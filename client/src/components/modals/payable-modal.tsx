import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPayableSchema, type Payable, type InsertPayable } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PayableModalProps {
  isOpen: boolean;
  onClose: () => void;
  payable?: Payable | null;
}

export default function PayableModal({ isOpen, onClose, payable }: PayableModalProps) {
  const { toast } = useToast();

  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients"],
    retry: false,
  });

  const form = useForm<InsertPayable>({
    resolver: zodResolver(insertPayableSchema),
    defaultValues: {
      receiverId: payable?.receiverId || 0,
      description: payable?.description || "",
      amount: payable?.amount || "",
      dueDate: payable?.dueDate ? formatDateForInput(payable.dueDate) : formatDateForInput(new Date()),
      status: payable?.status || "pending",
      type: payable?.type || "single",
      installmentNumber: payable?.installmentNumber || undefined,
      totalInstallments: payable?.totalInstallments || undefined,
      parentId: payable?.parentId || undefined,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertPayable) => {
      const response = await apiRequest("POST", "/api/payables", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payables"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({
        title: "Conta criada",
        description: "Conta a pagar criada com sucesso",
      });
      onClose();
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
        description: "Erro ao criar conta",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertPayable) => {
      const response = await apiRequest("PUT", `/api/payables/${payable!.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payables"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({
        title: "Conta atualizada",
        description: "Conta a pagar atualizada com sucesso",
      });
      onClose();
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

  useEffect(() => {
    if (payable) {
      form.reset({
        receiverId: payable.receiverId,
        description: payable.description || "",
        amount: payable.amount || "",
        dueDate: payable.dueDate ? formatDateForInput(payable.dueDate) : formatDateForInput(new Date()),
        status: payable.status || "pending",
        type: payable.type || "single",
        installmentNumber: payable.installmentNumber || undefined,
        totalInstallments: payable.totalInstallments || undefined,
        parentId: payable.parentId || undefined,
      });
    } else {
      form.reset({
        receiverId: 0,
        description: "",
        amount: "",
        dueDate: formatDateForInput(new Date()),
        status: "pending",
        type: "single",
        installmentNumber: undefined,
        totalInstallments: undefined,
        parentId: undefined,
      });
    }
  }, [payable, form]);

  const onSubmit = (data: InsertPayable) => {
    if (payable) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const formatDateForInput = (date: Date | string) => {
    if (!date) return '';
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toISOString().split('T')[0];
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{payable ? "Editar Conta a Pagar" : "Nova Conta a Pagar"}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="receiverId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recebedor *</FormLabel>
                  <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um recebedor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients.map((client: any) => (
                        <SelectItem key={client.id} value={client.id.toString()}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição *</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Descrição da conta a pagar" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor *</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Vencimento *</FormLabel>
                  <FormControl>
                    <Input 
                      type="date" 
                      value={formatDateForInput(field.value)} 
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="single">Conta única</SelectItem>
                      <SelectItem value="installment">Compra parcelada</SelectItem>
                      <SelectItem value="recurring">Conta recorrente</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch("type") === "installment" && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="installmentNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parcela Número</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="1" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="totalInstallments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total de Parcelas</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="12" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {createMutation.isPending || updateMutation.isPending ? "Salvando..." : (payable ? "Atualizar" : "Criar")} Conta
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
