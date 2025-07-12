import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageCircle, CheckCircle, XCircle, Settings, RefreshCw, Copy } from "lucide-react";

interface WhatsAppStatus {
  connected: boolean;
  configured: boolean;
  message: string;
}

export default function WhatsAppConfig() {
  const { toast } = useToast();
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [configData, setConfigData] = useState({
    apiUrl: "",
    apiKey: "",
    instanceName: "",
  });

  const { data: whatsappStatus, isLoading: statusLoading, refetch: refetchStatus } = useQuery<WhatsAppStatus>({
    queryKey: ["/api/whatsapp/test-connection"],
    retry: false,
  });

  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("GET", "/api/whatsapp/test-connection");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: data.connected ? "Conexão bem-sucedida" : "Falha na conexão",
        description: data.message,
        variant: data.connected ? "default" : "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/test-connection"] });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Falha ao testar conexão",
        variant: "destructive",
      });
    },
  });

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    await testConnectionMutation.mutateAsync();
    setIsTestingConnection(false);
  };

  const getStatusBadge = () => {
    if (statusLoading) {
      return <Badge variant="outline">Verificando...</Badge>;
    }

    if (!whatsappStatus?.configured) {
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="w-3 h-3" />
          Não configurado
        </Badge>
      );
    }

    if (whatsappStatus.connected) {
      return (
        <Badge variant="default" className="gap-1 bg-green-500">
          <CheckCircle className="w-3 h-3" />
          Conectado
        </Badge>
      );
    }

    return (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="w-3 h-3" />
        Desconectado
      </Badge>
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "Texto copiado para a área de transferência",
    });
  };

  const getConfigurationInstructions = () => {
    return (
      <div className="space-y-4 text-sm text-gray-600">
        <div>
          <p className="font-medium mb-2">📋 Como configurar WhatsApp Evolution API:</p>
          <div className="space-y-3">
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="font-medium text-blue-800 mb-1">🔧 No Replit:</p>
              <p className="text-blue-700">1. Clique em "Tools" (🔧) no painel lateral</p>
              <p className="text-blue-700">2. Selecione "Secrets" (🔐)</p>
              <p className="text-blue-700">3. Adicione as seguintes variáveis:</p>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <code className="text-xs font-mono">EVOLUTION_API_URL</code>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => copyToClipboard("EVOLUTION_API_URL")}
                  title="Copiar nome da variável"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 ml-2">Ex: https://sua-evolution-api.com</p>
              
              <div className="flex items-center justify-between">
                <code className="text-xs font-mono">EVOLUTION_API_KEY</code>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => copyToClipboard("EVOLUTION_API_KEY")}
                  title="Copiar nome da variável"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 ml-2">Ex: sua-chave-de-api-aqui</p>
              
              <div className="flex items-center justify-between">
                <code className="text-xs font-mono">EVOLUTION_INSTANCE_NAME</code>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => copyToClipboard("EVOLUTION_INSTANCE_NAME")}
                  title="Copiar nome da variável"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 ml-2">Ex: minha-instancia</p>
            </div>
            
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="font-medium text-green-800 mb-1">✅ Após configurar:</p>
              <p className="text-green-700">• O servidor será reiniciado automaticamente</p>
              <p className="text-green-700">• Teste a conexão com o botão "Testar"</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Configuração WhatsApp
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!whatsappStatus?.configured && (
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              {getConfigurationInstructions()}
            </div>
            
            <div className="flex gap-2">
              <Dialog open={isConfigModalOpen} onOpenChange={setIsConfigModalOpen}>
                <DialogTrigger asChild>
                  <Button className="flex-1">
                    <Settings className="w-4 h-4 mr-2" />
                    Configurar API
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Configurar Evolution API</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="apiUrl">URL da API</Label>
                      <Input
                        id="apiUrl"
                        placeholder="https://sua-evolution-api.com"
                        value={configData.apiUrl}
                        onChange={(e) => setConfigData({...configData, apiUrl: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="apiKey">Chave da API</Label>
                      <Input
                        id="apiKey"
                        placeholder="sua-chave-api"
                        value={configData.apiKey}
                        onChange={(e) => setConfigData({...configData, apiKey: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="instanceName">Nome da Instância</Label>
                      <Input
                        id="instanceName"
                        placeholder="nome-da-instancia"
                        value={configData.instanceName}
                        onChange={(e) => setConfigData({...configData, instanceName: e.target.value})}
                      />
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        <strong>Nota:</strong> As configurações precisam ser definidas como variáveis de ambiente no servidor. 
                        Use as instruções acima para configurar corretamente.
                      </p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Button
                onClick={handleTestConnection}
                disabled={isTestingConnection || testConnectionMutation.isPending}
                variant="outline"
              >
                {isTestingConnection ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Testando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Testar
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {whatsappStatus?.configured && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status da Conexão:</span>
              <span className="text-sm">{whatsappStatus.message}</span>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={handleTestConnection}
                disabled={isTestingConnection || testConnectionMutation.isPending}
                variant="outline"
                className="flex-1"
              >
                {isTestingConnection ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Testando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Testar Conexão
                  </>
                )}
              </Button>
              
              <Dialog open={isConfigModalOpen} onOpenChange={setIsConfigModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Configurar Evolution API</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="apiUrl">URL da API</Label>
                      <Input
                        id="apiUrl"
                        placeholder="https://sua-evolution-api.com"
                        value={configData.apiUrl}
                        onChange={(e) => setConfigData({...configData, apiUrl: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="apiKey">Chave da API</Label>
                      <Input
                        id="apiKey"
                        placeholder="sua-chave-api"
                        value={configData.apiKey}
                        onChange={(e) => setConfigData({...configData, apiKey: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="instanceName">Nome da Instância</Label>
                      <Input
                        id="instanceName"
                        placeholder="nome-da-instancia"
                        value={configData.instanceName}
                        onChange={(e) => setConfigData({...configData, instanceName: e.target.value})}
                      />
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        <strong>Nota:</strong> As configurações precisam ser definidas como variáveis de ambiente no servidor. 
                        Use as instruções acima para configurar corretamente.
                      </p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        )}

        {whatsappStatus?.configured && whatsappStatus.connected && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              ✅ WhatsApp Evolution API está configurado e funcionando corretamente!
            </p>
            <p className="text-sm text-green-700 mt-1">
              Você pode agora enviar lembretes e notificações automáticas via WhatsApp.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}