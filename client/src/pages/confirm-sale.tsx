import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  Upload, 
  Check, 
  FileImage, 
  User, 
  CreditCard, 
  Calendar, 
  FileText,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { format } from "date-fns";

export default function ConfirmSale() {
  const { token } = useParams();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { data: sale, isLoading, error } = useQuery({
    queryKey: [`/api/confirm-sale/${token}`],
    queryFn: async () => {
      const response = await fetch(`/api/confirm-sale/${token}`);
      if (!response.ok) {
        throw new Error("Venda não encontrada");
      }
      return response.json();
    },
    retry: false,
  });

  const confirmSaleMutation = useMutation({
    mutationFn: async (documentPhotoUrl: string) => {
      try {
        const response = await fetch(`/api/confirm-sale/${token}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ documentPhotoUrl }),
        });
        
        if (!response.ok) {
          const errorData = await response.text();
          console.error('Confirmation error:', errorData);
          throw new Error(`Falha ao confirmar venda: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Confirmation success:', result);
        return result;
      } catch (error) {
        console.error('Mutation error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Confirmation successful:', data);
      setIsSubmitted(true);
      toast({
        title: "Sucesso",
        description: "Venda confirmada com sucesso! Aguarde a aprovação.",
      });
    },
    onError: (error) => {
      console.error('Confirmation mutation error:', error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao confirmar venda",
        variant: "destructive",
      });
    },
  });

  // Function to compress image
  const compressImage = (file: File, maxWidth: number = 1024, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        const width = img.width * ratio;
        const height = img.height * ratio;
        
        // Set canvas size
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith("image/")) {
        setSelectedFile(file);
        
        // Compress the image before setting preview
        try {
          const compressedDataUrl = await compressImage(file);
          setPreviewUrl(compressedDataUrl);
        } catch (error) {
          toast({
            title: "Erro",
            description: "Erro ao processar a imagem",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Erro",
          description: "Por favor, selecione apenas arquivos de imagem",
          variant: "destructive",
        });
      }
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile || !previewUrl) {
      toast({
        title: "Erro",
        description: "Por favor, selecione uma foto do documento",
        variant: "destructive",
      });
      return;
    }

    // Check if image is too large (over 10MB as base64 can be ~33% larger)
    const sizeInMB = (previewUrl.length * 0.75) / (1024 * 1024);
    if (sizeInMB > 10) {
      toast({
        title: "Erro",
        description: "A imagem é muito grande. Tente uma imagem menor.",
        variant: "destructive",
      });
      return;
    }

    console.log(`Submitting document photo. Size: ${sizeInMB.toFixed(2)}MB`);
    
    // In a real application, you would upload the image to a storage service
    // For now, we'll use the data URL as a placeholder
    confirmSaleMutation.mutate(previewUrl);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !sale) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">
              <AlertCircle className="w-6 h-6 mx-auto mb-2" />
              Venda não encontrada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-600">
              O link de confirmação não é válido ou a venda não existe.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (sale.status !== "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-green-600">
              <CheckCircle className="w-6 h-6 mx-auto mb-2" />
              Venda já confirmada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-600">
              Esta venda já foi confirmada em{" "}
              {sale.clientSignedAt && format(new Date(sale.clientSignedAt), "dd/MM/yyyy 'às' HH:mm")}.
            </p>
            <p className="text-center text-sm text-gray-500 mt-2">
              Status atual: {sale.status === "confirmed" ? "Aguardando aprovação" : 
                           sale.status === "approved" ? "Aprovada" : "Rejeitada"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-green-600">
              <CheckCircle className="w-6 h-6 mx-auto mb-2" />
              Confirmação Enviada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-600">
              Sua confirmação foi enviada com sucesso! O vendedor irá revisar e aprovar sua venda.
            </p>
            <p className="text-center text-sm text-gray-500 mt-2">
              Você receberá uma notificação quando a venda for aprovada.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              <FileText className="w-6 h-6 mx-auto mb-2" />
              Confirmação de Venda Parcelada
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Sale Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3 flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Dados do Cliente
                </h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Nome:</strong> {sale.client.name}</p>
                  <p><strong>WhatsApp:</strong> {sale.client.whatsapp}</p>
                  <p><strong>Email:</strong> {sale.client.email}</p>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-3 flex items-center">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Dados da Venda
                </h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Valor Total:</strong> R$ {sale.totalAmount}</p>
                  <p><strong>Parcelas:</strong> {sale.installmentCount}x de R$ {sale.installmentValue}</p>
                  <p><strong>Primeiro Vencimento:</strong> {format(new Date(sale.firstDueDate), "dd/MM/yyyy")}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3 flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                Descrição da Venda
              </h3>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                {sale.description}
              </p>
            </div>

            <Separator />

            {/* Document Upload */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center">
                <FileImage className="w-4 h-4 mr-2" />
                Assinatura Digital
              </h3>
              
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Para confirmar esta venda, você precisa enviar uma foto do seu documento de identidade 
                  como forma de assinatura digital. A foto será usada apenas para confirmar sua identidade.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="document-photo">Foto do Documento (RG, CNH, etc.)</Label>
                  <Input
                    id="document-photo"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="mt-1"
                  />
                </div>

                {previewUrl && (
                  <div>
                    <Label>Prévia da Foto</Label>
                    <div className="mt-2 border rounded-lg p-2">
                      <img
                        src={previewUrl}
                        alt="Preview do documento"
                        className="max-w-full h-auto max-h-64 mx-auto rounded"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Actions */}
            <div className="flex justify-center space-x-4">
              <Button
                onClick={handleSubmit}
                disabled={!selectedFile || confirmSaleMutation.isPending}
                className="min-w-32"
              >
                {confirmSaleMutation.isPending ? (
                  "Enviando..."
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Confirmar Venda
                  </>
                )}
              </Button>
            </div>

            <div className="text-center text-xs text-gray-500">
              <p>
                Ao confirmar, você está concordando com os termos da venda apresentados acima.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}