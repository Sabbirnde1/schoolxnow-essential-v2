-- Fix foreign key constraint to allow school deletion
-- Drop the existing foreign key constraint
ALTER TABLE public.user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_school_id_fkey;

-- Recreate the foreign key with ON DELETE SET NULL
-- This allows schools to be deleted, setting user_profiles.school_id to NULL
ALTER TABLE public.user_profiles 
ADD CONSTRAINT user_profiles_school_id_fkey 
FOREIGN KEY (school_id) 
REFERENCES public.schools(id) 
ON DELETE SET NULL;