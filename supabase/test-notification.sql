-- Test Notification Creation
-- Run this in Supabase SQL Editor to test the notification system

-- Replace with your actual user_id and school_id
-- You can find these in the user_profiles table

-- Example 1: Create a test announcement notification
SELECT create_notification(
  (SELECT user_id FROM user_profiles LIMIT 1), -- Gets first user
  (SELECT school_id FROM user_profiles LIMIT 1), -- Gets first school
  'announcement',
  'System Test',
  'This is a test notification. The notification system is working correctly!',
  'medium'
);

-- Example 2: Create an urgent exam reminder
SELECT create_notification(
  (SELECT user_id FROM user_profiles LIMIT 1),
  (SELECT school_id FROM user_profiles LIMIT 1),
  'exam_date',
  'Urgent: Exam Tomorrow',
  'Mid-term Exam for Mathematics is scheduled for tomorrow at 10:00 AM',
  'urgent'
);

-- Example 3: Create a schedule change notification
SELECT create_notification(
  (SELECT user_id FROM user_profiles LIMIT 1),
  (SELECT school_id FROM user_profiles LIMIT 1),
  'schedule_change',
  'Schedule Updated',
  'Your class timing for Form 1A - Science has been changed to Monday 9:00 AM',
  'high'
);

-- View all notifications for testing
SELECT 
  id,
  type,
  title,
  message,
  priority,
  read,
  created_at
FROM notifications
ORDER BY created_at DESC
LIMIT 10;

-- Count unread notifications
SELECT 
  COUNT(*) as unread_count
FROM notifications
WHERE read = FALSE;
