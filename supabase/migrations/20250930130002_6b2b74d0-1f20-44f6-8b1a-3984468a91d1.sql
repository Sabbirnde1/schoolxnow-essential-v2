-- Allow anyone to create a new school (for self-registration)
CREATE POLICY "Anyone can create a school during registration"
ON public.schools
FOR INSERT
WITH CHECK (true);

-- Allow school admins to update their own school
CREATE POLICY "School admins can update their own school"
ON public.schools
FOR UPDATE
USING (
  id = get_user_school(auth.uid()) AND 
  get_user_role(auth.uid()) = ANY(ARRAY['school_admin'::user_role, 'super_admin'::user_role])
);