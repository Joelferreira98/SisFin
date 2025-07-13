import { storage } from "./storage";
import { InsertWhatsappMessage } from "@shared/schema";

export interface WhatsAppConfig {
  apiUrl: string;
  apiKey: string;
  instanceName: string;
}

export class WhatsAppService {
  private config: WhatsAppConfig;

  constructor(config: WhatsAppConfig) {
    this.config = config;
  }

  async sendTextMessage(phoneNumber: string, message: string, instanceName?: string): Promise<boolean> {
    try {
      // Formatar o número do WhatsApp (remover caracteres especiais e garantir formato correto)
      let formattedNumber = phoneNumber.replace(/\D/g, '');
      
      // Se o número não tem código do país, adicionar 55 (Brasil)
      if (formattedNumber.length === 11 && formattedNumber.startsWith('9')) {
        formattedNumber = '55' + formattedNumber;
      }
      
      const instance = instanceName || this.config.instanceName;
      
      if (!instance) {
        console.error('No WhatsApp instance available for sending message');
        return false;
      }
      
      console.log(`Sending message to ${formattedNumber} using instance: ${instance}`);
      
      const response = await fetch(`${this.config.apiUrl}/message/sendText/${instance}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.config.apiKey,
        },
        body: JSON.stringify({
          number: formattedNumber,
          text: message,
          delay: 1200,
          linkPreview: false,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('WhatsApp API Error:', errorText);
        return false;
      }

      const result = await response.json();
      console.log('WhatsApp message sent successfully:', result);
      return true;
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      return false;
    }
  }

  async sendPaymentReminder(clientId: number, clientName: string, phoneNumber: string, amount: number, dueDate: Date, description: string, userId: number): Promise<boolean> {
    const formattedAmount = amount.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

    const formattedDate = dueDate.toLocaleDateString('pt-BR');

    const message = `Olá ${clientName}! 👋

Lembrete de pagamento:
📝 ${description}
💰 Valor: ${formattedAmount}
📅 Vencimento: ${formattedDate}

Para mais informações, entre em contato conosco.

_Mensagem automática - Sistema de Gestão Financeira_`;

    // Get user's active WhatsApp instance or use admin instance as fallback
    const userInstance = await this.getUserActiveInstance(userId);
    if (!userInstance) {
      console.log(`No user instance found for user ${userId}, using admin instance as fallback`);
    }
    const success = await this.sendTextMessage(phoneNumber, message, userInstance);

    // Salvar no banco de dados
    try {
      const messageData: InsertWhatsappMessage = {
        clientId,
        content: message,
        templateType: 'reminder',
        status: success ? 'sent' : 'failed',
      };

      await storage.createWhatsappMessage(messageData, userId);
    } catch (error) {
      console.error('Error saving WhatsApp message to database:', error);
    }

    return success;
  }

  async sendOverdueNotification(clientId: number, clientName: string, phoneNumber: string, amount: number, dueDate: Date, description: string, userId: number): Promise<boolean> {
    const formattedAmount = amount.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

    const formattedDate = dueDate.toLocaleDateString('pt-BR');
    const daysPastDue = Math.floor((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

    const message = `Olá ${clientName}! ⚠️

Notificação de pagamento em atraso:
📝 ${description}
💰 Valor: ${formattedAmount}
📅 Venceu em: ${formattedDate}
🕐 Atraso: ${daysPastDue} dias

Por favor, entre em contato para regularizar a situação.

_Mensagem automática - Sistema de Gestão Financeira_`;

    // Get user's active WhatsApp instance or use admin instance as fallback
    const userInstance = await this.getUserActiveInstance(userId);
    if (!userInstance) {
      console.log(`No user instance found for user ${userId}, using admin instance as fallback`);
    }
    const success = await this.sendTextMessage(phoneNumber, message, userInstance);

    // Salvar no banco de dados
    try {
      const messageData: InsertWhatsappMessage = {
        clientId,
        content: message,
        templateType: 'overdue',
        status: success ? 'sent' : 'failed',
      };

      await storage.createWhatsappMessage(messageData, userId);
    } catch (error) {
      console.error('Error saving WhatsApp message to database:', error);
    }

    return success;
  }

  async sendInstallmentConfirmationRequest(clientId: number, clientName: string, phoneNumber: string, description: string, totalAmount: number, installmentCount: number, confirmationToken: string, userId: number): Promise<boolean> {
    const formattedAmount = totalAmount.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

    const confirmationLink = `${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'http://localhost:5000'}/confirm-sale/${confirmationToken}`;

    const message = `Olá ${clientName}! 📋

Confirmação de Venda Parcelada:
📝 ${description}
💰 Valor Total: ${formattedAmount}
📊 Parcelas: ${installmentCount}x

Para confirmar a venda, acesse o link:
🔗 ${confirmationLink}

No link, você poderá enviar a foto do documento como assinatura digital.

_Mensagem automática - Sistema de Gestão Financeira_`;

    // Get user's active WhatsApp instance or use admin instance as fallback
    const userInstance = await this.getUserActiveInstance(userId);
    if (!userInstance) {
      console.log(`No user instance found for user ${userId}, using admin instance as fallback`);
    }
    const success = await this.sendTextMessage(phoneNumber, message, userInstance);

    // Salvar no banco de dados
    try {
      const messageData: InsertWhatsappMessage = {
        clientId,
        content: message,
        templateType: 'custom',
        status: success ? 'sent' : 'failed',
      };

      await storage.createWhatsappMessage(messageData, userId);
    } catch (error) {
      console.error('Error saving WhatsApp message to database:', error);
    }

    return success;
  }

  async sendSaleApprovalNotification(clientId: number, clientName: string, phoneNumber: string, description: string, totalAmount: number, installmentCount: number, userId: number): Promise<boolean> {
    const formattedAmount = totalAmount.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

    const message = `🎉 Parabéns ${clientName}! 

Sua venda parcelada foi APROVADA! ✅

📝 ${description}
💰 Valor Total: ${formattedAmount}
📊 Parcelas: ${installmentCount}x

Suas parcelas foram criadas automaticamente no sistema e você receberá lembretes de pagamento nas datas de vencimento.

Obrigado por fazer negócios conosco! 🤝

_Mensagem automática - Sistema de Gestão Financeira_`;

    // Get user's active WhatsApp instance or use admin instance as fallback
    const userInstance = await this.getUserActiveInstance(userId);
    if (!userInstance) {
      console.log(`No user instance found for user ${userId}, using admin instance as fallback`);
    }
    const success = await this.sendTextMessage(phoneNumber, message, userInstance);

    // Salvar no banco de dados
    try {
      const messageData: InsertWhatsappMessage = {
        clientId,
        content: message,
        templateType: 'approval',
        status: success ? 'sent' : 'failed',
      };

      await storage.createWhatsappMessage(messageData, userId);
    } catch (error) {
      console.error('Error saving WhatsApp message to database:', error);
    }

    return success;
  }

  async sendSaleRejectionNotification(clientId: number, clientName: string, phoneNumber: string, description: string, totalAmount: number, rejectionReason: string, userId: number): Promise<boolean> {
    const formattedAmount = totalAmount.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

    const message = `Olá ${clientName}!

Infelizmente, sua venda parcelada foi REJEITADA. ❌

📝 ${description}
💰 Valor: ${formattedAmount}

${rejectionReason ? `Motivo: ${rejectionReason}` : ''}

Para mais informações ou para tentar novamente, entre em contato conosco.

_Mensagem automática - Sistema de Gestão Financeira_`;

    // Get user's active WhatsApp instance or use admin instance as fallback
    const userInstance = await this.getUserActiveInstance(userId);
    if (!userInstance) {
      console.log(`No user instance found for user ${userId}, using admin instance as fallback`);
    }
    const success = await this.sendTextMessage(phoneNumber, message, userInstance);

    // Salvar no banco de dados
    try {
      const messageData: InsertWhatsappMessage = {
        clientId,
        content: message,
        templateType: 'rejection',
        status: success ? 'sent' : 'failed',
      };

      await storage.createWhatsappMessage(messageData, userId);
    } catch (error) {
      console.error('Error saving WhatsApp message to database:', error);
    }

    return success;
  }

  async getUserActiveInstance(userId: number): Promise<string | undefined> {
    try {
      const instances = await storage.getUserWhatsappInstances(userId);
      const activeInstance = instances.find(instance => 
        instance.status === 'connected' && instance.isActive
      );
      
      if (!activeInstance) {
        console.log(`No active WhatsApp instance found for user ${userId}. Available instances:`, instances);
      }
      
      return activeInstance?.instanceName;
    } catch (error) {
      console.error('Error getting user active instance:', error);
      return undefined;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.apiUrl}/instance/fetchInstances`, {
        method: 'GET',
        headers: {
          'apikey': this.config.apiKey,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Error testing WhatsApp connection:', error);
      return false;
    }
  }

  async createInstance(instanceName: string, token?: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // Always use WhatsApp-Baileys with QR code
      const payload = {
        instanceName,
        token: token || "123456",
        qrcode: true,
        integration: "WHATSAPP-BAILEYS"
      };

      const response = await fetch(`${this.config.apiUrl}/instance/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.config.apiKey
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData}`);
      }

      const data = await response.json();
      console.log('Evolution API create response:', JSON.stringify(data, null, 2));
      return { success: true, data };
    } catch (error) {
      console.error('Error creating Evolution instance:', error);
      return { success: false, error: error.message };
    }
  }

  async getInstanceStatus(instanceName: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await fetch(`${this.config.apiUrl}/instance/connect/${instanceName}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.config.apiKey
        }
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData}`);
      }

      const data = await response.json();
      console.log('Instance status response:', JSON.stringify(data, null, 2));
      return { success: true, data };
    } catch (error) {
      console.error('Error getting instance status:', error);
      return { success: false, error: error.message };
    }
  }

  async getInstanceInfo(instanceName: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await fetch(`${this.config.apiUrl}/instance/fetchInstances?instanceName=${instanceName}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.config.apiKey
        }
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData}`);
      }

      const data = await response.json();
      console.log('Instance info response:', JSON.stringify(data, null, 2));
      return { success: true, data };
    } catch (error) {
      console.error('Error getting instance info:', error);
      return { success: false, error: error.message };
    }
  }

  async regenerateQRCode(instanceName: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await fetch(`${this.config.apiUrl}/instance/connect/${instanceName}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.config.apiKey
        }
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData}`);
      }

      const data = await response.json();
      console.log('QR Code regeneration response:', JSON.stringify(data, null, 2));
      return { success: true, data };
    } catch (error) {
      console.error('Error regenerating QR code:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteInstance(instanceName: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`Attempting to delete instance: ${instanceName}`);
      
      const response = await fetch(`${this.config.apiUrl}/instance/delete/${instanceName}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.config.apiKey
        }
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.log(`Delete response status: ${response.status}, data: ${errorData}`);
        
        // If it's a 404, the instance might already be deleted
        if (response.status === 404) {
          console.log(`Instance ${instanceName} not found in Evolution API (already deleted?)`);
          return { success: true };
        }
        
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData}`);
      }

      const responseData = await response.json();
      console.log(`Successfully deleted instance ${instanceName}:`, responseData);
      return { success: true };
    } catch (error) {
      console.error('Error deleting instance:', error);
      return { success: false, error: error.message };
    }
  }
}

// Singleton instance
let whatsappService: WhatsAppService | null = null;

export function getWhatsAppService(): WhatsAppService | null {
  if (!whatsappService) {
    const apiUrl = process.env.EVOLUTION_API_URL;
    const apiKey = process.env.EVOLUTION_API_KEY;
    const instanceName = process.env.EVOLUTION_INSTANCE_NAME;

    if (!apiUrl || !apiKey || !instanceName) {
      console.warn('WhatsApp service not configured. Missing environment variables.');
      return null;
    }

    whatsappService = new WhatsAppService({
      apiUrl,
      apiKey,
      instanceName,
    });
  }

  return whatsappService;
}