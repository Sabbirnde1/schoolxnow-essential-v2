-- Migration: Optimize RLS Performance
-- Fixes: 
-- 1. Auth RLS Initialization Plan warnings (50+ issues)
-- 2. Multiple Permissive Policies warnings (70+ issues)
-- 
-- Changes:
-- - Wrap auth.uid() with (SELECT auth.uid()) for better query planning
-- - Wrap get_user_school() with (SELECT ...) for better query planning  
-- - Consolidate multiple overlapping policies into single optimized policies

-- ======================
-- USER_ROLES TABLE (5 policies -> optimized)
-- ======================
DROP POLICY IF EXISTS "user_roles_select_own" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_select_super_admin" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_insert_super_admin" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_update_super_admin" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_delete_super_admin" ON public.user_roles;

-- Consolidated SELECT policy
CREATE POLICY "user_roles_select" ON public.user_roles
FOR SELECT
USING (
  (SELECT auth.uid()) IS NOT NULL
  AND (
    user_id = (SELECT auth.uid())
    OR public.has_role((SELECT auth.uid()), 'super_admin')
  )
);

CREATE POLICY "user_roles_insert" ON public.user_roles
FOR INSERT
WITH CHECK (
  (SELECT auth.uid()) IS NOT NULL
  AND public.has_role((SELECT auth.uid()), 'super_admin')
);

CREATE POLICY "user_roles_update" ON public.user_roles
FOR UPDATE
USING (
  (SELECT auth.uid()) IS NOT NULL
  AND public.has_role((SELECT auth.uid()), 'super_admin')
)
WITH CHECK (
  (SELECT auth.uid()) IS NOT NULL
  AND public.has_role((SELECT auth.uid()), 'super_admin')
);

CREATE POLICY "user_roles_delete" ON public.user_roles
FOR DELETE
USING (
  (SELECT auth.uid()) IS NOT NULL
  AND public.has_role((SELECT auth.uid()), 'super_admin')
);

-- ======================
-- USER_PROFILES TABLE
-- ======================
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "School admins can view school profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "School admins can update school profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Super admins can update all profiles" ON public.user_profiles;

-- Consolidated SELECT policy
CREATE POLICY "user_profiles_select" ON public.user_profiles
FOR SELECT
USING (
  (SELECT auth.uid()) IS NOT NULL
  AND (
    user_id = (SELECT auth.uid())
    OR (
      public.has_role((SELECT auth.uid()), 'school_admin')
      AND school_id = (SELECT get_user_school((SELECT auth.uid())))
    )
    OR public.has_role((SELECT auth.uid()), 'super_admin')
  )
);

-- Consolidated UPDATE policy
CREATE POLICY "user_profiles_update" ON public.user_profiles
FOR UPDATE
USING (
  (SELECT auth.uid()) IS NOT NULL
  AND (
    user_id = (SELECT auth.uid())
    OR (
      public.has_role((SELECT auth.uid()), 'school_admin')
      AND school_id = (SELECT get_user_school((SELECT auth.uid())))
    )
    OR public.has_role((SELECT auth.uid()), 'super_admin')
  )
);

-- ======================
-- ATTENDANCE TABLE
-- ======================
DROP POLICY IF EXISTS "School members can manage attendance" ON public.attendance;
DROP POLICY IF EXISTS "School members can view attendance" ON public.attendance;
DROP POLICY IF EXISTS "Teachers can view attendance" ON public.attendance;
DROP POLICY IF EXISTS "Teachers can manage attendance" ON public.attendance;

-- Consolidated policy for all operations
CREATE POLICY "attendance_all" ON public.attendance
FOR ALL
USING (
  (SELECT auth.uid()) IS NOT NULL
  AND (SELECT get_user_school((SELECT auth.uid()))) = school_id
  AND (
    public.has_role((SELECT auth.uid()), 'school_admin')
    OR public.has_role((SELECT auth.uid()), 'teacher')
  )
);

-- ======================
-- AUDIT_LOGS TABLE
-- ======================
DROP POLICY IF EXISTS "Users can view their own audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "School admins can view school audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Super admins can view all audit logs" ON public.audit_logs;

-- Consolidated SELECT policy
CREATE POLICY "audit_logs_select" ON public.audit_logs
FOR SELECT
USING (
  (SELECT auth.uid()) IS NOT NULL
  AND (
    user_id = (SELECT auth.uid())
    OR (
      public.has_role((SELECT auth.uid()), 'school_admin')
      AND school_id = (SELECT get_user_school((SELECT auth.uid())))
    )
    OR public.has_role((SELECT auth.uid()), 'super_admin')
  )
);

-- ======================
-- CLASSES TABLE
-- ======================
DROP POLICY IF EXISTS "School admins can manage classes" ON public.classes;
DROP POLICY IF EXISTS "School members can view classes" ON public.classes;
DROP POLICY IF EXISTS "School members can view school classes" ON public.classes;

-- Consolidated SELECT policy
CREATE POLICY "classes_select" ON public.classes
FOR SELECT
USING (
  (SELECT auth.uid()) IS NOT NULL
  AND school_id = (SELECT get_user_school((SELECT auth.uid())))
);

-- Admin operations
CREATE POLICY "classes_modify" ON public.classes
FOR ALL
USING (
  (SELECT auth.uid()) IS NOT NULL
  AND public.has_role((SELECT auth.uid()), 'school_admin')
  AND school_id = (SELECT get_user_school((SELECT auth.uid())))
);

-- ======================
-- EXAM_RESULTS TABLE
-- ======================
DROP POLICY IF EXISTS "School admins can manage results" ON public.exam_results;
DROP POLICY IF EXISTS "Teachers can manage results" ON public.exam_results;
DROP POLICY IF EXISTS "School members can view results" ON public.exam_results;
DROP POLICY IF EXISTS "Teachers can insert exam results" ON public.exam_results;
DROP POLICY IF EXISTS "Teachers can update exam results" ON public.exam_results;

-- Consolidated SELECT policy
CREATE POLICY "exam_results_select" ON public.exam_results
FOR SELECT
USING (
  (SELECT auth.uid()) IS NOT NULL
  AND school_id = (SELECT get_user_school((SELECT auth.uid())))
);

-- Consolidated INSERT/UPDATE/DELETE policy
CREATE POLICY "exam_results_modify" ON public.exam_results
FOR ALL
USING (
  (SELECT auth.uid()) IS NOT NULL
  AND school_id = (SELECT get_user_school((SELECT auth.uid())))
  AND (
    public.has_role((SELECT auth.uid()), 'school_admin')
    OR public.has_role((SELECT auth.uid()), 'teacher')
  )
);

-- ======================
-- EXAMS TABLE
-- ======================
DROP POLICY IF EXISTS "School admins can manage exams" ON public.exams;
DROP POLICY IF EXISTS "School members can view exams" ON public.exams;

-- Consolidated SELECT policy
CREATE POLICY "exams_select" ON public.exams
FOR SELECT
USING (
  (SELECT auth.uid()) IS NOT NULL
  AND school_id = (SELECT get_user_school((SELECT auth.uid())))
);

-- Admin operations
CREATE POLICY "exams_modify" ON public.exams
FOR ALL
USING (
  (SELECT auth.uid()) IS NOT NULL
  AND public.has_role((SELECT auth.uid()), 'school_admin')
  AND school_id = (SELECT get_user_school((SELECT auth.uid())))
);

-- ======================
-- SCHOOLS TABLE
-- ======================
DROP POLICY IF EXISTS "school_admin_manage_own" ON public.schools;
DROP POLICY IF EXISTS "super_admin_full_access" ON public.schools;
DROP POLICY IF EXISTS "allow_public_school_viewing" ON public.schools;
DROP POLICY IF EXISTS "allow_anonymous_school_registration" ON public.schools;

-- Consolidated policy
CREATE POLICY "schools_all" ON public.schools
FOR ALL
USING (
  (SELECT auth.uid()) IS NOT NULL
  AND (
    (
      public.has_role((SELECT auth.uid()), 'school_admin')
      AND id = (SELECT get_user_school((SELECT auth.uid())))
    )
    OR public.has_role((SELECT auth.uid()), 'super_admin')
  )
);

-- Public viewing for authenticated users
CREATE POLICY "schools_public_view" ON public.schools
FOR SELECT
USING ((SELECT auth.uid()) IS NOT NULL);

-- ======================
-- STUDENTS TABLE
-- ======================
DROP POLICY IF EXISTS "School admins can manage students" ON public.students;
DROP POLICY IF EXISTS "School members can view students" ON public.students;

-- Consolidated SELECT policy
CREATE POLICY "students_select" ON public.students
FOR SELECT
USING (
  (SELECT auth.uid()) IS NOT NULL
  AND school_id = (SELECT get_user_school((SELECT auth.uid())))
);

-- Admin operations
CREATE POLICY "students_modify" ON public.students
FOR ALL
USING (
  (SELECT auth.uid()) IS NOT NULL
  AND public.has_role((SELECT auth.uid()), 'school_admin')
  AND school_id = (SELECT get_user_school((SELECT auth.uid())))
);

-- ======================
-- SUBJECTS TABLE
-- ======================
DROP POLICY IF EXISTS "School admins can manage subjects" ON public.subjects;
DROP POLICY IF EXISTS "School members can view subjects" ON public.subjects;
DROP POLICY IF EXISTS "Super admins can manage all subjects" ON public.subjects;
DROP POLICY IF EXISTS "School admins can manage their school subjects" ON public.subjects;
DROP POLICY IF EXISTS "Super admins can view all subjects" ON public.subjects;
DROP POLICY IF EXISTS "Super admins can update all subjects" ON public.subjects;
DROP POLICY IF EXISTS "Super admins can delete all subjects" ON public.subjects;
DROP POLICY IF EXISTS "Super admins can insert subjects for any school" ON public.subjects;

-- Consolidated SELECT policy
CREATE POLICY "subjects_select" ON public.subjects
FOR SELECT
USING (
  (SELECT auth.uid()) IS NOT NULL
  AND (
    school_id = (SELECT get_user_school((SELECT auth.uid())))
    OR public.has_role((SELECT auth.uid()), 'super_admin')
  )
);

-- Consolidated modify policy
CREATE POLICY "subjects_modify" ON public.subjects
FOR ALL
USING (
  (SELECT auth.uid()) IS NOT NULL
  AND (
    (
      public.has_role((SELECT auth.uid()), 'school_admin')
      AND school_id = (SELECT get_user_school((SELECT auth.uid())))
    )
    OR public.has_role((SELECT auth.uid()), 'super_admin')
  )
);

-- ======================
-- TEACHER_APPLICATIONS TABLE
-- ======================
DROP POLICY IF EXISTS "Users can view own applications" ON public.teacher_applications;
DROP POLICY IF EXISTS "School admins can manage school applications" ON public.teacher_applications;
DROP POLICY IF EXISTS "Super admins can manage all applications" ON public.teacher_applications;
DROP POLICY IF EXISTS "Users can view their own applications" ON public.teacher_applications;
DROP POLICY IF EXISTS "School admins can view applications for their school" ON public.teacher_applications;
DROP POLICY IF EXISTS "School admins can update applications for their school" ON public.teacher_applications;
DROP POLICY IF EXISTS "Super admins can view all applications" ON public.teacher_applications;
DROP POLICY IF EXISTS "Super admins can update all applications" ON public.teacher_applications;
DROP POLICY IF EXISTS "Users can create their own applications" ON public.teacher_applications;

-- Consolidated SELECT policy
CREATE POLICY "teacher_applications_select" ON public.teacher_applications
FOR SELECT
USING (
  (SELECT auth.uid()) IS NOT NULL
  AND (
    user_id = (SELECT auth.uid())
    OR (
      public.has_role((SELECT auth.uid()), 'school_admin')
      AND school_id = (SELECT get_user_school((SELECT auth.uid())))
    )
    OR public.has_role((SELECT auth.uid()), 'super_admin')
  )
);

-- User can insert their own
CREATE POLICY "teacher_applications_insert" ON public.teacher_applications
FOR INSERT
WITH CHECK (
  (SELECT auth.uid()) IS NOT NULL
  AND user_id = (SELECT auth.uid())
);

-- Consolidated UPDATE policy
CREATE POLICY "teacher_applications_update" ON public.teacher_applications
FOR UPDATE
USING (
  (SELECT auth.uid()) IS NOT NULL
  AND (
    (
      public.has_role((SELECT auth.uid()), 'school_admin')
      AND school_id = (SELECT get_user_school((SELECT auth.uid())))
    )
    OR public.has_role((SELECT auth.uid()), 'super_admin')
  )
);

-- ======================
-- TEACHERS TABLE
-- ======================
DROP POLICY IF EXISTS "School admins can manage teachers" ON public.teachers;
DROP POLICY IF EXISTS "School members can view teachers" ON public.teachers;

-- Consolidated SELECT policy
CREATE POLICY "teachers_select" ON public.teachers
FOR SELECT
USING (
  (SELECT auth.uid()) IS NOT NULL
  AND school_id = (SELECT get_user_school((SELECT auth.uid())))
);

-- Admin operations
CREATE POLICY "teachers_modify" ON public.teachers
FOR ALL
USING (
  (SELECT auth.uid()) IS NOT NULL
  AND public.has_role((SELECT auth.uid()), 'school_admin')
  AND school_id = (SELECT get_user_school((SELECT auth.uid())))
);

-- ======================
-- TIMETABLE TABLE
-- ======================
DROP POLICY IF EXISTS "School admins can manage timetable" ON public.timetable;
DROP POLICY IF EXISTS "School members can view timetable" ON public.timetable;

-- Consolidated SELECT policy
CREATE POLICY "timetable_select" ON public.timetable
FOR SELECT
USING (
  (SELECT auth.uid()) IS NOT NULL
  AND school_id = (SELECT get_user_school((SELECT auth.uid())))
);

-- Admin operations
CREATE POLICY "timetable_modify" ON public.timetable
FOR ALL
USING (
  (SELECT auth.uid()) IS NOT NULL
  AND public.has_role((SELECT auth.uid()), 'school_admin')
  AND school_id = (SELECT get_user_school((SELECT auth.uid())))
);
