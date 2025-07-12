import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/layout/header";
import Navigation from "@/components/layout/navigation";
import FinancialCard from "@/components/cards/financial-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingDown, 
  TrendingUp, 
  AlertTriangle, 
  Wallet,
  Clock,
  CheckCircle,
  Plus
} from "lucide-react";

export default function Home() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  const { data: dashboardData, isLoading: isDashboardLoading, error: dashboardError } = useQuery({
    queryKey: ["/api/dashboard"],
    retry: false,
    enabled: isAuthenticated, // Only run query if user is authenticated
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Redirecting to login...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/auth";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Handle dashboard authentication errors
  useEffect(() => {
    if (dashboardError && isUnauthorizedError(dashboardError)) {
      toast({
        title: "Session Expired",
        description: "Your session has expired. Please log in again.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/auth";
      }, 500);
    }
  }, [dashboardError, toast]);

  if (isLoading || isDashboardLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-16 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <FinancialCard
            title="A Receber"
            amount={formatCurrency(dashboardData?.totalReceivable || 0)}
            icon={<TrendingDown className="h-6 w-6 text-success" />}
            color="success"
          />
          <FinancialCard
            title="A Pagar"
            amount={formatCurrency(dashboardData?.totalPayable || 0)}
            icon={<TrendingUp className="h-6 w-6 text-error" />}
            color="error"
          />
          <FinancialCard
            title="Vencidas"
            amount={formatCurrency(dashboardData?.totalOverdue || 0)}
            icon={<AlertTriangle className="h-6 w-6 text-warning" />}
            color="warning"
          />
          <FinancialCard
            title="Saldo"
            amount={formatCurrency(dashboardData?.balance || 0)}
            icon={<Wallet className="h-6 w-6 text-primary" />}
            color="primary"
          />
        </div>

        {/* Recent Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Vencimentos Próximos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData?.upcomingPayments?.length > 0 ? (
                  dashboardData.upcomingPayments.map((payment: any) => (
                    <div key={payment.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-2 h-2 bg-warning rounded-full mr-3"></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {payment.client.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {payment.description}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {formatCurrency(parseFloat(payment.amount))}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(payment.dueDate).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Nenhum vencimento próximo</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Atividades Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-center py-8 text-gray-500">
                  <Plus className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhuma atividade recente</p>
                  <p className="text-sm">Comece adicionando clientes e contas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
