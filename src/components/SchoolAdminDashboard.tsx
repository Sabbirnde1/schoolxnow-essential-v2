import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { TeacherApplicationsManager } from "@/components/TeacherApplicationsManager";
import { AttendanceManagement } from "@/components/AttendanceManagement";
import { ExamManagement } from "@/components/ExamManagement";
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  School, 
  UserPlus, 
  Settings,
  Calendar,
  BarChart3,
  FileText,
  TrendingUp,
  ClipboardList,
  Award,
  Clock,
  Activity
} from "lucide-react";

interface SchoolStats {
  totalStudents: number;
  activeStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalSubjects: number;
  recentAdmissions: number;
}

const SchoolAdminDashboard = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState<SchoolStats>({
    totalStudents: 0,
    activeStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalSubjects: 0,
    recentAdmissions: 0,
  });
  const [schoolInfo, setSchoolInfo] = useState<any>(null);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Show pending assignment screen if school admin is not assigned to a school yet
  if (profile?.approval_status === 'pending' || !profile?.school_id) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
        <div className="text-center max-w-md">
          <div className="mb-6">
            <School className="h-16 w-16 text-blue-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">School Assignment Pending</h1>
            <p className="text-muted-foreground">
              Your school administrator account is awaiting school assignment. 
              Please contact the system administrator to assign you to a school.
            </p>
          </div>
          
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Account Status</p>
                <Badge variant="outline" className="mt-1 bg-blue-100 text-blue-800">
                  {profile?.approval_status === 'pending' ? 'Pending Approval' : 'School Assignment Required'}
                </Badge>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Administrator Name</p>
                <p className="mt-1">{profile?.full_name}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Account Created</p>
                <p className="mt-1">{new Date(profile?.created_at || '').toLocaleDateString()}</p>
              </div>
            </div>
          </Card>
          
          <div className="mt-6 text-sm text-muted-foreground">
            <p>Once assigned to a school, you'll have full access to the dashboard.</p>
          </div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (profile?.school_id) {
      fetchDashboardData();
    }
  }, [profile]);

  const fetchDashboardData = async () => {
    if (!profile?.school_id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch school info
      const { data: school, error: schoolError } = await supabase
        .from('schools')
        .select('*')
        .eq('id', profile.school_id)
        .single();

      if (schoolError) throw schoolError;
      setSchoolInfo(school);

      // Fetch students count
      const { count: totalStudents } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('school_id', profile.school_id);

      const { count: activeStudents } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('school_id', profile.school_id)
        .eq('status', 'active');

      // Fetch teachers count
      const { count: totalTeachers } = await supabase
        .from('teachers')
        .select('*', { count: 'exact', head: true })
        .eq('school_id', profile.school_id)
        .eq('is_active', true);

      // Fetch classes count
      const { count: totalClasses } = await supabase
        .from('classes')
        .select('*', { count: 'exact', head: true })
        .eq('school_id', profile.school_id)
        .eq('is_active', true);

      // Fetch subjects count
      const { count: totalSubjects } = await supabase
        .from('subjects')
        .select('*', { count: 'exact', head: true })
        .eq('school_id', profile.school_id)
        .eq('is_active', true);

      // Fetch recent admissions (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { count: recentAdmissions } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('school_id', profile.school_id)
        .gte('admission_date', thirtyDaysAgo.toISOString().split('T')[0]);

      setStats({
        totalStudents: totalStudents || 0,
        activeStudents: activeStudents || 0,
        totalTeachers: totalTeachers || 0,
        totalClasses: totalClasses || 0,
        totalSubjects: totalSubjects || 0,
        recentAdmissions: recentAdmissions || 0,
      });

      // Fetch recent activities (recent students)
      const { data: recentStudents, error: studentsError } = await supabase
        .from('students')
        .select('full_name, admission_date, class_id, classes(name)')
        .eq('school_id', profile.school_id)
        .order('admission_date', { ascending: false })
        .limit(5);

      if (studentsError) throw studentsError;
      setRecentActivities(recentStudents || []);

    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getSchoolTypeLabel = (type: string) => {
    switch (type) {
      case 'bangla_medium':
        return 'Bangla Medium';
      case 'english_medium':
        return 'English Medium';
      case 'madrasha':
        return 'Madrasha';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header with gradient background */}
      <div className="relative bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-xl p-8 border border-primary/10 shadow-elegant overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <School className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">
                {schoolInfo?.name || 'School Dashboard'}
              </h1>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              {schoolInfo?.name_bangla && (
                <>
                  <span className="text-sm">{schoolInfo.name_bangla}</span>
                  <span>•</span>
                </>
              )}
              <Badge variant="outline" className="bg-background/50">
                {getSchoolTypeLabel(schoolInfo?.school_type || '')}
              </Badge>
              <span>•</span>
              <span className="text-sm flex items-center gap-1">
                <Activity className="h-3 w-3" />
                Active
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            {/* <Button className="bg-primary hover:bg-primary/90 shadow-sm">
              <UserPlus className="mr-2 h-4 w-4" />
              Add Student
            </Button>
            <Button variant="outline" className="border-primary/20 hover:bg-primary/5">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button> */}
          </div>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="exams">Exams</TabsTrigger>
          <TabsTrigger value="applications">Teacher Applications</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Total Students Card */}
            <Card className="relative overflow-hidden border-primary/20 hover:shadow-elegant transition-all duration-300 group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
                <div className="p-2 bg-primary/10 rounded-lg group-hover:scale-110 transition-transform">
                  <GraduationCap className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary mb-1">{stats.totalStudents}</div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Activity className="h-3 w-3" />
                  <span>{stats.activeStudents} active students</span>
                </div>
              </CardContent>
            </Card>

            {/* Teachers Card */}
            <Card className="relative overflow-hidden border-accent/20 hover:shadow-elegant transition-all duration-300 group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-accent/20 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Teaching Staff</CardTitle>
                <div className="p-2 bg-accent/10 rounded-lg group-hover:scale-110 transition-transform">
                  <Users className="h-5 w-5 text-accent" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-accent mb-1">{stats.totalTeachers}</div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Award className="h-3 w-3" />
                  <span>Active teachers</span>
                </div>
              </CardContent>
            </Card>

            {/* Classes Card */}
            <Card className="relative overflow-hidden hover:shadow-elegant transition-all duration-300 group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Classes</CardTitle>
                <div className="p-2 bg-primary/10 rounded-lg group-hover:scale-110 transition-transform">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-1">{stats.totalClasses}</div>
                <p className="text-xs text-muted-foreground">
                  Active classes
                </p>
              </CardContent>
            </Card>

            {/* Subjects Card */}
            <Card className="relative overflow-hidden hover:shadow-elegant transition-all duration-300 group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-accent/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Subjects</CardTitle>
                <div className="p-2 bg-accent/10 rounded-lg group-hover:scale-110 transition-transform">
                  <ClipboardList className="h-5 w-5 text-accent" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-1">{stats.totalSubjects}</div>
                <p className="text-xs text-muted-foreground">
                  Curriculum subjects
                </p>
              </CardContent>
            </Card>

            {/* Recent Admissions Card */}
            <Card className="relative overflow-hidden border-primary/20 hover:shadow-elegant transition-all duration-300 group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Recent Admissions</CardTitle>
                <div className="p-2 bg-primary/10 rounded-lg group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary mb-1">{stats.recentAdmissions}</div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Last 30 days</span>
                </div>
              </CardContent>
            </Card>

            {/* Reports Card */}
            <Card className="relative overflow-hidden hover:shadow-elegant transition-all duration-300 group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-accent/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Analytics</CardTitle>
                <div className="p-2 bg-accent/10 rounded-lg group-hover:scale-110 transition-transform">
                  <BarChart3 className="h-5 w-5 text-accent" />
                </div>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full hover:bg-accent/5 hover:border-accent/30">
                  <FileText className="w-4 h-4 mr-2" />
                  View Reports
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activities */}
          <Card className="border-primary/10 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                Recent Student Admissions
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {recentActivities.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="p-4 bg-muted/30 rounded-full w-fit mx-auto mb-4">
                    <GraduationCap className="h-12 w-12 opacity-50" />
                  </div>
                  <p className="text-lg font-medium mb-1">No Recent Admissions</p>
                  <p className="text-sm">New student admissions will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentActivities.map((student, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-muted/50 to-transparent rounded-lg border border-border/50 hover:border-primary/30 transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
                          <GraduationCap className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{student.full_name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>Admitted on {new Date(student.admission_date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-background/50">
                        {student.classes?.name || 'No Class Assigned'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-auto p-6 flex flex-col items-center gap-3 hover:bg-primary/5 hover:border-primary/30 transition-all duration-200 group"
            >
              <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                <UserPlus className="h-6 w-6 text-primary" />
              </div>
              <span className="font-medium">Add New Student</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-6 flex flex-col items-center gap-3 hover:bg-accent/5 hover:border-accent/30 transition-all duration-200 group"
            >
              <div className="p-3 bg-accent/10 rounded-xl group-hover:bg-accent/20 transition-colors">
                <Users className="h-6 w-6 text-accent" />
              </div>
              <span className="font-medium">Manage Teachers</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-6 flex flex-col items-center gap-3 hover:bg-primary/5 hover:border-primary/30 transition-all duration-200 group"
            >
              <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <span className="font-medium">Manage Classes</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-6 flex flex-col items-center gap-3 hover:bg-accent/5 hover:border-accent/30 transition-all duration-200 group"
            >
              <div className="p-3 bg-accent/10 rounded-xl group-hover:bg-accent/20 transition-colors">
                <BarChart3 className="h-6 w-6 text-accent" />
              </div>
              <span className="font-medium">View Reports</span>
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="attendance">
          <AttendanceManagement />
        </TabsContent>

        <TabsContent value="exams">
          <ExamManagement />
        </TabsContent>

        <TabsContent value="applications">
          <TeacherApplicationsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SchoolAdminDashboard;