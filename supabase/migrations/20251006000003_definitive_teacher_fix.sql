-- DEFINITIVE FIX: Add teacher permissions by directly querying user_roles and user_profiles
-- Avoids function call issues in RLS policies

-- Step 1: Drop all existing restrictive policies
DROP POLICY IF EXISTS "School admins can manage students" ON public.students;
DROP POLICY IF EXISTS "School members can view students" ON public.students;
DROP POLICY IF EXISTS "School members can insert students" ON public.students;
DROP POLICY IF EXISTS "School members can update students" ON public.students;
DROP POLICY IF EXISTS "School admins can delete students" ON public.students;
DROP POLICY IF EXISTS "Super admins manage all students" ON public.students;
DROP POLICY IF EXISTS "Teachers and admins can view students" ON public.students;
DROP POLICY IF EXISTS "Teachers and admins can insert students" ON public.students;
DROP POLICY IF EXISTS "Teachers and admins can update students" ON public.students;

-- Step 2: Create new policies that include teachers (direct table queries)

-- Teachers and admins can view students in their school
CREATE POLICY "School members can view students"
ON public.students FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    JOIN public.user_roles ur ON ur.user_id = up.user_id
    WHERE up.user_id = auth.uid()
    AND up.school_id = students.school_id
    AND ur.role IN ('teacher', 'school_admin', 'super_admin')
  )
);

-- Teachers and admins can insert students in their school
CREATE POLICY "School members can insert students"
ON public.students FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    JOIN public.user_roles ur ON ur.user_id = up.user_id
    WHERE up.user_id = auth.uid()
    AND up.school_id = students.school_id
    AND ur.role IN ('teacher', 'school_admin', 'super_admin')
  )
);

-- Teachers and admins can update students in their school
CREATE POLICY "School members can update students"
ON public.students FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    JOIN public.user_roles ur ON ur.user_id = up.user_id
    WHERE up.user_id = auth.uid()
    AND up.school_id = students.school_id
    AND ur.role IN ('teacher', 'school_admin', 'super_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    JOIN public.user_roles ur ON ur.user_id = up.user_id
    WHERE up.user_id = auth.uid()
    AND up.school_id = students.school_id
    AND ur.role IN ('teacher', 'school_admin', 'super_admin')
  )
);

-- Only school admins and super admins can delete students
CREATE POLICY "School admins can delete students"
ON public.students FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    JOIN public.user_roles ur ON ur.user_id = up.user_id
    WHERE up.user_id = auth.uid()
    AND up.school_id = students.school_id
    AND ur.role IN ('school_admin', 'super_admin')
  )
);

-- Super admin can manage all students in all schools
CREATE POLICY "Super admins manage all students"
ON public.students FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'super_admin'
  )
);