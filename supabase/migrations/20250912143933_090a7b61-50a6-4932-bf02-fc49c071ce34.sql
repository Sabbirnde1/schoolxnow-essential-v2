-- Enable replica identity for user_profiles table to support real-time updates
ALTER TABLE public.user_profiles REPLICA IDENTITY FULL;