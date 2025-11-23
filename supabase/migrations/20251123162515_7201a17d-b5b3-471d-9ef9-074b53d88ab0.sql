-- Fix products INSERT RLS so vendors can create products without relying on has_role
DROP POLICY IF EXISTS "Vendors can create products" ON public.products;

CREATE POLICY "Vendors can create products"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = ANY (ARRAY['vendor'::public.app_role, 'admin'::public.app_role])
  )
);