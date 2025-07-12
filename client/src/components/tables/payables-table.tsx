import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, Edit, Trash2, Plus } from "lucide-react";
import type { Payable, Client } from "@shared/schema";

interface PayablesTableProps {
  payables: (Payable & { receiver: Client })[];
  isLoading: boolean;
  onMarkAsPaid: (id: number) => void;
  onEdit: (payable: Payable) => void;
  onDelete: (id: number) => void;
}

export default function PayablesTable({ 
  payables, 
  isLoading, 
  onMarkAsPaid, 
  onEdit, 
  onDelete 
}: PayablesTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
                <Skeleton className="h-8 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (payables.length === 0) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="text-center">
            <Plus className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma conta encontrada</h3>
            <p className="text-gray-500">Comece adicionando sua primeira conta a pagar</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (amount: string) => {
    const numAmount = parseFloat(amount);
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numAmount);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: string, dueDate: Date | string) => {
    const isOverdue = new Date(dueDate) < new Date() && status === 'pending';
    
    if (status === 'paid') {
      return (
        <Badge className="bg-success text-white">
          <Check className="h-3 w-3 mr-1" />
          Pago
        </Badge>
      );
    }
    
    if (isOverdue) {
      return (
        <Badge className="bg-error text-white">
          Vencida
        </Badge>
      );
    }
    
    return (
      <Badge className="bg-warning text-white">
        Pendente
      </Badge>
    );
  };

  const getClientInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'single':
        return 'Conta única';
      case 'installment':
        return 'Compra parcelada';
      case 'recurring':
        return 'Conta recorrente';
      default:
        return type;
    }
  };

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recebedor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descrição
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vencimento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payables.map((payable) => (
                <tr key={payable.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {getClientInitials(payable.receiver.name)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {payable.receiver.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {payable.receiver.whatsapp}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{payable.description}</div>
                    <div className="text-sm text-gray-500">
                      {getTypeLabel(payable.type)}
                      {payable.installmentNumber && payable.totalInstallments && (
                        <span> - {payable.installmentNumber}/{payable.totalInstallments}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(payable.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(payable.dueDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(payable.status, payable.dueDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {payable.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onMarkAsPaid(payable.id)}
                          className="text-success hover:text-success/80"
                          title="Marcar como pago"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(payable)}
                        className="text-gray-600 hover:text-gray-800"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(payable.id)}
                        className="text-error hover:text-error/80"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
