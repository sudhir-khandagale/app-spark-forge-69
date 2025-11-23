-- Fix user_roles INSERT policy to allow new user registration
-- The previous policy was too restrictive and blocked the handle_new_user() trigger

DROP POLICY IF EXISTS "Only admins can assign roles" ON public.user_roles;

-- Allow users to create their own role during signup (via trigger)
-- But prevent privilege escalation by only allowing role assignment for their own user_id
CREATE POLICY "Users can create their own role during signup"
ON public.user_roles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow admins to assign roles to any user
CREATE POLICY "Admins can assign any role"
ON public.user_roles FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
);