import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";
import Navigation from "@/components/layout/navigation";
import AdminStats from "@/components/admin/admin-stats";
import UserManagement from "@/components/admin/user-management";
import PlanManagement from "@/components/admin/plan-management";
import PlanChangeRequests from "@/components/admin/plan-change-requests";
import SystemSettings from "@/components/admin/system-settings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation, queryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Settings,
  BarChart3,
  Users,
  MessageSquare,
  Shield,
  Database,
  Bell,
  CreditCard
} from "lucide-react";

export default function Admin() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading, isAdmin } = useAuth();

  const triggerBillingMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/billing/trigger");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Cobrança mensal disparada",
        description: "As cobranças recorrentes dos planos foram geradas com sucesso",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao gerar cobranças",
        description: error.message || "Falha ao gerar cobranças mensais",
        variant: "destructive",
      });
    },
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
    
    if (!isLoading && isAuthenticated && !isAdmin) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para acessar o painel administrativo",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, isAdmin, toast]);

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
            Gerencie usuários, monitore estatísticas e configure o sistema
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="plans" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Planos
            </TabsTrigger>
            <TabsTrigger value="plan-requests" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Solicitações
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Cobrança
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              WhatsApp
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configurações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <AdminStats />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <UserManagement />
          </TabsContent>

          <TabsContent value="plans" className="space-y-6">
            <PlanManagement />
          </TabsContent>

          <TabsContent value="plan-requests" className="space-y-6">
            <PlanChangeRequests />
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Cobrança de Planos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">
                      Cobrança Mensal Automática
                    </h4>
                    <p className="text-sm text-gray-600 mb-4">
                      O sistema gera automaticamente cobranças mensais no dia 1° de cada mês para todos os usuários com planos ativos.
                    </p>
                    <Button 
                      onClick={() => triggerBillingMutation.mutate()}
                      disabled={triggerBillingMutation.isPending}
                      className="w-full sm:w-auto"
                    >
                      {triggerBillingMutation.isPending ? "Gerando..." : "Gerar Cobrança Manual"}
                    </Button>
                  </div>
                  
                  <div className="p-4 border rounded-lg bg-blue-50">
                    <h4 className="font-medium text-blue-900 mb-2">
                      Como Funciona
                    </h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Verifica todos os usuários com planos ativos</li>
                      <li>• Gera contas a receber para o mês atual</li>
                      <li>• Evita duplicação de cobranças</li>
                      <li>• Executado automaticamente todo dia 1°</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="whatsapp" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Configuração WhatsApp
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">
                      Evolution API
                    </h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Configure a URL da Evolution API para envio de mensagens
                    </p>
                    <Button variant="outline" size="sm">
                      Configurar API
                    </Button>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">
                      Templates de Mensagens
                    </h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Personalize os templates para lembretes de pagamento
                    </p>
                    <Button variant="outline" size="sm">
                      Gerenciar Templates
                    </Button>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">
                      Agendamento
                    </h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Configure horários para envio automático de mensagens
                    </p>
                    <Button variant="outline" size="sm">
                      Configurar Agendamento
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <SystemSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
