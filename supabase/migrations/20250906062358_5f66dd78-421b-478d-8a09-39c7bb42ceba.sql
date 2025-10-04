-- Check if the trigger exists and recreate it if needed
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Recreate the function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, role, full_name, approval_status)
  VALUES (
    NEW.id, 
    'teacher'::user_role, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'New User'),
    'pending'
  );
  RETURN NEW;
END;
$$;

-- Create the trigger to automatically create user profiles
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();