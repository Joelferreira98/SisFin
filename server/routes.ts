import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertClientSchema, insertReceivableSchema, insertPayableSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Client routes
  app.get('/api/clients', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const clients = await storage.getClients(userId);
      res.json(clients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.post('/api/clients', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
      const receivables = await storage.getReceivables(userId);
      res.json(receivables);
    } catch (error) {
      console.error("Error fetching receivables:", error);
      res.status(500).json({ message: "Failed to fetch receivables" });
    }
  });

  app.post('/api/receivables', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
      const payables = await storage.getPayables(userId);
      res.json(payables);
    } catch (error) {
      console.error("Error fetching payables:", error);
      res.status(500).json({ message: "Failed to fetch payables" });
    }
  });

  app.post('/api/payables', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
      const payableId = parseInt(req.params.id);
      await storage.deletePayable(payableId, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting payable:", error);
      res.status(500).json({ message: "Failed to delete payable" });
    }
  });

  // Dashboard route
  app.get('/api/dashboard', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const dashboardData = await storage.getDashboardData(userId);
      res.json(dashboardData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  // WhatsApp routes
  app.get('/api/whatsapp/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const messages = await storage.getWhatsappMessages(userId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching WhatsApp messages:", error);
      res.status(500).json({ message: "Failed to fetch WhatsApp messages" });
    }
  });

  app.post('/api/whatsapp/send', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { clientId, content, templateType } = req.body;
      
      // Simulate sending WhatsApp message
      const message = await storage.createWhatsappMessage({
        clientId,
        content,
        templateType,
        status: 'delivered'
      }, userId);
      
      res.status(201).json(message);
    } catch (error) {
      console.error("Error sending WhatsApp message:", error);
      res.status(500).json({ message: "Failed to send WhatsApp message" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
