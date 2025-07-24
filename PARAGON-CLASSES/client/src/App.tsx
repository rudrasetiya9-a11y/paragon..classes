import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import TeacherDashboard from "@/pages/teacher-dashboard";
import StudentDashboard from "@/pages/student-dashboard";
import FeeManagement from "@/pages/fee-management";
import StudyMaterials from "@/pages/study-materials";
import Notifications from "@/pages/notifications";
import StudentManagement from "@/pages/student-management";
import BatchManagement from "@/pages/batch-management";
import PaymentCheckout from "@/pages/payment-checkout";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : user?.role === 'teacher' ? (
        <>
          <Route path="/" component={TeacherDashboard} />
          <Route path="/students" component={StudentManagement} />
          <Route path="/batches" component={BatchManagement} />
          <Route path="/fees" component={FeeManagement} />
          <Route path="/materials" component={StudyMaterials} />
          <Route path="/notifications" component={Notifications} />
        </>
      ) : (
        <>
          <Route path="/" component={StudentDashboard} />
          <Route path="/materials" component={StudyMaterials} />
          <Route path="/notifications" component={Notifications} />
          <Route path="/payment/:paymentId" component={PaymentCheckout} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
