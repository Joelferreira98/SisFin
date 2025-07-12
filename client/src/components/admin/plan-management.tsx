import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  CreditCard, 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Activity,
  DollarSign,
  Check,
  X
} from "lucide-react";

interface Plan {
  id: number;
  name: string;
  description: string;
  price: string;
  features: string[];
  maxClients: number;
  maxTransactions: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function PlanManagement() {
  const { toast } = useToast();
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const { data: plans = [], isLoading } = useQuery<Plan[]>({
    queryKey: ["/api/admin/plans"],
    retry: false,
  });

  const createPlanMutation = useMutation({
    mutationFn: async (planData: Partial<Plan>) => {
      const response = await apiRequest("POST", "/api/admin/plans", planData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plans"] });
      toast({
        title: "Plano criado",
        description: "O plano foi criado com sucesso",
      });
      setIsDialogOpen(false);
      setIsCreating(false);
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Não foi possível criar o plano",
        variant: "destructive",
      });
    },
  });

  const updatePlanMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<Plan> }) => {
      const response = await apiRequest("PATCH", `/api/admin/plans/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plans"] });
      toast({
        title: "Plano atualizado",
        description: "O plano foi atualizado com sucesso",
      });
      setIsDialogOpen(false);
      setEditingPlan(null);
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o plano",
        variant: "destructive",
      });
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/plans/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plans"] });
      toast({
        title: "Plano removido",
        description: "O plano foi removido com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Não foi possível remover o plano",
        variant: "destructive",
      });
    },
  });

  const handleCreatePlan = () => {
    setEditingPlan(null);
    setIsCreating(true);
    setIsDialogOpen(true);
  };

  const handleEditPlan = (plan: Plan) => {
    setEditingPlan(plan);
    setIsCreating(false);
    setIsDialogOpen(true);
  };

  const handleSavePlan = (event: React.FormEvent) => {
    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);
    
    const planData = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      price: formData.get("price") as string,
      features: (formData.get("features") as string).split('\n').filter(f => f.trim()),
      maxClients: parseInt(formData.get("maxClients") as string),
      maxTransactions: parseInt(formData.get("maxTransactions") as string),
      isActive: formData.get("isActive") === "on",
    };

    if (isCreating) {
      createPlanMutation.mutate(planData);
    } else if (editingPlan) {
      updatePlanMutation.mutate({ id: editingPlan.id, updates: planData });
    }
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(parseFloat(amount));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Gerenciamento de Planos
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Total de planos: {plans.length}
              </p>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={handleCreatePlan} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Novo Plano
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {isCreating ? "Criar Novo Plano" : "Editar Plano"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSavePlan} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Nome do Plano</Label>
                      <Input
                        id="name"
                        name="name"
                        defaultValue={editingPlan?.name || ""}
                        placeholder="Ex: Básico, Premium, Empresarial"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Descrição</Label>
                      <Textarea
                        id="description"
                        name="description"
                        defaultValue={editingPlan?.description || ""}
                        placeholder="Descrição do plano"
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="price">Preço (R$)</Label>
                        <Input
                          id="price"
                          name="price"
                          type="number"
                          step="0.01"
                          min="0"
                          defaultValue={editingPlan?.price || ""}
                          placeholder="0.00"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="maxClients">Máx. Clientes</Label>
                        <Input
                          id="maxClients"
                          name="maxClients"
                          type="number"
                          min="1"
                          defaultValue={editingPlan?.maxClients || 100}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="maxTransactions">Máx. Transações</Label>
                      <Input
                        id="maxTransactions"
                        name="maxTransactions"
                        type="number"
                        min="1"
                        defaultValue={editingPlan?.maxTransactions || 1000}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="features">Recursos (um por linha)</Label>
                      <Textarea
                        id="features"
                        name="features"
                        defaultValue={editingPlan?.features?.join('\n') || ""}
                        placeholder="Ex: Clientes ilimitados&#10;Relatórios avançados&#10;Suporte prioritário"
                        rows={4}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        id="isActive"
                        name="isActive"
                        type="checkbox"
                        defaultChecked={editingPlan?.isActive ?? true}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <Label htmlFor="isActive">Plano ativo</Label>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createPlanMutation.isPending || updatePlanMutation.isPending}
                      >
                        {createPlanMutation.isPending || updatePlanMutation.isPending 
                          ? "Salvando..." 
                          : "Salvar"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plano</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Limites</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{plan.name}</p>
                          <p className="text-sm text-gray-500">{plan.description}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{formatCurrency(plan.price)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Users className="h-3 w-3 text-gray-400" />
                            <span>{plan.maxClients} clientes</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <Activity className="h-3 w-3 text-gray-400" />
                            <span>{plan.maxTransactions} transações</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={plan.isActive ? "default" : "secondary"}
                          className={plan.isActive ? "bg-green-100 text-green-800" : ""}
                        >
                          {plan.isActive ? (
                            <><Check className="h-3 w-3 mr-1" /> Ativo</>
                          ) : (
                            <><X className="h-3 w-3 mr-1" /> Inativo</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditPlan(plan)}
                            className="gap-1"
                          >
                            <Edit className="h-3 w-3" />
                            Editar
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                                Remover
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remover plano</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja remover o plano "{plan.name}"? 
                                  Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deletePlanMutation.mutate(plan.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Remover
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}