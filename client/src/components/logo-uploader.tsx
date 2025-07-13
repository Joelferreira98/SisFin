import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Link, X, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LogoUploaderProps {
  currentValue: string;
  onLogoChange: (logoUrl: string) => void;
  label: string;
  description?: string;
}

export function LogoUploader({ currentValue, onLogoChange, label, description }: LogoUploaderProps) {
  const [logoUrl, setLogoUrl] = useState(currentValue);
  const [uploadedImage, setUploadedImage] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erro",
        description: "Por favor, selecione apenas arquivos de imagem",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "A imagem deve ter no máximo 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Convert to base64 for storage
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setUploadedImage(base64);
        onLogoChange(base64);
        toast({
          title: "Sucesso",
          description: "Imagem carregada com sucesso",
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao carregar a imagem",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlChange = (url: string) => {
    setLogoUrl(url);
    onLogoChange(url);
  };

  const handleClearImage = () => {
    setUploadedImage("");
    setLogoUrl("");
    onLogoChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const currentImageSrc = uploadedImage || logoUrl || currentValue;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="h-4 w-4" />
          {label}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="url" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="url">URL</TabsTrigger>
            <TabsTrigger value="upload">Upload</TabsTrigger>
          </TabsList>
          
          <TabsContent value="url" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="logo-url">URL da Imagem</Label>
              <Input
                id="logo-url"
                type="url"
                placeholder="https://exemplo.com/logo.png"
                value={logoUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="upload" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="logo-upload">Carregar Imagem</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {isUploading ? "Carregando..." : "Selecionar Arquivo"}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Formatos: PNG, JPG, GIF, SVG (máx. 5MB)
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Image Preview */}
        {currentImageSrc && (
          <div className="mt-4 p-4 border rounded-lg bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Preview:</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearImage}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center justify-center bg-white border rounded p-2">
              <img
                src={currentImageSrc}
                alt="Logo preview"
                className="max-h-16 max-w-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  toast({
                    title: "Erro",
                    description: "Não foi possível carregar a imagem",
                    variant: "destructive",
                  });
                }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}