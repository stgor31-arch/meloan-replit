import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Welcome from "@/pages/welcome";
import MasterDashboard from "@/pages/master/dashboard";
import MasterCreateLoan from "@/pages/master/create-loan";
import MasterProfile from "@/pages/master/profile";
import MasterLoanDetails from "@/pages/master/loan-details";
import BorrowerLogin from "@/pages/borrower/login";
import BorrowerInvite from "@/pages/borrower/invite";
import BorrowerDashboard from "@/pages/borrower/dashboard";
import { AnimatePresence } from "framer-motion";

function Router() {
  const [location] = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Switch location={location} key={location}>
        <Route path="/" component={Welcome} />
        
        {/* Master (Lender) Routes */}
        <Route path="/master/dashboard" component={MasterDashboard} />
        <Route path="/master/create-loan" component={MasterCreateLoan} />
        <Route path="/master/profile" component={MasterProfile} />
        <Route path="/master/loan/:id" component={MasterLoanDetails} />
        
        {/* Borrower Routes */}
        <Route path="/borrower/login" component={BorrowerLogin} />
        <Route path="/invite/:id" component={BorrowerInvite} />
        <Route path="/borrower/dashboard" component={BorrowerDashboard} />
        
        <Route component={NotFound} />
      </Switch>
    </AnimatePresence>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background font-sans text-foreground">
          <Router />
          <Toaster />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
