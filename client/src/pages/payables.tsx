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
import { Plus, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import type { Payable } from "@shared/schema";

export default function Payables() {
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPayable, setEditingPayable] = useState<Payable | null>(null);

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
          <Button onClick={() => setIsModalOpen(true)} className="bg-error hover:bg-error/90">
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

        {/* Payables Table */}
        <PayablesTable
          payables={payables || []}
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
