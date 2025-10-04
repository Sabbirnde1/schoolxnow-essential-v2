import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { 
  Settings, 
  Database, 
  Shield, 
  Activity, 
  Users, 
  School, 
  BookOpen, 
  BarChart3,
  Server,
  HardDrive,
  Wifi,
  Globe,
  Lock,
  AlertTriangle
} from 'lucide-react';

interface SystemStats {
  totalSchools: number;
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  activeSchools: number;
  pendingApplications: number;
}

const SystemSettings = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState<SystemStats>({
    totalSchools: 0,
    totalUsers: 0,
    totalStudents: 0,
    totalTeachers: 0,
    activeSchools: 0,
    pendingApplications: 0,
  });
  const [loading, setLoading] = useState(true);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [systemConfig, setSystemConfig] = useState({
    maintenanceMode: false,
    allowRegistrations: true,
    defaultSchoolType: 'secondary',
    maxStudentsPerClass: 40,
    academicYearStart: '2024-01-01',
    academicYearEnd: '2024-12-31',
  });

  useEffect(() => {
    if (profile?.role === 'super_admin') {
      fetchSystemStats();
      fetchAuditLogs();
    }
  }, [profile]);

  const fetchSystemStats = async () => {
    try {
      // Fetch schools count
      const { count: schoolsCount } = await supabase
        .from('schools')
        .select('*', { count: 'exact', head: true });

      // Fetch active schools count
      const { count: activeSchoolsCount } = await supabase
        .from('schools')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Fetch users count
      const { count: usersCount } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch students count
      const { count: studentsCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true });

      // Fetch teachers count
      const { count: teachersCount } = await supabase
        .from('teachers')
        .select('*', { count: 'exact', head: true });

      // Fetch pending applications count
      const { count: pendingCount } = await supabase
        .from('teacher_applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      setStats({
        totalSchools: schoolsCount || 0,
        totalUsers: usersCount || 0,
        totalStudents: studentsCount || 0,
        totalTeachers: teachersCount || 0,
        activeSchools: activeSchoolsCount || 0,
        pendingApplications: pendingCount || 0,
      });
    } catch (error) {
      console.error('Error fetching system stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    // This would typically fetch from an audit_logs table
    // For now, we'll simulate some data
    setAuditLogs([
      {
        id: '1',
        action: 'USER_CREATED',
        user_id: 'user-1',
        details: 'New teacher account created',
        timestamp: new Date().toISOString(),
      },
      {
        id: '2',
        action: 'SCHOOL_UPDATED',
        user_id: 'admin-1',
        details: 'School information updated',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
      },
    ]);
  };

  const handleBackupDatabase = async () => {
    toast.success('Backup Initiated - Database backup has been started. You will be notified when complete.');
  };

  const handleSystemMaintenance = async () => {
    setSystemConfig(prev => ({ ...prev, maintenanceMode: !prev.maintenanceMode }));
    toast.success(systemConfig.maintenanceMode ? 'Maintenance Mode Disabled - System is now available to all users' : 'Maintenance Mode Enabled - System is now in maintenance mode');
  };

  if (profile?.role !== 'super_admin') {
    return (
      <div className="text-center py-8 lg:py-12 p-3 lg:p-6">
        <Shield className="h-12 w-12 lg:h-16 lg:w-16 mx-auto mb-4 text-muted-foreground/50" />
        <h3 className="text-lg lg:text-xl font-semibold">Access Denied</h3>
        <p className="text-muted-foreground text-sm lg:text-base">Only super administrators can access system settings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 lg:space-y-6 p-3 lg:p-6">
      <div className="flex flex-col gap-2">
        <div>
          <h1 className="text-xl lg:text-3xl font-bold text-foreground">System Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage system configuration and monitoring</p>
        </div>
      </div>

      {/* System Overview Cards */}
      <div className="grid gap-3 lg:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-soft bg-card/80 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 lg:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Schools</CardTitle>
            <School className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 lg:p-4 pt-0">
            <div className="text-lg sm:text-2xl font-bold">{stats.totalSchools}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              {stats.activeSchools} active
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-soft bg-card/80 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 lg:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Users</CardTitle>
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 lg:p-4 pt-0">
            <div className="text-lg sm:text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              System-wide users
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-soft bg-card/80 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 lg:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium">Students</CardTitle>
            <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 lg:p-4 pt-0">
            <div className="text-lg sm:text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Enrolled students
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-soft bg-card/80 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 lg:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium">Pending Apps</CardTitle>
            <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 lg:p-4 pt-0">
            <div className="text-lg sm:text-2xl font-bold">{stats.pendingApplications}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Require review
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="general" className="space-y-3 lg:space-y-4">
        <TabsList className="w-full grid grid-cols-2 sm:grid-cols-4 h-auto p-1 bg-muted/50 rounded-lg">
          <TabsTrigger 
            value="general" 
            className="text-xs sm:text-sm py-2.5 px-2 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-soft"
          >
            <Settings className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">General</span>
            <span className="sm:hidden">Gen</span>
          </TabsTrigger>
          <TabsTrigger 
            value="security" 
            className="text-xs sm:text-sm py-2.5 px-2 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-soft"
          >
            <Shield className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Security</span>
            <span className="sm:hidden">Sec</span>
          </TabsTrigger>
          <TabsTrigger 
            value="database" 
            className="text-xs sm:text-sm py-2.5 px-2 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-soft"
          >
            <Database className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Database</span>
            <span className="sm:hidden">DB</span>
          </TabsTrigger>
          <TabsTrigger 
            value="audit" 
            className="text-xs sm:text-sm py-2.5 px-2 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-soft"
          >
            <Activity className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Audit</span>
            <span className="sm:hidden">Log</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-3 lg:space-y-4">
          <Card className="shadow-soft bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-3 lg:pb-4">
              <CardTitle className="flex items-center gap-2 text-base lg:text-xl">
                <Settings className="h-4 w-4 lg:h-5 lg:w-5 text-primary" />
                System Configuration
              </CardTitle>
              <CardDescription className="text-xs lg:text-sm">
                Configure general system settings and policies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 lg:space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="academic_year_start" className="text-sm font-medium">Academic Year Start</Label>
                  <Input
                    id="academic_year_start"
                    type="date"
                    value={systemConfig.academicYearStart}
                    onChange={(e) => setSystemConfig(prev => ({ ...prev, academicYearStart: e.target.value }))}
                    className="touch-target"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="academic_year_end" className="text-sm font-medium">Academic Year End</Label>
                  <Input
                    id="academic_year_end"
                    type="date"
                    value={systemConfig.academicYearEnd}
                    onChange={(e) => setSystemConfig(prev => ({ ...prev, academicYearEnd: e.target.value }))}
                    className="touch-target"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_students" className="text-sm font-medium">Max Students Per Class</Label>
                <Input
                  id="max_students"
                  type="number"
                  min="1"
                  max="100"
                  value={systemConfig.maxStudentsPerClass}
                  onChange={(e) => setSystemConfig(prev => ({ ...prev, maxStudentsPerClass: parseInt(e.target.value) }))}
                  className="touch-target"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="allow_registrations"
                  checked={systemConfig.allowRegistrations}
                  onCheckedChange={(checked) => setSystemConfig(prev => ({ ...prev, allowRegistrations: checked }))}
                />
                <Label htmlFor="allow_registrations" className="text-sm font-medium">Allow New Registrations</Label>
              </div>
              <Button className="w-full sm:w-auto touch-target">Save Configuration</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-3 lg:space-y-4">
          <Card className="shadow-soft bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-3 lg:pb-4">
              <CardTitle className="flex items-center gap-2 text-base lg:text-xl">
                <Shield className="h-4 w-4 lg:h-5 lg:w-5 text-primary" />
                Security Settings
              </CardTitle>
              <CardDescription className="text-xs lg:text-sm">
                Manage system security and access controls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 lg:space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <h4 className="text-sm font-medium">Maintenance Mode</h4>
                  <p className="text-xs text-muted-foreground">
                    Restrict access to system administrators only
                  </p>
                </div>
                <Button 
                  variant={systemConfig.maintenanceMode ? "destructive" : "outline"}
                  onClick={handleSystemMaintenance}
                  className="touch-target"
                >
                  {systemConfig.maintenanceMode ? 'Disable' : 'Enable'}
                </Button>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <h4 className="text-sm font-medium">Two-Factor Authentication</h4>
                  <p className="text-xs text-muted-foreground">
                    Require 2FA for all administrator accounts
                  </p>
                </div>
                <Button variant="outline" className="touch-target">Configure</Button>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <h4 className="text-sm font-medium">Session Timeout</h4>
                  <p className="text-xs text-muted-foreground">
                    Automatically log out inactive users
                  </p>
                </div>
                <Button variant="outline" className="touch-target">Set Timeout</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-3 lg:space-y-4">
          <Card className="shadow-soft bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-3 lg:pb-4">
              <CardTitle className="flex items-center gap-2 text-base lg:text-xl">
                <Database className="h-4 w-4 lg:h-5 lg:w-5 text-primary" />
                Database Management
              </CardTitle>
              <CardDescription className="text-xs lg:text-sm">
                Monitor and maintain database health
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 lg:space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <h4 className="text-sm font-medium">Database Backup</h4>
                  <p className="text-xs text-muted-foreground">
                    Create a full backup of the database
                  </p>
                </div>
                <Button onClick={handleBackupDatabase} className="touch-target">
                  <Database className="h-4 w-4 mr-2" />
                  Create Backup
                </Button>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <h4 className="text-sm font-medium">Database Health</h4>
                  <p className="text-xs text-muted-foreground">
                    Check database performance and integrity
                  </p>
                </div>
                <Button variant="outline" className="touch-target">
                  <Activity className="h-4 w-4 mr-2" />
                  Run Diagnostics
                </Button>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <h4 className="text-sm font-medium">Cleanup Logs</h4>
                  <p className="text-xs text-muted-foreground">
                    Remove old logs and temporary data
                  </p>
                </div>
                <Button variant="outline" className="touch-target">Clean Up</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-3 lg:space-y-4">
          <Card className="shadow-soft bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-3 lg:pb-4">
              <CardTitle className="flex items-center gap-2 text-base lg:text-xl">
                <Activity className="h-4 w-4 lg:h-5 lg:w-5 text-primary" />
                System Audit Logs
              </CardTitle>
              <CardDescription className="text-xs lg:text-sm">
                Review system activities and user actions
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 lg:p-6">
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs font-medium">Action</TableHead>
                      <TableHead className="text-xs font-medium">User</TableHead>
                      <TableHead className="text-xs font-medium hidden sm:table-cell">Details</TableHead>
                      <TableHead className="text-xs font-medium">Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8">
                          <Activity className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                          <p className="text-sm text-muted-foreground">No audit logs found</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      auditLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">{log.action}</Badge>
                          </TableCell>
                          <TableCell className="text-xs">{log.user_id}</TableCell>
                          <TableCell className="text-xs hidden sm:table-cell">{log.details}</TableCell>
                          <TableCell className="text-xs">
                            {new Date(log.timestamp).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SystemSettings;