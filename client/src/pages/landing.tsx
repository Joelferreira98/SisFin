import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Users, FileText, MessageSquare } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-primary mr-3" />
              <h1 className="text-xl font-bold text-gray-900">FinanceManager</h1>
            </div>
            <Button onClick={() => window.location.href = '/api/login'}>
              Fazer Login
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Gestão Financeira Completa
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Controle suas contas a receber e pagar, gerencie clientes e automatize 
            lembretes via WhatsApp. Tudo em uma plataforma simples e eficiente.
          </p>
          <Button 
            size="lg" 
            onClick={() => window.location.href = '/api/login'}
            className="bg-primary hover:bg-primary/90"
          >
            Começar Agora
          </Button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
          <Card>
            <CardHeader className="text-center">
              <Users className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>Gestão de Clientes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center">
                Cadastre e gerencie seus clientes com informações completas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <TrendingUp className="h-12 w-12 text-success mx-auto mb-4" />
              <CardTitle>Contas a Receber</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center">
                Controle vendas parceladas e contas recorrentes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <FileText className="h-12 w-12 text-error mx-auto mb-4" />
              <CardTitle>Contas a Pagar</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center">
                Gerencie suas despesas e compromissos financeiros
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <MessageSquare className="h-12 w-12 text-secondary mx-auto mb-4" />
              <CardTitle>Integração WhatsApp</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center">
                Envie lembretes automáticos para seus clientes
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
