import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface SystemSettings {
  systemName: string;
  systemLogo: string;
  systemFavicon: string;
  systemDescription: string;
}

export function useSystemSettings() {
  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/admin/settings"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/settings");
      return response.json();
    },
    retry: false,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  const systemSettings: SystemSettings = {
    systemName: settings?.find((s: any) => s.key === 'system_name')?.value || 'FinanceManager',
    systemLogo: settings?.find((s: any) => s.key === 'system_logo')?.value || '',
    systemFavicon: settings?.find((s: any) => s.key === 'system_favicon')?.value || '',
    systemDescription: settings?.find((s: any) => s.key === 'system_description')?.value || 'Sistema de gestão financeira',
  };

  return {
    settings: systemSettings,
    isLoading,
  };
}