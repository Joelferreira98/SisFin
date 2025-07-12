import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isAdmin } from "./auth";
import { insertClientSchema, insertReceivableSchema, insertPayableSchema, insertPlanSchema, insertInstallmentSaleSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  setupAuth(app);

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
      
      const sale = await storage.updateInstallmentSaleByToken(req.params.token, {
        documentPhotoUrl,
        clientSignedAt: new Date(),
        status: "confirmed"
      });
      
      res.json(sale);
    } catch (error) {
      console.error("Error confirming sale:", error);
      res.status(500).json({ message: "Failed to confirm sale" });
    }
  });

  // Route for user to review and approve sales
  app.post('/api/installment-sales/:id/approve', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const saleId = parseInt(req.params.id);
      const { approved, notes } = req.body;
      
      const sale = await storage.updateInstallmentSale(saleId, {
        status: approved ? "approved" : "rejected",
        userReviewedAt: new Date(),
        userApprovedAt: approved ? new Date() : null,
        notes
      }, userId);
      
      // If approved, create receivables for each installment
      if (approved) {
        await storage.createReceivablesFromInstallmentSale(saleId, userId);
      }
      
      res.json(sale);
    } catch (error) {
      console.error("Error updating sale status:", error);
      res.status(500).json({ message: "Failed to update sale status" });
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

  const httpServer = createServer(app);
  return httpServer;
}