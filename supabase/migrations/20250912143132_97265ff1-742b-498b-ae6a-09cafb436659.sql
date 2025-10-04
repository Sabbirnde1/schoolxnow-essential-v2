-- Allow super admins to update any user profile
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins can update all profiles"
ON public.user_profiles
FOR UPDATE
USING (get_user_role(auth.uid()) = 'super_admin'::user_role)
WITH CHECK (get_user_role(auth.uid()) = 'super_admin'::user_role);

-- Allow super admins to view and update any teacher application
ALTER TABLE public.teacher_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins can view all applications"
ON public.teacher_applications
FOR SELECT
USING (get_user_role(auth.uid()) = 'super_admin'::user_role);

CREATE POLICY "Super admins can update all applications"
ON public.teacher_applications
FOR UPDATE
USING (get_user_role(auth.uid()) = 'super_admin'::user_role)
WITH CHECK (get_user_role(auth.uid()) = 'super_admin'::user_role);
