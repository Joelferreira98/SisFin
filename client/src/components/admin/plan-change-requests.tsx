import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Check, X, Clock, User, Calendar, MessageSquare } from "lucide-react";

interface PlanChangeRequest {
  id: number;
  userId: string;
  currentPlanId: number | null;
  requestedPlanId: number;
  status: 'pending' | 'approved' | 'rejected';
  userMessage: string | null;
  adminResponse: string | null;
  requestedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
  currentPlan: {
    id: number;
    name: string;
    price: string;
  } | null;
  requestedPlan: {
    id: number;
    name: string;
    price: string;
  };
}

export default function PlanChangeRequests() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<PlanChangeRequest | null>(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: requests = [], isLoading } = useQuery<PlanChangeRequest[]>({
    queryKey: ['/api/admin/plan-change-requests'],
  });

  const approveMutation = useMutation({
    mutationFn: async (data: { id: number; adminResponse?: string }) => {
      const response = await apiRequest('POST', `/api/admin/plan-change-requests/${data.id}/approve`, {
        adminResponse: data.adminResponse
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Solicitação aprovada",
        description: "A solicitação foi aprovada e o plano do usuário foi alterado.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/plan-change-requests'] });
      setIsDialogOpen(false);
      setSelectedRequest(null);
      setAdminResponse('');
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao aprovar",
        description: error.message || "Ocorreu um erro ao aprovar a solicitação.",
        variant: "destructive",
      });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async (data: { id: number; adminResponse?: string }) => {
      const response = await apiRequest('POST', `/api/admin/plan-change-requests/${data.id}/reject`, {
        adminResponse: data.adminResponse
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Solicitação rejeitada",
        description: "A solicitação foi rejeitada.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/plan-change-requests'] });
      setIsDialogOpen(false);
      setSelectedRequest(null);
      setAdminResponse('');
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao rejeitar",
        description: error.message || "Ocorreu um erro ao rejeitar a solicitação.",
        variant: "destructive",
      });
    }
  });

  const handleApprove = (request: PlanChangeRequest) => {
    setSelectedRequest(request);
    setIsDialogOpen(true);
  };

  const handleReject = (request: PlanChangeRequest) => {
    setSelectedRequest(request);
    setIsDialogOpen(true);
  };

  const confirmApprove = () => {
    if (selectedRequest) {
      approveMutation.mutate({ 
        id: selectedRequest.id, 
        adminResponse: adminResponse || undefined 
      });
    }
  };

  const confirmReject = () => {
    if (selectedRequest) {
      rejectMutation.mutate({ 
        id: selectedRequest.id, 
        adminResponse: adminResponse || undefined 
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <Check className="h-4 w-4 text-green-500" />;
      case 'rejected': return <X className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge variant="default">Aprovado</Badge>;
      case 'rejected': return <Badge variant="destructive">Rejeitado</Badge>;
      default: return <Badge variant="secondary">Pendente</Badge>;
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const processedRequests = requests.filter(r => r.status !== 'pending');

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Solicitações de Mudança de Plano</h2>
        <p className="text-muted-foreground mb-6">
          Gerencie as solicitações de mudança de plano dos usuários
        </p>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              Solicitações Pendentes ({pendingRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4 bg-yellow-50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-gray-500" />
                      <div>
                        <div className="font-medium">
                          {request.user.firstName} {request.user.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {request.user.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-muted-foreground">
                        {new Date(request.requestedAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="text-sm font-medium">Mudança solicitada:</div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">
                        {request.currentPlan?.name || 'Sem plano'} (R$ {request.currentPlan?.price || '0'})
                      </span>
                      <span className="mx-2">→</span>
                      <span className="font-medium">
                        {request.requestedPlan.name} (R$ {request.requestedPlan.price})
                      </span>
                    </div>
                  </div>

                  {request.userMessage && (
                    <div className="mb-3">
                      <div className="text-sm font-medium flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Mensagem do usuário:
                      </div>
                      <div className="text-sm text-muted-foreground bg-white p-2 rounded border">
                        {request.userMessage}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(request)}
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Aprovar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleReject(request)}
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Rejeitar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processed Requests */}
      {processedRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Solicitações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {processedRequests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-gray-500" />
                      <div>
                        <div className="font-medium">
                          {request.user.firstName} {request.user.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {request.user.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(request.status)}
                      {getStatusBadge(request.status)}
                    </div>
                  </div>

                  <div className="mb-2">
                    <div className="text-sm">
                      <span className="text-muted-foreground">
                        {request.currentPlan?.name || 'Sem plano'}
                      </span>
                      <span className="mx-2">→</span>
                      <span className="font-medium">
                        {request.requestedPlan.name}
                      </span>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    {request.status === 'approved' ? 'Aprovado' : 'Rejeitado'} em{' '}
                    {new Date(request.reviewedAt!).toLocaleDateString('pt-BR')}
                  </div>

                  {request.adminResponse && (
                    <div className="mt-2 text-sm">
                      <strong>Resposta do Admin:</strong> {request.adminResponse}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {requests.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <div className="text-muted-foreground">
              Nenhuma solicitação de mudança de plano encontrada.
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approval/Rejection Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedRequest?.status === 'pending' ? 'Revisar Solicitação' : 'Solicitação Processada'}
            </DialogTitle>
            <DialogDescription>
              {selectedRequest && (
                <>
                  Usuário: {selectedRequest.user.firstName} {selectedRequest.user.lastName}<br />
                  Mudança: {selectedRequest.currentPlan?.name || 'Sem plano'} → {selectedRequest.requestedPlan.name}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest?.userMessage && (
            <div className="mb-4">
              <div className="font-medium text-sm mb-2">Mensagem do usuário:</div>
              <div className="text-sm text-muted-foreground bg-gray-50 p-3 rounded">
                {selectedRequest.userMessage}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Resposta do Admin (opcional):
              </label>
              <Textarea
                value={adminResponse}
                onChange={(e) => setAdminResponse(e.target.value)}
                placeholder="Digite uma resposta para o usuário..."
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={confirmApprove}
                disabled={approveMutation.isPending || rejectMutation.isPending}
              >
                <Check className="h-4 w-4 mr-1" />
                {approveMutation.isPending ? 'Aprovando...' : 'Aprovar'}
              </Button>
              <Button
                variant="destructive"
                onClick={confirmReject}
                disabled={approveMutation.isPending || rejectMutation.isPending}
              >
                <X className="h-4 w-4 mr-1" />
                {rejectMutation.isPending ? 'Rejeitando...' : 'Rejeitar'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={approveMutation.isPending || rejectMutation.isPending}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}