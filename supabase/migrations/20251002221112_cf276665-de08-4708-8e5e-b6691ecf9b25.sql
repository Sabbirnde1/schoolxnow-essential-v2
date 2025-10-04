-- Recreate the view with explicit SECURITY INVOKER to address linter warning
DROP VIEW IF EXISTS public.schools_public_view;

CREATE VIEW public.schools_public_view 
WITH (security_invoker = true) AS
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

COMMENT ON VIEW public.schools_public_view IS 'Public view that exposes only non-sensitive school information for registration/signup forms. Contact details are protected.';