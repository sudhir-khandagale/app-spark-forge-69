-- Create favorite_stores table
CREATE TABLE IF NOT EXISTS public.favorite_stores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, store_id)
);

-- Enable RLS
ALTER TABLE public.favorite_stores ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own favorite stores"
  ON public.favorite_stores
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add stores to favorites"
  ON public.favorite_stores
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove stores from favorites"
  ON public.favorite_stores
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_favorite_stores_user_id ON public.favorite_stores(user_id);
CREATE INDEX idx_favorite_stores_store_id ON public.favorite_stores(store_id);