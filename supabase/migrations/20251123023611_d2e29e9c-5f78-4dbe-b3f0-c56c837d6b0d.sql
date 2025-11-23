-- Step 1: Drop dependent policies and function first
DROP POLICY IF EXISTS "Store owners can create products" ON products;
DROP POLICY IF EXISTS "Store owners can update products" ON products;
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON user_roles;
DROP FUNCTION IF EXISTS has_role(uuid, app_role);

-- Step 2: Rename old enum and create new one
ALTER TYPE app_role RENAME TO app_role_old;
CREATE TYPE app_role AS ENUM ('customer', 'vendor', 'admin');

-- Step 3: Update user_roles table to use new enum
ALTER TABLE user_roles 
  ALTER COLUMN role TYPE app_role USING 
    CASE role::text
      WHEN 'user' THEN 'customer'::app_role
      WHEN 'store_owner' THEN 'vendor'::app_role
      WHEN 'admin' THEN 'admin'::app_role
    END;

-- Step 4: Drop old enum
DROP TYPE app_role_old CASCADE;

-- Step 5: Recreate has_role function with new enum
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Step 6: Recreate policies with new enum
CREATE POLICY "Vendors can create products" ON products
FOR INSERT WITH CHECK (
  has_role(auth.uid(), 'vendor'::app_role) OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Vendors can update products" ON products
FOR UPDATE USING (
  has_role(auth.uid(), 'vendor'::app_role) OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can view all roles" ON user_roles
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all roles" ON user_roles
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Step 7: Update other policies
DROP POLICY IF EXISTS "Store owners can manage their inventory" ON inventory;
CREATE POLICY "Vendors can manage their inventory" ON inventory
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM stores 
    WHERE stores.id = inventory.store_id 
    AND stores.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Store owners can view reservations for their stores" ON reservations;
CREATE POLICY "Vendors can view reservations for their stores" ON reservations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM stores 
    WHERE stores.id = reservations.store_id 
    AND stores.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Store owners can delete their stores" ON stores;
CREATE POLICY "Vendors can delete their stores" ON stores
FOR DELETE USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Store owners can insert their stores" ON stores;
CREATE POLICY "Vendors can insert their stores" ON stores
FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Store owners can update their stores" ON stores;
CREATE POLICY "Vendors can update their stores" ON stores
FOR UPDATE USING (auth.uid() = owner_id);

-- Step 8: Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_role app_role;
BEGIN
  -- Get role from metadata, default to customer
  user_role := COALESCE(new.raw_user_meta_data->>'role', 'customer')::app_role;
  
  -- Prevent admin role from being set during signup (must be manually assigned)
  IF user_role = 'admin' THEN
    user_role := 'customer';
  END IF;
  
  -- Insert profile
  INSERT INTO public.profiles (id, display_name)
  VALUES (new.id, new.raw_user_meta_data->>'display_name');
  
  -- Insert role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, user_role);
  
  RETURN new;
END;
$$;