-- Add colors and sizes to products table
ALTER TABLE public.products 
ADD COLUMN colors JSONB DEFAULT '[]'::jsonb,
ADD COLUMN sizes JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.products.colors IS 'Array of available colors for the product';
COMMENT ON COLUMN public.products.sizes IS 'Array of available sizes with measurements for the product';