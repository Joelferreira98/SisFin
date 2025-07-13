import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Edit, Plus, Settings, Globe, AlertCircle, Palette, Upload } from "lucide-react";
import { SystemSetting } from "@shared/schema";
import { LogoUploader } from "@/components/logo-uploader";

export default function SystemSettings() {
  const { toast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState<SystemSetting | null>(null);
  const [formData, setFormData] = useState({
    key: "",
    value: "",
    description: "",
  });
  const [brandingData, setBrandingData] = useState({
    systemName: "",
    systemLogo: "",
    systemFavicon: "",
    systemDescription: "",
  });

  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/admin/settings"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/settings");
      return response.json();
    },
  });

  // Load branding data from settings
  useEffect(() => {
    if (settings) {
      const systemName = settings.find((s: SystemSetting) => s.key === 'system_name')?.value || '';
      const systemLogo = settings.find((s: SystemSetting) => s.key === 'system_logo')?.value || '';
      const systemFavicon = settings.find((s: SystemSetting) => s.key === 'system_favicon')?.value || '';
      const systemDescription = settings.find((s: SystemSetting) => s.key === 'system_description')?.value || '';
      
      setBrandingData({
        systemName,
        systemLogo,
        systemFavicon,
        systemDescription,
      });
    }
  }, [settings]);

  const createSetting = useMutation({
    mutationFn: async (data: { key: string; value: string; description?: string }) => {
      const response = await apiRequest("POST", "/api/admin/settings", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({
        title: "Configuração criada",
        description: "A configuração foi criada com sucesso",
      });
      setIsCreateModalOpen(false);
      setFormData({ key: "", value: "", description: "" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar configuração",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateSetting = useMutation({
    mutationFn: async (data: { key: string; value: string; description?: string }) => {
      const response = await apiRequest("POST", "/api/admin/settings", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({
        title: "Configuração atualizada",
        description: "A configuração foi atualizada com sucesso",
      });
      setIsEditModalOpen(false);
      setSelectedSetting(null);
      setFormData({ key: "", value: "", description: "" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar configuração",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteSetting = useMutation({
    mutationFn: async (key: string) => {
      await apiRequest("DELETE", `/api/admin/settings/${key}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({
        title: "Configuração excluída",
        description: "A configuração foi excluída com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir configuração",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const saveBrandingMutation = useMutation({
    mutationFn: async (data: typeof brandingData) => {
      const promises = [];
      
      if (data.systemName) {
        promises.push(apiRequest("POST", "/api/admin/settings", {
          key: "system_name",
          value: data.systemName,
          description: "Nome do sistema exibido no cabeçalho"
        }));
      }
      
      if (data.systemLogo) {
        promises.push(apiRequest("POST", "/api/admin/settings", {
          key: "system_logo",
          value: data.systemLogo,
          description: "URL do logo do sistema"
        }));
      }
      
      if (data.systemFavicon) {
        promises.push(apiRequest("POST", "/api/admin/settings", {
          key: "system_favicon",
          value: data.systemFavicon,
          description: "URL do favicon do sistema"
        }));
      }
      
      if (data.systemDescription) {
        promises.push(apiRequest("POST", "/api/admin/settings", {
          key: "system_description",
          value: data.systemDescription,
          description: "Descrição do sistema"
        }));
      }
      
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({
        title: "Personalização salva",
        description: "As configurações de personalização foram salvas com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar personalização",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEditClick = (setting: SystemSetting) => {
    setSelectedSetting(setting);
    setFormData({
      key: setting.key,
      value: setting.value,
      description: setting.description || "",
    });
    setIsEditModalOpen(true);
  };

  const handleSaveBranding = () => {
    saveBrandingMutation.mutate(brandingData);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.key || !formData.value) {
      toast({
        title: "Campos obrigatórios",
        description: "Chave e valor são obrigatórios",
        variant: "destructive",
      });
      return;
    }
    createSetting.mutate(formData);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.key || !formData.value) {
      toast({
        title: "Campos obrigatórios",
        description: "Chave e valor são obrigatórios",
        variant: "destructive",
      });
      return;
    }
    updateSetting.mutate(formData);
  };

  const setBaseUrl = () => {
    const baseUrl = window.location.origin;
    setFormData({
      key: "base_url",
      value: baseUrl,
      description: "URL base da aplicação para links de confirmação",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Configurações do Sistema</h2>
          <p className="text-gray-600">Gerencie as configurações globais da aplicação</p>
        </div>
      </div>

      <Tabs defaultValue="branding" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Personalização
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configurações Avançadas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="branding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Palette className="w-5 h-5" />
                <span>Personalização do Sistema</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="systemName">Nome do Sistema</Label>
                  <Input
                    id="systemName"
                    value={brandingData.systemName}
                    onChange={(e) => setBrandingData({ ...brandingData, systemName: e.target.value })}
                    placeholder="Finance Manager"
                  />
                  <p className="text-sm text-gray-500 mt-1">Nome exibido no cabeçalho da aplicação</p>
                </div>

                <div>
                  <Label htmlFor="systemDescription">Descrição</Label>
                  <Input
                    id="systemDescription"
                    value={brandingData.systemDescription}
                    onChange={(e) => setBrandingData({ ...brandingData, systemDescription: e.target.value })}
                    placeholder="Sistema de gestão financeira"
                  />
                  <p className="text-sm text-gray-500 mt-1">Descrição da aplicação</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <LogoUploader
                  label="Logo do Sistema"
                  description="Logo exibido no cabeçalho da aplicação"
                  currentValue={brandingData.systemLogo}
                  onLogoChange={(logoUrl) => setBrandingData({ ...brandingData, systemLogo: logoUrl })}
                />

                <LogoUploader
                  label="Favicon"
                  description="Ícone exibido na aba do navegador"
                  currentValue={brandingData.systemFavicon}
                  onLogoChange={(faviconUrl) => setBrandingData({ ...brandingData, systemFavicon: faviconUrl })}
                />
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={handleSaveBranding}
                  disabled={saveBrandingMutation.isPending}
                >
                  {saveBrandingMutation.isPending ? "Salvando..." : "Salvar Personalização"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Configurações Avançadas</h3>
              <p className="text-gray-600">Configurações técnicas da aplicação</p>
            </div>
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Configuração
                </Button>
              </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Configuração</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <Label htmlFor="key">Chave</Label>
                <Input
                  id="key"
                  value={formData.key}
                  onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                  placeholder="ex: base_url"
                  required
                />
              </div>
              <div>
                <Label htmlFor="value">Valor</Label>
                <Input
                  id="value"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder="ex: https://meudominio.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição da configuração"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={setBaseUrl}
                  className="flex items-center space-x-2"
                >
                  <Globe className="w-4 h-4" />
                  <span>Usar URL Atual</span>
                </Button>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createSetting.isPending}>
                  {createSetting.isPending ? "Criando..." : "Criar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Configurações Disponíveis</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!settings || settings.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma configuração encontrada</p>
              <p className="text-sm text-gray-400">Crie uma nova configuração para começar</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Chave</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {settings.map((setting: SystemSetting) => (
                  <TableRow key={setting.id}>
                    <TableCell>
                      <Badge variant="outline">{setting.key}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{setting.value}</TableCell>
                    <TableCell className="max-w-xs truncate">{setting.description || "-"}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditClick(setting)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteSetting.mutate(setting.key)}
                          disabled={deleteSetting.isPending}
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

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Configuração</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-key">Chave</Label>
              <Input
                id="edit-key"
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                disabled
              />
            </div>
            <div>
              <Label htmlFor="edit-value">Valor</Label>
              <Input
                id="edit-value"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Descrição</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updateSetting.isPending}>
                {updateSetting.isPending ? "Atualizando..." : "Atualizar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}