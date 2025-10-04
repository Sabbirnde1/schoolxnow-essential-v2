-- Fix RLS policy for exam_results to allow teachers to insert and update marks
DROP POLICY IF EXISTS "School admins can manage results" ON public.exam_results;

-- Allow school admins and super admins to manage all results
CREATE POLICY "School admins can manage results"
ON public.exam_results
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

-- Allow teachers to insert and update exam results for their school
CREATE POLICY "Teachers can insert exam results"
ON public.exam_results
FOR INSERT
TO authenticated
WITH CHECK (
  (school_id = get_user_school(auth.uid())) 
  AND has_role(auth.uid(), 'teacher'::user_role)
);

CREATE POLICY "Teachers can update exam results"
ON public.exam_results
FOR UPDATE
TO authenticated
USING (
  (school_id = get_user_school(auth.uid())) 
  AND has_role(auth.uid(), 'teacher'::user_role)
)
WITH CHECK (
  (school_id = get_user_school(auth.uid())) 
  AND has_role(auth.uid(), 'teacher'::user_role)
);