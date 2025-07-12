import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertReceivableSchema, type Receivable, type InsertReceivable } from "@shared/schema";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Calendar, DollarSign } from "lucide-react";

interface ReceivableModalProps {
  isOpen: boolean;
  onClose: () => void;
  receivable?: Receivable | null;
}

export default function ReceivableModal({ isOpen, onClose, receivable }: ReceivableModalProps) {
  const { toast } = useToast();
  const [isGeneratingInstallments, setIsGeneratingInstallments] = useState(false);

  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients"],
    retry: false,
  });

  const form = useForm<InsertReceivable>({
    resolver: zodResolver(insertReceivableSchema.refine(
      (data) => {
        // Validação para parcelas
        if (data.type === "installment") {
          return data.installmentNumber && data.totalInstallments && 
                 data.installmentNumber > 0 && data.totalInstallments > 0 &&
                 data.installmentNumber <= data.totalInstallments;
        }
        return true;
      },
      {
        message: "Para parcelamento, informe número da parcela e total de parcelas válidos",
        path: ["installmentNumber"]
      }
    )),
    defaultValues: {
      clientId: 0,
      description: "",
      amount: "",
      dueDate: new Date(),
      status: "pending",
      type: "single",
      installmentNumber: undefined,
      totalInstallments: undefined,
      parentId: undefined,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertReceivable) => {
      const response = await apiRequest("POST", "/api/receivables", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/receivables"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({
        title: "Conta criada",
        description: "Conta a receber criada com sucesso",
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
    mutationFn: async (data: InsertReceivable) => {
      const response = await apiRequest("PUT", `/api/receivables/${receivable!.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/receivables"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({
        title: "Conta atualizada",
        description: "Conta a receber atualizada com sucesso",
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
    if (receivable) {
      form.reset({
        clientId: receivable.clientId,
        description: receivable.description || "",
        amount: receivable.amount || "",
        dueDate: receivable.dueDate ? new Date(receivable.dueDate) : new Date(),
        status: receivable.status || "pending",
        type: receivable.type || "single",
        installmentNumber: receivable.installmentNumber || undefined,
        totalInstallments: receivable.totalInstallments || undefined,
        parentId: receivable.parentId || undefined,
      });
    } else {
      form.reset({
        clientId: 0,
        description: "",
        amount: "",
        dueDate: new Date(),
        status: "pending",
        type: "single",
        installmentNumber: undefined,
        totalInstallments: undefined,
        parentId: undefined,
      });
    }
  }, [receivable, form]);

  const onSubmit = (data: InsertReceivable) => {
    if (receivable) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const generateInstallments = async () => {
    const formData = form.getValues();
    
    // Validações
    if (!formData.clientId || formData.clientId === 0) {
      toast({
        title: "Erro",
        description: "Selecione um cliente",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast({
        title: "Erro",
        description: "Informe um valor válido",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.totalInstallments || formData.totalInstallments <= 0) {
      toast({
        title: "Erro",
        description: "Informe o número total de parcelas",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.description) {
      toast({
        title: "Erro",
        description: "Informe a descrição",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingInstallments(true);
    
    try {
      const totalAmount = parseFloat(formData.amount);
      const installmentAmount = totalAmount / formData.totalInstallments;
      const baseDate = new Date(formData.dueDate);
      
      // Gerar todas as parcelas
      const installments = [];
      for (let i = 1; i <= formData.totalInstallments; i++) {
        const dueDate = new Date(baseDate);
        dueDate.setMonth(dueDate.getMonth() + (i - 1));
        
        const installmentData = {
          clientId: formData.clientId,
          description: `${formData.description} - Parcela ${i}/${formData.totalInstallments}`,
          amount: installmentAmount.toFixed(2),
          dueDate: dueDate,
          status: "pending" as const,
          type: "installment" as const,
          installmentNumber: i,
          totalInstallments: formData.totalInstallments,
        };
        
        installments.push(installmentData);
      }
      
      // Criar todas as parcelas
      const promises = installments.map(installment => 
        apiRequest("POST", "/api/receivables", installment)
      );
      
      await Promise.all(promises);
      
      queryClient.invalidateQueries({ queryKey: ["/api/receivables"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      
      toast({
        title: "Parcelas criadas",
        description: `${formData.totalInstallments} parcelas foram criadas com sucesso`,
      });
      
      onClose();
    } catch (error) {
      if (isUnauthorizedError(error as Error)) {
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
        description: "Erro ao gerar parcelas",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingInstallments(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{receivable ? "Editar Conta a Receber" : "Nova Conta a Receber"}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente *</FormLabel>
                  <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um cliente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients.length === 0 ? (
                        <SelectItem value="0" disabled>
                          Nenhum cliente encontrado
                        </SelectItem>
                      ) : (
                        clients.map((client: any) => (
                          <SelectItem key={client.id} value={client.id.toString()}>
                            {client.name}
                          </SelectItem>
                        ))
                      )}
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
                    <Textarea placeholder="Descrição da conta a receber" {...field} />
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
                    <Input 
                      type="number" 
                      step="0.01" 
                      min="0" 
                      placeholder="0.00" 
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value);
                      }}
                    />
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
                      onChange={(e) => field.onChange(new Date(e.target.value))}
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
                      <SelectItem value="installment">Venda parcelada</SelectItem>
                      <SelectItem value="recurring">Conta recorrente</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch("type") === "installment" && (
              <div className="space-y-4">
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

                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Gerador de Parcelas
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Gera automaticamente todas as parcelas com vencimentos mensais
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <DollarSign className="w-4 h-4" />
                        <span>Valor por parcela: R$ {form.watch("amount") && form.watch("totalInstallments") ? 
                          (parseFloat(form.watch("amount")) / form.watch("totalInstallments")!).toFixed(2) : "0.00"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>Vencimento: {form.watch("totalInstallments") ? 
                          `${form.watch("totalInstallments")} parcelas mensais` : "Não definido"}</span>
                      </div>
                    </div>
                    <Button 
                      type="button" 
                      variant="outline"
                      size="sm"
                      className="w-full mt-3"
                      onClick={generateInstallments}
                      disabled={isGeneratingInstallments || !form.watch("amount") || !form.watch("totalInstallments")}
                    >
                      {isGeneratingInstallments ? "Gerando..." : "Gerar Todas as Parcelas"}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-success hover:bg-success/90"
              >
                {receivable ? "Atualizar" : "Criar"} Conta
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
