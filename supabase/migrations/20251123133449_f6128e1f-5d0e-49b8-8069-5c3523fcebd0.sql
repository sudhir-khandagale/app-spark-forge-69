-- Update handle_new_user function to allow admin signup when no admin exists
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  user_role app_role;
  admin_count INTEGER;
BEGIN
  -- Get role from metadata, default to customer
  user_role := COALESCE(new.raw_user_meta_data->>'role', 'customer')::app_role;
  
  -- Check if admin role is requested
  IF user_role = 'admin' THEN
    -- Count existing admins
    SELECT COUNT(*) INTO admin_count
    FROM public.user_roles
    WHERE role = 'admin';
    
    -- Only allow admin signup if no admin exists yet
    IF admin_count > 0 THEN
      user_role := 'customer';
    END IF;
  END IF;
  
  -- Insert profile
  INSERT INTO public.profiles (id, display_name)
  VALUES (new.id, new.raw_user_meta_data->>'display_name');
  
  -- Insert role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, user_role);
  
  RETURN new;
END;
$function$;