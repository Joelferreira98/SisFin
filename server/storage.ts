import {
  users,
  clients,
  receivables,
  payables,
  whatsappMessages,
  type User,
  type UpsertUser,
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
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Client operations
  getClients(userId: string): Promise<Client[]>;
  getClient(id: number, userId: string): Promise<Client | undefined>;
  createClient(client: InsertClient, userId: string): Promise<Client>;
  updateClient(id: number, client: Partial<InsertClient>, userId: string): Promise<Client>;
  deleteClient(id: number, userId: string): Promise<void>;
  
  // Receivable operations
  getReceivables(userId: string): Promise<(Receivable & { client: Client })[]>;
  getReceivable(id: number, userId: string): Promise<Receivable | undefined>;
  createReceivable(receivable: InsertReceivable, userId: string): Promise<Receivable>;
  updateReceivable(id: number, receivable: Partial<InsertReceivable>, userId: string): Promise<Receivable>;
  deleteReceivable(id: number, userId: string): Promise<void>;
  
  // Payable operations
  getPayables(userId: string): Promise<(Payable & { receiver: Client })[]>;
  getPayable(id: number, userId: string): Promise<Payable | undefined>;
  createPayable(payable: InsertPayable, userId: string): Promise<Payable>;
  updatePayable(id: number, payable: Partial<InsertPayable>, userId: string): Promise<Payable>;
  deletePayable(id: number, userId: string): Promise<void>;
  
  // WhatsApp operations
  getWhatsappMessages(userId: string): Promise<(WhatsappMessage & { client: Client })[]>;
  createWhatsappMessage(message: InsertWhatsappMessage, userId: string): Promise<WhatsappMessage>;
  
  // Dashboard operations
  getDashboardData(userId: string): Promise<{
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
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Client operations
  async getClients(userId: string): Promise<Client[]> {
    return await db
      .select()
      .from(clients)
      .where(eq(clients.userId, userId))
      .orderBy(asc(clients.name));
  }

  async getClient(id: number, userId: string): Promise<Client | undefined> {
    const [client] = await db
      .select()
      .from(clients)
      .where(and(eq(clients.id, id), eq(clients.userId, userId)));
    return client;
  }

  async createClient(client: InsertClient, userId: string): Promise<Client> {
    const [newClient] = await db
      .insert(clients)
      .values({ ...client, userId })
      .returning();
    return newClient;
  }

  async updateClient(id: number, client: Partial<InsertClient>, userId: string): Promise<Client> {
    const [updatedClient] = await db
      .update(clients)
      .set({ ...client, updatedAt: new Date() })
      .where(and(eq(clients.id, id), eq(clients.userId, userId)))
      .returning();
    return updatedClient;
  }

  async deleteClient(id: number, userId: string): Promise<void> {
    await db
      .delete(clients)
      .where(and(eq(clients.id, id), eq(clients.userId, userId)));
  }

  // Receivable operations
  async getReceivables(userId: string): Promise<(Receivable & { client: Client })[]> {
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
        client: clients,
      })
      .from(receivables)
      .innerJoin(clients, eq(receivables.clientId, clients.id))
      .where(eq(receivables.userId, userId))
      .orderBy(desc(receivables.dueDate));
  }

  async getReceivable(id: number, userId: string): Promise<Receivable | undefined> {
    const [receivable] = await db
      .select()
      .from(receivables)
      .where(and(eq(receivables.id, id), eq(receivables.userId, userId)));
    return receivable;
  }

  async createReceivable(receivable: InsertReceivable, userId: string): Promise<Receivable> {
    const [newReceivable] = await db
      .insert(receivables)
      .values({ ...receivable, userId })
      .returning();
    return newReceivable;
  }

  async updateReceivable(id: number, receivable: Partial<InsertReceivable>, userId: string): Promise<Receivable> {
    const [updatedReceivable] = await db
      .update(receivables)
      .set({ ...receivable, updatedAt: new Date() })
      .where(and(eq(receivables.id, id), eq(receivables.userId, userId)))
      .returning();
    return updatedReceivable;
  }

  async deleteReceivable(id: number, userId: string): Promise<void> {
    await db
      .delete(receivables)
      .where(and(eq(receivables.id, id), eq(receivables.userId, userId)));
  }

  // Payable operations
  async getPayables(userId: string): Promise<(Payable & { receiver: Client })[]> {
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
        receiver: clients,
      })
      .from(payables)
      .innerJoin(clients, eq(payables.receiverId, clients.id))
      .where(eq(payables.userId, userId))
      .orderBy(desc(payables.dueDate));
  }

  async getPayable(id: number, userId: string): Promise<Payable | undefined> {
    const [payable] = await db
      .select()
      .from(payables)
      .where(and(eq(payables.id, id), eq(payables.userId, userId)));
    return payable;
  }

  async createPayable(payable: InsertPayable, userId: string): Promise<Payable> {
    const [newPayable] = await db
      .insert(payables)
      .values({ ...payable, userId })
      .returning();
    return newPayable;
  }

  async updatePayable(id: number, payable: Partial<InsertPayable>, userId: string): Promise<Payable> {
    const [updatedPayable] = await db
      .update(payables)
      .set({ ...payable, updatedAt: new Date() })
      .where(and(eq(payables.id, id), eq(payables.userId, userId)))
      .returning();
    return updatedPayable;
  }

  async deletePayable(id: number, userId: string): Promise<void> {
    await db
      .delete(payables)
      .where(and(eq(payables.id, id), eq(payables.userId, userId)));
  }

  // WhatsApp operations
  async getWhatsappMessages(userId: string): Promise<(WhatsappMessage & { client: Client })[]> {
    return await db
      .select({
        id: whatsappMessages.id,
        userId: whatsappMessages.userId,
        clientId: whatsappMessages.clientId,
        content: whatsappMessages.content,
        templateType: whatsappMessages.templateType,
        status: whatsappMessages.status,
        sentAt: whatsappMessages.sentAt,
        client: clients,
      })
      .from(whatsappMessages)
      .innerJoin(clients, eq(whatsappMessages.clientId, clients.id))
      .where(eq(whatsappMessages.userId, userId))
      .orderBy(desc(whatsappMessages.sentAt));
  }

  async createWhatsappMessage(message: InsertWhatsappMessage, userId: string): Promise<WhatsappMessage> {
    const [newMessage] = await db
      .insert(whatsappMessages)
      .values({ ...message, userId })
      .returning();
    return newMessage;
  }

  // Dashboard operations
  async getDashboardData(userId: string): Promise<{
    totalReceivable: number;
    totalPayable: number;
    totalOverdue: number;
    balance: number;
    upcomingPayments: (Receivable & { client: Client })[];
    recentActivities: any[];
  }> {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Get total receivables
    const totalReceivableResult = await db
      .select({ total: sql<number>`sum(${receivables.amount})` })
      .from(receivables)
      .where(and(eq(receivables.userId, userId), eq(receivables.status, 'pending')));

    // Get total payables
    const totalPayableResult = await db
      .select({ total: sql<number>`sum(${payables.amount})` })
      .from(payables)
      .where(and(eq(payables.userId, userId), eq(payables.status, 'pending')));

    // Get overdue receivables
    const totalOverdueResult = await db
      .select({ total: sql<number>`sum(${receivables.amount})` })
      .from(receivables)
      .where(and(
        eq(receivables.userId, userId),
        eq(receivables.status, 'pending'),
        sql`${receivables.dueDate} < ${now}`
      ));

    // Get upcoming payments
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
        client: clients,
      })
      .from(receivables)
      .innerJoin(clients, eq(receivables.clientId, clients.id))
      .where(and(
        eq(receivables.userId, userId),
        eq(receivables.status, 'pending'),
        sql`${receivables.dueDate} <= ${nextWeek}`
      ))
      .orderBy(asc(receivables.dueDate))
      .limit(5);

    const totalReceivable = totalReceivableResult[0]?.total || 0;
    const totalPayable = totalPayableResult[0]?.total || 0;
    const totalOverdue = totalOverdueResult[0]?.total || 0;
    const balance = totalReceivable - totalPayable;

    return {
      totalReceivable,
      totalPayable,
      totalOverdue,
      balance,
      upcomingPayments,
      recentActivities: [], // This would be populated with actual activities
    };
  }
}

export const storage = new DatabaseStorage();
