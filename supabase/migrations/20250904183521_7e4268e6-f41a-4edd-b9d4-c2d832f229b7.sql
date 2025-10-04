-- Fix RLS policies to allow proper CRUD operations for school management

-- Update students table policies
DROP POLICY IF EXISTS "School admins can manage students" ON students;
DROP POLICY IF EXISTS "School members can view students" ON students;

CREATE POLICY "School members can view students" 
ON students FOR SELECT 
USING (school_id = get_user_school(auth.uid()));

CREATE POLICY "School admins can manage students" 
ON students FOR ALL 
USING (
  school_id = get_user_school(auth.uid()) AND 
  get_user_role(auth.uid()) = ANY (ARRAY['school_admin'::user_role, 'super_admin'::user_role])
);

-- Update teachers table policies
DROP POLICY IF EXISTS "School members can view teachers" ON teachers;

CREATE POLICY "School members can view teachers" 
ON teachers FOR SELECT 
USING (school_id = get_user_school(auth.uid()));

CREATE POLICY "School admins can manage teachers" 
ON teachers FOR ALL 
USING (
  school_id = get_user_school(auth.uid()) AND 
  get_user_role(auth.uid()) = ANY (ARRAY['school_admin'::user_role, 'super_admin'::user_role])
);

-- Update subjects table policies  
DROP POLICY IF EXISTS "School members can view subjects" ON subjects;

CREATE POLICY "School members can view subjects" 
ON subjects FOR SELECT 
USING (school_id = get_user_school(auth.uid()));

CREATE POLICY "School admins can manage subjects" 
ON subjects FOR ALL 
USING (
  school_id = get_user_school(auth.uid()) AND 
  get_user_role(auth.uid()) = ANY (ARRAY['school_admin'::user_role, 'super_admin'::user_role])
);

-- Update exams table policies
DROP POLICY IF EXISTS "School members can view exams" ON exams;

CREATE POLICY "School members can view exams" 
ON exams FOR SELECT 
USING (school_id = get_user_school(auth.uid()));

CREATE POLICY "School admins can manage exams" 
ON exams FOR ALL 
USING (
  school_id = get_user_school(auth.uid()) AND 
  get_user_role(auth.uid()) = ANY (ARRAY['school_admin'::user_role, 'super_admin'::user_role])
);

-- Update exam_results table policies
DROP POLICY IF EXISTS "School members can view results" ON exam_results;

CREATE POLICY "School members can view results" 
ON exam_results FOR SELECT 
USING (school_id = get_user_school(auth.uid()));

CREATE POLICY "School admins can manage results" 
ON exam_results FOR ALL 
USING (
  school_id = get_user_school(auth.uid()) AND 
  get_user_role(auth.uid()) = ANY (ARRAY['school_admin'::user_role, 'super_admin'::user_role])
);

-- Update attendance table policies to allow teachers to mark attendance
CREATE POLICY "Teachers can manage attendance" 
ON attendance FOR ALL 
USING (school_id = get_user_school(auth.uid()));

-- Update user_profiles table policies to allow updates
CREATE POLICY "Users can update their own profile" 
ON user_profiles FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "School admins can update school profiles" 
ON user_profiles FOR UPDATE 
USING (
  school_id = get_user_school(auth.uid()) AND 
  get_user_role(auth.uid()) = ANY (ARRAY['school_admin'::user_role, 'super_admin'::user_role])
);