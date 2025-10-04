import { ReactNode } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import logo from "@/assets/logo.png";

interface LayoutProps {
  children: ReactNode;
  activeModule: string;
  setActiveModule: (module: string) => void;
}

export function Layout({ children, activeModule, setActiveModule }: LayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar activeModule={activeModule} setActiveModule={setActiveModule} />
      <SidebarInset>
        <header className="sticky top-0 z-40 flex h-14 md:h-16 shrink-0 items-center gap-2 border-b px-3 md:px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <SidebarTrigger className="-ml-1" />
          <div className="flex items-center gap-2 md:gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg blur-sm group-hover:blur-md transition-all duration-300" />
              <div className="relative bg-gradient-to-br from-primary/10 to-accent/10 p-1.5 md:p-2 rounded-lg border border-primary/20 group-hover:border-primary/40 transition-all duration-300 group-hover:scale-105">
                <img src={logo} alt="SchoolXNow Logo" className="h-6 w-6 md:h-7 md:w-7 object-contain drop-shadow-md" />
              </div>
            </div>
            <h1 className="text-lg md:text-xl font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">SchoolXNow</h1>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-3 md:gap-4 p-3 md:p-4 lg:p-6 bg-background min-h-screen">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}