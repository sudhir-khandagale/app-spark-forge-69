-- Fix the assign_admin_role function to require admin authorization
-- Exception: Allow first admin assignment when no admins exist (bootstrap case)

CREATE OR REPLACE FUNCTION public.assign_admin_role(admin_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  target_user_id UUID;
  caller_user_id UUID;
  existing_role app_role;
  admin_count INTEGER;
BEGIN
  -- Get the caller's user ID
  caller_user_id := auth.uid();
  
  -- Check if there are any existing admins
  SELECT COUNT(*) INTO admin_count
  FROM public.user_roles
  WHERE role = 'admin';
  
  -- If admins exist, caller must be an admin to assign admin role
  IF admin_count > 0 THEN
    IF caller_user_id IS NULL THEN
      RETURN 'Error: Authentication required';
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = caller_user_id AND role = 'admin'
    ) THEN
      RETURN 'Error: Unauthorized - Only admins can assign admin roles';
    END IF;
  END IF;
  
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
  
  IF existing_role = 'admin' THEN
    RETURN 'Info: User ' || admin_email || ' is already an admin';
  ELSIF existing_role IS NOT NULL THEN
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