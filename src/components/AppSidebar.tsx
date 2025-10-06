import { 
  Home,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  FileText,
  Settings,
  BarChart3,
  School,
  UserCheck,
  ClipboardList,
  LogOut,
  Award,
  ArrowRightLeft
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";

interface AppSidebarProps {
  activeModule: string;
  setActiveModule: (module: string) => void;
}

export function AppSidebar({ activeModule, setActiveModule }: AppSidebarProps) {
  const { profile, loading, signOut } = useAuth();

  // Show loading state while auth is initializing
  if (loading) {
    return (
      <Sidebar>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="text-lg font-semibold text-primary">
              EduManage
            </SidebarGroupLabel>
            <div className="p-4">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </div>
            </div>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    );
  }

  // Define menu items based on user role
  const getMenuItems = () => {
    const commonItems = [
      {
        title: "Dashboard",
        url: "#",
        icon: Home,
        module: "dashboard"
      }
    ];

    if (profile?.role === 'super_admin') {
      return [
        ...commonItems,
        {
          title: "Schools",
          url: "#", 
          icon: School,
          module: "schools"
        },
        {
          title: "School Admins",
          url: "#", 
          icon: Users,
          module: "users"
        },
        {
          title: "Analytics",
          url: "#",
          icon: BarChart3,
          module: "analytics"
        }
      ];
    }

    if (profile?.role === 'school_admin') {
      return [
        ...commonItems,
        {
          title: "Students",
          url: "#",
          icon: Users,
          module: "students"
        },
        {
          title: "Teachers",
          url: "#",
          icon: Users,
          module: "users"
        },
        {
          title: "Classes",
          url: "#",
          icon: BookOpen,
          module: "classes"
        },
        {
          title: "Subjects",
          url: "#",
          icon: ClipboardList,
          module: "subjects"
        },
        {
          title: "Class Assignment",
          url: "#",
          icon: ArrowRightLeft,
          module: "class-assignment"
        },
        {
          title: "Attendance",
          url: "#",
          icon: UserCheck,
          module: "attendance"
        },
        {
          title: "Exams",
          url: "#",
          icon: FileText,
          module: "exams"
        },
        {
          title: "Timetable",
          url: "#",
          icon: Calendar,
          module: "timetable"
        },
        {
          title: "Reports",
          url: "#",
          icon: BarChart3,
          module: "reports"
        }
      ];
    }

    if (profile?.role === 'teacher') {
      return [
        ...commonItems,
        {
          title: "My Students",
          url: "#",
          icon: Users,
          module: "students"
        },
        {
          title: "Attendance",
          url: "#",
          icon: UserCheck,
          module: "attendance"
        },
        {
          title: "Enter Exam Marks",
          url: "#",
          icon: Award,
          module: "exam-marks"
        },
        {
          title: "My Classes",
          url: "#",
          icon: BookOpen,
          module: "classes"
        },
        {
          title: "Timetable",
          url: "#",
          icon: Calendar,
          module: "timetable"
        },
        {
          title: "Assignments",
          url: "#",
          icon: FileText,
          module: "assignments"
        }
      ];
    }

    return commonItems;
  };

  const menuItems = getMenuItems();

  return (
    <Sidebar className="border-r">
      <SidebarContent className="gap-0">
        <SidebarGroup className="border-b px-0">
          <SidebarGroupLabel className="px-4 py-2 text-base md:text-lg font-bold text-primary bg-primary/5">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 md:h-8 md:w-8 rounded bg-primary flex items-center justify-center">
                <span className="text-primary-foreground text-xs md:text-sm font-bold">S</span>
              </div>
              <span className="hidden md:inline">SchoolXNow</span>
            </div>
          </SidebarGroupLabel>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => setActiveModule(item.module)}
                    isActive={activeModule === item.module}
                    className="w-full justify-start h-10 px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setActiveModule("settings")}
                  isActive={activeModule === "settings"}
                  className="h-10 px-3 text-sm"
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* User Profile Section */}
        {profile && (
          <SidebarGroup className="border-t pt-4">
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <div className="px-3 py-2 border rounded-lg bg-muted/50">
                    <div className="font-medium text-sm truncate">{profile.full_name}</div>
                    <div className="text-xs text-muted-foreground capitalize truncate">
                      {profile.role.replace('_', ' ')}
                    </div>
                  </div>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={async () => {
                      await signOut();
                    }}
                    className="h-10 px-3 text-sm text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}