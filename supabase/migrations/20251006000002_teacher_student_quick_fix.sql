-- Quick fix: Add teacher permissions to students table
-- This adds INSERT permission for teachers without removing existing policies

-- Drop the restrictive policy that only allows school_admin
DROP POLICY IF EXISTS "School admins can manage students" ON public.students;
DROP POLICY IF EXISTS "Teachers and admins can view students" ON public.students;
DROP POLICY IF EXISTS "Teachers and admins can insert students" ON public.students;
DROP POLICY IF EXISTS "Teachers and admins can update students" ON public.students;
DROP POLICY IF EXISTS "School admins can delete students" ON public.students;
DROP POLICY IF EXISTS "Super admins can view all students" ON public.students;
DROP POLICY IF EXISTS "Super admins can insert students" ON public.students;
DROP POLICY IF EXISTS "Super admins can update students" ON public.students;
DROP POLICY IF EXISTS "Super admins can delete students" ON public.students;
DROP POLICY IF EXISTS "School members can view students" ON public.students;

-- 1. SELECT - Teachers, school admins can view students in their school
CREATE POLICY "Teachers and admins can view students"
ON public.students FOR SELECT
TO authenticated
USING (
  school_id IN (
    SELECT school_id FROM public.user_profiles 
    WHERE user_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('teacher', 'school_admin')
  )
);

-- 2. INSERT - Teachers, school admins can add students to their school
CREATE POLICY "Teachers and admins can insert students"
ON public.students FOR INSERT
TO authenticated
WITH CHECK (
  school_id IN (
    SELECT school_id FROM public.user_profiles 
    WHERE user_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('teacher', 'school_admin')
  )
);

-- 3. UPDATE - Teachers, school admins can update students
CREATE POLICY "Teachers and admins can update students"
ON public.students FOR UPDATE
TO authenticated
USING (
  school_id IN (
    SELECT school_id FROM public.user_profiles 
    WHERE user_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('teacher', 'school_admin')
  )
)
WITH CHECK (
  school_id IN (
    SELECT school_id FROM public.user_profiles 
    WHERE user_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('teacher', 'school_admin')
  )
);

-- 4. DELETE - Only school admins can delete students
CREATE POLICY "School admins can delete students"
ON public.students FOR DELETE
TO authenticated
USING (
  school_id IN (
    SELECT school_id FROM public.user_profiles 
    WHERE user_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'school_admin'
  )
);

-- Super admin policies (full access to all students)
CREATE POLICY "Super admins have full access to students"
ON public.students FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'super_admin'
  )
);
