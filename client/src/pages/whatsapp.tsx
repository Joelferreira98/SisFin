import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, Send, User, Clock, CheckCircle, XCircle, Settings, Smartphone } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import WhatsAppConfig from "@/components/whatsapp-config";
import WhatsAppInstanceManager from "@/components/whatsapp-instance-manager";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/layout/header";
import Navigation from "@/components/layout/navigation";

interface WhatsAppMessage {
  id: number;
  userId: number;
  clientId: number;
  content: string;
  status: string;
  templateType: string;
  sentAt: string;
  client: {
    id: number;
    name: string;
    whatsapp: string;
    document: string;
    email: string;
    address: string;
    zipCode: string;
    city: string;
    state: string;
    userId: number;
    createdAt: string;
    updatedAt: string;
  };
}

export default function WhatsApp() {
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  const { data: messages, isLoading } = useQuery({
    queryKey: ['/api/whatsapp/messages'],
    queryFn: () => apiRequest('GET', '/api/whatsapp/messages').then(res => res.json()),
  });

  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('GET', '/api/whatsapp/test-connection');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Teste de Conexão",
        description: data.message,
        variant: data.message.includes('sucesso') ? 'default' : 'destructive',
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro no Teste",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Enviado</Badge>;
      case 'delivered':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><CheckCircle className="w-3 h-3 mr-1" />Entregue</Badge>;
      case 'read':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800"><CheckCircle className="w-3 h-3 mr-1" />Lido</Badge>;
      case 'failed':
        return <Badge variant="secondary" className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Falhou</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">WhatsApp</h1>
            <p className="text-gray-600">Gerencie suas instâncias e mensagens WhatsApp</p>
          </div>
          <Button 
            onClick={() => testConnectionMutation.mutate()}
            disabled={testConnectionMutation.isPending}
            variant="outline"
          >
            {testConnectionMutation.isPending ? 'Testando...' : 'Testar Conexão Global'}
          </Button>
        </div>

      <Tabs defaultValue="instances" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="instances" className="flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            Instâncias
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <Send className="w-4 h-4" />
            Mensagens
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="config" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Configuração
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="instances" className="space-y-4">
          <WhatsAppInstanceManager />
        </TabsContent>

        <TabsContent value="messages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="w-5 h-5" />
                Mensagens Enviadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : !messages || messages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma mensagem enviada</h3>
                  <p className="text-gray-500">
                    As mensagens enviadas aparecerão aqui quando você usar os botões de WhatsApp nas tabelas de contas.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message: WhatsAppMessage) => (
                    <div key={message.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">{message.client.name}</span>
                          <span className="text-sm text-gray-500">({message.client.whatsapp})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(message.status)}
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Clock className="w-3 h-3" />
                            {formatDate(message.sentAt)}
                          </div>
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm">{message.content}</p>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        Template: {message.templateType}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="config" className="space-y-4">
            <WhatsAppConfig />
          </TabsContent>
        )}
      </Tabs>
      </div>
    </div>
  );
}