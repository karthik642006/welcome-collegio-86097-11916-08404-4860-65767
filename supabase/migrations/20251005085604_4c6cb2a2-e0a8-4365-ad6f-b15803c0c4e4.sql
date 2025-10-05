
-- Drop the insecure view that exposes auth.users
DROP VIEW IF EXISTS public.user_roles_with_email;

-- Update the add_admin_role function to use proper security
CREATE OR REPLACE FUNCTION public.add_admin_role(user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  target_user_id uuid;
BEGIN
  -- Only allow admins to add admin roles
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can add admin roles';
  END IF;
  
  -- Get the user ID from profiles table (not auth.users)
  SELECT id INTO target_user_id
  FROM public.profiles
  WHERE email = user_email;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
  
  -- Insert admin role if it doesn't exist
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- Create a function to add staff role
CREATE OR REPLACE FUNCTION public.add_staff_role(user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  target_user_id uuid;
BEGIN
  -- Only allow admins to add staff roles
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can add staff roles';
  END IF;
  
  -- Get the user ID from profiles table
  SELECT id INTO target_user_id
  FROM public.profiles
  WHERE email = user_email;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
  
  -- Insert staff role if it doesn't exist
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'staff')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- Create a function to remove user role
CREATE OR REPLACE FUNCTION public.remove_user_role(user_email text, role_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  target_user_id uuid;
BEGIN
  -- Only allow admins to remove roles
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can remove roles';
  END IF;
  
  -- Get the user ID from profiles table
  SELECT id INTO target_user_id
  FROM public.profiles
  WHERE email = user_email;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
  
  -- Delete the role
  DELETE FROM public.user_roles
  WHERE user_id = target_user_id AND role = role_name;
END;
$$;

-- Update RLS policies for user_roles to allow admins to manage roles
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

CREATE POLICY "Admins can manage user roles"
ON public.user_roles
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));
