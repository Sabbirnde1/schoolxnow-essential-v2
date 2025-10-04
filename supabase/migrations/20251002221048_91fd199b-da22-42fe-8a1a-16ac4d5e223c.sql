-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Anyone can view active schools for signup" ON public.schools;

-- Create a secure view that only exposes non-sensitive information
CREATE OR REPLACE VIEW public.schools_public_view AS
SELECT 
  id,
  name,
  name_bangla,
  school_type,
  is_active
FROM public.schools
WHERE is_active = true;

-- Grant public access to the view
GRANT SELECT ON public.schools_public_view TO anon;
GRANT SELECT ON public.schools_public_view TO authenticated;

-- Ensure authenticated users can still see full details if they're part of the school system
-- (existing policies handle this: "School admins and teachers can view their school", 
-- "Super admins can view all schools")

-- Add a comment explaining the security measure
COMMENT ON VIEW public.schools_public_view IS 'Public view that exposes only non-sensitive school information for registration/signup forms. Contact details are protected.';
