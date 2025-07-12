import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Navigation from "@/components/layout/navigation";
import FinancialCard from "@/components/cards/financial-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  TrendingDown, 
  TrendingUp, 
  TrendingUpDown, 
  Percent,
  Download 
} from "lucide-react";

export default function Reports() {
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["/api/dashboard"],
    retry: false,
  });

  const { data: receivables = [] } = useQuery({
    queryKey: ["/api/receivables"],
    retry: false,
  });

  const { data: payables = [] } = useQuery({
    queryKey: ["/api/payables"],
    retry: false,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  // Calculate monthly totals
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyReceived = receivables
    .filter((r: any) => r.status === 'paid' && 
      new Date(r.updatedAt).getMonth() === currentMonth &&
      new Date(r.updatedAt).getFullYear() === currentYear)
    .reduce((sum: number, r: any) => sum + parseFloat(r.amount), 0);

  const monthlyPaid = payables
    .filter((p: any) => p.status === 'paid' && 
      new Date(p.updatedAt).getMonth() === currentMonth &&
      new Date(p.updatedAt).getFullYear() === currentYear)
    .reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0);

  const netProfit = monthlyReceived - monthlyPaid;
  const marginPercentage = monthlyReceived > 0 ? (netProfit / monthlyReceived) * 100 : 0;

  // Top clients by revenue
  const clientRevenue = receivables
    .filter((r: any) => r.status === 'paid')
    .reduce((acc: any, r: any) => {
      const clientId = r.client.id;
      if (!acc[clientId]) {
        acc[clientId] = {
          client: r.client,
          total: 0,
          transactions: 0
        };
      }
      acc[clientId].total += parseFloat(r.amount);
      acc[clientId].transactions += 1;
      return acc;
    }, {});

  const topClients = Object.values(clientRevenue)
    .sort((a: any, b: any) => b.total - a.total)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">
            Relatórios Financeiros
          </h2>
          <div className="flex items-center space-x-4">
            <Select defaultValue="current-month">
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current-month">Mês Atual</SelectItem>
                <SelectItem value="last-month">Mês Anterior</SelectItem>
                <SelectItem value="current-year">Ano Atual</SelectItem>
              </SelectContent>
            </Select>
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
          </div>
        </div>

        {/* Monthly Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <FinancialCard
            title="Total Recebido"
            amount={formatCurrency(monthlyReceived)}
            icon={<TrendingDown className="h-6 w-6 text-success" />}
            color="success"
          />
          <FinancialCard
            title="Total Pago"
            amount={formatCurrency(monthlyPaid)}
            icon={<TrendingUp className="h-6 w-6 text-error" />}
            color="error"
          />
          <FinancialCard
            title="Lucro Líquido"
            amount={formatCurrency(netProfit)}
            icon={<TrendingUpDown className="h-6 w-6 text-primary" />}
            color="primary"
          />
          <FinancialCard
            title="Margem"
            amount={`${marginPercentage.toFixed(1)}%`}
            icon={<Percent className="h-6 w-6 text-accent" />}
            color="accent"
          />
        </div>

        {/* Charts and Detailed Reports */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Comparison Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Comparativo Mensal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end justify-center space-x-4">
                <div className="flex flex-col items-center">
                  <div className="bg-success rounded-t w-12 h-24 mb-2 flex items-end justify-center">
                    <span className="text-white text-xs mb-1">6.2k</span>
                  </div>
                  <div className="bg-error rounded-t w-12 h-16 mb-2 flex items-end justify-center">
                    <span className="text-white text-xs mb-1">4.1k</span>
                  </div>
                  <span className="text-xs text-gray-500">Out</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="bg-success rounded-t w-12 h-32 mb-2 flex items-end justify-center">
                    <span className="text-white text-xs mb-1">7.8k</span>
                  </div>
                  <div className="bg-error rounded-t w-12 h-20 mb-2 flex items-end justify-center">
                    <span className="text-white text-xs mb-1">5.2k</span>
                  </div>
                  <span className="text-xs text-gray-500">Nov</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="bg-success rounded-t w-12 h-40 mb-2 flex items-end justify-center">
                    <span className="text-white text-xs mb-1">
                      {(monthlyReceived / 1000).toFixed(1)}k
                    </span>
                  </div>
                  <div className="bg-error rounded-t w-12 h-16 mb-2 flex items-end justify-center">
                    <span className="text-white text-xs mb-1">
                      {(monthlyPaid / 1000).toFixed(1)}k
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">Dez</span>
                </div>
              </div>
              <div className="mt-4 flex justify-center space-x-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-success rounded mr-2"></div>
                  <span className="text-sm text-gray-600">Recebidos</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-error rounded mr-2"></div>
                  <span className="text-sm text-gray-600">Pagos</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Clients Report */}
          <Card>
            <CardHeader>
              <CardTitle>Principais Clientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topClients.length > 0 ? (
                  topClients.map((clientData: any, index: number) => (
                    <div key={clientData.client.id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                            <span className="text-white text-xs font-medium">
                              {clientData.client.name.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            {clientData.client.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {clientData.transactions} transações
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {formatCurrency(clientData.total)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {monthlyReceived > 0 ? 
                            `${((clientData.total / monthlyReceived) * 100).toFixed(1)}%` : 
                            '0%'
                          }
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>Nenhum cliente com transações pagas</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
