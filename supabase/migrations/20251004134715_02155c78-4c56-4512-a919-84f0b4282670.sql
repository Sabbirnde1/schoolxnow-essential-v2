-- Drop all existing policies for exam_results
DROP POLICY IF EXISTS "School admins can manage results" ON public.exam_results;
DROP POLICY IF EXISTS "School members can view results" ON public.exam_results;
DROP POLICY IF EXISTS "Teachers can insert exam results" ON public.exam_results;
DROP POLICY IF EXISTS "Teachers can update exam results" ON public.exam_results;

-- Recreate policies with proper permissions

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

-- Allow all school members (including teachers) to view results
CREATE POLICY "School members can view results"
ON public.exam_results
FOR SELECT
TO authenticated
USING (school_id = get_user_school(auth.uid()));

-- Allow teachers to insert exam results for their school
CREATE POLICY "Teachers can insert exam results"
ON public.exam_results
FOR INSERT
TO authenticated
WITH CHECK (
  (school_id = get_user_school(auth.uid())) 
  AND has_role(auth.uid(), 'teacher'::user_role)
);

-- Allow teachers to update exam results for their school
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