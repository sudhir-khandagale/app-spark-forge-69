-- Fix RLS policies for security issues

-- 1. Fix profiles table - restrict public access
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can view profiles of stores they interact with"
ON public.profiles FOR SELECT
USING (
  id IN (
    SELECT owner_id FROM public.stores
    WHERE id IN (
      SELECT store_id FROM public.reservations WHERE user_id = auth.uid()
      UNION
      SELECT store_id FROM public.reviews WHERE user_id = auth.uid()
    )
  )
);

-- 2. Add INSERT policy for profiles (only for user's own profile)
CREATE POLICY "Users can create their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- 3. Fix stores table - keep store info public but protect sensitive contact info
-- For now, keep stores publicly readable for discovery but consider moving contact info to separate table in future

-- 4. Add DELETE policy for products
CREATE POLICY "Vendors and admins can delete products"
ON public.products FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.stores s ON s.owner_id = ur.user_id
    JOIN public.inventory i ON i.store_id = s.id
    WHERE i.product_id = products.id
    AND ur.user_id = auth.uid()
    AND ur.role IN ('vendor', 'admin')
  )
  OR
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 5. Restrict bulk access to reservation contact_info for vendors
-- Update existing vendor policy to limit data exposure
DROP POLICY IF EXISTS "Vendors can manage their store reservations" ON public.reservations;

CREATE POLICY "Vendors can view their store reservations"
ON public.reservations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.stores s
    JOIN public.user_roles ur ON ur.user_id = s.owner_id
    WHERE s.id = reservations.store_id
    AND ur.user_id = auth.uid()
    AND ur.role = 'vendor'
  )
);

CREATE POLICY "Vendors can update their store reservations"
ON public.reservations FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.stores s
    JOIN public.user_roles ur ON ur.user_id = s.owner_id
    WHERE s.id = reservations.store_id
    AND ur.user_id = auth.uid()
    AND ur.role = 'vendor'
  )
);

-- 6. Add explicit INSERT policy for user_roles (admin only)
CREATE POLICY "Only admins can assign roles"
ON public.user_roles FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);