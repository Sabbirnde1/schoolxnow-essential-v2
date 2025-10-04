-- Update the handle_new_user function to use role from metadata
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
    COALESCE(
      (NEW.raw_user_meta_data->>'role')::user_role,
      'teacher'::user_role
    ),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'New User'),
    'pending'
  );
  RETURN NEW;
END;
$$;