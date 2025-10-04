import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import BootstrapChecker from "@/components/BootstrapChecker";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AdminAuth from "./pages/AdminAuth";
import Bootstrap from "./pages/Bootstrap";
import SchoolRegistration from "./pages/SchoolRegistration";
import PasswordReset from "./components/PasswordReset";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
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
            <Route path="/reset-password" element={<PasswordReset />} />
            <Route path="/system-admin-access" element={<AdminAuth />} />
            <Route path="/dashboard" element={
              <BootstrapChecker>
                <Index />
              </BootstrapChecker>
            } />
            <Route path="/" element={<Landing />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
