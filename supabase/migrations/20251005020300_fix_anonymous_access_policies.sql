-- Migration: Fix Anonymous Access Policies
-- This prevents anonymous users from accessing any data
-- All policies now require authenticated users (auth.uid() IS NOT NULL)

-- ======================
-- ATTENDANCE TABLE
-- ======================
DROP POLICY IF EXISTS "School members can manage attendance" ON public.attendance;
DROP POLICY IF EXISTS "School members can view attendance" ON public.attendance;
DROP POLICY IF EXISTS "Teachers can manage attendance" ON public.attendance;

CREATE POLICY "School members can manage attendance" ON public.attendance
FOR ALL
USING (
  auth.uid() IS NOT NULL
  AND get_user_school(auth.uid()) = school_id
);

CREATE POLICY "Teachers can view attendance" ON public.attendance
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND public.has_role(auth.uid(), 'teacher')
  AND get_user_school(auth.uid()) = school_id
);

-- ======================
-- AUDIT_LOGS TABLE
-- ======================
DROP POLICY IF EXISTS "School admins can view their school's audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Super admins can view all audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Users can view their own audit logs" ON public.audit_logs;

CREATE POLICY "Users can view their own audit logs" ON public.audit_logs
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
);

CREATE POLICY "School admins can view school audit logs" ON public.audit_logs
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND public.has_role(auth.uid(), 'school_admin')
  AND school_id = get_user_school(auth.uid())
);

CREATE POLICY "Super admins can view all audit logs" ON public.audit_logs
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND public.has_role(auth.uid(), 'super_admin')
);

-- ======================
-- CLASSES TABLE
-- ======================
DROP POLICY IF EXISTS "School admins can manage classes" ON public.classes;
DROP POLICY IF EXISTS "School members can view school classes" ON public.classes;

CREATE POLICY "School admins can manage classes" ON public.classes
FOR ALL
USING (
  auth.uid() IS NOT NULL
  AND public.has_role(auth.uid(), 'school_admin')
  AND school_id = get_user_school(auth.uid())
);

CREATE POLICY "School members can view classes" ON public.classes
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND school_id = get_user_school(auth.uid())
);

-- ======================
-- EXAM_RESULTS TABLE
-- ======================
DROP POLICY IF EXISTS "School admins can manage results" ON public.exam_results;
DROP POLICY IF EXISTS "School members can view results" ON public.exam_results;
DROP POLICY IF EXISTS "Teachers can update exam results" ON public.exam_results;

CREATE POLICY "School admins can manage results" ON public.exam_results
FOR ALL
USING (
  auth.uid() IS NOT NULL
  AND public.has_role(auth.uid(), 'school_admin')
  AND school_id = get_user_school(auth.uid())
);

CREATE POLICY "Teachers can manage results" ON public.exam_results
FOR ALL
USING (
  auth.uid() IS NOT NULL
  AND public.has_role(auth.uid(), 'teacher')
  AND school_id = get_user_school(auth.uid())
);

CREATE POLICY "School members can view results" ON public.exam_results
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND school_id = get_user_school(auth.uid())
);

-- ======================
-- EXAMS TABLE
-- ======================
DROP POLICY IF EXISTS "School admins can manage exams" ON public.exams;
DROP POLICY IF EXISTS "School members can view exams" ON public.exams;

CREATE POLICY "School admins can manage exams" ON public.exams
FOR ALL
USING (
  auth.uid() IS NOT NULL
  AND public.has_role(auth.uid(), 'school_admin')
  AND school_id = get_user_school(auth.uid())
);

CREATE POLICY "School members can view exams" ON public.exams
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND school_id = get_user_school(auth.uid())
);

-- ======================
-- SCHOOLS TABLE
-- ======================
DROP POLICY IF EXISTS "school_admin_manage_own" ON public.schools;
DROP POLICY IF EXISTS "super_admin_full_access" ON public.schools;

CREATE POLICY "school_admin_manage_own" ON public.schools
FOR ALL
USING (
  auth.uid() IS NOT NULL
  AND public.has_role(auth.uid(), 'school_admin')
  AND id = get_user_school(auth.uid())
);

CREATE POLICY "super_admin_full_access" ON public.schools
FOR ALL
USING (
  auth.uid() IS NOT NULL
  AND public.has_role(auth.uid(), 'super_admin')
);

-- ======================
-- STUDENTS TABLE
-- ======================
DROP POLICY IF EXISTS "School admins can manage students" ON public.students;
DROP POLICY IF EXISTS "School members can view students" ON public.students;

CREATE POLICY "School admins can manage students" ON public.students
FOR ALL
USING (
  auth.uid() IS NOT NULL
  AND public.has_role(auth.uid(), 'school_admin')
  AND school_id = get_user_school(auth.uid())
);

CREATE POLICY "School members can view students" ON public.students
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND school_id = get_user_school(auth.uid())
);

-- ======================
-- SUBJECTS TABLE
-- ======================
DROP POLICY IF EXISTS "School admins can manage their school subjects" ON public.subjects;
DROP POLICY IF EXISTS "School members can view subjects" ON public.subjects;
DROP POLICY IF EXISTS "Super admins can delete all subjects" ON public.subjects;
DROP POLICY IF EXISTS "Super admins can update all subjects" ON public.subjects;
DROP POLICY IF EXISTS "Super admins can view all subjects" ON public.subjects;

CREATE POLICY "School admins can manage subjects" ON public.subjects
FOR ALL
USING (
  auth.uid() IS NOT NULL
  AND public.has_role(auth.uid(), 'school_admin')
  AND school_id = get_user_school(auth.uid())
);

CREATE POLICY "School members can view subjects" ON public.subjects
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND school_id = get_user_school(auth.uid())
);

CREATE POLICY "Super admins can manage all subjects" ON public.subjects
FOR ALL
USING (
  auth.uid() IS NOT NULL
  AND public.has_role(auth.uid(), 'super_admin')
);

-- ======================
-- TEACHER_APPLICATIONS TABLE
-- ======================
DROP POLICY IF EXISTS "School admins can update applications for their school" ON public.teacher_applications;
DROP POLICY IF EXISTS "School admins can view applications for their school" ON public.teacher_applications;
DROP POLICY IF EXISTS "Super admins can update all applications" ON public.teacher_applications;
DROP POLICY IF EXISTS "Super admins can view all applications" ON public.teacher_applications;
DROP POLICY IF EXISTS "Users can view their own applications" ON public.teacher_applications;

CREATE POLICY "Users can view own applications" ON public.teacher_applications
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
);

CREATE POLICY "School admins can manage school applications" ON public.teacher_applications
FOR ALL
USING (
  auth.uid() IS NOT NULL
  AND public.has_role(auth.uid(), 'school_admin')
  AND school_id = get_user_school(auth.uid())
);

CREATE POLICY "Super admins can manage all applications" ON public.teacher_applications
FOR ALL
USING (
  auth.uid() IS NOT NULL
  AND public.has_role(auth.uid(), 'super_admin')
);

-- ======================
-- TEACHERS TABLE
-- ======================
DROP POLICY IF EXISTS "School admins can manage teachers" ON public.teachers;
DROP POLICY IF EXISTS "School members can view teachers" ON public.teachers;

CREATE POLICY "School admins can manage teachers" ON public.teachers
FOR ALL
USING (
  auth.uid() IS NOT NULL
  AND public.has_role(auth.uid(), 'school_admin')
  AND school_id = get_user_school(auth.uid())
);

CREATE POLICY "School members can view teachers" ON public.teachers
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND school_id = get_user_school(auth.uid())
);

-- ======================
-- TIMETABLE TABLE
-- ======================
DROP POLICY IF EXISTS "School admins can manage timetable" ON public.timetable;
DROP POLICY IF EXISTS "School members can view timetable" ON public.timetable;

CREATE POLICY "School admins can manage timetable" ON public.timetable
FOR ALL
USING (
  auth.uid() IS NOT NULL
  AND public.has_role(auth.uid(), 'school_admin')
  AND school_id = get_user_school(auth.uid())
);

CREATE POLICY "School members can view timetable" ON public.timetable
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND school_id = get_user_school(auth.uid())
);

-- ======================
-- USER_PROFILES TABLE
-- ======================
DROP POLICY IF EXISTS "School admins can update school profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "School admins can view school profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Super admins can update all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;

CREATE POLICY "Users can view own profile" ON public.user_profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
);

CREATE POLICY "Users can update own profile" ON public.user_profiles
FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
);

CREATE POLICY "School admins can view school profiles" ON public.user_profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND public.has_role(auth.uid(), 'school_admin')
  AND school_id = get_user_school(auth.uid())
);

CREATE POLICY "School admins can update school profiles" ON public.user_profiles
FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND public.has_role(auth.uid(), 'school_admin')
  AND school_id = get_user_school(auth.uid())
);

CREATE POLICY "Super admins can view all profiles" ON public.user_profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND public.has_role(auth.uid(), 'super_admin')
);

CREATE POLICY "Super admins can update all profiles" ON public.user_profiles
FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND public.has_role(auth.uid(), 'super_admin')
);

-- ======================
-- USER_ROLES TABLE (Already fixed, but ensuring auth check)
-- ======================
DROP POLICY IF EXISTS "user_roles_select_own" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_select_super_admin" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_insert_super_admin" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_update_super_admin" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_delete_super_admin" ON public.user_roles;

CREATE POLICY "user_roles_select_own" ON public.user_roles
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
);

CREATE POLICY "user_roles_select_super_admin" ON public.user_roles
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND public.has_role(auth.uid(), 'super_admin')
  AND user_id != auth.uid()
);

CREATE POLICY "user_roles_insert_super_admin" ON public.user_roles
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND public.has_role(auth.uid(), 'super_admin')
);

CREATE POLICY "user_roles_update_super_admin" ON public.user_roles
FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND public.has_role(auth.uid(), 'super_admin')
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND public.has_role(auth.uid(), 'super_admin')
);

CREATE POLICY "user_roles_delete_super_admin" ON public.user_roles
FOR DELETE
USING (
  auth.uid() IS NOT NULL
  AND public.has_role(auth.uid(), 'super_admin')
);
