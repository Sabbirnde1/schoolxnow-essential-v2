-- Migration: Separate roles into dedicated table for security
-- This prevents privilege escalation attacks by isolating role management

-- Step 1: Create the user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role user_role NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Step 2: Migrate existing roles from user_profiles to user_roles
INSERT INTO public.user_roles (user_id, role, created_at)
SELECT user_id, role, created_at
FROM public.user_profiles
WHERE role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 3: Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role user_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Step 4: Create function to get primary role (for backward compatibility)
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid uuid)
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = user_uuid LIMIT 1;
$$;

-- Step 5: RLS Policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Super admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can manage all roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'));

-- Step 6: Update existing RLS policies to use has_role function
-- Update user_profiles policies
DROP POLICY IF EXISTS "School admins can update school profiles" ON public.user_profiles;
CREATE POLICY "School admins can update school profiles"
ON public.user_profiles
FOR UPDATE
USING (
  (SELECT school_id FROM public.user_profiles WHERE user_id = auth.uid()) = school_id
  AND (public.has_role(auth.uid(), 'school_admin') OR public.has_role(auth.uid(), 'super_admin'))
);

DROP POLICY IF EXISTS "School admins can view school profiles" ON public.user_profiles;
CREATE POLICY "School admins can view school profiles"
ON public.user_profiles
FOR SELECT
USING (
  (SELECT school_id FROM public.user_profiles WHERE user_id = auth.uid()) = school_id
  AND public.has_role(auth.uid(), 'school_admin')
);

DROP POLICY IF EXISTS "Super admins can update all profiles" ON public.user_profiles;
CREATE POLICY "Super admins can update all profiles"
ON public.user_profiles
FOR UPDATE
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.user_profiles;
CREATE POLICY "Super admins can view all profiles"
ON public.user_profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'super_admin'));

-- Update schools policies
DROP POLICY IF EXISTS "School admins can update their own school" ON public.schools;
CREATE POLICY "School admins can update their own school"
ON public.schools
FOR UPDATE
USING (
  id = get_user_school(auth.uid())
  AND (public.has_role(auth.uid(), 'school_admin') OR public.has_role(auth.uid(), 'super_admin'))
);

DROP POLICY IF EXISTS "Super admins can manage all schools" ON public.schools;
CREATE POLICY "Super admins can manage all schools"
ON public.schools
FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Super admins can view all schools" ON public.schools;
CREATE POLICY "Super admins can view all schools"
ON public.schools
FOR SELECT
USING (public.has_role(auth.uid(), 'super_admin'));

-- Update teacher_applications policies
DROP POLICY IF EXISTS "School admins can update applications for their school" ON public.teacher_applications;
CREATE POLICY "School admins can update applications for their school"
ON public.teacher_applications
FOR UPDATE
USING (
  school_id = get_user_school(auth.uid())
  AND (public.has_role(auth.uid(), 'school_admin') OR public.has_role(auth.uid(), 'super_admin'))
);

DROP POLICY IF EXISTS "School admins can view applications for their school" ON public.teacher_applications;
CREATE POLICY "School admins can view applications for their school"
ON public.teacher_applications
FOR SELECT
USING (
  school_id = get_user_school(auth.uid())
  AND (public.has_role(auth.uid(), 'school_admin') OR public.has_role(auth.uid(), 'super_admin'))
);

DROP POLICY IF EXISTS "Super admins can update all applications" ON public.teacher_applications;
CREATE POLICY "Super admins can update all applications"
ON public.teacher_applications
FOR UPDATE
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Super admins can view all applications" ON public.teacher_applications;
CREATE POLICY "Super admins can view all applications"
ON public.teacher_applications
FOR SELECT
USING (public.has_role(auth.uid(), 'super_admin'));

-- Update classes policies
DROP POLICY IF EXISTS "School admins can manage classes" ON public.classes;
CREATE POLICY "School admins can manage classes"
ON public.classes
FOR ALL
USING (
  school_id = get_user_school(auth.uid())
  AND (public.has_role(auth.uid(), 'school_admin') OR public.has_role(auth.uid(), 'super_admin'))
);

-- Update students policies
DROP POLICY IF EXISTS "School admins can manage students" ON public.students;
CREATE POLICY "School admins can manage students"
ON public.students
FOR ALL
USING (
  school_id = get_user_school(auth.uid())
  AND (public.has_role(auth.uid(), 'school_admin') OR public.has_role(auth.uid(), 'super_admin'))
);

-- Update teachers policies
DROP POLICY IF EXISTS "School admins can manage teachers" ON public.teachers;
CREATE POLICY "School admins can manage teachers"
ON public.teachers
FOR ALL
USING (
  school_id = get_user_school(auth.uid())
  AND (public.has_role(auth.uid(), 'school_admin') OR public.has_role(auth.uid(), 'super_admin'))
);

-- Update subjects policies
DROP POLICY IF EXISTS "School admins can manage subjects" ON public.subjects;
CREATE POLICY "School admins can manage subjects"
ON public.subjects
FOR ALL
USING (
  school_id = get_user_school(auth.uid())
  AND (public.has_role(auth.uid(), 'school_admin') OR public.has_role(auth.uid(), 'super_admin'))
);

-- Update exams policies
DROP POLICY IF EXISTS "School admins can manage exams" ON public.exams;
CREATE POLICY "School admins can manage exams"
ON public.exams
FOR ALL
USING (
  school_id = get_user_school(auth.uid())
  AND (public.has_role(auth.uid(), 'school_admin') OR public.has_role(auth.uid(), 'super_admin'))
);

-- Update exam_results policies
DROP POLICY IF EXISTS "School admins can manage results" ON public.exam_results;
CREATE POLICY "School admins can manage results"
ON public.exam_results
FOR ALL
USING (
  school_id = get_user_school(auth.uid())
  AND (public.has_role(auth.uid(), 'school_admin') OR public.has_role(auth.uid(), 'super_admin'))
);

-- Update handle_new_user trigger function to create role in user_roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_role_value user_role;
BEGIN
  -- Determine the role
  user_role_value := COALESCE(
    (NEW.raw_user_meta_data->>'role')::user_role,
    'teacher'::user_role
  );

  -- Insert into user_profiles (without role column)
  INSERT INTO public.user_profiles (user_id, full_name, approval_status, school_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'New User'),
    'approved',
    COALESCE((NEW.raw_user_meta_data->>'school_id')::uuid, NULL)
  );

  -- Insert role into user_roles table
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role_value)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$function$;

-- Step 7: Add index for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- Note: Keeping role column in user_profiles for now for backward compatibility
-- It will be synced via application logic during transition period
-- Can be removed in a future migration once all code is updated