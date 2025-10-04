-- Fix RLS policies for subjects table to properly handle super admins
-- Super admins should be able to manage subjects for any school
-- School admins should only manage subjects for their own school

DROP POLICY IF EXISTS "School admins can manage subjects" ON public.subjects;
DROP POLICY IF EXISTS "School members can view subjects" ON public.subjects;

-- Super admins can manage all subjects
CREATE POLICY "Super admins can manage all subjects"
ON public.subjects
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::user_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::user_role));

-- School admins can manage subjects for their school
CREATE POLICY "School admins can manage their school subjects"
ON public.subjects
FOR ALL
TO authenticated
USING (
  school_id = get_user_school(auth.uid()) 
  AND has_role(auth.uid(), 'school_admin'::user_role)
)
WITH CHECK (
  school_id = get_user_school(auth.uid()) 
  AND has_role(auth.uid(), 'school_admin'::user_role)
);

-- Teachers can view subjects for their school
CREATE POLICY "School members can view subjects"
ON public.subjects
FOR SELECT
TO authenticated
USING (school_id = get_user_school(auth.uid()));