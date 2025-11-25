-- Create product_variants table for tracking individual color/size combinations
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  color TEXT,
  size TEXT,
  sku TEXT,
  price NUMERIC NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(product_id, store_id, color, size)
);

-- Enable RLS
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- Policies for product_variants
CREATE POLICY "Anyone can view variants from approved stores"
  ON public.product_variants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = product_variants.store_id
      AND (stores.status = 'approved' OR stores.owner_id = auth.uid() OR has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "Vendors can manage their variants"
  ON public.product_variants
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = product_variants.store_id
      AND stores.owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all variants"
  ON public.product_variants
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_product_variants_updated_at
  BEFORE UPDATE ON public.product_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();