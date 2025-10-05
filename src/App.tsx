import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import BootstrapChecker from "@/components/BootstrapChecker";
import ErrorBoundary from "@/components/ErrorBoundary";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AdminAuth from "./pages/AdminAuth";
import Bootstrap from "./pages/Bootstrap";
import SchoolRegistration from "./pages/SchoolRegistration";
import ConfigDebugger from "./pages/ConfigDebugger";
import PasswordReset from "./components/PasswordReset";
import NotFound from "./pages/NotFound";
import TestPage from "./pages/TestPage";
import SupabaseConnectionTest from "./pages/SupabaseConnectionTest";
import RealtimeTest from "./pages/RealtimeTest";
import SupabaseTestSuite from "./pages/SupabaseTestSuite";

// Create a query client with error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

// Full app with diagnostic routes added
const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/bootstrap" element={<Bootstrap />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/school-registration" element={<SchoolRegistration />} />
              <Route path="/config-debug" element={<ConfigDebugger />} />
              <Route path="/reset-password" element={<PasswordReset />} />
              <Route path="/system-admin-access" element={<AdminAuth />} />
              <Route path="/dashboard" element={
                <BootstrapChecker>
                  <Index />
                </BootstrapChecker>
              } />
              
              {/* Diagnostic routes - keep these for troubleshooting */}
              <Route path="/test" element={<TestPage />} />
              <Route path="/supabase-test" element={<SupabaseConnectionTest />} />
              <Route path="/realtime-test" element={
                <React.Suspense fallback={<div>Loading Diagnostic Tool...</div>}>
                  <RealtimeTest />
                </React.Suspense>
              } />
              <Route path="/supabase-test-suite" element={<SupabaseTestSuite />} />
              
              <Route path="/" element={<Landing />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
