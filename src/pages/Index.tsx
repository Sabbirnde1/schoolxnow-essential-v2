import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Layout } from "@/components/Layout";
import { Dashboard } from "@/components/Dashboard";
import { StudentManagement } from "@/components/StudentManagement";
import { ClassManagement } from "@/components/ClassManagement";
import { SubjectManagement } from "@/components/SubjectManagement";
import { AttendanceManagement } from "@/components/AttendanceManagement";
import { ExamManagement } from "@/components/ExamManagement";
import { TimetableManagement } from "@/components/TimetableManagement";
import UserManagement from "@/components/UserManagement";
import SchoolAdminManagement from "@/components/SchoolAdminManagement";
import TeacherManagement from "@/components/TeacherManagement";
import SchoolManagement from "@/components/SchoolManagement";
import Settings from "@/components/Settings";
import SuperAdminDashboard from "@/components/SuperAdminDashboard";
import SchoolAdminDashboard from "@/components/SchoolAdminDashboard";
import TeacherDashboard from "@/components/TeacherDashboard";
import { ExamMarksEntry } from "@/components/ExamMarksEntry";
import { ReportsAnalytics } from "@/components/ReportsAnalytics";
import { ClassAssignment } from "@/components/ClassAssignment";

const Index = () => {
  const { user, profile, loading } = useAuth();
  const [activeModule, setActiveModule] = useState('dashboard');

  // Redirect to landing page if not logged in
  if (!loading && !user) {
    return <Navigate to="/" replace />;
  }

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const renderContent = () => {
    // Role-based dashboard rendering
    if (profile?.role === 'super_admin') {
      switch (activeModule) {
        case 'students': return <StudentManagement />;
        case 'schools': return <SchoolManagement />;
        case 'users': return <SchoolAdminManagement />; // Super admin manages school admins
        case 'settings': return <Settings />;
        case 'dashboard':
        default: return <SuperAdminDashboard />;
      }
    }
    
    if (profile?.role === 'school_admin') {
      switch (activeModule) {
        case 'students': return <StudentManagement />;
        case 'classes': return <ClassManagement />;
        case 'subjects': return <SubjectManagement />;
        case 'attendance': return <AttendanceManagement />;
        case 'exams': return <ExamManagement />;
        case 'timetable': return <TimetableManagement />;
        case 'users': return <TeacherManagement />; // School admin manages teachers
        case 'reports': return <ReportsAnalytics />;
        case 'class-assignment': return <ClassAssignment />;
        case 'settings': return <Settings />;
        case 'dashboard':
        default: return <SchoolAdminDashboard />;
      }
    }
    
    if (profile?.role === 'teacher') {
      switch (activeModule) {
        case 'students': return <StudentManagement />;
        case 'attendance': return <AttendanceManagement />;
        case 'exam-marks': return (
          <div className="container mx-auto p-4 md:p-6 space-y-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Enter Exam Marks</h1>
              <p className="text-sm md:text-base text-muted-foreground">
                Enter and manage student exam marks
              </p>
            </div>
            <ExamMarksEntry />
          </div>
        );
        case 'exams': return <ExamManagement />;
        case 'timetable': return <TimetableManagement />;
        case 'classes': return <ClassManagement />;
        case 'dashboard':
        default: return <TeacherDashboard setActiveModule={setActiveModule} />;
      }
    }

    // Fallback to module-based rendering for backward compatibility
    switch (activeModule) {
      case 'students': return <StudentManagement />;
      case 'classes': return <ClassManagement />;
      case 'subjects': return <SubjectManagement />;
      case 'dashboard':
      default: return <Dashboard />;
    }
  };

  return (
    <Layout activeModule={activeModule} setActiveModule={setActiveModule}>
      {renderContent()}
    </Layout>
  );
};

export default Index;
