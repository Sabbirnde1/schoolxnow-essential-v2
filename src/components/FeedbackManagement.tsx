import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Star,
  AlertCircle,
  Lightbulb,
  CheckCircle2,
  Clock,
  Users,
  BarChart3,
  Calendar
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface FeedbackSubmission {
  id: string;
  user_id: string;
  category: string;
  rating: number | null;
  nps_score: number | null;
  satisfaction: string | null;
  subject: string | null;
  feedback: string | null;
  priority: string;
  status: string;
  admin_notes: string | null;
  admin_response: string | null;
  created_at: string;
  user_profiles: {
    full_name: string;
    role: string;
  };
}

interface FeedbackAnalytics {
  total_submissions: number;
  avg_rating: number | null;
  avg_nps_score: number | null;
  nps_promoters: number;
  nps_passives: number;
  nps_detractors: number;
  nps_percentage: number | null;
  satisfaction_breakdown: Record<string, number>;
  category_breakdown: Record<string, number>;
}

export function FeedbackManagement() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [feedbackList, setFeedbackList] = useState<FeedbackSubmission[]>([]);
  const [analytics, setAnalytics] = useState<FeedbackAnalytics | null>(null);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackSubmission | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [adminResponse, setAdminResponse] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    if (profile) {
      loadFeedback();
      loadAnalytics();
    }
  }, [profile, statusFilter, categoryFilter]);

  const loadFeedback = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      let query = supabase
        .from('feedback_submissions')
        .select(`
          *,
          user_profiles (
            full_name,
            role
          )
        `)
        .eq('school_id', profile.school_id)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setFeedbackList(data || []);
    } catch (error: any) {
      console.error('Error loading feedback:', error);
      toast.error('Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    if (!profile) return;

    try {
      // Calculate analytics for current month
      const startDate = new Date();
      startDate.setDate(1);
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0);

      const { data, error } = await supabase
        .from('feedback_analytics')
        .select('*')
        .eq('school_id', profile.school_id)
        .gte('period_start', startDate.toISOString().split('T')[0])
        .lte('period_end', endDate.toISOString().split('T')[0])
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setAnalytics(data);
    } catch (error: any) {
      console.error('Error loading analytics:', error);
    }
  };

  const updateFeedbackStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('feedback_submissions')
        .update({
          status,
          admin_response: adminResponse || null,
          admin_notes: adminNotes || null,
          responded_at: new Date().toISOString(),
          responded_by: profile?.user_id,
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Feedback updated successfully');
      loadFeedback();
      setSelectedFeedback(null);
      setAdminResponse('');
      setAdminNotes('');
    } catch (error: any) {
      console.error('Error updating feedback:', error);
      toast.error('Failed to update feedback');
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'feature_request':
        return <Lightbulb className="h-4 w-4" />;
      case 'bug_report':
        return <AlertCircle className="h-4 w-4" />;
      case 'nps_survey':
        return <Star className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'feature_request':
        return 'bg-blue-100 text-blue-800';
      case 'bug_report':
        return 'bg-red-100 text-red-800';
      case 'nps_survey':
        return 'bg-yellow-100 text-yellow-800';
      case 'usability_issue':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      submitted: 'bg-gray-100 text-gray-800',
      reviewed: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      archived: 'bg-gray-100 text-gray-600',
    };

    return (
      <Badge className={variants[status] || variants.submitted}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getNPSCategory = (score: number | null) => {
    if (score === null) return null;
    if (score >= 9) return { label: 'Promoter', color: 'text-green-600', icon: TrendingUp };
    if (score >= 7) return { label: 'Passive', color: 'text-yellow-600', icon: TrendingUp };
    return { label: 'Detractor', color: 'text-red-600', icon: TrendingDown };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Feedback Management</h2>
        <p className="text-muted-foreground">
          Review and respond to user feedback and feature requests
        </p>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.total_submissions}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.avg_rating?.toFixed(1) || 'N/A'} / 5
              </div>
              <div className="flex gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= (analytics.avg_rating || 0)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">NPS Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.nps_percentage?.toFixed(0) || 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                {analytics.nps_promoters} promoters, {analytics.nps_detractors} detractors
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average NPS</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.avg_nps_score?.toFixed(1) || 'N/A'} / 10
              </div>
              <p className="text-xs text-muted-foreground">Net Promoter Score</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Feedback List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <CardTitle>Feedback Submissions</CardTitle>
              <CardDescription>Review and respond to user feedback</CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="general_feedback">General Feedback</SelectItem>
                  <SelectItem value="feature_request">Feature Request</SelectItem>
                  <SelectItem value="bug_report">Bug Report</SelectItem>
                  <SelectItem value="usability_issue">Usability Issue</SelectItem>
                  <SelectItem value="nps_survey">NPS Survey</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading feedback...</div>
          ) : feedbackList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No feedback submissions found
            </div>
          ) : (
            <div className="space-y-4">
              {feedbackList.map((item) => (
                <Card key={item.id} className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setSelectedFeedback(item)}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={getCategoryColor(item.category)}>
                            <span className="flex items-center gap-1">
                              {getCategoryIcon(item.category)}
                              {item.category.replace('_', ' ')}
                            </span>
                          </Badge>
                          {getStatusBadge(item.status)}
                          {item.priority && item.priority !== 'medium' && (
                            <Badge variant={item.priority === 'critical' ? 'destructive' : 'default'}>
                              {item.priority}
                            </Badge>
                          )}
                          {item.nps_score !== null && (
                            <>
                              {(() => {
                                const npsCategory = getNPSCategory(item.nps_score);
                                return npsCategory ? (
                                  <Badge className={npsCategory.color}>
                                    <npsCategory.icon className="h-3 w-3 mr-1" />
                                    {npsCategory.label}
                                  </Badge>
                                ) : null;
                              })()}
                            </>
                          )}
                        </div>
                        {item.subject && (
                          <h4 className="font-semibold">{item.subject}</h4>
                        )}
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {item.feedback || 'No details provided'}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {item.user_profiles?.full_name || 'Unknown'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                          </span>
                          {item.rating && (
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3" />
                              {item.rating}/5
                            </span>
                          )}
                          {item.nps_score !== null && (
                            <span className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              NPS: {item.nps_score}/10
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Feedback Detail Dialog */}
      {selectedFeedback && (
        <Dialog open={!!selectedFeedback} onOpenChange={() => setSelectedFeedback(null)}>
          <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Feedback Details</DialogTitle>
              <DialogDescription>
                Review and respond to this feedback
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Metadata */}
              <div className="flex flex-wrap gap-2">
                <Badge className={getCategoryColor(selectedFeedback.category)}>
                  {getCategoryIcon(selectedFeedback.category)}
                  {selectedFeedback.category.replace('_', ' ')}
                </Badge>
                {getStatusBadge(selectedFeedback.status)}
                {selectedFeedback.priority && (
                  <Badge variant={selectedFeedback.priority === 'critical' ? 'destructive' : 'default'}>
                    {selectedFeedback.priority}
                  </Badge>
                )}
              </div>

              {/* Subject */}
              {selectedFeedback.subject && (
                <div>
                  <Label className="text-base font-semibold">Subject</Label>
                  <p className="mt-1">{selectedFeedback.subject}</p>
                </div>
              )}

              {/* Ratings */}
              <div className="grid grid-cols-2 gap-4">
                {selectedFeedback.rating && (
                  <div>
                    <Label>Star Rating</Label>
                    <div className="flex gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-5 w-5 ${
                            star <= selectedFeedback.rating!
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {selectedFeedback.nps_score !== null && (
                  <div>
                    <Label>NPS Score</Label>
                    <p className="text-2xl font-bold mt-1">
                      {selectedFeedback.nps_score} / 10
                    </p>
                  </div>
                )}
              </div>

              {/* Feedback */}
              {selectedFeedback.feedback && (
                <div>
                  <Label className="text-base font-semibold">Feedback</Label>
                  <p className="mt-1 whitespace-pre-wrap">{selectedFeedback.feedback}</p>
                </div>
              )}

              {/* Admin Response */}
              <div className="space-y-2">
                <Label htmlFor="admin-response">Admin Response</Label>
                <Textarea
                  id="admin-response"
                  placeholder="Type your response to the user..."
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  rows={4}
                />
              </div>

              {/* Admin Notes */}
              <div className="space-y-2">
                <Label htmlFor="admin-notes">Internal Notes (not visible to user)</Label>
                <Textarea
                  id="admin-notes"
                  placeholder="Add internal notes..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Status Update Buttons */}
              <div className="flex justify-end gap-2 flex-wrap">
                <Button
                  variant="outline"
                  onClick={() => updateFeedbackStatus(selectedFeedback.id, 'reviewed')}
                >
                  Mark as Reviewed
                </Button>
                <Button
                  variant="outline"
                  onClick={() => updateFeedbackStatus(selectedFeedback.id, 'in_progress')}
                >
                  In Progress
                </Button>
                <Button
                  variant="default"
                  onClick={() => updateFeedbackStatus(selectedFeedback.id, 'completed')}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Mark Complete
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
