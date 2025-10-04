-- Create timetable table for scheduling management
CREATE TABLE public.timetable (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL,
  class_id UUID NOT NULL,
  subject_id UUID NOT NULL,
  teacher_id UUID NOT NULL,
  day_of_week TEXT NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday')),
  time_slot TEXT NOT NULL,
  room_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(school_id, class_id, day_of_week, time_slot),
  UNIQUE(school_id, teacher_id, day_of_week, time_slot)
);

-- Enable Row Level Security
ALTER TABLE public.timetable ENABLE ROW LEVEL SECURITY;

-- Create policies for timetable access
CREATE POLICY "School admins can manage timetable" 
ON public.timetable 
FOR ALL 
USING (
  school_id = get_user_school(auth.uid()) AND 
  get_user_role(auth.uid()) = ANY(ARRAY['school_admin'::user_role, 'super_admin'::user_role])
);

CREATE POLICY "School members can view timetable" 
ON public.timetable 
FOR SELECT 
USING (school_id = get_user_school(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_timetable_updated_at
BEFORE UPDATE ON public.timetable
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();