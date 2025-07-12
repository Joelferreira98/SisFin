import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Header from "@/components/layout/header";
import Navigation from "@/components/layout/navigation";
import ReceivableModal from "@/components/modals/receivable-modal";
import ReceivablesTable from "@/components/tables/receivables-table";
import FinancialCard from "@/components/cards/financial-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Clock, AlertTriangle, CheckCircle, Search, Filter } from "lucide-react";
import type { Receivable, Client } from "@shared/schema";

export default function Receivables() {
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReceivable, setEditingReceivable] = useState<Receivable | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const { data: receivables, isLoading } = useQuery({
    queryKey: ["/api/receivables"],
    retry: false,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Receivable> }) => {
      const response = await apiRequest("PUT", `/api/receivables/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/receivables"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({
        title: "Conta atualizada",
        description: "Conta atualizada com sucesso",
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
        description: "Erro ao atualizar conta",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/receivables/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/receivables"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({
        title: "Conta excluída",
        description: "Conta excluída com sucesso",
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
        description: "Erro ao excluir conta",
        variant: "destructive",
      });
    },
  });

  const handleMarkAsPaid = (id: number) => {
    updateMutation.mutate({ id, data: { status: "paid" } });
  };

  const handleEdit = (receivable: Receivable) => {
    setEditingReceivable(receivable);
    setIsModalOpen(true);
  };

  const filteredReceivables = receivables?.filter((receivable: Receivable & { client: Client }) => {
    const matchesSearch = receivable.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         receivable.client.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || receivable.status === statusFilter;
    const matchesType = typeFilter === "all" || receivable.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  }) || [];



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'paid': return 'Pago';
      case 'overdue': return 'Vencido';
      default: return status;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'single': return 'Única';
      case 'installment': return 'Parcela';
      case 'recurring': return 'Recorrente';
      default: return type;
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir esta conta?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingReceivable(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  // Calculate summary data
  const pending = receivables?.filter((r: any) => r.status === 'pending') || [];
  const overdue = receivables?.filter((r: any) => r.status === 'pending' && new Date(r.dueDate) < new Date()) || [];
  const paid = receivables?.filter((r: any) => r.status === 'paid') || [];

  const totalPending = pending.reduce((sum: number, r: any) => sum + parseFloat(r.amount), 0);
  const totalOverdue = overdue.reduce((sum: number, r: any) => sum + parseFloat(r.amount), 0);
  const totalPaid = paid.reduce((sum: number, r: any) => sum + parseFloat(r.amount), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">
            Contas a Receber
          </h2>
          <Button 
            onClick={() => setIsModalOpen(true)} 
            className="bg-green-600 hover:bg-green-700 text-white"
            size="default"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Conta a Receber
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <FinancialCard
            title="Pendentes"
            amount={formatCurrency(totalPending)}
            icon={<Clock className="h-6 w-6 text-warning" />}
            color="warning"
          />
          <FinancialCard
            title="Vencidas"
            amount={formatCurrency(totalOverdue)}
            icon={<AlertTriangle className="h-6 w-6 text-error" />}
            color="error"
          />
          <FinancialCard
            title="Recebidas"
            amount={formatCurrency(totalPaid)}
            icon={<CheckCircle className="h-6 w-6 text-success" />}
            color="success"
          />
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por descrição ou cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="paid">Pagos</SelectItem>
                  <SelectItem value="overdue">Vencidos</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Tipos</SelectItem>
                  <SelectItem value="single">Conta Única</SelectItem>
                  <SelectItem value="installment">Parcela</SelectItem>
                  <SelectItem value="recurring">Recorrente</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {filteredReceivables.length} de {receivables?.length || 0} contas
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Receivables Table */}
        <ReceivablesTable
          receivables={filteredReceivables}
          isLoading={isLoading}
          onMarkAsPaid={handleMarkAsPaid}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {/* Receivable Modal */}
        <ReceivableModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          receivable={editingReceivable}
        />
      </div>
    </div>
  );
}
