import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";
import Navigation from "@/components/layout/navigation";
import AdminStats from "@/components/admin/admin-stats";
import UserManagement from "@/components/admin/user-management";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Settings,
  BarChart3,
  Users,
  MessageSquare,
  Shield,
  Database,
  Bell
} from "lucide-react";

export default function Admin() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();

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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuários
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
                      <Database className="h-4 w-4 inline mr-2" />
                      Banco de Dados
                    </h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Configurar backups automáticos e políticas de retenção
                    </p>
                    <Button variant="outline" size="sm">
                      Configurar Backup
                    </Button>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">
                      <Shield className="h-4 w-4 inline mr-2" />
                      Segurança
                    </h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Configurar políticas de segurança e autenticação
                    </p>
                    <Button variant="outline" size="sm">
                      Configurar Segurança
                    </Button>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">
                      <Bell className="h-4 w-4 inline mr-2" />
                      Notificações
                    </h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Configurar notificações automáticas e alertas
                    </p>
                    <Button variant="outline" size="sm">
                      Configurar Notificações
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
