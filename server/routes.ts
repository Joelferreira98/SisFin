import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isAdmin } from "./auth";
import { getWhatsAppService } from "./whatsapp";
import { planBillingService } from "./plan-billing-service";
import { insertClientSchema, insertReceivableSchema, insertPayableSchema, insertPlanSchema, insertInstallmentSaleSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  setupAuth(app);

  // Plan limit routes
  app.get('/api/plan-limits/clients', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const planLimit = await storage.checkPlanLimit(userId, 'maxClients');
      res.json(planLimit);
    } catch (error) {
      console.error("Error checking plan limit:", error);
      res.status(500).json({ message: "Failed to check plan limit" });
    }
  });

  app.get('/api/plan-limits/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const planLimit = await storage.checkPlanLimit(userId, 'maxTransactions');
      res.json(planLimit);
    } catch (error) {
      console.error("Error checking plan limit:", error);
      res.status(500).json({ message: "Failed to check plan limit" });
    }
  });

  app.get('/api/plan-limits/whatsapp', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const planLimit = await storage.checkPlanLimit(userId, 'maxWhatsappMessages');
      res.json(planLimit);
    } catch (error) {
      console.error("Error checking plan limit:", error);
      res.status(500).json({ message: "Failed to check plan limit" });
    }
  });

  // Client routes
  app.get('/api/clients', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const clients = await storage.getClients(userId);
      res.json(clients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.get('/api/clients/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const clientId = parseInt(req.params.id);
      const client = await storage.getClient(clientId, userId);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      console.error("Error fetching client:", error);
      res.status(500).json({ message: "Failed to fetch client" });
    }
  });

  app.post('/api/clients', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Verificar limitação do plano
      const planLimit = await storage.checkPlanLimit(userId, 'maxClients');
      if (!planLimit.canCreate) {
        return res.status(403).json({ 
          message: "Limite de clientes atingido para seu plano",
          currentCount: planLimit.currentCount,
          maxLimit: planLimit.maxLimit
        });
      }
      
      const clientData = insertClientSchema.parse(req.body);
      const client = await storage.createClient(clientData, userId);
      res.status(201).json(client);
    } catch (error) {
      console.error("Error creating client:", error);
      res.status(500).json({ message: "Failed to create client" });
    }
  });

  app.put('/api/clients/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const clientId = parseInt(req.params.id);
      const clientData = insertClientSchema.partial().parse(req.body);
      const client = await storage.updateClient(clientId, clientData, userId);
      res.json(client);
    } catch (error) {
      console.error("Error updating client:", error);
      res.status(500).json({ message: "Failed to update client" });
    }
  });

  app.delete('/api/clients/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const clientId = parseInt(req.params.id);
      await storage.deleteClient(clientId, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting client:", error);
      res.status(500).json({ message: "Failed to delete client" });
    }
  });

  // Receivable routes
  app.get('/api/receivables', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const receivables = await storage.getReceivables(userId);
      res.json(receivables);
    } catch (error) {
      console.error("Error fetching receivables:", error);
      res.status(500).json({ message: "Failed to fetch receivables" });
    }
  });

  app.get('/api/receivables/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const receivableId = parseInt(req.params.id);
      const receivable = await storage.getReceivable(receivableId, userId);
      if (!receivable) {
        return res.status(404).json({ message: "Receivable not found" });
      }
      res.json(receivable);
    } catch (error) {
      console.error("Error fetching receivable:", error);
      res.status(500).json({ message: "Failed to fetch receivable" });
    }
  });

  app.post('/api/receivables', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Verificar limitação do plano
      const planLimit = await storage.checkPlanLimit(userId, 'maxTransactions');
      if (!planLimit.canCreate) {
        return res.status(403).json({ 
          message: "Limite de transações atingido para seu plano",
          currentCount: planLimit.currentCount,
          maxLimit: planLimit.maxLimit
        });
      }
      
      const receivableData = insertReceivableSchema.parse(req.body);
      const receivable = await storage.createReceivable(receivableData, userId);
      res.status(201).json(receivable);
    } catch (error) {
      console.error("Error creating receivable:", error);
      res.status(500).json({ message: "Failed to create receivable" });
    }
  });

  app.put('/api/receivables/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const receivableId = parseInt(req.params.id);
      const receivableData = insertReceivableSchema.partial().parse(req.body);
      const receivable = await storage.updateReceivable(receivableId, receivableData, userId);
      res.json(receivable);
    } catch (error) {
      console.error("Error updating receivable:", error);
      res.status(500).json({ message: "Failed to update receivable" });
    }
  });

  app.delete('/api/receivables/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const receivableId = parseInt(req.params.id);
      await storage.deleteReceivable(receivableId, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting receivable:", error);
      res.status(500).json({ message: "Failed to delete receivable" });
    }
  });

  // Payable routes
  app.get('/api/payables', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const payables = await storage.getPayables(userId);
      res.json(payables);
    } catch (error) {
      console.error("Error fetching payables:", error);
      res.status(500).json({ message: "Failed to fetch payables" });
    }
  });

  app.get('/api/payables/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const payableId = parseInt(req.params.id);
      const payable = await storage.getPayable(payableId, userId);
      if (!payable) {
        return res.status(404).json({ message: "Payable not found" });
      }
      res.json(payable);
    } catch (error) {
      console.error("Error fetching payable:", error);
      res.status(500).json({ message: "Failed to fetch payable" });
    }
  });

  app.post('/api/payables', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Verificar limitação do plano
      const planLimit = await storage.checkPlanLimit(userId, 'maxTransactions');
      if (!planLimit.canCreate) {
        return res.status(403).json({ 
          message: "Limite de transações atingido para seu plano",
          currentCount: planLimit.currentCount,
          maxLimit: planLimit.maxLimit
        });
      }
      
      const payableData = insertPayableSchema.parse(req.body);
      const payable = await storage.createPayable(payableData, userId);
      res.status(201).json(payable);
    } catch (error) {
      console.error("Error creating payable:", error);
      res.status(500).json({ message: "Failed to create payable" });
    }
  });

  app.put('/api/payables/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const payableId = parseInt(req.params.id);
      const payableData = insertPayableSchema.partial().parse(req.body);
      const payable = await storage.updatePayable(payableId, payableData, userId);
      res.json(payable);
    } catch (error) {
      console.error("Error updating payable:", error);
      res.status(500).json({ message: "Failed to update payable" });
    }
  });

  app.delete('/api/payables/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const payableId = parseInt(req.params.id);
      await storage.deletePayable(payableId, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting payable:", error);
      res.status(500).json({ message: "Failed to delete payable" });
    }
  });

  // WhatsApp routes
  app.get('/api/whatsapp/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const messages = await storage.getWhatsappMessages(userId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching WhatsApp messages:", error);
      res.status(500).json({ message: "Failed to fetch WhatsApp messages" });
    }
  });

  app.post('/api/whatsapp/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const message = await storage.createWhatsappMessage(req.body, userId);
      res.status(201).json(message);
    } catch (error) {
      console.error("Error creating WhatsApp message:", error);
      res.status(500).json({ message: "Failed to create WhatsApp message" });
    }
  });

  // User WhatsApp instances routes
  app.get('/api/whatsapp/instances', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const instances = await storage.getUserWhatsappInstances(userId);
      res.json(instances);
    } catch (error) {
      console.error('Error getting WhatsApp instances:', error);
      res.status(500).json({ message: 'Erro ao buscar instâncias WhatsApp' });
    }
  });

  app.post('/api/whatsapp/instances', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const instanceData = req.body;
      
      // Validate required fields
      if (!instanceData.instanceName || !instanceData.displayName) {
        return res.status(400).json({ message: 'Nome da instância e nome de exibição são obrigatórios' });
      }
      
      // Check if instance name already exists for this user
      const existingInstance = await storage.getUserWhatsappInstanceByName(instanceData.instanceName, userId);
      if (existingInstance) {
        return res.status(400).json({ message: 'Nome da instância já existe' });
      }
      
      // Create instance in Evolution API
      const whatsappService = getWhatsAppService();
      if (!whatsappService) {
        return res.status(500).json({ message: 'Serviço WhatsApp não configurado' });
      }
      
      const evolutionResult = await whatsappService.createInstance(
        instanceData.instanceName,
        instanceData.token
      );
      
      if (!evolutionResult.success) {
        return res.status(500).json({ 
          message: `Erro ao criar instância na Evolution API: ${evolutionResult.error}` 
        });
      }
      
      // Save instance to database with QR code data
      const instance = await storage.createUserWhatsappInstance({
        ...instanceData,
        status: 'connecting',
        qrCode: evolutionResult.data?.qrcode?.code
      }, userId);
      
      res.status(201).json({
        ...instance,
        qrCodeData: evolutionResult.data?.qrcode
      });
    } catch (error) {
      console.error('Error creating WhatsApp instance:', error);
      res.status(500).json({ message: 'Erro ao criar instância WhatsApp' });
    }
  });

  app.put('/api/whatsapp/instances/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const instanceId = parseInt(req.params.id);
      const instanceData = req.body;
      
      const instance = await storage.updateUserWhatsappInstance(instanceId, instanceData, userId);
      res.json(instance);
    } catch (error) {
      console.error('Error updating WhatsApp instance:', error);
      res.status(500).json({ message: 'Erro ao atualizar instância WhatsApp' });
    }
  });

  app.post('/api/whatsapp/instances/:id/regenerate-qr', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const instanceId = parseInt(req.params.id);
      
      // Get instance from database
      const instances = await storage.getUserWhatsappInstances(userId);
      const instance = instances.find(i => i.id === instanceId);
      
      if (!instance) {
        return res.status(404).json({ message: 'Instância não encontrada' });
      }

      // Regenerate QR code from Evolution API
      const whatsappService = getWhatsAppService();
      if (!whatsappService) {
        return res.status(500).json({ message: 'Serviço WhatsApp não configurado' });
      }
      
      const evolutionResult = await whatsappService.regenerateQRCode(instance.instanceName);
      
      if (!evolutionResult.success) {
        return res.status(500).json({ 
          message: `Erro ao regenerar QR code: ${evolutionResult.error}` 
        });
      }
      
      // Update instance in database with new QR code
      const updatedInstance = await storage.updateUserWhatsappInstance(instanceId, {
        qrCode: evolutionResult.data?.qrcode?.code || evolutionResult.data?.qr,
        status: 'connecting'
      }, userId);
      
      res.json({
        ...updatedInstance,
        qrCodeData: evolutionResult.data?.qrcode || evolutionResult.data
      });
    } catch (error) {
      console.error('Error regenerating QR code:', error);
      res.status(500).json({ message: 'Erro ao regenerar QR code' });
    }
  });

  app.delete('/api/whatsapp/instances/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const instanceId = parseInt(req.params.id);
      
      // Get instance from database first
      const instances = await storage.getUserWhatsappInstances(userId);
      const instance = instances.find(i => i.id === instanceId);
      
      if (!instance) {
        return res.status(404).json({ message: 'Instância não encontrada' });
      }
      
      // Delete from Evolution API first
      const whatsappService = getWhatsAppService();
      if (whatsappService) {
        const deleteResult = await whatsappService.deleteInstance(instance.instanceName);
        if (!deleteResult.success) {
          console.error('Error deleting from Evolution API:', deleteResult.error);
          // Continue with database deletion even if Evolution API fails
        } else {
          console.log('Successfully deleted instance from Evolution API:', instance.instanceName);
        }
      }
      
      // Delete from database
      await storage.deleteUserWhatsappInstance(instanceId, userId);
      res.json({ message: 'Instância WhatsApp excluída com sucesso' });
    } catch (error) {
      console.error('Error deleting WhatsApp instance:', error);
      res.status(500).json({ message: 'Erro ao deletar instância WhatsApp' });
    }
  });

  // Route to test WhatsApp message sending
  app.post('/api/whatsapp/test-message', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { phoneNumber, message, instanceName } = req.body;
      
      if (!phoneNumber || !message) {
        return res.status(400).json({ message: 'Phone number and message are required' });
      }
      
      const whatsappService = getWhatsAppService();
      if (!whatsappService) {
        return res.status(500).json({ message: 'Serviço WhatsApp não configurado' });
      }
      
      const success = await whatsappService.sendTextMessage(phoneNumber, message, instanceName);
      
      res.json({ 
        success, 
        message: success ? 'Mensagem enviada com sucesso' : 'Falha ao enviar mensagem' 
      });
    } catch (error) {
      console.error('Error testing WhatsApp message:', error);
      res.status(500).json({ message: 'Erro ao testar mensagem WhatsApp' });
    }
  });

  // Route to get instance status from Evolution API
  app.get('/api/whatsapp/instances/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const instanceId = parseInt(req.params.id);
      
      // Get instance from database
      const instances = await storage.getUserWhatsappInstances(userId);
      const instance = instances.find(i => i.id === instanceId);
      
      if (!instance) {
        return res.status(404).json({ message: 'Instância não encontrada' });
      }
      
      // Get status from Evolution API
      const whatsappService = getWhatsAppService();
      if (!whatsappService) {
        return res.status(500).json({ message: 'Serviço WhatsApp não configurado' });
      }
      
      // Try to get instance info first
      const infoResult = await whatsappService.getInstanceInfo(instance.instanceName);
      let newStatus = 'disconnected';
      let phoneNumber = instance.phoneNumber;
      
      if (infoResult.success && infoResult.data) {
        // Check if it's an array of instances
        const instanceData = Array.isArray(infoResult.data) ? infoResult.data[0] : infoResult.data;
        
        if (instanceData) {
          // Determine status based on Evolution API response
          if (instanceData.connectionStatus === 'open') {
            newStatus = 'connected';
          } else if (instanceData.connectionStatus === 'connecting') {
            newStatus = 'connecting';
          } else {
            newStatus = 'disconnected';
          }
          
          // Update phone number if available
          if (instanceData.ownerJid) {
            phoneNumber = instanceData.ownerJid.replace('@s.whatsapp.net', '');
          } else if (instanceData.instance?.wuid) {
            phoneNumber = instanceData.instance.wuid.replace('@c.us', '');
          }
        }
      }
      
      // Update instance status in database
      const updatedInstance = await storage.updateUserWhatsappInstance(instanceId, {
        status: newStatus,
        phoneNumber: phoneNumber
      }, userId);
      
      res.json({
        ...infoResult.data,
        localStatus: newStatus,
        updatedInstance
      });
    } catch (error) {
      console.error('Error getting instance status:', error);
      res.status(500).json({ message: 'Erro ao obter status da instância' });
    }
  });

  // Installment Sales routes
  app.get('/api/installment-sales', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const sales = await storage.getInstallmentSales(userId);
      res.json(sales);
    } catch (error) {
      console.error("Error fetching installment sales:", error);
      res.status(500).json({ message: "Failed to fetch installment sales" });
    }
  });

  app.get('/api/installment-sales/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const saleId = parseInt(req.params.id);
      const sale = await storage.getInstallmentSale(saleId, userId);
      if (!sale) {
        return res.status(404).json({ message: "Sale not found" });
      }
      res.json(sale);
    } catch (error) {
      console.error("Error fetching installment sale:", error);
      res.status(500).json({ message: "Failed to fetch installment sale" });
    }
  });

  app.post('/api/installment-sales', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const saleData = insertInstallmentSaleSchema.parse(req.body);
      const sale = await storage.createInstallmentSale(saleData, userId);
      
      // Get client data to send WhatsApp message
      const client = await storage.getClient(sale.clientId, userId);
      if (client && client.whatsapp) {
        const whatsappService = getWhatsAppService();
        if (whatsappService) {
          try {
            const sent = await whatsappService.sendInstallmentConfirmationRequest(
              client.id,
              client.name,
              client.whatsapp,
              sale.description,
              sale.totalAmount,
              sale.installmentCount,
              sale.confirmationToken,
              userId
            );
            if (sent) {
              console.log(`WhatsApp confirmation sent to ${client.name} (${client.whatsapp})`);
            } else {
              console.error(`Failed to send WhatsApp confirmation to ${client.name} (${client.whatsapp})`);
            }
          } catch (whatsappError) {
            console.error('Error sending WhatsApp confirmation:', whatsappError);
            // Don't fail the sale creation if WhatsApp fails
          }
        }
      }
      
      res.status(201).json(sale);
    } catch (error) {
      console.error("Error creating installment sale:", error);
      res.status(500).json({ message: "Failed to create installment sale" });
    }
  });

  app.put('/api/installment-sales/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const saleId = parseInt(req.params.id);
      const saleData = insertInstallmentSaleSchema.partial().parse(req.body);
      const sale = await storage.updateInstallmentSale(saleId, saleData, userId);
      res.json(sale);
    } catch (error) {
      console.error("Error updating installment sale:", error);
      res.status(500).json({ message: "Failed to update installment sale" });
    }
  });

  app.delete('/api/installment-sales/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const saleId = parseInt(req.params.id);
      await storage.deleteInstallmentSale(saleId, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting installment sale:", error);
      res.status(500).json({ message: "Failed to delete installment sale" });
    }
  });

  // Public route for client confirmation
  app.get('/api/confirm-sale/:token', async (req, res) => {
    try {
      const sale = await storage.getInstallmentSaleByToken(req.params.token);
      if (!sale) {
        return res.status(404).json({ message: "Sale not found" });
      }
      res.json(sale);
    } catch (error) {
      console.error("Error fetching sale:", error);
      res.status(500).json({ message: "Failed to fetch sale" });
    }
  });

  app.post('/api/confirm-sale/:token', async (req, res) => {
    try {
      const { documentPhotoUrl } = req.body;
      
      console.log(`Confirming sale with token: ${req.params.token}`);
      console.log(`Document photo URL length: ${documentPhotoUrl ? documentPhotoUrl.length : 0}`);
      
      if (!documentPhotoUrl) {
        return res.status(400).json({ message: "Document photo is required" });
      }
      
      const sale = await storage.updateInstallmentSaleByToken(req.params.token, {
        documentPhotoUrl,
        clientSignedAt: new Date(),
        status: "confirmed"
      });
      
      console.log(`Sale confirmed successfully: ${sale.id}`);
      res.json(sale);
    } catch (error) {
      console.error("Error confirming sale:", error);
      res.status(500).json({ message: "Failed to confirm sale", error: error.message });
    }
  });

  // Route for user to review and approve sales
  app.post('/api/installment-sales/:id/approve', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const saleId = parseInt(req.params.id);
      const { approved, notes } = req.body;
      
      const sale = await storage.updateInstallmentSale(saleId, {
        status: approved ? "approved" : "pending", // Reset to pending if rejected to allow resubmission
        userReviewedAt: new Date(),
        userApprovedAt: approved ? new Date() : null,
        notes,
        // Clear previous document if rejected to allow new submission
        documentPhotoUrl: approved ? undefined : null,
        clientSignedAt: approved ? undefined : null
      }, userId);
      
      // If approved, create receivables for each installment
      if (approved) {
        try {
          await storage.createReceivablesFromInstallmentSale(saleId, userId);
        } catch (error) {
          // If we can't create receivables due to limits, revert the approval
          await storage.updateInstallmentSale(saleId, {
            status: "confirmed",
            userReviewedAt: null,
            userApprovedAt: null,
            notes: null
          }, userId);
          
          return res.status(400).json({ 
            message: error.message || "Erro ao criar parcelas da venda" 
          });
        }
      }
      
      // Send WhatsApp notification to client
      const client = await storage.getClient(sale.clientId, userId);
      if (client && client.whatsapp) {
        const whatsappService = getWhatsAppService();
        if (whatsappService) {
          try {
            if (approved) {
              await whatsappService.sendSaleApprovalNotification(
                client.id,
                client.name,
                client.whatsapp,
                sale.description,
                sale.totalAmount,
                sale.installmentCount,
                userId
              );
              console.log(`Approval notification sent to ${client.name} (${client.whatsapp})`);
            } else {
              await whatsappService.sendSaleRejectionNotification(
                client.id,
                client.name,
                client.whatsapp,
                sale.description,
                sale.totalAmount,
                notes || 'Não especificado',
                sale.confirmationToken,
                userId
              );
              console.log(`Rejection notification sent to ${client.name} (${client.whatsapp})`);
            }
          } catch (whatsappError) {
            console.error('Error sending WhatsApp notification:', whatsappError);
            // Don't fail the approval if WhatsApp fails
          }
        }
      }
      
      res.json(sale);
    } catch (error) {
      console.error("Error updating sale status:", error);
      res.status(500).json({ message: "Failed to update sale status" });
    }
  });

  // Regenerate confirmation token for resubmission
  app.post('/api/installment-sales/:id/regenerate-token', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const saleId = parseInt(req.params.id);
      
      const newToken = storage.generateConfirmationToken();
      const sale = await storage.updateInstallmentSale(saleId, {
        confirmationToken: newToken,
        status: "pending",
        documentPhotoUrl: null,
        clientSignedAt: null,
        userReviewedAt: null,
        userApprovedAt: null,
        notes: null
      }, userId);
      
      // Send new confirmation link via WhatsApp
      const client = await storage.getClient(sale.clientId, userId);
      if (client && client.whatsapp) {
        const whatsappService = getWhatsAppService();
        if (whatsappService) {
          try {
            await whatsappService.sendInstallmentConfirmationRequest(
              client.id,
              client.name,
              client.whatsapp,
              sale.description,
              sale.totalAmount,
              sale.installmentCount,
              newToken,
              userId
            );
            console.log(`New confirmation link sent to ${client.name} (${client.whatsapp})`);
          } catch (whatsappError) {
            console.error('Error sending WhatsApp confirmation:', whatsappError);
            // Don't fail the token regeneration if WhatsApp fails
          }
        }
      }
      
      res.json({ token: newToken, sale });
    } catch (error) {
      console.error("Error regenerating token:", error);
      res.status(500).json({ message: "Failed to regenerate token" });
    }
  });

  // Dashboard routes
  app.get('/api/dashboard', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const dashboardData = await storage.getDashboardData(userId);
      res.json(dashboardData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  // Admin routes
  app.get("/api/admin/users", isAdmin, async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/stats", isAdmin, async (req: any, res) => {
    try {
      const stats = await storage.getUserStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });

  app.patch("/api/admin/users/:id", isAdmin, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.id);
      const updates = req.body;
      const user = await storage.updateUser(userId, updates);
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/admin/users/:id", isAdmin, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.id);
      await storage.deleteUser(userId);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Plan change request routes
  app.post("/api/plan-change-requests", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const requestData = req.body;
      
      // Get user's current plan
      const userSubs = await storage.getUserSubscriptions(userId);
      const currentSub = userSubs.find(sub => sub.isActive);
      
      const request = await storage.createPlanChangeRequest({
        ...requestData,
        currentPlanId: currentSub?.planId || null,
      }, userId);
      
      res.status(201).json(request);
    } catch (error) {
      console.error("Error creating plan change request:", error);
      res.status(500).json({ error: "Erro ao criar solicitação de mudança de plano" });
    }
  });

  app.get("/api/plan-change-requests", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const requests = await storage.getUserPlanChangeRequests(userId);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching plan change requests:", error);
      res.status(500).json({ error: "Erro ao buscar solicitações de mudança de plano" });
    }
  });

  app.get("/api/admin/plan-change-requests", isAdmin, async (req: any, res) => {
    try {
      const requests = await storage.getAllPlanChangeRequests();
      res.json(requests);
    } catch (error) {
      console.error("Error fetching all plan change requests:", error);
      res.status(500).json({ error: "Erro ao buscar todas as solicitações de mudança de plano" });
    }
  });

  app.post("/api/admin/plan-change-requests/:id/approve", isAdmin, async (req: any, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const adminId = req.user.id;
      const { adminResponse } = req.body;
      
      await storage.approvePlanChangeRequest(requestId, adminId, adminResponse);
      res.json({ message: "Solicitação aprovada com sucesso" });
    } catch (error) {
      console.error("Error approving plan change request:", error);
      res.status(500).json({ error: "Erro ao aprovar solicitação de mudança de plano" });
    }
  });

  app.post("/api/admin/plan-change-requests/:id/reject", isAdmin, async (req: any, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const adminId = req.user.id;
      const { adminResponse } = req.body;
      
      await storage.rejectPlanChangeRequest(requestId, adminId, adminResponse);
      res.json({ message: "Solicitação rejeitada com sucesso" });
    } catch (error) {
      console.error("Error rejecting plan change request:", error);
      res.status(500).json({ error: "Erro ao rejeitar solicitação de mudança de plano" });
    }
  });

  // Plan Billing Service endpoints
  app.post("/api/admin/billing/trigger", isAdmin, async (req: any, res) => {
    try {
      await planBillingService.triggerMonthlyBilling();
      res.json({ message: "Monthly billing generated successfully" });
    } catch (error) {
      console.error("Error triggering monthly billing:", error);
      res.status(500).json({ message: "Failed to trigger monthly billing" });
    }
  });

  // System Settings endpoints
  app.get("/api/admin/settings", isAdmin, async (req: any, res) => {
    try {
      const settings = await storage.getAllSystemSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.get("/api/admin/settings/:key", isAdmin, async (req: any, res) => {
    try {
      const key = req.params.key;
      const setting = await storage.getSystemSetting(key);
      if (!setting) {
        return res.status(404).json({ message: "Setting not found" });
      }
      res.json(setting);
    } catch (error) {
      console.error("Error fetching setting:", error);
      res.status(500).json({ message: "Failed to fetch setting" });
    }
  });

  app.post("/api/admin/settings", isAdmin, async (req: any, res) => {
    try {
      const { key, value, description } = req.body;
      const setting = await storage.setSystemSetting(key, value, description);
      res.json(setting);
    } catch (error) {
      console.error("Error setting system setting:", error);
      res.status(500).json({ message: "Failed to set system setting" });
    }
  });

  // PWA Manifest endpoint
  app.get("/manifest.json", async (req, res) => {
    try {
      const settings = await storage.getAllSystemSettings();
      const systemName = settings.find(s => s.key === 'system_name')?.value || 'FinanceManager';
      const systemDescription = settings.find(s => s.key === 'system_description')?.value || 'Sistema de gestão financeira completo';
      const systemLogo = settings.find(s => s.key === 'system_logo')?.value || '';
      
      const manifest = {
        name: systemName,
        short_name: systemName,
        description: systemDescription,
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#2563eb",
        orientation: "portrait",
        scope: "/",
        icons: [
          {
            src: systemLogo || "/pwa-192x192.svg",
            sizes: "192x192",
            type: systemLogo ? "image/png" : "image/svg+xml",
            purpose: "any maskable"
          },
          {
            src: systemLogo || "/pwa-512x512.svg",
            sizes: "512x512",
            type: systemLogo ? "image/png" : "image/svg+xml",
            purpose: "any maskable"
          }
        ]
      };
      
      res.setHeader('Content-Type', 'application/manifest+json');
      res.json(manifest);
    } catch (error) {
      console.error("Error generating manifest:", error);
      res.status(500).json({ error: "Failed to generate manifest" });
    }
  });

  app.delete("/api/admin/settings/:key", isAdmin, async (req: any, res) => {
    try {
      const key = req.params.key;
      await storage.deleteSystemSetting(key);
      res.json({ message: "Setting deleted successfully" });
    } catch (error) {
      console.error("Error deleting setting:", error);
      res.status(500).json({ message: "Failed to delete setting" });
    }
  });

  // Payment Reminders endpoints
  app.get("/api/payment-reminders", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const reminders = await storage.getPaymentReminders(userId);
      res.json(reminders);
    } catch (error) {
      console.error("Error fetching payment reminders:", error);
      res.status(500).json({ message: "Failed to fetch payment reminders" });
    }
  });

  app.get("/api/payment-reminders/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const reminderId = parseInt(req.params.id);
      const reminder = await storage.getPaymentReminder(reminderId, userId);
      if (!reminder) {
        return res.status(404).json({ message: "Payment reminder not found" });
      }
      res.json(reminder);
    } catch (error) {
      console.error("Error fetching payment reminder:", error);
      res.status(500).json({ message: "Failed to fetch payment reminder" });
    }
  });

  app.post("/api/payment-reminders", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const reminder = await storage.createPaymentReminder(req.body, userId);
      res.status(201).json(reminder);
    } catch (error) {
      console.error("Error creating payment reminder:", error);
      res.status(500).json({ message: "Failed to create payment reminder" });
    }
  });

  app.put("/api/payment-reminders/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const reminderId = parseInt(req.params.id);
      const reminder = await storage.updatePaymentReminder(reminderId, req.body, userId);
      res.json(reminder);
    } catch (error) {
      console.error("Error updating payment reminder:", error);
      res.status(500).json({ message: "Failed to update payment reminder" });
    }
  });

  app.delete("/api/payment-reminders/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const reminderId = parseInt(req.params.id);
      await storage.deletePaymentReminder(reminderId, userId);
      res.json({ message: "Payment reminder deleted successfully" });
    } catch (error) {
      console.error("Error deleting payment reminder:", error);
      res.status(500).json({ message: "Failed to delete payment reminder" });
    }
  });

  // Reminder Logs endpoints
  app.get("/api/reminder-logs", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const logs = await storage.getReminderLogs(userId);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching reminder logs:", error);
      res.status(500).json({ message: "Failed to fetch reminder logs" });
    }
  });

  // Test endpoint for manual reminder processing
  app.post("/api/payment-reminders/test", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { reminderService } = await import("./reminder-service");
      
      // Force process reminders for this user
      await reminderService.processUserReminders(userId);
      
      res.json({ message: "Lembretes processados com sucesso" });
    } catch (error) {
      console.error("Error processing reminders:", error);
      res.status(500).json({ message: "Failed to process reminders" });
    }
  });

  // Plan routes
  app.get("/api/plans", isAuthenticated, async (req: any, res) => {
    try {
      const plans = await storage.getPlans();
      res.json(plans);
    } catch (error) {
      console.error("Error fetching plans:", error);
      res.status(500).json({ message: "Failed to fetch plans" });
    }
  });

  app.get("/api/admin/plans", isAdmin, async (req: any, res) => {
    try {
      const plans = await storage.getPlans();
      res.json(plans);
    } catch (error) {
      console.error("Error fetching plans:", error);
      res.status(500).json({ message: "Failed to fetch plans" });
    }
  });

  app.post("/api/admin/plans", isAdmin, async (req: any, res) => {
    try {
      const planData = insertPlanSchema.parse(req.body);
      const plan = await storage.createPlan(planData);
      res.status(201).json(plan);
    } catch (error) {
      console.error("Error creating plan:", error);
      res.status(500).json({ message: "Failed to create plan" });
    }
  });

  app.patch("/api/admin/plans/:id", isAdmin, async (req: any, res) => {
    try {
      const planId = parseInt(req.params.id);
      const updates = req.body;
      const plan = await storage.updatePlan(planId, updates);
      res.json(plan);
    } catch (error) {
      console.error("Error updating plan:", error);
      res.status(500).json({ message: "Failed to update plan" });
    }
  });

  app.delete("/api/admin/plans/:id", isAdmin, async (req: any, res) => {
    try {
      const planId = parseInt(req.params.id);
      await storage.deletePlan(planId);
      res.json({ message: "Plan deleted successfully" });
    } catch (error) {
      console.error("Error deleting plan:", error);
      res.status(500).json({ message: "Failed to delete plan" });
    }
  });

  // User subscription routes
  app.get("/api/user/subscriptions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const subscriptions = await storage.getUserSubscriptions(userId);
      res.json(subscriptions);
    } catch (error) {
      console.error("Error fetching user subscriptions:", error);
      res.status(500).json({ message: "Failed to fetch subscriptions" });
    }
  });

  app.post("/api/user/subscriptions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { planId } = req.body;
      
      // Deactivate current subscription
      const currentSubscriptions = await storage.getUserSubscriptions(userId);
      const currentActive = currentSubscriptions.find(sub => sub.isActive);
      
      if (currentActive) {
        await storage.updateUserSubscription(currentActive.id, { isActive: false });
      }
      
      // Create new subscription
      const newSubscription = await storage.createUserSubscription({
        userId,
        planId,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        isActive: true
      });
      
      res.status(201).json(newSubscription);
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: "Failed to create subscription" });
    }
  });

  // WhatsApp routes
  app.get('/api/whatsapp/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const messages = await storage.getWhatsappMessages(userId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching WhatsApp messages:", error);
      res.status(500).json({ message: "Failed to fetch WhatsApp messages" });
    }
  });

  app.post('/api/whatsapp/send-reminder', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { receivableId } = req.body;
      
      // Buscar o recebível e cliente
      const receivable = await storage.getReceivable(receivableId, userId);
      if (!receivable) {
        return res.status(404).json({ message: "Receivable not found" });
      }
      
      const client = await storage.getClient(receivable.clientId, userId);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      const whatsappService = getWhatsAppService();
      if (!whatsappService) {
        return res.status(500).json({ message: "WhatsApp service not configured" });
      }
      
      const success = await whatsappService.sendPaymentReminder(
        client.id,
        client.name,
        client.whatsapp,
        parseFloat(receivable.amount),
        new Date(receivable.dueDate),
        receivable.description,
        userId
      );
      
      if (success) {
        res.json({ message: "Reminder sent successfully" });
      } else {
        res.status(500).json({ message: "Failed to send reminder" });
      }
    } catch (error) {
      console.error("Error sending reminder:", error);
      res.status(500).json({ message: "Failed to send reminder" });
    }
  });

  app.post('/api/whatsapp/send-overdue', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { receivableId } = req.body;
      
      // Buscar o recebível e cliente
      const receivable = await storage.getReceivable(receivableId, userId);
      if (!receivable) {
        return res.status(404).json({ message: "Receivable not found" });
      }
      
      const client = await storage.getClient(receivable.clientId, userId);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      const whatsappService = getWhatsAppService();
      if (!whatsappService) {
        return res.status(500).json({ message: "WhatsApp service not configured" });
      }
      
      const success = await whatsappService.sendOverdueNotification(
        client.id,
        client.name,
        client.whatsapp,
        parseFloat(receivable.amount),
        new Date(receivable.dueDate),
        receivable.description,
        userId
      );
      
      if (success) {
        res.json({ message: "Overdue notification sent successfully" });
      } else {
        res.status(500).json({ message: "Failed to send overdue notification" });
      }
    } catch (error) {
      console.error("Error sending overdue notification:", error);
      res.status(500).json({ message: "Failed to send overdue notification" });
    }
  });

  app.post('/api/whatsapp/send-confirmation', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { installmentSaleId } = req.body;
      
      // Buscar a venda parcelada e cliente
      const sale = await storage.getInstallmentSale(installmentSaleId, userId);
      if (!sale) {
        return res.status(404).json({ message: "Installment sale not found" });
      }
      
      const client = await storage.getClient(sale.clientId, userId);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      const whatsappService = getWhatsAppService();
      if (!whatsappService) {
        return res.status(500).json({ message: "WhatsApp service not configured" });
      }
      
      const success = await whatsappService.sendInstallmentConfirmationRequest(
        client.id,
        client.name,
        client.whatsapp,
        sale.description,
        parseFloat(sale.totalAmount),
        sale.installmentCount,
        sale.confirmationToken,
        userId
      );
      
      if (success) {
        res.json({ message: "Confirmation request sent successfully" });
      } else {
        res.status(500).json({ message: "Failed to send confirmation request" });
      }
    } catch (error) {
      console.error("Error sending confirmation request:", error);
      res.status(500).json({ message: "Failed to send confirmation request" });
    }
  });

  app.get('/api/whatsapp/test-connection', isAuthenticated, async (req: any, res) => {
    try {
      const whatsappService = getWhatsAppService();
      if (!whatsappService) {
        return res.status(500).json({ 
          message: "WhatsApp service not configured", 
          configured: false 
        });
      }
      
      const isConnected = await whatsappService.testConnection();
      res.json({ 
        message: isConnected ? "Connection successful" : "Connection failed",
        connected: isConnected,
        configured: true
      });
    } catch (error) {
      console.error("Error testing WhatsApp connection:", error);
      res.status(500).json({ message: "Failed to test connection" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}