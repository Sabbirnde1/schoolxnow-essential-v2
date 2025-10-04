-- Drop existing super admin policy for subjects
DROP POLICY IF EXISTS "Super admins can manage all subjects" ON public.subjects;

-- Create separate policies for super admins (view, update, delete only - no insert)
CREATE POLICY "Super admins can view all subjects"
ON public.subjects
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::user_role));

CREATE POLICY "Super admins can update all subjects"
ON public.subjects
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::user_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::user_role));

CREATE POLICY "Super admins can delete all subjects"
ON public.subjects
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::user_role));