-- Allow super admins to insert subjects for any school
CREATE POLICY "Super admins can insert subjects for any school"
ON public.subjects
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'super_admin'::user_role));