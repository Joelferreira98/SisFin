import {
  users,
  clients,
  receivables,
  payables,
  whatsappMessages,
  plans,
  userSubscriptions,
  installmentSales,
  userWhatsappInstances,
  systemSettings,
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
  type Plan,
  type InsertPlan,
  type UserSubscription,
  type InsertUserSubscription,
  type InstallmentSale,
  type InsertInstallmentSale,
  type UserWhatsappInstance,
  type InsertUserWhatsappInstance,
  type SystemSetting,
  type InsertSystemSetting,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, sql, or } from "drizzle-orm";

export interface IStorage {
  // User operations (required for custom auth)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Admin operations
  getAllUsers(): Promise<User[]>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
  deleteUser(id: number): Promise<void>;
  getUserStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    totalTransactions: number;
    totalVolume: number;
    subscriptionStats: { [key: string]: number };
  }>;
  
  // Plan operations
  getPlans(): Promise<Plan[]>;
  getPlan(id: number): Promise<Plan | undefined>;
  createPlan(plan: InsertPlan): Promise<Plan>;
  updatePlan(id: number, plan: Partial<InsertPlan>): Promise<Plan>;
  deletePlan(id: number): Promise<void>;
  
  // Subscription operations
  getUserSubscriptions(userId: number): Promise<(UserSubscription & { plan: Plan })[]>;
  createUserSubscription(subscription: InsertUserSubscription): Promise<UserSubscription>;
  
  // Admin check
  isUserAdmin(userId: number): Promise<boolean>;
  
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
  
  // User WhatsApp instances
  getUserWhatsappInstances(userId: number): Promise<UserWhatsappInstance[]>;
  createUserWhatsappInstance(instance: InsertUserWhatsappInstance, userId: number): Promise<UserWhatsappInstance>;
  updateUserWhatsappInstance(instanceId: number, instance: Partial<UserWhatsappInstance>, userId: number): Promise<UserWhatsappInstance>;
  deleteUserWhatsappInstance(instanceId: number, userId: number): Promise<void>;
  getUserWhatsappInstanceByName(instanceName: string, userId: number): Promise<UserWhatsappInstance | undefined>;
  
  // System settings
  getSystemSetting(key: string): Promise<SystemSetting | undefined>;
  setSystemSetting(key: string, value: string, description?: string): Promise<SystemSetting>;
  getAllSystemSettings(): Promise<SystemSetting[]>;
  deleteSystemSetting(key: string): Promise<void>;
  
  // Dashboard operations
  getDashboardData(userId: number): Promise<{
    totalReceivable: number;
    totalPayable: number;
    totalOverdue: number;
    balance: number;
    upcomingPayments: (Receivable & { client: Client })[];
    recentActivities: any[];
  }>;

  // Installment Sales operations
  getInstallmentSales(userId: number): Promise<(InstallmentSale & { client: Client })[]>;
  getInstallmentSale(id: number, userId: number): Promise<InstallmentSale | undefined>;
  getInstallmentSaleByToken(token: string): Promise<(InstallmentSale & { client: Client, user: User }) | undefined>;
  createInstallmentSale(sale: InsertInstallmentSale, userId: number): Promise<InstallmentSale>;
  updateInstallmentSale(id: number, sale: Partial<InstallmentSale>, userId: number): Promise<InstallmentSale>;
  updateInstallmentSaleByToken(token: string, updates: Partial<InstallmentSale>): Promise<InstallmentSale>;
  deleteInstallmentSale(id: number, userId: number): Promise<void>;
  generateConfirmationToken(): string;
  createReceivablesFromInstallmentSale(saleId: number, userId: number): Promise<void>;
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

  // Admin operations
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getUserStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    totalTransactions: number;
    totalVolume: number;
    subscriptionStats: { [key: string]: number };
  }> {
    const [userCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);
    
    const [receivableStats] = await db
      .select({ 
        count: sql<number>`count(*)`,
        sum: sql<number>`coalesce(sum(${receivables.amount}), 0)`
      })
      .from(receivables);
    
    const [payableStats] = await db
      .select({ 
        count: sql<number>`count(*)`,
        sum: sql<number>`coalesce(sum(${payables.amount}), 0)`
      })
      .from(payables);

    return {
      totalUsers: userCount.count,
      activeUsers: userCount.count, // Assumindo que todos estão ativos
      totalTransactions: (receivableStats.count || 0) + (payableStats.count || 0),
      totalVolume: parseFloat(receivableStats.sum?.toString() || '0') + parseFloat(payableStats.sum?.toString() || '0'),
      subscriptionStats: { free: userCount.count }, // Assumindo que todos são free
    };
  }

  // Plan operations
  async getPlans(): Promise<Plan[]> {
    return await db.select().from(plans).where(eq(plans.isActive, true)).orderBy(plans.price);
  }

  async getPlan(id: number): Promise<Plan | undefined> {
    const [plan] = await db.select().from(plans).where(eq(plans.id, id));
    return plan;
  }

  async createPlan(planData: InsertPlan): Promise<Plan> {
    const [plan] = await db
      .insert(plans)
      .values(planData)
      .returning();
    return plan;
  }

  async updatePlan(id: number, planData: Partial<InsertPlan>): Promise<Plan> {
    const [plan] = await db
      .update(plans)
      .set({ ...planData, updatedAt: new Date() })
      .where(eq(plans.id, id))
      .returning();
    return plan;
  }

  async deletePlan(id: number): Promise<void> {
    await db.update(plans).set({ isActive: false }).where(eq(plans.id, id));
  }

  // Subscription operations
  async getUserSubscriptions(userId: number): Promise<(UserSubscription & { plan: Plan })[]> {
    return await db
      .select({
        id: userSubscriptions.id,
        userId: userSubscriptions.userId,
        planId: userSubscriptions.planId,
        startDate: userSubscriptions.startDate,
        endDate: userSubscriptions.endDate,
        isActive: userSubscriptions.isActive,
        createdAt: userSubscriptions.createdAt,
        updatedAt: userSubscriptions.updatedAt,
        plan: plans,
      })
      .from(userSubscriptions)
      .leftJoin(plans, eq(userSubscriptions.planId, plans.id))
      .where(eq(userSubscriptions.userId, userId));
  }

  async createUserSubscription(subscriptionData: InsertUserSubscription): Promise<UserSubscription> {
    const [subscription] = await db
      .insert(userSubscriptions)
      .values(subscriptionData)
      .returning();
    return subscription;
  }

  // Admin check
  async isUserAdmin(userId: number): Promise<boolean> {
    const [user] = await db.select({ isAdmin: users.isAdmin }).from(users).where(eq(users.id, userId));
    return user?.isAdmin || false;
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

  // Installment Sales operations
  async getInstallmentSales(userId: number): Promise<(InstallmentSale & { client: Client })[]> {
    const sales = await db.select({
      id: installmentSales.id,
      userId: installmentSales.userId,
      clientId: installmentSales.clientId,
      description: installmentSales.description,
      totalAmount: installmentSales.totalAmount,
      installmentCount: installmentSales.installmentCount,
      installmentValue: installmentSales.installmentValue,
      firstDueDate: installmentSales.firstDueDate,
      confirmationToken: installmentSales.confirmationToken,
      status: installmentSales.status,
      documentPhotoUrl: installmentSales.documentPhotoUrl,
      clientSignedAt: installmentSales.clientSignedAt,
      userReviewedAt: installmentSales.userReviewedAt,
      userApprovedAt: installmentSales.userApprovedAt,
      notes: installmentSales.notes,
      createdAt: installmentSales.createdAt,
      updatedAt: installmentSales.updatedAt,
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
    }).from(installmentSales)
      .leftJoin(clients, eq(installmentSales.clientId, clients.id))
      .where(eq(installmentSales.userId, userId))
      .orderBy(desc(installmentSales.createdAt));

    return sales;
  }

  async getInstallmentSale(id: number, userId: number): Promise<InstallmentSale | undefined> {
    const [sale] = await db.select()
      .from(installmentSales)
      .where(and(eq(installmentSales.id, id), eq(installmentSales.userId, userId)));
    return sale;
  }

  async getInstallmentSaleByToken(token: string): Promise<(InstallmentSale & { client: Client, user: User }) | undefined> {
    const [sale] = await db.select({
      id: installmentSales.id,
      userId: installmentSales.userId,
      clientId: installmentSales.clientId,
      description: installmentSales.description,
      totalAmount: installmentSales.totalAmount,
      installmentCount: installmentSales.installmentCount,
      installmentValue: installmentSales.installmentValue,
      firstDueDate: installmentSales.firstDueDate,
      confirmationToken: installmentSales.confirmationToken,
      status: installmentSales.status,
      documentPhotoUrl: installmentSales.documentPhotoUrl,
      clientSignedAt: installmentSales.clientSignedAt,
      userReviewedAt: installmentSales.userReviewedAt,
      userApprovedAt: installmentSales.userApprovedAt,
      notes: installmentSales.notes,
      createdAt: installmentSales.createdAt,
      updatedAt: installmentSales.updatedAt,
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
      user: {
        id: users.id,
        username: users.username,
        email: users.email,
        password: users.password,
        firstName: users.firstName,
        lastName: users.lastName,
        isAdmin: users.isAdmin,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      },
    }).from(installmentSales)
      .leftJoin(clients, eq(installmentSales.clientId, clients.id))
      .leftJoin(users, eq(installmentSales.userId, users.id))
      .where(eq(installmentSales.confirmationToken, token));

    return sale;
  }

  generateConfirmationToken(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  async createInstallmentSale(sale: InsertInstallmentSale, userId: number): Promise<InstallmentSale> {
    const token = this.generateConfirmationToken();
    
    const [created] = await db.insert(installmentSales)
      .values({
        ...sale,
        userId,
        confirmationToken: token,
      })
      .returning();

    return created;
  }

  async updateInstallmentSale(id: number, sale: Partial<InstallmentSale>, userId: number): Promise<InstallmentSale> {
    const [updated] = await db.update(installmentSales)
      .set({ ...sale, updatedAt: new Date() })
      .where(and(eq(installmentSales.id, id), eq(installmentSales.userId, userId)))
      .returning();

    return updated;
  }

  async updateInstallmentSaleByToken(token: string, updates: Partial<InstallmentSale>): Promise<InstallmentSale> {
    const [updated] = await db.update(installmentSales)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(installmentSales.confirmationToken, token))
      .returning();

    return updated;
  }

  async deleteInstallmentSale(id: number, userId: number): Promise<void> {
    await db.delete(installmentSales)
      .where(and(eq(installmentSales.id, id), eq(installmentSales.userId, userId)));
  }

  async createReceivablesFromInstallmentSale(saleId: number, userId: number): Promise<void> {
    // First, get the installment sale details
    const sale = await this.getInstallmentSale(saleId, userId);
    if (!sale) {
      throw new Error("Installment sale not found");
    }

    // Calculate installment dates
    const firstDueDate = new Date(sale.firstDueDate);
    const installmentAmount = parseFloat(sale.installmentValue);
    
    // Create receivables for each installment
    const receivableData = [];
    for (let i = 0; i < sale.installmentCount; i++) {
      const dueDate = new Date(firstDueDate);
      dueDate.setMonth(dueDate.getMonth() + i);
      
      const receivable = {
        userId,
        clientId: sale.clientId,
        description: `${sale.description} - Parcela ${i + 1}/${sale.installmentCount}`,
        amount: installmentAmount,
        dueDate,
        status: 'pending' as const,
        type: 'installment' as const,
        installmentNumber: i + 1,
        totalInstallments: sale.installmentCount,
        parentId: saleId, // Reference to the original sale
      };
      
      receivableData.push(receivable);
    }

    // Insert all receivables
    await db.insert(receivables).values(receivableData);
  }

  // User WhatsApp instances methods
  async getUserWhatsappInstances(userId: number): Promise<UserWhatsappInstance[]> {
    return await db.query.userWhatsappInstances.findMany({
      where: eq(userWhatsappInstances.userId, userId),
      orderBy: [desc(userWhatsappInstances.createdAt)],
    });
  }

  async createUserWhatsappInstance(instance: InsertUserWhatsappInstance, userId: number): Promise<UserWhatsappInstance> {
    const [newInstance] = await db
      .insert(userWhatsappInstances)
      .values({
        ...instance,
        userId: userId,
      })
      .returning();
    return newInstance;
  }

  async updateUserWhatsappInstance(instanceId: number, instance: Partial<UserWhatsappInstance>, userId: number): Promise<UserWhatsappInstance> {
    const [updatedInstance] = await db
      .update(userWhatsappInstances)
      .set({
        ...instance,
        updatedAt: new Date(),
      })
      .where(and(eq(userWhatsappInstances.id, instanceId), eq(userWhatsappInstances.userId, userId)))
      .returning();
    
    if (!updatedInstance) {
      throw new Error('WhatsApp instance not found');
    }
    
    return updatedInstance;
  }

  async deleteUserWhatsappInstance(instanceId: number, userId: number): Promise<void> {
    await db
      .delete(userWhatsappInstances)
      .where(and(eq(userWhatsappInstances.id, instanceId), eq(userWhatsappInstances.userId, userId)));
  }

  async getUserWhatsappInstanceByName(instanceName: string, userId: number): Promise<UserWhatsappInstance | undefined> {
    return await db.query.userWhatsappInstances.findFirst({
      where: and(
        eq(userWhatsappInstances.instanceName, instanceName),
        eq(userWhatsappInstances.userId, userId)
      ),
    });
  }

  // System settings operations
  async getSystemSetting(key: string): Promise<SystemSetting | undefined> {
    const [setting] = await db.select().from(systemSettings).where(eq(systemSettings.key, key));
    return setting;
  }

  async setSystemSetting(key: string, value: string, description?: string): Promise<SystemSetting> {
    const [setting] = await db
      .insert(systemSettings)
      .values({ key, value, description })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: { value, description, updatedAt: new Date() },
      })
      .returning();
    return setting;
  }

  async getAllSystemSettings(): Promise<SystemSetting[]> {
    return await db.select().from(systemSettings).orderBy(systemSettings.key);
  }

  async deleteSystemSetting(key: string): Promise<void> {
    await db.delete(systemSettings).where(eq(systemSettings.key, key));
  }
}

export const storage = new DatabaseStorage();