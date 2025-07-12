import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Header from "@/components/layout/header";
import Navigation from "@/components/layout/navigation";
import WhatsAppConfig from "@/components/whatsapp-config";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  MessageSquare, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Send,
  Plus,
  Edit,
  Users,
  MessageCircle,
  History,
  Settings
} from "lucide-react";
import { format } from "date-fns";
import type { Client, WhatsappMessage } from "@shared/schema";

export default function WhatsApp() {
  const { toast } = useToast();
  const [customMessage, setCustomMessage] = useState("");
  const [selectedClients, setSelectedClients] = useState<number[]>([]);

  const { data: messages = [], isLoading: isLoadingMessages } = useQuery({
    queryKey: ["/api/whatsapp/messages"],
    retry: false,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients"],
    retry: false,
  });

  const { data: receivables = [] } = useQuery({
    queryKey: ["/api/receivables"],
    retry: false,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ clientId, content, templateType }: {
      clientId: number;
      content: string;
      templateType?: string;
    }) => {
      const response = await apiRequest("POST", "/api/whatsapp/send", {
        clientId,
        content,
        templateType
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/messages"] });
      toast({
        title: "Mensagem enviada",
        description: "Mensagem enviada com sucesso",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Erro",
        description: "Erro ao enviar mensagem",
        variant: "destructive",
      });
    },
  });

  const handleSendReminders = () => {
    const upcomingDue = receivables.filter((r: any) => {
      const dueDate = new Date(r.dueDate);
      const today = new Date();
      const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return r.status === 'pending' && diffDays <= 3 && diffDays >= 0;
    });

    upcomingDue.forEach((receivable: any) => {
      const message = `Olá ${receivable.client.name}! 👋\n\nLembrando que sua conta de ${receivable.description} no valor de R$ ${receivable.amount} vence em ${Math.ceil((new Date(receivable.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} dias.\n\nQualquer dúvida, estou à disposição!`;
      
      sendMessageMutation.mutate({
        clientId: receivable.client.id,
        content: message,
        templateType: 'reminder'
      });
    });
  };

  const handleSendOverdueNotices = () => {
    const overdue = receivables.filter((r: any) => {
      return r.status === 'pending' && new Date(r.dueDate) < new Date();
    });

    overdue.forEach((receivable: any) => {
      const daysPastDue = Math.ceil((new Date().getTime() - new Date(receivable.dueDate).getTime()) / (1000 * 60 * 60 * 24));
      const message = `Olá ${receivable.client.name}! 📋\n\nSua conta de ${receivable.description} no valor de R$ ${receivable.amount} está vencida há ${daysPastDue} dias.\n\nPor favor, entre em contato para regularizar a situação.`;
      
      sendMessageMutation.mutate({
        clientId: receivable.client.id,
        content: message,
        templateType: 'overdue'
      });
    });
  };

  const handleSendCustomMessage = () => {
    if (!customMessage.trim()) {
      toast({
        title: "Erro",
        description: "Digite uma mensagem antes de enviar",
        variant: "destructive",
      });
      return;
    }

    if (selectedClients.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um cliente",
        variant: "destructive",
      });
      return;
    }

    selectedClients.forEach(clientId => {
      sendMessageMutation.mutate({
        clientId,
        content: customMessage,
        templateType: 'custom'
      });
    });

    setCustomMessage("");
    setSelectedClients([]);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'read':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Integração WhatsApp
          </h2>
          
          {/* Configuration Component */}
          <div className="mb-6">
            <WhatsAppConfig />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Message Templates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Modelos de Mensagem
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">Lembrete de Vencimento</h4>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="bg-gray-50 rounded p-3 text-sm text-gray-700">
                    <p>Olá [Nome]! 👋</p>
                    <p>Lembrando que sua conta de [Descrição] no valor de R$ [Valor] vence em [Dias] dias.</p>
                    <p>Qualquer dúvida, estou à disposição!</p>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Enviado automaticamente 3 dias antes do vencimento
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">Cobrança Vencida</h4>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="bg-gray-50 rounded p-3 text-sm text-gray-700">
                    <p>Olá [Nome]! 📋</p>
                    <p>Sua conta de [Descrição] no valor de R$ [Valor] está vencida há [Dias] dias.</p>
                    <p>Por favor, entre em contato para regularizar a situação.</p>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Enviado automaticamente após 3 dias de vencimento
                  </div>
                </div>

                <Button className="w-full" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Modelo
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Message History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Histórico de Mensagens
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {messages.length > 0 ? (
                  messages.map((message: any) => (
                    <div key={message.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-success rounded-full flex items-center justify-center">
                          <MessageSquare className="h-4 w-4 text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">
                            {message.client.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatTimestamp(message.sentAt)}
                          </p>
                        </div>
                        <p className="text-sm text-gray-700 truncate">
                          {message.content.length > 50 ? 
                            `${message.content.substring(0, 50)}...` : 
                            message.content
                          }
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          {getStatusIcon(message.status)}
                          <p className="text-xs text-gray-500 capitalize">
                            {message.status}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Nenhuma mensagem enviada</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bulk Actions */}
        <div className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ações em Massa</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  onClick={handleSendReminders}
                  className="bg-warning hover:bg-warning/90 h-auto p-4"
                  disabled={sendMessageMutation.isPending}
                >
                  <div className="text-center">
                    <Clock className="h-6 w-6 mx-auto mb-2" />
                    <p className="font-medium">Enviar Lembretes</p>
                    <p className="text-sm opacity-90">Contas vencendo em 3 dias</p>
                  </div>
                </Button>
                
                <Button
                  onClick={handleSendOverdueNotices}
                  className="bg-error hover:bg-error/90 h-auto p-4"
                  disabled={sendMessageMutation.isPending}
                >
                  <div className="text-center">
                    <AlertTriangle className="h-6 w-6 mx-auto mb-2" />
                    <p className="font-medium">Cobrar Vencidas</p>
                    <p className="text-sm opacity-90">Contas em atraso</p>
                  </div>
                </Button>
                
                <Button
                  onClick={() => {/* Open custom message modal */}}
                  className="bg-primary hover:bg-primary/90 h-auto p-4"
                  disabled={sendMessageMutation.isPending}
                >
                  <div className="text-center">
                    <Send className="h-6 w-6 mx-auto mb-2" />
                    <p className="font-medium">Mensagem Personalizada</p>
                    <p className="text-sm opacity-90">Envio customizado</p>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Custom Message */}
          <Card>
            <CardHeader>
              <CardTitle>Mensagem Personalizada</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="custom-message">Mensagem</Label>
                <Textarea
                  id="custom-message"
                  placeholder="Digite sua mensagem personalizada..."
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="mt-1"
                  rows={4}
                />
              </div>
              
              <div>
                <Label>Clientes Selecionados</Label>
                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                  {clients.map((client: any) => (
                    <div key={client.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`client-${client.id}`}
                        checked={selectedClients.includes(client.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedClients([...selectedClients, client.id]);
                          } else {
                            setSelectedClients(selectedClients.filter(id => id !== client.id));
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor={`client-${client.id}`} className="text-sm text-gray-700">
                        {client.name} - {client.whatsapp}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              <Button
                onClick={handleSendCustomMessage}
                disabled={sendMessageMutation.isPending}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                Enviar Mensagem
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
