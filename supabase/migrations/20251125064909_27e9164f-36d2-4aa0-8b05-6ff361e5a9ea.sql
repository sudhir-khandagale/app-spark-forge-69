-- Add trending column to products table
ALTER TABLE public.products
ADD COLUMN trending BOOLEAN DEFAULT false;

-- Create index for faster trending product queries
CREATE INDEX idx_products_trending ON public.products(trending) WHERE trending = true;

-- Add RLS policy for admins to update trending status
CREATE POLICY "Admins can update trending status"
ON public.products
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));