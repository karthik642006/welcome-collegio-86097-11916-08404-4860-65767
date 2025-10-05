
-- First, ensure we have a function to safely add admin role
CREATE OR REPLACE FUNCTION public.add_admin_role(user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id uuid;
BEGIN
  -- Get the user ID from auth.users
  SELECT id INTO target_user_id
  FROM auth.users
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

-- Add unique constraint if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_roles_user_id_role_key'
  ) THEN
    ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);
  END IF;
END $$;

-- Create a view to get user roles with email
CREATE OR REPLACE VIEW public.user_roles_with_email AS
SELECT 
  ur.id,
  ur.user_id,
  ur.role,
  ur.created_at,
  au.email,
  p.full_name
FROM public.user_roles ur
LEFT JOIN auth.users au ON ur.user_id = au.id
LEFT JOIN public.profiles p ON ur.user_id = p.id;

-- Grant access to the view
GRANT SELECT ON public.user_roles_with_email TO authenticated;

-- Create RLS policy for the view
CREATE POLICY "Admins can view user roles with email"
ON public.user_roles
FOR SELECT
USING (is_admin(auth.uid()));
