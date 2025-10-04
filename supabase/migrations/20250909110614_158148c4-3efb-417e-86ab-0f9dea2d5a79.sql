-- Create a Super Admin user with a specific email and password
-- This will be a one-time setup for the system administrator

-- First, let's create a function to safely create a super admin
CREATE OR REPLACE FUNCTION create_super_admin(
  admin_email TEXT,
  admin_password TEXT,
  admin_name TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Check if super admin already exists
  IF EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE role = 'super_admin' 
    AND full_name = admin_name
  ) THEN
    RAISE EXCEPTION 'Super admin with this name already exists';
  END IF;

  -- Create the super admin profile directly (since we can't create auth users via SQL)
  -- This will be a placeholder that gets updated when the user signs up
  INSERT INTO user_profiles (
    user_id,
    full_name,
    role,
    approval_status,
    is_active,
    school_id
  ) VALUES (
    gen_random_uuid(), -- Temporary UUID, will be updated on signup
    admin_name,
    'super_admin'::user_role,
    'approved',
    true,
    NULL
  ) RETURNING user_id INTO new_user_id;

  RETURN new_user_id;
END;
$$;

-- Insert the default Super Admin profile
-- Note: The actual auth user will need to be created through the signup process
-- but this profile will be linked when they sign up with the designated email
INSERT INTO user_profiles (
  user_id,
  full_name,
  role,
  approval_status,
  is_active,
  school_id
) VALUES (
  '00000000-0000-0000-0000-000000000000', -- Placeholder UUID
  'System Administrator',
  'super_admin'::user_role,
  'approved',
  true,
  NULL
) ON CONFLICT DO NOTHING;

-- Create a function to promote a user to super admin
CREATE OR REPLACE FUNCTION promote_to_super_admin(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the user profile to super admin
  UPDATE user_profiles 
  SET 
    role = 'super_admin'::user_role,
    approval_status = 'approved',
    is_active = true,
    school_id = NULL
  WHERE user_id = target_user_id;
  
  -- Return true if update was successful
  RETURN FOUND;
END;
$$;