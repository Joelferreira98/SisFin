import { useAuth } from "@/hooks/useAuth";
import { useSystemSettings } from "@/hooks/use-system-settings";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Bell, 
  ChevronDown,
  LogOut
} from "lucide-react";

export default function Header() {
  const { user, logoutMutation } = useAuth();
  const { settings } = useSystemSettings();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              {settings.systemLogo ? (
                <img 
                  src={settings.systemLogo} 
                  alt="Logo" 
                  className="h-6 w-6 mr-3" 
                />
              ) : (
                <TrendingUp className="h-6 w-6 text-primary mr-3" />
              )}
              <h1 className="text-xl font-bold text-gray-900">{settings.systemName}</h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <div className="relative">
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4" />
                <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center text-xs bg-error">
                  3
                </Badge>
              </Button>
            </div>
            
            {/* User Menu */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {user?.firstName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-900">
                  {user?.firstName || user?.email || 'Usuário'}
                </p>
                <p className="text-xs text-gray-500">
                  {user?.email}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
