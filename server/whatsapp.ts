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

  async sendTextMessage(phoneNumber: string, message: string): Promise<boolean> {
    try {
      // Formatar o número do WhatsApp (remover caracteres especiais)
      const formattedNumber = phoneNumber.replace(/\D/g, '');
      
      const response = await fetch(`${this.config.apiUrl}/message/sendText/${this.config.instanceName}`, {
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

    const success = await this.sendTextMessage(phoneNumber, message);

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

    const success = await this.sendTextMessage(phoneNumber, message);

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

    const success = await this.sendTextMessage(phoneNumber, message);

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