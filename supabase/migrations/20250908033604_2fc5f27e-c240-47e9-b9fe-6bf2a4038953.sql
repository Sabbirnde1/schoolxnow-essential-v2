-- Enable realtime for the tables
ALTER TABLE public.user_profiles REPLICA IDENTITY FULL;
ALTER TABLE public.students REPLICA IDENTITY FULL;
ALTER TABLE public.classes REPLICA IDENTITY FULL;
ALTER TABLE public.subjects REPLICA IDENTITY FULL;
ALTER TABLE public.schools REPLICA IDENTITY FULL;
ALTER TABLE public.teachers REPLICA IDENTITY FULL;

-- Add tables to realtime publication
BEGIN;
  -- Remove tables from publication first (in case they're already added)
  DROP PUBLICATION IF EXISTS supabase_realtime CASCADE;
  
  -- Create the publication with all our tables
  CREATE PUBLICATION supabase_realtime FOR TABLE
    public.user_profiles,
    public.students,
    public.classes,
    public.subjects,
    public.schools,
    public.teachers,
    public.teacher_applications,
    public.attendance,
    public.exams,
    public.exam_results;
COMMIT;