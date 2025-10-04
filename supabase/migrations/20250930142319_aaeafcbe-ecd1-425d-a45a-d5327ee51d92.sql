-- Fix user deletion by updating the foreign key constraint
-- This allows users to be deleted from auth.users and cascades to user_profiles

-- Drop the existing foreign key constraint
ALTER TABLE public.user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_user_id_fkey;

-- Add the constraint back with ON DELETE CASCADE
ALTER TABLE public.user_profiles
ADD CONSTRAINT user_profiles_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;