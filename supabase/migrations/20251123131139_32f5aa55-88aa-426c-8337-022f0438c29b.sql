-- Function to assign admin role to a specific email
-- This is a helper function that can be called to manually promote a user to admin
CREATE OR REPLACE FUNCTION public.assign_admin_role(admin_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  target_user_id UUID;
  existing_role app_role;
BEGIN
  -- Find the user by email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = admin_email;
  
  IF target_user_id IS NULL THEN
    RETURN 'Error: User with email ' || admin_email || ' not found';
  END IF;
  
  -- Check if user already has a role
  SELECT role INTO existing_role
  FROM public.user_roles
  WHERE user_id = target_user_id;
  
  IF existing_role IS NOT NULL THEN
    -- Update existing role to admin
    UPDATE public.user_roles
    SET role = 'admin'
    WHERE user_id = target_user_id;
    RETURN 'Success: User ' || admin_email || ' role updated from ' || existing_role || ' to admin';
  ELSE
    -- Insert new admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, 'admin');
    RETURN 'Success: User ' || admin_email || ' assigned admin role';
  END IF;
END;
$$;

-- Example usage (uncomment and replace with your admin email):
-- SELECT public.assign_admin_role('your-admin-email@example.com');