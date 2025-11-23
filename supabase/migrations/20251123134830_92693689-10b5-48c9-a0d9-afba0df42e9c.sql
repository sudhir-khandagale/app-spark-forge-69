-- Update RLS policies to ensure only approved stores' products are visible to customers

-- Drop existing policy on products
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;

-- Create new policy: Only show products from approved stores or to store owners/admins
CREATE POLICY "Anyone can view products from approved stores"
ON public.products
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.inventory i
    JOIN public.stores s ON s.id = i.store_id
    WHERE i.product_id = products.id
    AND (s.status = 'approved' OR s.owner_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

-- Update inventory policy to be more explicit
DROP POLICY IF EXISTS "Anyone can view inventory" ON public.inventory;

CREATE POLICY "Anyone can view inventory from approved stores"
ON public.inventory
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.id = inventory.store_id
    AND (stores.status = 'approved' OR stores.owner_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

-- Ensure product reviews are only visible for approved stores
DROP POLICY IF EXISTS "Anyone can view product reviews" ON public.product_reviews;

CREATE POLICY "Anyone can view reviews from approved stores"
ON public.product_reviews
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.id = product_reviews.store_id
    AND (stores.status = 'approved' OR stores.owner_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);