import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
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
import StudentAssessment from "./pages/StudentAssessment";
import StudentReport from "./pages/StudentReport";
import Online from "./pages/Online";
import CurriculumBrowser from "./pages/CurriculumBrowser";
import Classroom from "./pages/Classroom";
import SessionDetails from "./pages/SessionDetails";
import Activities from "./pages/Activities";
import CreateMultipleChoiceQuiz from "./pages/CreateMultipleChoiceQuiz";
import CreateSurveyActivity from "./pages/CreateSurveyActivity";
import NotFound from "./pages/NotFound";
import Spinner from "./pages/Spinner";

const queryClient = new QueryClient();

function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isAuthPage = location.pathname === "/" || location.pathname === "/login";
  const isSpinnerPage = location.pathname.startsWith("/spinner");
  const isStudentPage = location.pathname === "/online" || 
                        location.pathname.startsWith("/student-assessment") ||
                        location.pathname.startsWith("/student-form") ||
                        location.pathname.startsWith("/student-quiz");

  if (isAuthPage || isSpinnerPage || isStudentPage) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
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
                path="/activities" 
                element={
                  <ProtectedRoute>
                    <Activities />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/activities/create/multiple-choice-quiz" 
                element={
                  <ProtectedRoute>
                    <CreateMultipleChoiceQuiz />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/activities/create/survey" 
                element={
                  <ProtectedRoute>
                    <CreateSurveyActivity />
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
              {/* Public student routes - no auth required */}
              <Route 
                path="/online" 
                element={<Online />}
              />
              <Route 
                path="/student-assessment/:assessmentId" 
                element={<StudentAssessment />}
              />
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
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
