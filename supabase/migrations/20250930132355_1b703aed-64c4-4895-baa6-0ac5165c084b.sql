-- Update the handle_new_user function to auto-approve school admins
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.user_profiles (user_id, role, full_name, approval_status, school_id)
  VALUES (
    NEW.id, 
    COALESCE(
      (NEW.raw_user_meta_data->>'role')::user_role,
      'teacher'::user_role
    ),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'New User'),
    -- Auto-approve school admins, others remain pending
    CASE 
      WHEN COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'teacher'::user_role) = 'school_admin'::user_role 
      THEN 'approved'
      ELSE 'pending'
    END,
    COALESCE(
      (NEW.raw_user_meta_data->>'school_id')::uuid,
      NULL
    )
  );
  RETURN NEW;
END;
$function$;