-- Fix RLS policy for classes table to allow INSERT operations
DROP POLICY IF EXISTS "School admins can manage classes" ON public.classes;

-- Recreate the policy with both USING and WITH CHECK expressions
CREATE POLICY "School admins can manage classes"
ON public.classes
FOR ALL
TO authenticated
USING (
  (school_id = get_user_school(auth.uid())) 
  AND (has_role(auth.uid(), 'school_admin'::user_role) OR has_role(auth.uid(), 'super_admin'::user_role))
)
WITH CHECK (
  (school_id = get_user_school(auth.uid())) 
  AND (has_role(auth.uid(), 'school_admin'::user_role) OR has_role(auth.uid(), 'super_admin'::user_role))
);