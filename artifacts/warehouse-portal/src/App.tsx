import { type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Route, Switch, useLocation, Router as WouterRouter } from "wouter";
import { Shell } from "@/components/shell";
import HomePage from "@/pages/home";
import SopsPage from "@/pages/sops";
import SopDetailPage from "@/pages/sop-detail";
import LearningsPage from "@/pages/learnings";
import LearningDetailPage from "@/pages/learning-detail";
import ToolkitPage from "@/pages/toolkit";
import AdminPage from "@/pages/admin";
import RegisterDevicePage from "@/pages/register-device";
import ViewingReportPage from "@/pages/viewing-report";
import LoginPage from "@/pages/login";

const queryClient = new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: true, retry: 1 } } });

function Router() {
  return (
    <Shell>
      <RoutedErrorBoundary>
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/sops" component={SopsPage} />
          <Route path="/sops/:id" component={SopDetailPage} />
          <Route path="/learnings" component={LearningsPage} />
          <Route path="/learnings/:id" component={LearningDetailPage} />
          <Route path="/toolkit" component={ToolkitPage} />
          <Route path="/admin" component={AdminPage} />
          <Route path="/register-device" component={RegisterDevicePage} />
          <Route path="/viewing-report" component={ViewingReportPage} />
          <Route path="/login" component={LoginPage} />
          <Route component={NotFound} />
        </Switch>
      </RoutedErrorBoundary>
    </Shell>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
