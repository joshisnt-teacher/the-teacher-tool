import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, matchPath } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { StudentSessionProvider } from "@/hooks/useStudentSession";
import { useDemoTracking } from "@/hooks/useDemoTracking";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Moon, Sun } from "lucide-react";
import { AppSidebar } from "@/components/AppSidebar";
import { AppBreadcrumb } from "@/components/AppBreadcrumb";
import { useTheme } from "@/contexts/ThemeContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ToolSwitcher from "@/components/ToolSwitcher";
import { PulseWelcomeTour } from "@/components/tour/PulseWelcomeTour";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import CreateClass from "./pages/CreateClass";

import ClassDashboard from "./pages/ClassDashboard";
import Classroom from "./pages/Classroom";
import SessionDetails from "./pages/SessionDetails";
import ExitTickets from "./pages/ExitTickets";
import CreateExitTicket from "./pages/CreateExitTicket";
import Resources from "./pages/Resources";
import ClassJoin from "./pages/ClassJoin";
import TakeExitTicket from "./pages/TakeExitTicket";
import StudentLanding from "./pages/StudentLanding";
import StudentSSO from "./pages/StudentSSO";
import StudentDashboard from "./pages/StudentDashboard";
import TeacherSSO from "./pages/TeacherSSO";
import NotFound from "./pages/NotFound";
import Spinner from "./pages/Spinner";
import ExitTicketResults from "./pages/ExitTicketResults";
import Lessons from "./pages/Lessons";

const queryClient = new QueryClient();

const PAGE_TITLES: { path: string; title: string }[] = [
  { path: "/dashboard", title: "Dashboard" },
  { path: "/settings", title: "Settings" },
  { path: "/create-class", title: "Create Class" },
  { path: "/class/:classId/session/:sessionId", title: "Session" },
  { path: "/class/:classId", title: "Class" },
  { path: "/classroom/:classId", title: "Classroom" },
  { path: "/classroom", title: "Classroom" },
  { path: "/exit-tickets/create", title: "Create Exit Ticket" },
  { path: "/exit-tickets", title: "Exit Tickets" },
  { path: "/resources", title: "Resources" },
  { path: "/student/dashboard", title: "Student Dashboard" },
  { path: "/exit-ticket/:taskId", title: "Exit Ticket" },
  { path: "/join", title: "Student Sign In" },
  { path: "/login", title: "Login" },
  { path: "/auth/teacher/sso", title: "Signing in..." },
  { path: "/auth/sso", title: "Signing in..." },
  { path: "/lessons", title: "Lessons" },
  { path: "/assessment/:assessmentId", title: "Results" },
  { path: "/spinner", title: "Pulse" },
  { path: "/", title: "pulse" },
];

function PageTitle() {
  const location = useLocation();

  useEffect(() => {
    const match = PAGE_TITLES.find(({ path }) => matchPath({ path, end: true }, location.pathname));
    const label = match?.title ?? "pulse";
    document.title = label === "pulse" ? "pulse - by edufied" : `pulse - ${label}`;
  }, [location.pathname]);

  return null;
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <button
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent/20 hover:text-foreground transition-colors"
      title={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
    >
      {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const currentPath = location.pathname;
  const isAuthPage = currentPath === "/" || currentPath === "/login" || currentPath === "/auth/teacher/sso";
  const isSpinnerPage = currentPath.startsWith("/spinner");

  // Public student pages (no sidebar)
  const isStudentPage =
    currentPath === "/join" ||
    currentPath.startsWith("/exit-ticket/") ||
    currentPath.startsWith("/auth/sso") ||
    currentPath.startsWith("/student/");

  if (isAuthPage || isSpinnerPage || isStudentPage) {
    return <><PageTitle />{children}</>;
  }

  return (
    <SidebarProvider>
      <PageTitle />
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b border-border px-4 bg-background/80 backdrop-blur-md sticky top-0 z-30">
            <SidebarTrigger className="mr-2" />
            <div className="flex-1 min-w-0">
              <AppBreadcrumb />
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <ThemeToggle />
            </div>
          </header>
          <div className="flex-1 overflow-auto pb-12">
            {children}
          </div>
        </main>
      </div>
      <ToolSwitcher currentSlug="pulse" />
      <PulseWelcomeTour />
    </SidebarProvider>
  );
}

function DemoTracker() {
  useDemoTracking()
  return null
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
    <AuthProvider>
      <StudentSessionProvider>
        <TooltipProvider delayDuration={300}>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <DemoTracker />
            <AppLayout>
              <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/settings" 
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/create-class" 
                element={
                  <ProtectedRoute>
                    <CreateClass />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/class/:classId" 
                element={
                  <ProtectedRoute>
                    <ClassDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/classroom" 
                element={
                  <ProtectedRoute>
                    <Classroom />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/classroom/:classId" 
                element={
                  <ProtectedRoute>
                    <Classroom />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/exit-tickets" 
                element={
                  <ProtectedRoute>
                    <ExitTickets />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/exit-tickets/create" 
                element={
                  <ProtectedRoute>
                    <CreateExitTicket />
                  </ProtectedRoute>
                } 
              />
              <Route
                path="/resources"
                element={
                  <ProtectedRoute>
                    <Resources />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/lessons"
                element={
                  <ProtectedRoute>
                    <Lessons />
                  </ProtectedRoute>
                }
              />
              <Route 
                path="/spinner" 
                element={<Spinner />}
              />
              <Route
                path="/class/:classId/session/:sessionId"
                element={
                  <ProtectedRoute>
                    <SessionDetails />
                  </ProtectedRoute>
                }
              />
              {/* Public student routes */}
              <Route path="/join" element={<ClassJoin />} />
              <Route path="/student-landing" element={<StudentLanding />} />
              <Route path="/exit-ticket/:taskId" element={<TakeExitTicket />} />
              <Route path="/auth/sso" element={<StudentSSO />} />
              <Route path="/auth/teacher/sso" element={<TeacherSSO />} />
              <Route path="/student/dashboard" element={<StudentDashboard />} />
              <Route
                path="/assessment/:assessmentId"
                element={
                  <ProtectedRoute>
                    <ExitTicketResults />
                  </ProtectedRoute>
                }
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </TooltipProvider>
      </StudentSessionProvider>
    </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
