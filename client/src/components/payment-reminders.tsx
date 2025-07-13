import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { 
  Clock, 
  Edit, 
  Trash2, 
  Plus, 
  MessageSquare, 
  Calendar,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Bell,
  PlayCircle,
  PauseCircle,
  History,
  Loader2,
  TestTube
} from "lucide-react";
import { PaymentReminder, ReminderLog } from "@shared/schema";

const reminderSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  messageTemplate: z.string().min(10, "Mensagem deve ter pelo menos 10 caracteres"),
  triggerType: z.enum(["on_due", "before_due", "after_due"]),
  triggerDays: z.number().min(0).max(30),
  triggerTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato deve ser HH:MM"),
  isActive: z.boolean(),
});

type ReminderFormData = z.infer<typeof reminderSchema>;

export default function PaymentReminders() {
  const { toast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<PaymentReminder | null>(null);

  const form = useForm<ReminderFormData>({
    resolver: zodResolver(reminderSchema),
    defaultValues: {
      name: "",
      messageTemplate: "Olá {cliente}, sua conta de {valor} vence em {vencimento}. Por favor, regularize sua situação para evitar cobranças adicionais.",
      triggerType: "on_due",
      triggerDays: 0,
      triggerTime: "09:00",
      isActive: true,
    },
  });

  const { data: reminders, isLoading: remindersLoading } = useQuery<PaymentReminder[]>({
    queryKey: ["/api/payment-reminders"],
  });

  const { data: logs, isLoading: logsLoading } = useQuery<(ReminderLog & { reminder: PaymentReminder, receivable: any, client: any })[]>({
    queryKey: ["/api/reminder-logs"],
  });

  const createReminder = useMutation({
    mutationFn: async (data: ReminderFormData) => {
      await apiRequest("POST", "/api/payment-reminders", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-reminders"] });
      setIsCreateModalOpen(false);
      form.reset();
      toast({
        title: "Lembrete criado",
        description: "O lembrete de pagamento foi criado com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar lembrete",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateReminder = useMutation({
    mutationFn: async (data: ReminderFormData) => {
      if (!selectedReminder) return;
      await apiRequest("PUT", `/api/payment-reminders/${selectedReminder.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-reminders"] });
      setIsEditModalOpen(false);
      setSelectedReminder(null);
      form.reset();
      toast({
        title: "Lembrete atualizado",
        description: "O lembrete de pagamento foi atualizado com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar lembrete",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteReminder = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/payment-reminders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-reminders"] });
      toast({
        title: "Lembrete excluído",
        description: "O lembrete de pagamento foi excluído com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir lembrete",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const testReminders = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/payment-reminders/test");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminder-logs"] });
      toast({
        title: "Lembretes processados",
        description: "Os lembretes foram processados com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao processar lembretes",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEditClick = (reminder: PaymentReminder) => {
    setSelectedReminder(reminder);
    form.reset({
      name: reminder.name,
      messageTemplate: reminder.messageTemplate,
      triggerType: reminder.triggerType as "on_due" | "before_due" | "after_due",
      triggerDays: reminder.triggerDays || 0,
      triggerTime: reminder.triggerTime,
      isActive: reminder.isActive,
    });
    setIsEditModalOpen(true);
  };

  const onSubmit = (data: ReminderFormData) => {
    if (selectedReminder) {
      updateReminder.mutate(data);
    } else {
      createReminder.mutate(data);
    }
  };

  const getTriggerTypeLabel = (type: string) => {
    switch (type) {
      case "on_due":
        return "No vencimento";
      case "before_due":
        return "Antes do vencimento";
      case "after_due":
        return "Após o vencimento";
      default:
        return type;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const templateVariables = [
    { variable: "{cliente}", description: "Nome do cliente" },
    { variable: "{valor}", description: "Valor da conta" },
    { variable: "{vencimento}", description: "Data de vencimento" },
    { variable: "{descricao}", description: "Descrição da conta" },
    { variable: "{dias_atraso}", description: "Dias de atraso (apenas para contas vencidas)" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Lembretes de Pagamento</h2>
          <p className="text-gray-600">Configure lembretes automáticos para suas contas a receber</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Novo Lembrete
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Criar Novo Lembrete</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Lembrete</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Lembrete de Vencimento" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Ativo</FormLabel>
                            <FormDescription>Lembrete está ativo</FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="triggerType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quando Enviar</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione quando enviar" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="before_due">Antes do vencimento</SelectItem>
                              <SelectItem value="on_due">No vencimento</SelectItem>
                              <SelectItem value="after_due">Após o vencimento</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="triggerDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dias</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              max="30" 
                              placeholder="0" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormDescription>
                            Quantos dias antes/depois
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="triggerTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Horário</FormLabel>
                          <FormControl>
                            <Input 
                              type="time" 
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Hora do envio
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="messageTemplate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mensagem do Lembrete</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Olá {cliente}, sua conta de {valor} vence em {vencimento}..."
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Use as variáveis disponíveis para personalizar a mensagem
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">Variáveis Disponíveis:</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {templateVariables.map((variable) => (
                        <div key={variable.variable} className="flex items-center gap-2">
                          <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                            {variable.variable}
                          </code>
                          <span className="text-gray-600">{variable.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={createReminder.isPending}>
                      {createReminder.isPending ? "Criando..." : "Criar"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          <Button 
            variant="outline" 
            onClick={() => testReminders.mutate()}
            disabled={testReminders.isPending}
          >
            {testReminders.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <TestTube className="mr-2 h-4 w-4" />
                Testar Lembretes
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="reminders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="reminders" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Lembretes
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reminders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Lembretes Configurados
              </CardTitle>
            </CardHeader>
            <CardContent>
              {remindersLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : !reminders || reminders.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum lembrete configurado</p>
                  <p className="text-sm text-gray-400">Crie um lembrete para começar</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Quando Enviar</TableHead>
                      <TableHead>Horário</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reminders.map((reminder: PaymentReminder) => (
                      <TableRow key={reminder.id}>
                        <TableCell className="font-medium">{reminder.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getTriggerTypeLabel(reminder.triggerType)}
                            {reminder.triggerDays > 0 && ` (${reminder.triggerDays} dias)`}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            {reminder.triggerTime}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={reminder.isActive ? "default" : "secondary"}>
                            {reminder.isActive ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditClick(reminder)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteReminder.mutate(reminder.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Histórico de Lembretes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : !logs || logs.length === 0 ? (
                <div className="text-center py-8">
                  <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum lembrete enviado ainda</p>
                  <p className="text-sm text-gray-400">Os lembretes enviados aparecerão aqui</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lembrete</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Data de Envio</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log: ReminderLog & { reminder: PaymentReminder, client: any, receivable: any }) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">{log.reminder.name}</TableCell>
                        <TableCell>{log.client.name}</TableCell>
                        <TableCell>
                          {log.receivable.amount.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          })}
                        </TableCell>
                        <TableCell>
                          {new Date(log.sentAt).toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(log.status)}
                            <span className="capitalize">{log.status}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              toast({
                                title: "Mensagem enviada",
                                description: log.message,
                              });
                            }}
                          >
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Lembrete</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Lembrete</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Lembrete de Vencimento" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Ativo</FormLabel>
                        <FormDescription>Lembrete está ativo</FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="triggerType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quando Enviar</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione quando enviar" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="before_due">Antes do vencimento</SelectItem>
                          <SelectItem value="on_due">No vencimento</SelectItem>
                          <SelectItem value="after_due">Após o vencimento</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="triggerDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dias</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          max="30" 
                          placeholder="0" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        Quantos dias antes/depois
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="triggerTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horário</FormLabel>
                      <FormControl>
                        <Input 
                          type="time" 
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Hora do envio
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="messageTemplate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mensagem do Lembrete</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Olá {cliente}, sua conta de {valor} vence em {vencimento}..."
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Use as variáveis disponíveis para personalizar a mensagem
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={updateReminder.isPending}>
                  {updateReminder.isPending ? "Atualizando..." : "Atualizar"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}