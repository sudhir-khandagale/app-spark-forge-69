-- Add email column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Update the handle_new_user function to also store email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
  
  -- Insert profile with email
  INSERT INTO public.profiles (id, display_name, email)
  VALUES (new.id, new.raw_user_meta_data->>'display_name', new.email);
  
  -- Insert role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, user_role);
  
  RETURN new;
END;
$function$;

-- Update existing profiles to have email from auth.users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;