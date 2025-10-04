-- Insert sample schools for testing with correct enum values
INSERT INTO public.schools (name, name_bangla, address, address_bangla, phone, email, school_type, established_year) VALUES
('Dhaka Model High School', 'ঢাকা মডেল উচ্চ বিদ্যালয়', '123 Dhanmondi, Dhaka', '১২৩ ধানমন্ডি, ঢাকা', '+880-2-9661234', 'info@dhakamodel.edu.bd', 'bangla_medium', 1995),
('Chittagong English School', 'চট্টগ্রাম ইংলিশ স্কুল', '456 Agrabad, Chittagong', '৪৫৬ আগ্রাবাদ, চট্টগ্রাম', '+880-31-710123', 'contact@ctgenglish.edu.bd', 'english_medium', 1980),
('Sylhet Islamia Madrasha', 'সিলেট ইসলামিয়া মাদ্রাসা', '789 Zindabazar, Sylhet', '৭৮৯ জিন্দাবাজার, সিলেট', '+880-821-710456', 'info@sylhetislamia.edu.bd', 'madrasha', 1965),
('Rajshahi Bangla Medium School', 'রাজশাহী বাংলা মাধ্যম স্কুল', '321 Court Station, Rajshahi', '৩২১ কোর্ট স্টেশন, রাজশাহী', '+880-721-770789', 'admin@rajshahibangla.edu.bd', 'bangla_medium', 1988),
('Khulna International School', 'খুলনা আন্তর্জাতিক স্কুল', '654 Shibbari, Khulna', '৬৫৪ শিববাড়ি, খুলনা', '+880-41-720321', 'info@khulnaintl.edu.bd', 'english_medium', 2000);

-- Create teacher_applications table for tracking applications
CREATE TABLE public.teacher_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  full_name_bangla TEXT,
  phone TEXT NOT NULL,
  address TEXT,
  address_bangla TEXT,
  qualification TEXT,
  subject_specialization TEXT,
  experience_years INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  application_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on teacher_applications
ALTER TABLE public.teacher_applications ENABLE ROW LEVEL SECURITY;

-- Policies for teacher_applications
CREATE POLICY "Users can view their own applications" 
ON public.teacher_applications 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own applications" 
ON public.teacher_applications 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "School admins can view applications for their school" 
ON public.teacher_applications 
FOR SELECT 
USING (
  school_id = get_user_school(auth.uid()) 
  AND get_user_role(auth.uid()) = ANY (ARRAY['school_admin'::user_role, 'super_admin'::user_role])
);

CREATE POLICY "School admins can update applications for their school" 
ON public.teacher_applications 
FOR UPDATE 
USING (
  school_id = get_user_school(auth.uid()) 
  AND get_user_role(auth.uid()) = ANY (ARRAY['school_admin'::user_role, 'super_admin'::user_role])
);

-- Add trigger for updated_at
CREATE TRIGGER update_teacher_applications_updated_at
BEFORE UPDATE ON public.teacher_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add approval_status to user_profiles
ALTER TABLE public.user_profiles ADD COLUMN approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- Update existing users to approved status
UPDATE public.user_profiles SET approval_status = 'approved' WHERE approval_status IS NULL;