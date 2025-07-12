import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Header from "@/components/layout/header";
import Navigation from "@/components/layout/navigation";
import PayableModal from "@/components/modals/payable-modal";
import PayablesTable from "@/components/tables/payables-table";
import FinancialCard from "@/components/cards/financial-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Clock, AlertTriangle, CheckCircle, Search, Filter } from "lucide-react";
import type { Payable } from "@shared/schema";

export default function Payables() {
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPayable, setEditingPayable] = useState<Payable | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const { data: payables, isLoading } = useQuery({
    queryKey: ["/api/payables"],
    retry: false,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Payable> }) => {
      const response = await apiRequest("PUT", `/api/payables/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payables"] });
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
      await apiRequest("DELETE", `/api/payables/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payables"] });
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

  const handleEdit = (payable: Payable) => {
    setEditingPayable(payable);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir esta conta?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingPayable(null);
  };

  const filteredPayables = payables?.filter((payable: Payable & { receiver: any }) => {
    const matchesSearch = payable.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payable.receiver.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || payable.status === statusFilter;
    const matchesType = typeFilter === "all" || payable.type === typeFilter;
    
    // Filter by month
    const dueDate = new Date(payable.dueDate);
    const payableMonth = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}`;
    const matchesMonth = payableMonth === selectedMonth;
    
    return matchesSearch && matchesStatus && matchesType && matchesMonth;
  }) || [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  // Calculate summary data
  const pending = payables?.filter((p: any) => p.status === 'pending') || [];
  const overdue = payables?.filter((p: any) => p.status === 'pending' && new Date(p.dueDate) < new Date()) || [];
  const paid = payables?.filter((p: any) => p.status === 'paid') || [];

  const totalPending = pending.reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0);
  const totalOverdue = overdue.reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0);
  const totalPaid = paid.reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">
            Contas a Pagar
          </h2>
          <Button 
            onClick={() => setIsModalOpen(true)} 
            className="bg-red-600 hover:bg-red-700 text-white"
            size="default"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Conta a Pagar
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
            title="Pagas"
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
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por descrição ou fornecedor..."
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
              <div>
                <label className="block text-sm font-medium mb-1">Mês</label>
                <Input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {filteredPayables.length} de {payables?.length || 0} contas
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payables Table */}
        <PayablesTable
          payables={filteredPayables}
          isLoading={isLoading}
          onMarkAsPaid={handleMarkAsPaid}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {/* Payable Modal */}
        <PayableModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          payable={editingPayable}
        />
      </div>
    </div>
  );
}
