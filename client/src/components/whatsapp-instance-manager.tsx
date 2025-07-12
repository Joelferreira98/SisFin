import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { MessageCircle, Plus, Settings, Trash2, Smartphone, QrCode, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { UserWhatsappInstance } from "@shared/schema";

export default function WhatsAppInstanceManager() {
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newInstance, setNewInstance] = useState({
    instanceName: "",
    displayName: "",
    token: ""
  });

  const [qrCodeData, setQrCodeData] = useState<any>(null);

  // Query para buscar instâncias do usuário
  const { data: instances, isLoading } = useQuery({
    queryKey: ['/api/whatsapp/instances'],
    queryFn: () => apiRequest('GET', '/api/whatsapp/instances').then(res => res.json()),
  });

  // Mutation para criar instância
  const createInstanceMutation = useMutation({
    mutationFn: async (instanceData: typeof newInstance) => {
      const res = await apiRequest('POST', '/api/whatsapp/instances', instanceData);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/whatsapp/instances'] });
      
      if (data.qrCodeData && data.qrCodeData.base64) {
        // Mostra QR code para escaneamento
        setQrCodeData(data.qrCodeData);
        toast({
          title: "QR Code Gerado!",
          description: "Escaneie o QR code com seu WhatsApp para conectar",
        });
      } else {
        setIsCreateModalOpen(false);
        setNewInstance({ instanceName: "", displayName: "", token: "" });
        toast({
          title: "Sucesso!",
          description: "Instância WhatsApp criada com sucesso",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para deletar instância
  const deleteInstanceMutation = useMutation({
    mutationFn: async (instanceId: number) => {
      const res = await apiRequest('DELETE', `/api/whatsapp/instances/${instanceId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/whatsapp/instances'] });
      toast({
        title: "Sucesso!",
        description: "Instância WhatsApp deletada com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para atualizar status da instância
  const updateInstanceMutation = useMutation({
    mutationFn: async ({ instanceId, status }: { instanceId: number; status: string }) => {
      const res = await apiRequest('PUT', `/api/whatsapp/instances/${instanceId}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/whatsapp/instances'] });
      toast({
        title: "Sucesso!",
        description: "Status da instância atualizado",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para verificar status da instância
  const checkStatusMutation = useMutation({
    mutationFn: async (instanceId: number) => {
      const res = await apiRequest('GET', `/api/whatsapp/instances/${instanceId}/status`);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/whatsapp/instances'] });
      toast({
        title: "Status verificado",
        description: `Status da instância: ${data.status || 'Desconhecido'}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: `Erro ao verificar status: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutation para regenerar QR code
  const regenerateQRMutation = useMutation({
    mutationFn: async (instanceId: number) => {
      const res = await apiRequest('POST', `/api/whatsapp/instances/${instanceId}/regenerate-qr`);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/whatsapp/instances'] });
      
      // Show the new QR code
      if (data.qrCodeData) {
        setQrCodeData(data.qrCodeData);
        setIsCreateModalOpen(true);
      }
      
      toast({
        title: "QR Code regenerado!",
        description: "Novo QR Code gerado com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao regenerar QR Code",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateInstance = () => {
    if (!newInstance.instanceName || !newInstance.displayName) {
      toast({
        title: "Erro",
        description: "Nome da instância e nome de exibição são obrigatórios",
        variant: "destructive",
      });
      return;
    }
    createInstanceMutation.mutate(newInstance);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Conectado</Badge>;
      case 'connecting':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><RefreshCw className="w-3 h-3 mr-1 animate-spin" />Conectando</Badge>;
      case 'disconnected':
        return <Badge variant="secondary" className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Desconectado</Badge>;
      default:
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-8 h-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Minhas Instâncias WhatsApp
            </CardTitle>
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Instância
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Nova Instância WhatsApp</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="instanceName">Nome da Instância</Label>
                    <Input
                      id="instanceName"
                      placeholder="minha-instancia"
                      value={newInstance.instanceName}
                      onChange={(e) => setNewInstance({...newInstance, instanceName: e.target.value})}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Use apenas letras, números e hífens. Será usado na API.
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="displayName">Nome de Exibição</Label>
                    <Input
                      id="displayName"
                      placeholder="Minha Instância"
                      value={newInstance.displayName}
                      onChange={(e) => setNewInstance({...newInstance, displayName: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="token">Token (opcional)</Label>
                    <Input
                      id="token"
                      placeholder="Deixe em branco para usar padrão (123456)"
                      value={newInstance.token}
                      onChange={(e) => setNewInstance({...newInstance, token: e.target.value})}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Token usado para autenticação da instância
                    </p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-md">
                    <p className="text-sm text-blue-800">
                      <strong>Modo WhatsApp-Baileys:</strong> Será gerado um QR Code para você escanear com seu WhatsApp e conectar a instância.
                    </p>
                  </div>
                  {qrCodeData && qrCodeData.base64 ? (
                    <div className="space-y-4">
                      <div className="text-center">
                        <h3 className="font-semibold mb-2">QR Code para Conexão</h3>
                        <div className="flex justify-center">
                          <img 
                            src={qrCodeData.base64} 
                            alt="QR Code WhatsApp" 
                            className="max-w-64 max-h-64 border rounded"
                          />
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                          Escaneie este QR code com seu WhatsApp para conectar a instância
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => {
                            setQrCodeData(null);
                            setIsCreateModalOpen(false);
                            setNewInstance({ instanceName: "", displayName: "", token: "" });
                          }}
                          variant="outline"
                          className="flex-1"
                        >
                          Fechar
                        </Button>
                        <Button 
                          onClick={() => {
                            // Regenerar QR code
                            handleCreateInstance();
                          }}
                          variant="outline"
                          className="flex-1"
                        >
                          Gerar Novo QR
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button 
                      onClick={handleCreateInstance}
                      disabled={createInstanceMutation.isPending}
                      className="w-full"
                    >
                      {createInstanceMutation.isPending ? "Criando..." : "Criar Instância"}
                    </Button>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {!instances || instances.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma instância encontrada</h3>
              <p className="text-gray-500 mb-4">
                Crie sua primeira instância WhatsApp para começar a enviar mensagens.
              </p>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeira Instância
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome de Exibição</TableHead>
                  <TableHead>Instância</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {instances.map((instance: UserWhatsappInstance) => (
                  <TableRow key={instance.id}>
                    <TableCell className="font-medium">{instance.displayName}</TableCell>
                    <TableCell>
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                        {instance.instanceName}
                      </code>
                    </TableCell>
                    <TableCell>{instance.phoneNumber || "Não configurado"}</TableCell>
                    <TableCell>{getStatusBadge(instance.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {instance.status === 'disconnected' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              toast({
                                title: "Conectando...",
                                description: "Iniciando conexão com WhatsApp. Aguarde...",
                              });
                              updateInstanceMutation.mutate({ instanceId: instance.id, status: 'connecting' });
                            }}
                          >
                            <QrCode className="w-4 h-4 mr-1" />
                            Conectar
                          </Button>
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => checkStatusMutation.mutate(instance.id)}
                          disabled={checkStatusMutation.isPending}
                        >
                          <RefreshCw className={`w-4 h-4 ${checkStatusMutation.isPending ? 'animate-spin' : ''}`} />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => regenerateQRMutation.mutate(instance.id)}
                          disabled={regenerateQRMutation.isPending}
                        >
                          <QrCode className={`w-4 h-4 ${regenerateQRMutation.isPending ? 'animate-spin' : ''}`} />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // TODO: Implementar configuração da instância
                            toast({
                              title: "Em breve",
                              description: "Configuração da instância será implementada",
                            });
                          }}
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Deletar Instância</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja deletar a instância "{instance.displayName}"?
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteInstanceMutation.mutate(instance.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Deletar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Configuração do Admin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">🔧 Configuração Global da Evolution API</h4>
              <p className="text-sm text-gray-600 mb-3">
                Como administrador, você configurou a conexão global com a Evolution API através das variáveis de ambiente:
              </p>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>EVOLUTION_API_URL configurada</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>EVOLUTION_API_KEY configurada</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>EVOLUTION_INSTANCE_NAME configurada</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-3">
                Agora cada usuário pode criar suas próprias instâncias e conectar seus WhatsApp individuais.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}