-- Update super_admin_exists function to use user_roles table
CREATE OR REPLACE FUNCTION public.super_admin_exists()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles ur
    JOIN public.user_profiles up ON ur.user_id = up.user_id
    WHERE ur.role = 'super_admin' 
      AND up.approval_status = 'approved' 
      AND up.is_active = true
  );
$function$;