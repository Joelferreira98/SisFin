import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";
import Navigation from "@/components/layout/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Settings,
  UserCheck,
  UserX,
  Crown
} from "lucide-react";

export default function Admin() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();

  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients"],
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

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/auth";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalUsers = 1; // Current user
  const totalTransactions = receivables.length + payables.length;
  const totalVolume = receivables.reduce((sum: number, r: any) => sum + parseFloat(r.amount), 0) +
                    payables.reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0);

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
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Painel Administrativo
          </h2>
          <p className="text-gray-600">
            Gerencie usuários, planos e configurações do sistema
          </p>
        </div>

        {/* System Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                Usuários ativos na plataforma
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Transações</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTransactions}</div>
              <p className="text-xs text-muted-foreground">
                Contas registradas no sistema
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Volume Financeiro</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalVolume)}</div>
              <p className="text-xs text-muted-foreground">
                Total movimentado
              </p>
            </CardContent>
          </Card>
        </div>

        {/* User Management */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Gerenciamento de Usuários
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-white font-medium">
                      {user?.firstName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {user?.firstName || user?.email || 'Usuário'}
                    </p>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-success text-white">
                    <Crown className="h-3 w-3 mr-1" />
                    Administrador
                  </Badge>
                  <Badge variant="outline" className="border-green-200 text-green-800">
                    <UserCheck className="h-3 w-3 mr-1" />
                    Ativo
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configurações do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">
                  Planos de Assinatura
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  Configure os planos disponíveis para os usuários
                </p>
                <Button variant="outline" size="sm">
                  Configurar Planos
                </Button>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">
                  Integração WhatsApp
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  Configurar Evolution API e templates de mensagens
                </p>
                <Button variant="outline" size="sm">
                  Configurar API
                </Button>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">
                  Notificações
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  Configurar notificações automáticas e lembretes
                </p>
                <Button variant="outline" size="sm">
                  Configurar Notificações
                </Button>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">
                  Backup e Segurança
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  Configurar backups automáticos e políticas de segurança
                </p>
                <Button variant="outline" size="sm">
                  Configurar Backup
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
