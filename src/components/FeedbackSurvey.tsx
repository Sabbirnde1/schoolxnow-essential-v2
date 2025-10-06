import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Star, MessageSquare, TrendingUp, AlertCircle, CheckCircle2, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';

interface FeedbackSurveyProps {
  open: boolean;
  onClose: () => void;
  surveyType?: 'general' | 'feature' | 'issue' | 'nps';
}

export function FeedbackSurvey({ open, onClose, surveyType = 'general' }: FeedbackSurveyProps) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form state
  const [category, setCategory] = useState('general_feedback');
  const [rating, setRating] = useState<number>(0);
  const [npsScore, setNpsScore] = useState<number>(0);
  const [satisfaction, setSatisfaction] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [feedback, setFeedback] = useState('');
  const [featureRequest, setFeatureRequest] = useState('');
  const [priority, setPriority] = useState('medium');
  const [improvementArea, setImprovementArea] = useState('');

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setSubmitted(false);
      setRating(0);
      setNpsScore(0);
      setSatisfaction('');
      setSubject('');
      setFeedback('');
      setFeatureRequest('');
      setPriority('medium');
      setImprovementArea('');
      
      // Set default category based on survey type
      if (surveyType === 'feature') {
        setCategory('feature_request');
      } else if (surveyType === 'issue') {
        setCategory('bug_report');
      } else if (surveyType === 'nps') {
        setCategory('nps_survey');
      }
    }
  }, [open, surveyType]);

  const handleSubmit = async () => {
    if (!profile) {
      toast.error('Please log in to submit feedback');
      return;
    }

    // Validation
    if (category === 'nps_survey' && npsScore === 0) {
      toast.error('Please select a score');
      return;
    }

    if (category !== 'nps_survey' && !feedback.trim()) {
      toast.error('Please provide your feedback');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from('feedback_submissions').insert({
        user_id: profile.user_id,
        school_id: profile.school_id,
        category,
        rating,
        nps_score: npsScore || null,
        satisfaction,
        subject: subject || null,
        feedback: feedback || null,
        feature_request: featureRequest || null,
        priority,
        improvement_area: improvementArea || null,
        status: 'submitted',
      });

      if (error) throw error;

      setSubmitted(true);
      toast.success('Thank you for your feedback!');
      
      // Close dialog after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const StarRating = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => {
    return (
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="focus:outline-none transition-all hover:scale-110"
          >
            <Star
              className={`h-8 w-8 ${
                star <= value
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const NPSScale = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => {
    return (
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Not likely at all</span>
          <span>Extremely likely</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
            <button
              key={score}
              type="button"
              onClick={() => onChange(score)}
              className={`w-10 h-10 rounded-lg border-2 transition-all font-semibold ${
                score === value
                  ? score <= 6
                    ? 'bg-red-500 border-red-500 text-white'
                    : score <= 8
                    ? 'bg-yellow-500 border-yellow-500 text-white'
                    : 'bg-green-500 border-green-500 text-white'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              {score}
            </button>
          ))}
        </div>
        {value > 0 && (
          <p className="text-sm text-muted-foreground mt-2">
            {value <= 6 && '😞 We\'re sorry to hear that. Your feedback will help us improve.'}
            {value >= 7 && value <= 8 && '😊 Thank you! We\'d love to hear how we can make it even better.'}
            {value >= 9 && '🎉 Wonderful! We\'re thrilled you love it!'}
          </p>
        )}
      </div>
    );
  };

  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-semibold">Thank You!</h3>
              <p className="text-muted-foreground">
                Your feedback has been submitted successfully.
              </p>
              <p className="text-sm text-muted-foreground">
                We appreciate you taking the time to help us improve.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Share Your Feedback
          </DialogTitle>
          <DialogDescription>
            Help us improve SchoolXNow by sharing your thoughts and suggestions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Category Selection */}
          <div className="space-y-2">
            <Label>Feedback Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general_feedback">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    General Feedback
                  </div>
                </SelectItem>
                <SelectItem value="feature_request">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    Feature Request
                  </div>
                </SelectItem>
                <SelectItem value="bug_report">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Bug Report
                  </div>
                </SelectItem>
                <SelectItem value="usability_issue">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Usability Issue
                  </div>
                </SelectItem>
                <SelectItem value="nps_survey">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Net Promoter Score
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* NPS Survey */}
          {category === 'nps_survey' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Net Promoter Score</CardTitle>
                <CardDescription>
                  How likely are you to recommend SchoolXNow to a colleague?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <NPSScale value={npsScore} onChange={setNpsScore} />
              </CardContent>
            </Card>
          )}

          {/* Star Rating (for non-NPS categories) */}
          {category !== 'nps_survey' && (
            <div className="space-y-2">
              <Label>Overall Satisfaction</Label>
              <StarRating value={rating} onChange={setRating} />
              {rating > 0 && (
                <p className="text-sm text-muted-foreground">
                  {rating === 1 && 'Very Dissatisfied'}
                  {rating === 2 && 'Dissatisfied'}
                  {rating === 3 && 'Neutral'}
                  {rating === 4 && 'Satisfied'}
                  {rating === 5 && 'Very Satisfied'}
                </p>
              )}
            </div>
          )}

          {/* Satisfaction Level */}
          {category !== 'nps_survey' && (
            <div className="space-y-2">
              <Label>What best describes your experience?</Label>
              <RadioGroup value={satisfaction} onValueChange={setSatisfaction}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="excellent" id="excellent" />
                  <Label htmlFor="excellent" className="font-normal cursor-pointer">
                    😊 Excellent - Everything works great!
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="good" id="good" />
                  <Label htmlFor="good" className="font-normal cursor-pointer">
                    🙂 Good - Works well, minor improvements needed
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="average" id="average" />
                  <Label htmlFor="average" className="font-normal cursor-pointer">
                    😐 Average - Some issues, but usable
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="poor" id="poor" />
                  <Label htmlFor="poor" className="font-normal cursor-pointer">
                    😟 Poor - Significant problems
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="very_poor" id="very_poor" />
                  <Label htmlFor="very_poor" className="font-normal cursor-pointer">
                    😞 Very Poor - Unusable
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Subject (for bug reports and feature requests) */}
          {(category === 'bug_report' || category === 'feature_request') && (
            <div className="space-y-2">
              <Label htmlFor="subject">
                {category === 'bug_report' ? 'Bug Title' : 'Feature Title'}
              </Label>
              <input
                id="subject"
                type="text"
                placeholder={
                  category === 'bug_report'
                    ? 'e.g., Attendance form not saving'
                    : 'e.g., Export attendance reports to Excel'
                }
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          )}

          {/* Main Feedback */}
          <div className="space-y-2">
            <Label htmlFor="feedback">
              {category === 'bug_report' && 'Describe the bug'}
              {category === 'feature_request' && 'Describe the feature'}
              {category === 'nps_survey' && 'Tell us more (optional)'}
              {!['bug_report', 'feature_request', 'nps_survey'].includes(category) &&
                'Your Feedback'}
            </Label>
            <Textarea
              id="feedback"
              placeholder={
                category === 'bug_report'
                  ? 'What happened? What were you trying to do? What did you expect?'
                  : category === 'feature_request'
                  ? 'Describe the feature and how it would help you...'
                  : 'Share your thoughts, suggestions, or concerns...'
              }
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={6}
              className="resize-none"
            />
          </div>

          {/* Priority (for feature requests and bug reports) */}
          {(category === 'feature_request' || category === 'bug_report') && (
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <Badge variant="secondary">Low</Badge>
                  </SelectItem>
                  <SelectItem value="medium">
                    <Badge variant="default">Medium</Badge>
                  </SelectItem>
                  <SelectItem value="high">
                    <Badge variant="destructive">High</Badge>
                  </SelectItem>
                  <SelectItem value="critical">
                    <Badge className="bg-red-600">Critical</Badge>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Improvement Area */}
          {category === 'usability_issue' && (
            <div className="space-y-2">
              <Label>Which area needs improvement?</Label>
              <Select value={improvementArea} onValueChange={setImprovementArea}>
                <SelectTrigger>
                  <SelectValue placeholder="Select area" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dashboard">Dashboard</SelectItem>
                  <SelectItem value="attendance">Attendance Management</SelectItem>
                  <SelectItem value="exams">Exam Management</SelectItem>
                  <SelectItem value="timetable">Timetable</SelectItem>
                  <SelectItem value="students">Student Management</SelectItem>
                  <SelectItem value="reports">Reports & Analytics</SelectItem>
                  <SelectItem value="navigation">Navigation</SelectItem>
                  <SelectItem value="mobile">Mobile Experience</SelectItem>
                  <SelectItem value="performance">Performance/Speed</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <Separator />

          {/* Submit Button */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
