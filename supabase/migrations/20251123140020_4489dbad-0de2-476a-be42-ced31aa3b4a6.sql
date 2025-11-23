-- Add admin policy to update stores
CREATE POLICY "Admins can update any store"
ON public.stores
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add admin policy to delete stores
CREATE POLICY "Admins can delete any store"
ON public.stores
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));