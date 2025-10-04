-- Allow anyone to search and view schools for signup
-- This is needed so users can select their institution during registration
CREATE POLICY "Anyone can view active schools for signup"
ON public.schools
FOR SELECT
USING (is_active = true);