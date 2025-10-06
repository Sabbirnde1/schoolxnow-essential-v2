-- Notifications & Reminders System
-- Migration: 20251006_notifications_system.sql

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'schedule_change',
    'exam_date',
    'assignment_deadline',
    'attendance_reminder',
    'grade_updated',
    'announcement'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  read BOOLEAN DEFAULT FALSE,
  related_id UUID,
  related_type TEXT,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notification_settings table
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  settings JSONB NOT NULL DEFAULT '{
    "email_enabled": true,
    "inapp_enabled": true,
    "push_enabled": false,
    "schedule_changes": true,
    "exam_reminders": true,
    "assignment_reminders": true,
    "attendance_reminders": true,
    "grade_updates": true,
    "announcements": true,
    "reminder_advance_days": 1,
    "quiet_hours_start": "22:00",
    "quiet_hours_end": "08:00"
  }',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_school_id ON notifications(school_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read) WHERE read = FALSE;

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own notifications"
  ON notifications FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- RLS Policies for notification_settings
CREATE POLICY "Users can view their own settings"
  ON notification_settings FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own settings"
  ON notification_settings FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own settings"
  ON notification_settings FOR UPDATE
  USING (user_id = auth.uid());

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_school_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_priority TEXT DEFAULT 'medium',
  p_related_id UUID DEFAULT NULL,
  p_related_type TEXT DEFAULT NULL,
  p_action_url TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
  v_settings JSONB;
BEGIN
  -- Check user's notification settings
  SELECT settings INTO v_settings
  FROM notification_settings
  WHERE user_id = p_user_id;
  
  -- If no settings exist or notification type is enabled, create notification
  IF v_settings IS NULL OR 
     (v_settings->>'inapp_enabled')::boolean = true THEN
    
    INSERT INTO notifications (
      user_id,
      school_id,
      type,
      title,
      message,
      priority,
      related_id,
      related_type,
      action_url
    ) VALUES (
      p_user_id,
      p_school_id,
      p_type,
      p_title,
      p_message,
      p_priority,
      p_related_id,
      p_related_type,
      p_action_url
    ) RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify users about schedule changes
CREATE OR REPLACE FUNCTION notify_schedule_change()
RETURNS TRIGGER AS $$
DECLARE
  v_teacher_id UUID;
  v_class_name TEXT;
  v_subject_name TEXT;
  v_message TEXT;
BEGIN
  -- Get teacher_id, class name, and subject name
  SELECT t.user_id, c.name, s.name
  INTO v_teacher_id, v_class_name, v_subject_name
  FROM teachers t
  LEFT JOIN classes c ON NEW.class_id = c.id
  LEFT JOIN subjects s ON NEW.subject_id = s.id
  WHERE t.id = NEW.teacher_id;
  
  IF TG_OP = 'INSERT' THEN
    v_message := format('New class scheduled: %s - %s on %s at %s',
      v_class_name, v_subject_name, NEW.day_of_week, NEW.start_time);
  ELSIF TG_OP = 'UPDATE' THEN
    v_message := format('Schedule updated: %s - %s changed to %s at %s',
      v_class_name, v_subject_name, NEW.day_of_week, NEW.start_time);
  END IF;
  
  -- Create notification for teacher
  PERFORM create_notification(
    v_teacher_id,
    NEW.school_id,
    'schedule_change',
    'Schedule Change',
    v_message,
    'high',
    NEW.id,
    'timetable',
    '/timetable'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to notify about exam dates
CREATE OR REPLACE FUNCTION notify_exam_date()
RETURNS TRIGGER AS $$
DECLARE
  v_teacher RECORD;
  v_class_name TEXT;
  v_subject_name TEXT;
  v_days_until INT;
BEGIN
  -- Get class and subject names
  SELECT c.name, s.name
  INTO v_class_name, v_subject_name
  FROM classes c
  LEFT JOIN subjects s ON NEW.subject_id = s.id
  WHERE c.id = NEW.class_id;
  
  -- Calculate days until exam
  v_days_until := (NEW.exam_date - CURRENT_DATE);
  
  -- Notify all teachers of this class
  FOR v_teacher IN
    SELECT DISTINCT t.user_id, t.id
    FROM teachers t
    JOIN timetable tt ON tt.teacher_id = t.id
    WHERE tt.class_id = NEW.class_id
      AND tt.school_id = NEW.school_id
  LOOP
    -- Create notification based on days until exam
    IF v_days_until <= 7 THEN
      PERFORM create_notification(
        v_teacher.user_id,
        NEW.school_id,
        'exam_date',
        'Upcoming Exam',
        format('Exam for %s - %s in %s days on %s',
          v_class_name, v_subject_name, v_days_until, NEW.exam_date),
        CASE 
          WHEN v_days_until <= 1 THEN 'urgent'
          WHEN v_days_until <= 3 THEN 'high'
          ELSE 'medium'
        END,
        NEW.id,
        'exam',
        '/exams'
      );
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to remind about pending attendance
CREATE OR REPLACE FUNCTION remind_pending_attendance()
RETURNS void AS $$
DECLARE
  v_teacher RECORD;
  v_pending_count INT;
BEGIN
  -- Find teachers with classes today who haven't taken attendance
  FOR v_teacher IN
    SELECT DISTINCT 
      t.user_id,
      t.id as teacher_id,
      t.school_id,
      COUNT(DISTINCT tt.class_id) as class_count
    FROM teachers t
    JOIN timetable tt ON tt.teacher_id = t.id
    WHERE tt.day_of_week = TO_CHAR(CURRENT_DATE, 'Day')
      AND NOT EXISTS (
        SELECT 1 FROM attendance a
        WHERE a.class_id = tt.class_id
          AND a.date = CURRENT_DATE
      )
    GROUP BY t.user_id, t.id, t.school_id
  LOOP
    PERFORM create_notification(
      v_teacher.user_id,
      v_teacher.school_id,
      'attendance_reminder',
      'Attendance Reminder',
      format('You have %s class(es) with pending attendance for today', v_teacher.class_count),
      'high',
      NULL,
      'attendance',
      '/attendance'
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to notify about grade updates
CREATE OR REPLACE FUNCTION notify_grade_update()
RETURNS TRIGGER AS $$
DECLARE
  v_student_user_id UUID;
  v_exam_name TEXT;
BEGIN
  -- Get student's user_id and exam name
  SELECT s.user_id, e.name
  INTO v_student_user_id, v_exam_name
  FROM students s
  JOIN exams e ON e.id = NEW.exam_id
  WHERE s.id = NEW.student_id;
  
  IF v_student_user_id IS NOT NULL THEN
    PERFORM create_notification(
      v_student_user_id,
      NEW.school_id,
      'grade_updated',
      'Grade Published',
      format('Your grade for %s has been published: %s/%s',
        v_exam_name, NEW.obtained_marks, NEW.total_marks),
      'medium',
      NEW.id,
      'exam_result',
      '/grades'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_schedule_change ON timetable;
CREATE TRIGGER trigger_schedule_change
  AFTER INSERT OR UPDATE ON timetable
  FOR EACH ROW
  EXECUTE FUNCTION notify_schedule_change();

DROP TRIGGER IF EXISTS trigger_exam_date ON exams;
CREATE TRIGGER trigger_exam_date
  AFTER INSERT OR UPDATE ON exams
  FOR EACH ROW
  EXECUTE FUNCTION notify_exam_date();

DROP TRIGGER IF EXISTS trigger_grade_update ON exam_results;
CREATE TRIGGER trigger_grade_update
  AFTER INSERT OR UPDATE ON exam_results
  FOR EACH ROW
  EXECUTE FUNCTION notify_grade_update();

-- Create a scheduled job for daily attendance reminders
-- Note: This requires pg_cron extension
-- Uncomment if pg_cron is available
-- SELECT cron.schedule(
--   'attendance-reminder',
--   '0 14 * * *', -- Run daily at 2 PM
--   $$ SELECT remind_pending_attendance(); $$
-- );

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE ON notification_settings TO authenticated;
GRANT EXECUTE ON FUNCTION create_notification TO authenticated;
GRANT EXECUTE ON FUNCTION remind_pending_attendance TO authenticated;

-- Comments for documentation
COMMENT ON TABLE notifications IS 'Stores all user notifications for schedule changes, exams, assignments, and announcements';
COMMENT ON TABLE notification_settings IS 'User-specific notification preferences and reminder settings';
COMMENT ON FUNCTION create_notification IS 'Creates a new notification respecting user preferences';
COMMENT ON FUNCTION notify_schedule_change IS 'Triggered when timetable entries are created or updated';
COMMENT ON FUNCTION notify_exam_date IS 'Triggered when exam dates are created or updated';
COMMENT ON FUNCTION notify_grade_update IS 'Triggered when exam results are published';
COMMENT ON FUNCTION remind_pending_attendance IS 'Sends daily reminders for pending attendance';
