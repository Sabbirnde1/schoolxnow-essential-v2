-- User Feedback & Survey System
-- Migration: 20251006_feedback_system.sql

-- Create feedback_submissions table
CREATE TABLE IF NOT EXISTS feedback_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN (
    'general_feedback',
    'feature_request',
    'bug_report',
    'usability_issue',
    'nps_survey'
  )),
  rating INT CHECK (rating >= 0 AND rating <= 5),
  nps_score INT CHECK (nps_score >= 0 AND nps_score <= 10),
  satisfaction TEXT CHECK (satisfaction IN (
    'excellent', 'good', 'average', 'poor', 'very_poor'
  )),
  subject TEXT,
  feedback TEXT,
  feature_request TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  improvement_area TEXT,
  status TEXT DEFAULT 'submitted' CHECK (status IN (
    'submitted', 'reviewed', 'in_progress', 'completed', 'archived'
  )),
  admin_notes TEXT,
  admin_response TEXT,
  responded_at TIMESTAMPTZ,
  responded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create feedback_analytics table for aggregated metrics
CREATE TABLE IF NOT EXISTS feedback_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_submissions INT DEFAULT 0,
  avg_rating DECIMAL(3,2),
  avg_nps_score DECIMAL(3,2),
  nps_promoters INT DEFAULT 0,  -- Score 9-10
  nps_passives INT DEFAULT 0,   -- Score 7-8
  nps_detractors INT DEFAULT 0, -- Score 0-6
  nps_percentage DECIMAL(5,2),
  satisfaction_breakdown JSONB DEFAULT '{}',
  category_breakdown JSONB DEFAULT '{}',
  top_features_requested JSONB DEFAULT '[]',
  top_issues_reported JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(school_id, period_start, period_end)
);

-- Create survey_templates table for predefined surveys
CREATE TABLE IF NOT EXISTS survey_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  survey_type TEXT NOT NULL CHECK (survey_type IN (
    'onboarding', 'quarterly', 'feature_specific', 'nps', 'exit'
  )),
  questions JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  target_role TEXT CHECK (target_role IN ('teacher', 'admin', 'super_admin', 'all')),
  frequency_days INT DEFAULT 90, -- How often to show (days)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_survey_responses table to track who completed what
CREATE TABLE IF NOT EXISTS user_survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  survey_template_id UUID REFERENCES survey_templates(id) ON DELETE CASCADE,
  feedback_submission_id UUID REFERENCES feedback_submissions(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, survey_template_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_school_id ON feedback_submissions(school_id);
CREATE INDEX IF NOT EXISTS idx_feedback_category ON feedback_submissions(category);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback_submissions(status);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON feedback_submissions(rating);
CREATE INDEX IF NOT EXISTS idx_feedback_nps_score ON feedback_submissions(nps_score);

CREATE INDEX IF NOT EXISTS idx_analytics_school_id ON feedback_analytics(school_id);
CREATE INDEX IF NOT EXISTS idx_analytics_period ON feedback_analytics(period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_survey_templates_active ON survey_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_user_survey_responses_user ON user_survey_responses(user_id);

-- Enable Row Level Security
ALTER TABLE feedback_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_survey_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for feedback_submissions
CREATE POLICY "Users can view their own feedback"
  ON feedback_submissions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own feedback"
  ON feedback_submissions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all feedback for their school"
  ON feedback_submissions FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update feedback status"
  ON feedback_submissions FOR UPDATE
  USING (
    school_id IN (
      SELECT school_id FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for feedback_analytics
CREATE POLICY "Admins can view analytics for their school"
  ON feedback_analytics FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for survey_templates
CREATE POLICY "All authenticated users can view active surveys"
  ON survey_templates FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage survey templates"
  ON survey_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for user_survey_responses
CREATE POLICY "Users can view their own survey responses"
  ON user_survey_responses FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own survey responses"
  ON user_survey_responses FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Function to calculate and update feedback analytics
CREATE OR REPLACE FUNCTION calculate_feedback_analytics(
  p_school_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS void AS $$
DECLARE
  v_total_submissions INT;
  v_avg_rating DECIMAL(3,2);
  v_avg_nps DECIMAL(3,2);
  v_promoters INT;
  v_passives INT;
  v_detractors INT;
  v_nps_percentage DECIMAL(5,2);
  v_satisfaction JSONB;
  v_categories JSONB;
BEGIN
  -- Count total submissions
  SELECT COUNT(*)
  INTO v_total_submissions
  FROM feedback_submissions
  WHERE school_id = p_school_id
    AND created_at::date BETWEEN p_start_date AND p_end_date;

  -- Calculate average rating
  SELECT ROUND(AVG(rating)::numeric, 2)
  INTO v_avg_rating
  FROM feedback_submissions
  WHERE school_id = p_school_id
    AND created_at::date BETWEEN p_start_date AND p_end_date
    AND rating IS NOT NULL;

  -- Calculate NPS metrics
  SELECT 
    COUNT(*) FILTER (WHERE nps_score >= 9),
    COUNT(*) FILTER (WHERE nps_score >= 7 AND nps_score <= 8),
    COUNT(*) FILTER (WHERE nps_score <= 6),
    ROUND(AVG(nps_score)::numeric, 2)
  INTO v_promoters, v_passives, v_detractors, v_avg_nps
  FROM feedback_submissions
  WHERE school_id = p_school_id
    AND created_at::date BETWEEN p_start_date AND p_end_date
    AND nps_score IS NOT NULL;

  -- Calculate NPS percentage
  IF (v_promoters + v_passives + v_detractors) > 0 THEN
    v_nps_percentage := ROUND(
      ((v_promoters::decimal - v_detractors::decimal) / 
       (v_promoters + v_passives + v_detractors)::decimal) * 100,
      2
    );
  END IF;

  -- Aggregate satisfaction breakdown
  SELECT jsonb_object_agg(satisfaction, count)
  INTO v_satisfaction
  FROM (
    SELECT satisfaction, COUNT(*) as count
    FROM feedback_submissions
    WHERE school_id = p_school_id
      AND created_at::date BETWEEN p_start_date AND p_end_date
      AND satisfaction IS NOT NULL
    GROUP BY satisfaction
  ) s;

  -- Aggregate category breakdown
  SELECT jsonb_object_agg(category, count)
  INTO v_categories
  FROM (
    SELECT category, COUNT(*) as count
    FROM feedback_submissions
    WHERE school_id = p_school_id
      AND created_at::date BETWEEN p_start_date AND p_end_date
    GROUP BY category
  ) c;

  -- Insert or update analytics
  INSERT INTO feedback_analytics (
    school_id,
    period_start,
    period_end,
    total_submissions,
    avg_rating,
    avg_nps_score,
    nps_promoters,
    nps_passives,
    nps_detractors,
    nps_percentage,
    satisfaction_breakdown,
    category_breakdown
  ) VALUES (
    p_school_id,
    p_start_date,
    p_end_date,
    v_total_submissions,
    v_avg_rating,
    v_avg_nps,
    v_promoters,
    v_passives,
    v_detractors,
    v_nps_percentage,
    COALESCE(v_satisfaction, '{}'::jsonb),
    COALESCE(v_categories, '{}'::jsonb)
  )
  ON CONFLICT (school_id, period_start, period_end)
  DO UPDATE SET
    total_submissions = EXCLUDED.total_submissions,
    avg_rating = EXCLUDED.avg_rating,
    avg_nps_score = EXCLUDED.avg_nps_score,
    nps_promoters = EXCLUDED.nps_promoters,
    nps_passives = EXCLUDED.nps_passives,
    nps_detractors = EXCLUDED.nps_detractors,
    nps_percentage = EXCLUDED.nps_percentage,
    satisfaction_breakdown = EXCLUDED.satisfaction_breakdown,
    category_breakdown = EXCLUDED.category_breakdown,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically update analytics on new feedback
CREATE OR REPLACE FUNCTION update_analytics_on_feedback()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate analytics for the current month
  PERFORM calculate_feedback_analytics(
    NEW.school_id,
    DATE_TRUNC('month', NEW.created_at)::date,
    (DATE_TRUNC('month', NEW.created_at) + INTERVAL '1 month - 1 day')::date
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic analytics updates
DROP TRIGGER IF EXISTS trigger_update_analytics ON feedback_submissions;
CREATE TRIGGER trigger_update_analytics
  AFTER INSERT OR UPDATE ON feedback_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_analytics_on_feedback();

-- Insert default survey templates
INSERT INTO survey_templates (name, description, survey_type, questions, target_role, frequency_days)
VALUES
  (
    'Quarterly User Satisfaction',
    'Measure overall satisfaction with the platform every quarter',
    'quarterly',
    '[
      {"type": "nps", "question": "How likely are you to recommend SchoolXNow to a colleague?"},
      {"type": "rating", "question": "How satisfied are you with the overall experience?"},
      {"type": "text", "question": "What do you like most about SchoolXNow?"},
      {"type": "text", "question": "What could we improve?"}
    ]'::jsonb,
    'all',
    90
  ),
  (
    'New Feature Feedback',
    'Gather feedback on newly released features',
    'feature_specific',
    '[
      {"type": "rating", "question": "How useful is this new feature?"},
      {"type": "text", "question": "What do you like about this feature?"},
      {"type": "text", "question": "How could this feature be improved?"}
    ]'::jsonb,
    'all',
    NULL
  ),
  (
    'Onboarding Experience',
    'Understand the onboarding experience for new users',
    'onboarding',
    '[
      {"type": "rating", "question": "How easy was it to get started with SchoolXNow?"},
      {"type": "text", "question": "What was most helpful during onboarding?"},
      {"type": "text", "question": "What was most confusing or difficult?"}
    ]'::jsonb,
    'all',
    NULL
  );

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON feedback_submissions TO authenticated;
GRANT SELECT ON feedback_analytics TO authenticated;
GRANT SELECT ON survey_templates TO authenticated;
GRANT SELECT, INSERT ON user_survey_responses TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_feedback_analytics TO authenticated;

-- Comments for documentation
COMMENT ON TABLE feedback_submissions IS 'Stores all user feedback, bug reports, feature requests, and survey responses';
COMMENT ON TABLE feedback_analytics IS 'Aggregated feedback metrics for analytics and reporting';
COMMENT ON TABLE survey_templates IS 'Predefined survey templates for gathering structured feedback';
COMMENT ON TABLE user_survey_responses IS 'Tracks which users have completed which surveys';
COMMENT ON FUNCTION calculate_feedback_analytics IS 'Calculates and updates aggregated feedback metrics for a given period';
COMMENT ON FUNCTION update_analytics_on_feedback IS 'Automatically updates analytics when new feedback is submitted';
