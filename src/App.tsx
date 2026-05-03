import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, matchPath } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { StudentSessionProvider } from "@/hooks/useStudentSession";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import CreateClass from "./pages/CreateClass";

import ClassDashboard from "./pages/ClassDashboard";
import AssessmentDetail from "./pages/AssessmentDetail";
import CreateAssessment from "./pages/CreateAssessment";
import StudentReport from "./pages/StudentReport";
import CurriculumBrowser from "./pages/CurriculumBrowser";
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

const queryClient = new QueryClient();

const PAGE_TITLES: { path: string; title: string }[] = [
  { path: "/dashboard", title: "Dashboard" },
  { path: "/settings", title: "Settings" },
  { path: "/create-class", title: "Create Class" },
  { path: "/class/:classId/session/:sessionId", title: "Session" },
  { path: "/class/:classId", title: "Class" },
  { path: "/assessment/:assessmentId", title: "Assessment" },
  { path: "/create-assessment/:classId", title: "Create Assessment" },
  { path: "/curriculum-browser/strand/:strandId", title: "Curriculum" },
  { path: "/curriculum-browser/content/:contentItemId", title: "Curriculum" },
  { path: "/curriculum-browser", title: "Curriculum" },
  { path: "/classroom/:classId", title: "Classroom" },
  { path: "/classroom", title: "Classroom" },
  { path: "/exit-tickets/create", title: "Create Exit Ticket" },
  { path: "/exit-tickets", title: "Exit Tickets" },
  { path: "/resources", title: "Resources" },
  { path: "/student/:studentId/class/:classId", title: "Student Report" },
  { path: "/student/dashboard", title: "Student Dashboard" },
  { path: "/exit-ticket/:taskId", title: "Exit Ticket" },
  { path: "/join", title: "Student Sign In" },
  { path: "/login", title: "Login" },
  { path: "/auth/teacher/sso", title: "Signing in..." },
  { path: "/auth/sso", title: "Signing in..." },
  { path: "/spinner", title: "Pulse" },
  { path: "/", title: "Pulse" },
];

function PageTitle() {
  const location = useLocation();

  useEffect(() => {
    const match = PAGE_TITLES.find(({ path }) => matchPath({ path, end: true }, location.pathname));
    const label = match?.title ?? "Pulse";
    document.title = label === "Pulse" ? "Pulse · by Edufied" : `Pulse - ${label}`;
  }, [location.pathname]);

  return null;
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
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 flex flex-col">
          <header className="h-12 flex items-center border-b px-4 bg-background">
            <SidebarTrigger className="mr-2" />
          </header>
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <StudentSessionProvider>
        <TooltipProvider delayDuration={300}>
          <Toaster />
          <Sonner />
          <BrowserRouter>
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
                path="/assessment/:assessmentId" 
                element={
                  <ProtectedRoute>
                    <AssessmentDetail />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/curriculum-browser" 
                element={
                  <ProtectedRoute>
                    <CurriculumBrowser />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/curriculum-browser/strand/:strandId" 
                element={
                  <ProtectedRoute>
                    <CurriculumBrowser />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/curriculum-browser/content/:contentItemId" 
                element={
                  <ProtectedRoute>
                    <CurriculumBrowser />
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
              <Route 
                path="/create-assessment/:classId" 
                element={
                  <ProtectedRoute>
                    <CreateAssessment />
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
                path="/student/:studentId/class/:classId" 
                element={
                  <ProtectedRoute>
                    <StudentReport />
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
  </QueryClientProvider>
);

export default App;
