-- Fix RLS policies for school registration
-- First, drop existing policies that might conflict
DROP POLICY IF EXISTS "Anyone can create a school during registration" ON public.schools;
DROP POLICY IF EXISTS "Anyone can view active schools for signup" ON public.schools;

-- Allow unauthenticated users to create schools during registration
CREATE POLICY "Allow school registration"
ON public.schools
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow viewing active schools for registration purposes
CREATE POLICY "View active schools for registration"
ON public.schools
FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Ensure existing policies for school management remain
-- These policies should already exist from previous migrations:
-- - "Super admins can view all schools"
-- - "School admins and teachers can view their school"
-- - "Super admins can manage all schools"
-- - "School admins can update their own school"

-- Add comment explaining the policies
COMMENT ON TABLE public.schools IS 'Schools table with RLS policies allowing registration and proper access control';