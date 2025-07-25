import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/lib/protected-route";
import AuthPage from "@/pages/auth-page";
import Home from "@/pages/home";
import Clients from "@/pages/clients";
import Receivables from "@/pages/receivables";
import Payables from "@/pages/payables";
import Reports from "@/pages/reports";
import WhatsApp from "@/pages/whatsapp";
import Admin from "@/pages/admin";
import InstallmentSales from "@/pages/installment-sales";
import ConfirmSale from "@/pages/confirm-sale";
import PaymentReminders from "@/pages/payment-reminders";
import Plans from "@/pages/plans";
import NotFound from "@/pages/not-found";
import { SystemHead } from "@/components/system-head";
import { PWAInstaller } from "@/components/pwa-installer";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Home} />
      <ProtectedRoute path="/clients" component={Clients} />
      <ProtectedRoute path="/receivables" component={Receivables} />
      <ProtectedRoute path="/payables" component={Payables} />
      <ProtectedRoute path="/reports" component={Reports} />
      <ProtectedRoute path="/whatsapp" component={WhatsApp} />
      <ProtectedRoute path="/confirmations" component={InstallmentSales} />
      <ProtectedRoute path="/payment-reminders" component={PaymentReminders} />
      <ProtectedRoute path="/plans" component={Plans} />
      <ProtectedRoute path="/admin" component={Admin} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/confirm-sale/:token" component={ConfirmSale} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <SystemHead />
          <Toaster />
          <Router />
          <PWAInstaller />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
