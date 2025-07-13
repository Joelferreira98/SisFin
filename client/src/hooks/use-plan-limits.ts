import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';

export interface PlanLimitCheck {
  canCreate: boolean;
  currentCount: number;
  maxLimit: number;
}

export function usePlanLimits() {
  const { user } = useAuth();

  const { data: clientLimit } = useQuery<PlanLimitCheck>({
    queryKey: ['/api/plan-limits/clients'],
    enabled: !!user
  });

  const { data: receivableLimit } = useQuery<PlanLimitCheck>({
    queryKey: ['/api/plan-limits/receivables'],
    enabled: !!user
  });

  const { data: payableLimit } = useQuery<PlanLimitCheck>({
    queryKey: ['/api/plan-limits/payables'],
    enabled: !!user
  });

  const { data: whatsappLimit } = useQuery<PlanLimitCheck>({
    queryKey: ['/api/plan-limits/whatsapp'],
    enabled: !!user
  });

  return {
    clientLimit,
    receivableLimit,
    payableLimit,
    whatsappLimit
  };
}

export function usePlanLimit(limitType: 'clients' | 'receivables' | 'payables' | 'whatsapp') {
  const { user } = useAuth();

  return useQuery<PlanLimitCheck>({
    queryKey: [`/api/plan-limits/${limitType}`],
    enabled: !!user
  });
}