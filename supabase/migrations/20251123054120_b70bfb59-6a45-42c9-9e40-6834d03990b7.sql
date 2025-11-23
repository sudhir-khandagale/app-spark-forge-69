-- Create product_reviews table
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  photo_urls TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, product_id, store_id)
);

-- Enable RLS
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_reviews
CREATE POLICY "Anyone can view product reviews"
  ON public.product_reviews
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own product reviews"
  ON public.product_reviews
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own product reviews"
  ON public.product_reviews
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own product reviews"
  ON public.product_reviews
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_product_reviews_updated_at
  BEFORE UPDATE ON public.product_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add average rating and review count to products table
ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS rating NUMERIC(3,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- Function to update product ratings
CREATE OR REPLACE FUNCTION public.update_product_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.products
  SET 
    rating = (
      SELECT AVG(rating)::DECIMAL(3,2)
      FROM public.product_reviews
      WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
    ),
    review_count = (
      SELECT COUNT(*)
      FROM public.product_reviews
      WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
    )
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger to update product rating on review changes
DROP TRIGGER IF EXISTS update_product_rating_on_review ON public.product_reviews;
CREATE TRIGGER update_product_rating_on_review
  AFTER INSERT OR UPDATE OR DELETE ON public.product_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_product_rating();