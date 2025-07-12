import {
  users,
  clients,
  receivables,
  payables,
  whatsappMessages,
  type User,
  type InsertUser,
  type Client,
  type InsertClient,
  type Receivable,
  type InsertReceivable,
  type Payable,
  type InsertPayable,
  type WhatsappMessage,
  type InsertWhatsappMessage,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, sql, or } from "drizzle-orm";

export interface IStorage {
  // User operations (required for custom auth)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Client operations
  getClients(userId: number): Promise<Client[]>;
  getClient(id: number, userId: number): Promise<Client | undefined>;
  createClient(client: InsertClient, userId: number): Promise<Client>;
  updateClient(id: number, client: Partial<InsertClient>, userId: number): Promise<Client>;
  deleteClient(id: number, userId: number): Promise<void>;
  
  // Receivable operations
  getReceivables(userId: number): Promise<(Receivable & { client: Client })[]>;
  getReceivable(id: number, userId: number): Promise<Receivable | undefined>;
  createReceivable(receivable: InsertReceivable, userId: number): Promise<Receivable>;
  updateReceivable(id: number, receivable: Partial<InsertReceivable>, userId: number): Promise<Receivable>;
  deleteReceivable(id: number, userId: number): Promise<void>;
  
  // Payable operations
  getPayables(userId: number): Promise<(Payable & { receiver: Client })[]>;
  getPayable(id: number, userId: number): Promise<Payable | undefined>;
  createPayable(payable: InsertPayable, userId: number): Promise<Payable>;
  updatePayable(id: number, payable: Partial<InsertPayable>, userId: number): Promise<Payable>;
  deletePayable(id: number, userId: number): Promise<void>;
  
  // WhatsApp operations
  getWhatsappMessages(userId: number): Promise<(WhatsappMessage & { client: Client })[]>;
  createWhatsappMessage(message: InsertWhatsappMessage, userId: number): Promise<WhatsappMessage>;
  
  // Dashboard operations
  getDashboardData(userId: number): Promise<{
    totalReceivable: number;
    totalPayable: number;
    totalOverdue: number;
    balance: number;
    upcomingPayments: (Receivable & { client: Client })[];
    recentActivities: any[];
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  // Client operations
  async getClients(userId: number): Promise<Client[]> {
    return await db
      .select()
      .from(clients)
      .where(eq(clients.userId, userId))
      .orderBy(asc(clients.name));
  }

  async getClient(id: number, userId: number): Promise<Client | undefined> {
    const [client] = await db
      .select()
      .from(clients)
      .where(and(eq(clients.id, id), eq(clients.userId, userId)));
    return client;
  }

  async createClient(client: InsertClient, userId: number): Promise<Client> {
    const [newClient] = await db
      .insert(clients)
      .values({ ...client, userId })
      .returning();
    return newClient;
  }

  async updateClient(id: number, client: Partial<InsertClient>, userId: number): Promise<Client> {
    const [updatedClient] = await db
      .update(clients)
      .set({ ...client, updatedAt: new Date() })
      .where(and(eq(clients.id, id), eq(clients.userId, userId)))
      .returning();
    return updatedClient;
  }

  async deleteClient(id: number, userId: number): Promise<void> {
    await db
      .delete(clients)
      .where(and(eq(clients.id, id), eq(clients.userId, userId)));
  }

  // Receivable operations
  async getReceivables(userId: number): Promise<(Receivable & { client: Client })[]> {
    return await db
      .select({
        id: receivables.id,
        userId: receivables.userId,
        clientId: receivables.clientId,
        description: receivables.description,
        amount: receivables.amount,
        dueDate: receivables.dueDate,
        status: receivables.status,
        type: receivables.type,
        installmentNumber: receivables.installmentNumber,
        totalInstallments: receivables.totalInstallments,
        parentId: receivables.parentId,
        createdAt: receivables.createdAt,
        updatedAt: receivables.updatedAt,
        client: {
          id: clients.id,
          name: clients.name,
          whatsapp: clients.whatsapp,
          document: clients.document,
          email: clients.email,
          address: clients.address,
          zipCode: clients.zipCode,
          city: clients.city,
          state: clients.state,
          userId: clients.userId,
          createdAt: clients.createdAt,
          updatedAt: clients.updatedAt,
        },
      })
      .from(receivables)
      .innerJoin(clients, eq(receivables.clientId, clients.id))
      .where(eq(receivables.userId, userId))
      .orderBy(desc(receivables.dueDate));
  }

  async getReceivable(id: number, userId: number): Promise<Receivable | undefined> {
    const [receivable] = await db
      .select()
      .from(receivables)
      .where(and(eq(receivables.id, id), eq(receivables.userId, userId)));
    return receivable;
  }

  async createReceivable(receivable: InsertReceivable, userId: number): Promise<Receivable> {
    const [newReceivable] = await db
      .insert(receivables)
      .values({ ...receivable, userId })
      .returning();
    return newReceivable;
  }

  async updateReceivable(id: number, receivable: Partial<InsertReceivable>, userId: number): Promise<Receivable> {
    const [updatedReceivable] = await db
      .update(receivables)
      .set({ ...receivable, updatedAt: new Date() })
      .where(and(eq(receivables.id, id), eq(receivables.userId, userId)))
      .returning();
    return updatedReceivable;
  }

  async deleteReceivable(id: number, userId: number): Promise<void> {
    await db
      .delete(receivables)
      .where(and(eq(receivables.id, id), eq(receivables.userId, userId)));
  }

  // Payable operations
  async getPayables(userId: number): Promise<(Payable & { receiver: Client })[]> {
    return await db
      .select({
        id: payables.id,
        userId: payables.userId,
        receiverId: payables.receiverId,
        description: payables.description,
        amount: payables.amount,
        dueDate: payables.dueDate,
        status: payables.status,
        type: payables.type,
        installmentNumber: payables.installmentNumber,
        totalInstallments: payables.totalInstallments,
        parentId: payables.parentId,
        createdAt: payables.createdAt,
        updatedAt: payables.updatedAt,
        receiver: {
          id: clients.id,
          name: clients.name,
          whatsapp: clients.whatsapp,
          document: clients.document,
          email: clients.email,
          address: clients.address,
          zipCode: clients.zipCode,
          city: clients.city,
          state: clients.state,
          userId: clients.userId,
          createdAt: clients.createdAt,
          updatedAt: clients.updatedAt,
        },
      })
      .from(payables)
      .innerJoin(clients, eq(payables.receiverId, clients.id))
      .where(eq(payables.userId, userId))
      .orderBy(desc(payables.dueDate));
  }

  async getPayable(id: number, userId: number): Promise<Payable | undefined> {
    const [payable] = await db
      .select()
      .from(payables)
      .where(and(eq(payables.id, id), eq(payables.userId, userId)));
    return payable;
  }

  async createPayable(payable: InsertPayable, userId: number): Promise<Payable> {
    const [newPayable] = await db
      .insert(payables)
      .values({ ...payable, userId })
      .returning();
    return newPayable;
  }

  async updatePayable(id: number, payable: Partial<InsertPayable>, userId: number): Promise<Payable> {
    const [updatedPayable] = await db
      .update(payables)
      .set({ ...payable, updatedAt: new Date() })
      .where(and(eq(payables.id, id), eq(payables.userId, userId)))
      .returning();
    return updatedPayable;
  }

  async deletePayable(id: number, userId: number): Promise<void> {
    await db
      .delete(payables)
      .where(and(eq(payables.id, id), eq(payables.userId, userId)));
  }

  // WhatsApp operations
  async getWhatsappMessages(userId: number): Promise<(WhatsappMessage & { client: Client })[]> {
    return await db
      .select({
        id: whatsappMessages.id,
        userId: whatsappMessages.userId,
        clientId: whatsappMessages.clientId,
        content: whatsappMessages.content,
        status: whatsappMessages.status,
        templateType: whatsappMessages.templateType,
        sentAt: whatsappMessages.sentAt,
        client: {
          id: clients.id,
          name: clients.name,
          whatsapp: clients.whatsapp,
          document: clients.document,
          email: clients.email,
          address: clients.address,
          zipCode: clients.zipCode,
          city: clients.city,
          state: clients.state,
          userId: clients.userId,
          createdAt: clients.createdAt,
          updatedAt: clients.updatedAt,
        },
      })
      .from(whatsappMessages)
      .innerJoin(clients, eq(whatsappMessages.clientId, clients.id))
      .where(eq(whatsappMessages.userId, userId))
      .orderBy(desc(whatsappMessages.sentAt));
  }

  async createWhatsappMessage(message: InsertWhatsappMessage, userId: number): Promise<WhatsappMessage> {
    const [newMessage] = await db
      .insert(whatsappMessages)
      .values({ ...message, userId, sentAt: new Date() })
      .returning();
    return newMessage;
  }

  // Dashboard operations
  async getDashboardData(userId: number): Promise<{
    totalReceivable: number;
    totalPayable: number;
    totalOverdue: number;
    balance: number;
    upcomingPayments: (Receivable & { client: Client })[];
    recentActivities: any[];
  }> {
    const today = new Date();
    
    // Get total receivables
    const totalReceivableResult = await db
      .select({
        total: sql<number>`COALESCE(SUM(CAST(${receivables.amount} AS DECIMAL)), 0)`,
      })
      .from(receivables)
      .where(and(eq(receivables.userId, userId), eq(receivables.status, 'pending')));

    // Get total payables
    const totalPayableResult = await db
      .select({
        total: sql<number>`COALESCE(SUM(CAST(${payables.amount} AS DECIMAL)), 0)`,
      })
      .from(payables)
      .where(and(eq(payables.userId, userId), eq(payables.status, 'pending')));

    // Get overdue receivables
    const overdueResult = await db
      .select({
        total: sql<number>`COALESCE(SUM(CAST(${receivables.amount} AS DECIMAL)), 0)`,
      })
      .from(receivables)
      .where(and(
        eq(receivables.userId, userId),
        eq(receivables.status, 'pending'),
        sql`${receivables.dueDate} < ${today}`
      ));

    // Get upcoming payments (next 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const upcomingPayments = await db
      .select({
        id: receivables.id,
        userId: receivables.userId,
        clientId: receivables.clientId,
        description: receivables.description,
        amount: receivables.amount,
        dueDate: receivables.dueDate,
        status: receivables.status,
        type: receivables.type,
        installmentNumber: receivables.installmentNumber,
        totalInstallments: receivables.totalInstallments,
        parentId: receivables.parentId,
        createdAt: receivables.createdAt,
        updatedAt: receivables.updatedAt,
        client: {
          id: clients.id,
          name: clients.name,
          whatsapp: clients.whatsapp,
          document: clients.document,
          email: clients.email,
          address: clients.address,
          zipCode: clients.zipCode,
          city: clients.city,
          state: clients.state,
          userId: clients.userId,
          createdAt: clients.createdAt,
          updatedAt: clients.updatedAt,
        },
      })
      .from(receivables)
      .innerJoin(clients, eq(receivables.clientId, clients.id))
      .where(and(
        eq(receivables.userId, userId),
        eq(receivables.status, 'pending'),
        sql`${receivables.dueDate} BETWEEN ${today} AND ${thirtyDaysFromNow}`
      ))
      .orderBy(asc(receivables.dueDate))
      .limit(10);

    const totalReceivable = Number(totalReceivableResult[0]?.total || 0);
    const totalPayable = Number(totalPayableResult[0]?.total || 0);
    const totalOverdue = Number(overdueResult[0]?.total || 0);
    const balance = totalReceivable - totalPayable;

    return {
      totalReceivable,
      totalPayable,
      totalOverdue,
      balance,
      upcomingPayments,
      recentActivities: [], // This can be implemented later
    };
  }
}

export const storage = new DatabaseStorage();