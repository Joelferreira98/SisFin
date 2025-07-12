import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, CheckCircle, XCircle, Settings, RefreshCw } from "lucide-react";

interface WhatsAppStatus {
  connected: boolean;
  configured: boolean;
  message: string;
}

export default function WhatsAppConfig() {
  const { toast } = useToast();
  const [isTestingConnection, setIsTestingConnection] = useState(false);

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

  const getConfigurationInstructions = () => {
    return (
      <div className="space-y-2 text-sm text-gray-600">
        <p><strong>Para configurar o WhatsApp Evolution API:</strong></p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Configure as seguintes variáveis de ambiente:</li>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li><code>EVOLUTION_API_URL</code> - URL da sua instância Evolution API</li>
            <li><code>EVOLUTION_API_KEY</code> - Chave de API da Evolution API</li>
            <li><code>EVOLUTION_INSTANCE_NAME</code> - Nome da instância WhatsApp</li>
          </ul>
          <li>Reinicie o servidor após configurar as variáveis</li>
          <li>Teste a conexão para verificar se está funcionando</li>
        </ol>
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
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            {getConfigurationInstructions()}
          </div>
        )}

        {whatsappStatus?.configured && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status da Conexão:</span>
              <span className="text-sm">{whatsappStatus.message}</span>
            </div>
            
            <Button
              onClick={handleTestConnection}
              disabled={isTestingConnection || testConnectionMutation.isPending}
              variant="outline"
              className="w-full"
            >
              {isTestingConnection ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Testando...
                </>
              ) : (
                <>
                  <Settings className="w-4 h-4 mr-2" />
                  Testar Conexão
                </>
              )}
            </Button>
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