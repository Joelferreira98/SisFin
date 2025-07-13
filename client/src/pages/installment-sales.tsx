import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  Eye, 
  Check, 
  X, 
  Copy, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  CreditCard,
  Calendar,
  User,
  FileText,
  Link as LinkIcon,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { InstallmentSale, Client } from "@shared/schema";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/layout/header";
import Navigation from "@/components/layout/navigation";

interface InstallmentSaleWithClient extends InstallmentSale {
  client: Client;
}

export default function InstallmentSales() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [selectedSale, setSelectedSale] = useState<InstallmentSaleWithClient | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState("");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Não autorizado",
        description: "Você precisa estar logado para acessar esta página",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/auth";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: sales, isLoading: salesLoading } = useQuery({
    queryKey: ["/api/installment-sales"],
    enabled: isAuthenticated,
  });



  const approveSaleMutation = useMutation({
    mutationFn: async ({ id, approved, notes }: { id: number; approved: boolean; notes: string }) => {
      const response = await fetch(`/api/installment-sales/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved, notes }),
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/installment-sales"] });
      toast({
        title: "Sucesso",
        description: "Status da venda atualizado com sucesso",
      });
      setIsApproveModalOpen(false);
      setApprovalNotes("");
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Não autorizado",
          description: "Você foi desconectado. Redirecionando...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/auth";
        }, 500);
        return;
      }
      toast({
        title: "Erro",
        description: "Falha ao atualizar status da venda",
        variant: "destructive",
      });
    },
  });



  const copyConfirmationLink = (token: string) => {
    const link = `${window.location.origin}/confirm-sale/${token}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Sucesso",
      description: "Link copiado para a área de transferência",
    });
  };

  const resendConfirmationLink = useMutation({
    mutationFn: async (saleId: number) => {
      const response = await apiRequest('POST', `/api/installment-sales/${saleId}/regenerate-token`);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Link reenviado!",
        description: "Um novo link de confirmação foi gerado e enviado ao cliente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/installment-sales"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao reenviar link",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      case "confirmed":
        return <Badge variant="outline"><AlertCircle className="w-3 h-3 mr-1" />Confirmado</Badge>;
      case "approved":
        return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Aprovado</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejeitado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading || salesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const pendingSales = sales?.filter((sale: InstallmentSaleWithClient) => sale.status === "pending") || [];
  const confirmedSales = sales?.filter((sale: InstallmentSaleWithClient) => sale.status === "confirmed") || [];
  const approvedSales = sales?.filter((sale: InstallmentSaleWithClient) => sale.status === "approved") || [];
  const rejectedSales = sales?.filter((sale: InstallmentSaleWithClient) => sale.status === "rejected") || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Confirmações de Vendas</h1>
            <p className="text-gray-600">Gerencie confirmações e aprovações de vendas parceladas</p>
          </div>
        </div>

      <Tabs defaultValue="confirmed" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending">Pendentes ({pendingSales.length})</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmadas ({confirmedSales.length})</TabsTrigger>
          <TabsTrigger value="approved">Aprovadas ({approvedSales.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejeitadas ({rejectedSales.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vendas Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Parcelas</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingSales.map((sale: InstallmentSaleWithClient) => (
                    <TableRow key={sale.id}>
                      <TableCell>{sale.client.name}</TableCell>
                      <TableCell>{sale.description}</TableCell>
                      <TableCell>R$ {sale.totalAmount}</TableCell>
                      <TableCell>{sale.installmentCount}x de R$ {sale.installmentValue}</TableCell>
                      <TableCell>{getStatusBadge(sale.status)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyConfirmationLink(sale.confirmationToken)}
                          >
                            <Copy className="w-4 h-4 mr-1" />
                            Copiar Link
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedSale(sale);
                              setIsViewModalOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="confirmed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vendas Confirmadas (Aguardando Aprovação)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Confirmado em</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {confirmedSales.map((sale: InstallmentSaleWithClient) => (
                    <TableRow key={sale.id}>
                      <TableCell>{sale.client.name}</TableCell>
                      <TableCell>{sale.description}</TableCell>
                      <TableCell>R$ {sale.totalAmount}</TableCell>
                      <TableCell>
                        {sale.clientSignedAt ? format(new Date(sale.clientSignedAt), "dd/MM/yyyy HH:mm") : "-"}
                      </TableCell>
                      <TableCell>{getStatusBadge(sale.status)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedSale(sale);
                              setIsViewModalOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedSale(sale);
                              setIsApproveModalOpen(true);
                            }}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Revisar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vendas Aprovadas</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Aprovado em</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvedSales.map((sale: InstallmentSaleWithClient) => (
                    <TableRow key={sale.id}>
                      <TableCell>{sale.client.name}</TableCell>
                      <TableCell>{sale.description}</TableCell>
                      <TableCell>R$ {sale.totalAmount}</TableCell>
                      <TableCell>
                        {sale.userApprovedAt ? format(new Date(sale.userApprovedAt), "dd/MM/yyyy HH:mm") : "-"}
                      </TableCell>
                      <TableCell>{getStatusBadge(sale.status)}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedSale(sale);
                            setIsViewModalOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vendas Rejeitadas</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Rejeitado em</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rejectedSales.map((sale: InstallmentSaleWithClient) => (
                    <TableRow key={sale.id}>
                      <TableCell>{sale.client.name}</TableCell>
                      <TableCell>{sale.description}</TableCell>
                      <TableCell>R$ {sale.totalAmount}</TableCell>
                      <TableCell>
                        {sale.userReviewedAt ? format(new Date(sale.userReviewedAt), "dd/MM/yyyy HH:mm") : "-"}
                      </TableCell>
                      <TableCell>{getStatusBadge(sale.status)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedSale(sale);
                              setIsViewModalOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => resendConfirmationLink.mutate(sale.id)}
                            disabled={resendConfirmationLink.isPending}
                          >
                            <RefreshCw className="w-4 h-4 mr-1" />
                            Reenviar Link
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Sale Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Venda</DialogTitle>
          </DialogHeader>
          {selectedSale && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Informações do Cliente</h4>
                  <p><strong>Nome:</strong> {selectedSale.client.name}</p>
                  <p><strong>WhatsApp:</strong> {selectedSale.client.whatsapp}</p>
                  <p><strong>Email:</strong> {selectedSale.client.email}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Informações da Venda</h4>
                  <p><strong>Descrição:</strong> {selectedSale.description}</p>
                  <p><strong>Valor Total:</strong> R$ {selectedSale.totalAmount}</p>
                  <p><strong>Parcelas:</strong> {selectedSale.installmentCount}x de R$ {selectedSale.installmentValue}</p>
                  <p><strong>Primeiro Vencimento:</strong> {format(new Date(selectedSale.firstDueDate), "dd/MM/yyyy")}</p>
                  <p><strong>Status:</strong> {getStatusBadge(selectedSale.status)}</p>
                </div>
              </div>
              
              {selectedSale.status === "pending" && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">Link de Confirmação</h4>
                  <div className="flex items-center space-x-2">
                    <Input
                      value={`${window.location.origin}/confirm-sale/${selectedSale.confirmationToken}`}
                      readOnly
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      onClick={() => copyConfirmationLink(selectedSale.confirmationToken)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
              
              {selectedSale.documentPhotoUrl && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">Foto do Documento</h4>
                  <img 
                    src={selectedSale.documentPhotoUrl} 
                    alt="Documento assinado" 
                    className="max-w-full h-auto rounded-lg border"
                  />
                </div>
              )}
              
              {selectedSale.notes && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">Observações</h4>
                  <p className="text-sm text-gray-600">{selectedSale.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Sale Modal */}
      <Dialog open={isApproveModalOpen} onOpenChange={setIsApproveModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revisar Venda</DialogTitle>
          </DialogHeader>
          {selectedSale && (
            <div className="space-y-4">
              <div className="text-sm">
                <p><strong>Cliente:</strong> {selectedSale.client.name}</p>
                <p><strong>Descrição:</strong> {selectedSale.description}</p>
                <p><strong>Valor Total:</strong> R$ {selectedSale.totalAmount}</p>
              </div>
              
              {selectedSale.documentPhotoUrl && (
                <div>
                  <h4 className="font-semibold mb-2">Foto do Documento</h4>
                  <img 
                    src={selectedSale.documentPhotoUrl} 
                    alt="Documento assinado" 
                    className="max-w-full h-auto rounded-lg border"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium mb-2">Observações</label>
                <Textarea
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="Adicione observações sobre a aprovação/rejeição..."
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsApproveModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    approveSaleMutation.mutate({
                      id: selectedSale.id,
                      approved: false,
                      notes: approvalNotes
                    });
                  }}
                  disabled={approveSaleMutation.isPending}
                >
                  <X className="w-4 h-4 mr-1" />
                  Rejeitar
                </Button>
                <Button
                  onClick={() => {
                    approveSaleMutation.mutate({
                      id: selectedSale.id,
                      approved: true,
                      notes: approvalNotes
                    });
                  }}
                  disabled={approveSaleMutation.isPending}
                >
                  <Check className="w-4 h-4 mr-1" />
                  Aprovar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}