-- Reset all existing policies for schools table
DROP POLICY IF EXISTS "Anyone can create a school during registration" ON public.schools;
DROP POLICY IF EXISTS "Anyone can view active schools for signup" ON public.schools;
DROP POLICY IF EXISTS "Allow school registration" ON public.schools;
DROP POLICY IF EXISTS "View active schools for registration" ON public.schools;
DROP POLICY IF EXISTS "Super admins can view all schools" ON public.schools;
DROP POLICY IF EXISTS "School admins and teachers can view their school" ON public.schools;
DROP POLICY IF EXISTS "Super admins can manage all schools" ON public.schools;
DROP POLICY IF EXISTS "School admins can update their own school" ON public.schools;

-- Enable RLS on schools table
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- 1. Allow anonymous registration
CREATE POLICY "allow_anonymous_school_registration"
ON public.schools
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 2. Allow public viewing of active schools (for registration forms)
CREATE POLICY "allow_public_school_viewing"
ON public.schools
FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- 3. Super admin full access
CREATE POLICY "super_admin_full_access"
ON public.schools
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'super_admin'::text)
WITH CHECK (auth.jwt() ->> 'role' = 'super_admin'::text);

-- 4. School admin view and update their own school
CREATE POLICY "school_admin_manage_own"
ON public.schools
FOR ALL
TO authenticated
USING (
    id = (
        SELECT school_id 
        FROM public.user_profiles 
        WHERE user_id = auth.uid() 
        AND role = 'school_admin'
    )
)
WITH CHECK (
    id = (
        SELECT school_id 
        FROM public.user_profiles 
        WHERE user_id = auth.uid() 
        AND role = 'school_admin'
    )
);

-- 5. Teachers can view their school
CREATE POLICY "teachers_view_own_school"
ON public.schools
FOR SELECT
TO authenticated
USING (
    id = (
        SELECT school_id 
        FROM public.user_profiles 
        WHERE user_id = auth.uid() 
        AND role = 'teacher'
    )
);

-- Create helper function for school creation
CREATE OR REPLACE FUNCTION public.create_school_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- Automatically mark the school as active
    NEW.is_active := true;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to run before school insertion
DROP TRIGGER IF EXISTS before_school_insert ON public.schools;
CREATE TRIGGER before_school_insert
    BEFORE INSERT ON public.schools
    FOR EACH ROW
    EXECUTE FUNCTION public.create_school_profile();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_schools_is_active ON public.schools(is_active);
CREATE INDEX IF NOT EXISTS idx_user_profiles_school_id ON public.user_profiles(school_id);

-- Grant necessary permissions
GRANT USAGE ON SEQUENCE schools_id_seq TO anon, authenticated;
GRANT SELECT ON public.schools TO anon, authenticated;