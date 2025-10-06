-- DEFINITIVE FIX: Update the original restrictive policy to include teachers
-- This directly modifies the core issue from the base migration

-- Step 1: Drop the restrictive policy from the original migration
DROP POLICY IF EXISTS "School admins can manage students" ON public.students;
DROP POLICY IF EXISTS "School members can view students" ON public.students;

-- Step 2: Create new policies that include teachers

-- Teachers and admins can view students in their school
CREATE POLICY "School members can view students"
ON public.students FOR SELECT
TO authenticated
USING (
  school_id = public.get_user_school(auth.uid())
  AND public.get_user_role(auth.uid()) IN ('teacher', 'school_admin', 'super_admin')
);

-- Teachers and admins can insert students in their school
CREATE POLICY "School members can insert students"
ON public.students FOR INSERT
TO authenticated
WITH CHECK (
  school_id = public.get_user_school(auth.uid())
  AND public.get_user_role(auth.uid()) IN ('teacher', 'school_admin', 'super_admin')
);

-- Teachers and admins can update students in their school
CREATE POLICY "School members can update students"
ON public.students FOR UPDATE
TO authenticated
USING (
  school_id = public.get_user_school(auth.uid())
  AND public.get_user_role(auth.uid()) IN ('teacher', 'school_admin', 'super_admin')
)
WITH CHECK (
  school_id = public.get_user_school(auth.uid())
  AND public.get_user_role(auth.uid()) IN ('teacher', 'school_admin', 'super_admin')
);

-- Only school admins and super admins can delete students
CREATE POLICY "School admins can delete students"
ON public.students FOR DELETE
TO authenticated
USING (
  school_id = public.get_user_school(auth.uid())
  AND public.get_user_role(auth.uid()) IN ('school_admin', 'super_admin')
);

-- Super admin policy for all operations on all students
CREATE POLICY "Super admins manage all students"
ON public.students FOR ALL
TO authenticated
USING (public.get_user_role(auth.uid()) = 'super_admin')
WITH CHECK (public.get_user_role(auth.uid()) = 'super_admin');