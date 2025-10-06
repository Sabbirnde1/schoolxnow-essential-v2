-- Fix RLS policies for teachers to add students
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Teachers can insert students in their school" ON students;
DROP POLICY IF EXISTS "Teachers can view students in their school" ON students;
DROP POLICY IF EXISTS "Teachers can update students in their school" ON students;
DROP POLICY IF EXISTS "School admins can manage students" ON students;
DROP POLICY IF EXISTS "Students select policy" ON students;
DROP POLICY IF EXISTS "Students insert policy" ON students;
DROP POLICY IF EXISTS "Students update policy" ON students;
DROP POLICY IF EXISTS "Students delete policy" ON students;
DROP POLICY IF EXISTS "Teachers and admins can view students" ON students;
DROP POLICY IF EXISTS "Teachers and admins can insert students" ON students;
DROP POLICY IF EXISTS "Teachers and admins can update students" ON students;
DROP POLICY IF EXISTS "School admins can delete students" ON students;
DROP POLICY IF EXISTS "Super admins can view all students" ON students;
DROP POLICY IF EXISTS "Super admins can insert students" ON students;
DROP POLICY IF EXISTS "Super admins can update students" ON students;
DROP POLICY IF EXISTS "Super admins can delete students" ON students;

-- Create new comprehensive policies for students table

-- 1. SELECT policy - Teachers and admins can view students in their school
CREATE POLICY "Teachers and admins can view students"
ON students FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN user_roles ur ON ur.user_id = up.user_id
    WHERE up.user_id = auth.uid()
    AND up.school_id = students.school_id
    AND ur.role IN ('teacher', 'school_admin')
  )
);

-- 2. INSERT policy - Teachers and admins can add students to their school
CREATE POLICY "Teachers and admins can insert students"
ON students FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN user_roles ur ON ur.user_id = up.user_id
    WHERE up.user_id = auth.uid()
    AND up.school_id = students.school_id
    AND ur.role IN ('teacher', 'school_admin')
  )
);

-- 3. UPDATE policy - Teachers and admins can update students in their school
CREATE POLICY "Teachers and admins can update students"
ON students FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN user_roles ur ON ur.user_id = up.user_id
    WHERE up.user_id = auth.uid()
    AND up.school_id = students.school_id
    AND ur.role IN ('teacher', 'school_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN user_roles ur ON ur.user_id = up.user_id
    WHERE up.user_id = auth.uid()
    AND up.school_id = students.school_id
    AND ur.role IN ('teacher', 'school_admin')
  )
);

-- 4. DELETE policy - Only school admins can delete students
CREATE POLICY "School admins can delete students"
ON students FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN user_roles ur ON ur.user_id = up.user_id
    WHERE up.user_id = auth.uid()
    AND up.school_id = students.school_id
    AND ur.role = 'school_admin'
  )
);

-- Super admin policies (can manage all students)
CREATE POLICY "Super admins can view all students"
ON students FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'super_admin'
  )
);

CREATE POLICY "Super admins can insert students"
ON students FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'super_admin'
  )
);

CREATE POLICY "Super admins can update students"
ON students FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'super_admin'
  )
);

CREATE POLICY "Super admins can delete students"
ON students FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'super_admin'
  )
);
