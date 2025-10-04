-- Enable RLS on auth.users is already enabled by default in Supabase

-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('super_admin', 'school_admin', 'teacher');

-- Create enum for school types (Bangladeshi education systems)
CREATE TYPE public.school_type AS ENUM ('bangla_medium', 'english_medium', 'madrasha');

-- Create enum for student status
CREATE TYPE public.student_status AS ENUM ('active', 'inactive', 'graduated', 'transferred');

-- Create enum for class levels
CREATE TYPE public.class_level AS ENUM (
  'nursery', 'kg', 'class_1', 'class_2', 'class_3', 'class_4', 'class_5',
  'class_6', 'class_7', 'class_8', 'class_9', 'class_10', 'class_11', 'class_12',
  'alim', 'fazil', 'kamil'
);

-- Create schools table
CREATE TABLE public.schools (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_bangla TEXT,
  school_type school_type NOT NULL,
  address TEXT NOT NULL,
  address_bangla TEXT,
  phone TEXT,
  email TEXT,
  eiin_number TEXT UNIQUE,
  established_year INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_profiles table
CREATE TABLE public.user_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  school_id UUID REFERENCES public.schools,
  role user_role NOT NULL,
  full_name TEXT NOT NULL,
  full_name_bangla TEXT,
  phone TEXT,
  address TEXT,
  address_bangla TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create classes table
CREATE TABLE public.classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES public.schools NOT NULL,
  name TEXT NOT NULL,
  name_bangla TEXT,
  class_level class_level NOT NULL,
  section TEXT NOT NULL DEFAULT 'A',
  capacity INTEGER DEFAULT 40,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(school_id, class_level, section)
);

-- Create students table
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES public.schools NOT NULL,
  class_id UUID REFERENCES public.classes,
  student_id TEXT NOT NULL,
  full_name TEXT NOT NULL,
  full_name_bangla TEXT,
  father_name TEXT NOT NULL,
  father_name_bangla TEXT,
  mother_name TEXT NOT NULL,
  mother_name_bangla TEXT,
  date_of_birth DATE NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  blood_group TEXT,
  address TEXT NOT NULL,
  address_bangla TEXT,
  guardian_phone TEXT NOT NULL,
  guardian_email TEXT,
  admission_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status student_status NOT NULL DEFAULT 'active',
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(school_id, student_id)
);

-- Create subjects table
CREATE TABLE public.subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES public.schools NOT NULL,
  name TEXT NOT NULL,
  name_bangla TEXT,
  code TEXT NOT NULL,
  class_level class_level NOT NULL,
  is_optional BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(school_id, code, class_level)
);

-- Create teachers table
CREATE TABLE public.teachers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  school_id UUID REFERENCES public.schools NOT NULL,
  teacher_id TEXT NOT NULL,
  full_name TEXT NOT NULL,
  full_name_bangla TEXT,
  designation TEXT,
  qualification TEXT,
  subject_specialization TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  address_bangla TEXT,
  joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(school_id, teacher_id)
);

-- Create attendance table
CREATE TABLE public.attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES public.schools NOT NULL,
  student_id UUID REFERENCES public.students NOT NULL,
  class_id UUID REFERENCES public.classes NOT NULL,
  date DATE NOT NULL,
  is_present BOOLEAN NOT NULL DEFAULT false,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, date)
);

-- Create exams table
CREATE TABLE public.exams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES public.schools NOT NULL,
  name TEXT NOT NULL,
  name_bangla TEXT,
  class_level class_level NOT NULL,
  exam_date DATE NOT NULL,
  total_marks INTEGER NOT NULL DEFAULT 100,
  pass_marks INTEGER NOT NULL DEFAULT 40,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create exam_results table
CREATE TABLE public.exam_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES public.schools NOT NULL,
  exam_id UUID REFERENCES public.exams NOT NULL,
  student_id UUID REFERENCES public.students NOT NULL,
  subject_id UUID REFERENCES public.subjects NOT NULL,
  obtained_marks INTEGER NOT NULL,
  total_marks INTEGER NOT NULL,
  grade TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(exam_id, student_id, subject_id)
);

-- Enable Row Level Security
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;

-- Create function to check user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_profiles WHERE user_id = user_uuid;
$$;

-- Create function to get user school
CREATE OR REPLACE FUNCTION public.get_user_school(user_uuid UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT school_id FROM public.user_profiles WHERE user_id = user_uuid;
$$;

-- RLS Policies for schools
CREATE POLICY "Super admins can view all schools"
ON public.schools FOR SELECT
TO authenticated
USING (public.get_user_role(auth.uid()) = 'super_admin');

CREATE POLICY "School admins and teachers can view their school"
ON public.schools FOR SELECT
TO authenticated
USING (id = public.get_user_school(auth.uid()));

CREATE POLICY "Super admins can manage all schools"
ON public.schools FOR ALL
TO authenticated
USING (public.get_user_role(auth.uid()) = 'super_admin');

-- RLS Policies for user_profiles
CREATE POLICY "Users can view their own profile"
ON public.user_profiles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Super admins can view all profiles"
ON public.user_profiles FOR SELECT
TO authenticated
USING (public.get_user_role(auth.uid()) = 'super_admin');

CREATE POLICY "School admins can view school profiles"
ON public.user_profiles FOR SELECT
TO authenticated
USING (
  school_id = public.get_user_school(auth.uid()) 
  AND public.get_user_role(auth.uid()) = 'school_admin'
);

-- RLS Policies for school-specific tables (classes, students, etc.)
CREATE POLICY "School members can view school classes"
ON public.classes FOR SELECT
TO authenticated
USING (school_id = public.get_user_school(auth.uid()));

CREATE POLICY "School admins can manage classes"
ON public.classes FOR ALL
TO authenticated
USING (
  school_id = public.get_user_school(auth.uid())
  AND public.get_user_role(auth.uid()) IN ('school_admin', 'super_admin')
);

CREATE POLICY "School members can view students"
ON public.students FOR SELECT
TO authenticated
USING (school_id = public.get_user_school(auth.uid()));

CREATE POLICY "School admins can manage students"
ON public.students FOR ALL
TO authenticated
USING (
  school_id = public.get_user_school(auth.uid())
  AND public.get_user_role(auth.uid()) IN ('school_admin', 'super_admin')
);

-- Similar policies for other tables
CREATE POLICY "School members can view subjects"
ON public.subjects FOR SELECT
TO authenticated
USING (school_id = public.get_user_school(auth.uid()));

CREATE POLICY "School members can view teachers"
ON public.teachers FOR SELECT
TO authenticated
USING (school_id = public.get_user_school(auth.uid()));

CREATE POLICY "School members can view attendance"
ON public.attendance FOR SELECT
TO authenticated
USING (school_id = public.get_user_school(auth.uid()));

CREATE POLICY "School members can manage attendance"
ON public.attendance FOR ALL
TO authenticated
USING (school_id = public.get_user_school(auth.uid()));

CREATE POLICY "School members can view exams"
ON public.exams FOR SELECT
TO authenticated
USING (school_id = public.get_user_school(auth.uid()));

CREATE POLICY "School members can view results"
ON public.exam_results FOR SELECT
TO authenticated
USING (school_id = public.get_user_school(auth.uid()));

-- Create trigger for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers to all tables with updated_at
CREATE TRIGGER update_schools_updated_at
  BEFORE UPDATE ON public.schools
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_classes_updated_at
  BEFORE UPDATE ON public.classes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subjects_updated_at
  BEFORE UPDATE ON public.subjects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_teachers_updated_at
  BEFORE UPDATE ON public.teachers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_exams_updated_at
  BEFORE UPDATE ON public.exams
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, role, full_name)
  VALUES (NEW.id, 'teacher', COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();