import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  Users, 
  TrendingDown, 
  TrendingUp, 
  BarChart3, 
  MessageSquare,
  Settings,
  CreditCard,
  Bell
} from "lucide-react";

export default function Navigation() {
  const [location, navigate] = useLocation();

  const navItems = [
    { name: "Dashboard", path: "/", icon: Home },
    { name: "Clientes", path: "/clients", icon: Users },
    { name: "Contas a Receber", path: "/receivables", icon: TrendingDown },
    { name: "Contas a Pagar", path: "/payables", icon: TrendingUp },
    { name: "Confirmações", path: "/confirmations", icon: CreditCard },
    { name: "Lembretes", path: "/payment-reminders", icon: Bell },
    { name: "Relatórios", path: "/reports", icon: BarChart3 },
    { name: "WhatsApp", path: "/whatsapp", icon: MessageSquare },
    { name: "Admin", path: "/admin", icon: Settings },
  ];

  const isActive = (path: string) => {
    if (path === "/") {
      return location === "/";
    }
    return location.startsWith(path);
  };

  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.name}
                variant="ghost"
                className={`
                  whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm
                  ${isActive(item.path)
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }
                `}
                onClick={() => navigate(item.path)}
              >
                <Icon className="h-4 w-4 mr-2" />
                {item.name}
              </Button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
