import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Star, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Plan {
  id: number;
  name: string;
  description: string;
  price: string;
  features: string[];
  maxClients: number;
  maxTransactions: number;
  isActive: boolean;
}

interface UserSubscription {
  id: number;
  userId: number;
  planId: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  plan: Plan;
}

export default function PlansPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);

  const { data: plans = [], isLoading: plansLoading } = useQuery<Plan[]>({
    queryKey: ['/api/plans'],
    enabled: !!user
  });

  const { data: subscriptions = [], isLoading: subscriptionsLoading } = useQuery<UserSubscription[]>({
    queryKey: ['/api/user/subscriptions'],
    enabled: !!user
  });

  const changePlanMutation = useMutation({
    mutationFn: async (planId: number) => {
      const response = await apiRequest('POST', '/api/user/subscriptions', { planId });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Plano alterado com sucesso",
        description: "Seu plano foi alterado e já está ativo.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user/subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      setSelectedPlan(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao alterar plano",
        description: error.message || "Ocorreu um erro ao alterar o plano.",
        variant: "destructive",
      });
    }
  });

  const currentSubscription = subscriptions.find(sub => sub.isActive);
  const currentPlan = currentSubscription?.plan;

  if (plansLoading || subscriptionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando planos...</p>
        </div>
      </div>
    );
  }

  const getPlanIcon = (planName: string) => {
    if (planName.toLowerCase().includes('gratuito')) return <Star className="h-5 w-5" />;
    if (planName.toLowerCase().includes('básico')) return <Zap className="h-5 w-5" />;
    if (planName.toLowerCase().includes('premium')) return <Crown className="h-5 w-5" />;
    return <Check className="h-5 w-5" />;
  };

  const formatPrice = (price: string) => {
    const numPrice = parseFloat(price);
    return numPrice === 0 ? 'Gratuito' : `R$ ${numPrice.toFixed(2)}/mês`;
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Planos e Assinaturas</h1>
        <p className="text-muted-foreground">
          Escolha o plano que melhor se adapta às suas necessidades de gestão financeira.
        </p>
      </div>

      {currentPlan && (
        <Card className="mb-8 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Plano Atual
              </Badge>
              {getPlanIcon(currentPlan.name)}
              {currentPlan.name}
            </CardTitle>
            <CardDescription>
              Válido até {new Date(currentSubscription!.endDate).toLocaleDateString('pt-BR')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{currentPlan.maxClients}</div>
                <div className="text-sm text-muted-foreground">Clientes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{currentPlan.maxTransactions}</div>
                <div className="text-sm text-muted-foreground">Transações</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{formatPrice(currentPlan.price)}</div>
                <div className="text-sm text-muted-foreground">Preço</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`relative transition-all duration-200 ${
              currentPlan?.id === plan.id 
                ? 'ring-2 ring-blue-500 shadow-lg scale-105' 
                : 'hover:shadow-md'
            }`}
          >
            {currentPlan?.id === plan.id && (
              <Badge className="absolute -top-2 -right-2 bg-blue-500">
                Atual
              </Badge>
            )}
            
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getPlanIcon(plan.name)}
                {plan.name}
              </CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="text-3xl font-bold text-primary">
                {formatPrice(plan.price)}
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-semibold text-lg">{plan.maxClients}</div>
                    <div className="text-muted-foreground">Clientes</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-lg">{plan.maxTransactions}</div>
                    <div className="text-muted-foreground">Transações</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold">Recursos inclusos:</h4>
                  <ul className="space-y-1">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <Button 
                  className="w-full" 
                  disabled={currentPlan?.id === plan.id || changePlanMutation.isPending}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  {currentPlan?.id === plan.id ? 'Plano Atual' : 'Escolher Plano'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedPlan && (
        <Card className="mt-8 border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-800">Confirmar Mudança de Plano</CardTitle>
            <CardDescription>
              Tem certeza de que deseja alterar para o plano {plans.find(p => p.id === selectedPlan)?.name}?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button 
                onClick={() => changePlanMutation.mutate(selectedPlan)}
                disabled={changePlanMutation.isPending}
              >
                {changePlanMutation.isPending ? 'Alterando...' : 'Confirmar Mudança'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setSelectedPlan(null)}
                disabled={changePlanMutation.isPending}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}