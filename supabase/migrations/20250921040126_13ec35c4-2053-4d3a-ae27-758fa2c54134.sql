-- Update the existing super admin's approval status
UPDATE user_profiles 
SET approval_status = 'approved', is_active = true 
WHERE role = 'super_admin' AND approval_status = 'pending';

-- Create a security definer function to check if super admin exists
-- This bypasses RLS and can be called by anonymous users
CREATE OR REPLACE FUNCTION public.super_admin_exists()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE role = 'super_admin' AND approval_status = 'approved' AND is_active = true
  );
$$;

-- Create a policy to allow anonymous users to call this function
-- (The function itself bypasses RLS, but we need this for good practice)
GRANT EXECUTE ON FUNCTION public.super_admin_exists() TO anon;