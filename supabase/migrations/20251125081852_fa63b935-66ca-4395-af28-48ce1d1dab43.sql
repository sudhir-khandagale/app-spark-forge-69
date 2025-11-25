-- Update handle_new_user to support multiple roles per phone number
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_role app_role;
  admin_count INTEGER;
  existing_profile_id UUID;
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
  
  -- Check if profile exists for this phone number
  SELECT id INTO existing_profile_id
  FROM public.profiles
  WHERE phone = new.phone
  LIMIT 1;
  
  IF existing_profile_id IS NOT NULL THEN
    -- Profile exists, just add new role if not already present
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new.id, user_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    -- New profile
    INSERT INTO public.profiles (id, display_name, phone)
    VALUES (new.id, new.raw_user_meta_data->>'display_name', new.phone);
    
    -- Insert role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new.id, user_role);
  END IF;
  
  RETURN new;
END;
$function$;