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
  paymentReminders,
  reminderLogs,
  planChangeRequests,
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
  type PaymentReminder,
  type InsertPaymentReminder,
  type ReminderLog,
  type InsertReminderLog,
  type PlanChangeRequest,
  type InsertPlanChangeRequest,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, sql, or, exists, gte, lte } from "drizzle-orm";

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
  getFreePlan(): Promise<Plan | undefined>;
  createPlan(plan: InsertPlan): Promise<Plan>;
  updatePlan(id: number, plan: Partial<InsertPlan>): Promise<Plan>;
  deletePlan(id: number): Promise<void>;
  
  // Subscription operations
  getUserSubscriptions(userId: number): Promise<(UserSubscription & { plan: Plan })[]>;
  createUserSubscription(subscription: InsertUserSubscription): Promise<UserSubscription>;
  updateUserSubscription(id: number, subscription: Partial<InsertUserSubscription>): Promise<UserSubscription>;
  
  // Plan change requests operations
  createPlanChangeRequest(request: InsertPlanChangeRequest, userId: number): Promise<PlanChangeRequest>;
  getUserPlanChangeRequests(userId: number): Promise<(PlanChangeRequest & { currentPlan: Plan | null, requestedPlan: Plan, user: User })[]>;
  getAllPlanChangeRequests(): Promise<(PlanChangeRequest & { currentPlan: Plan | null, requestedPlan: Plan, user: User })[]>;
  getPlanChangeRequest(id: number): Promise<(PlanChangeRequest & { currentPlan: Plan | null, requestedPlan: Plan, user: User }) | undefined>;
  updatePlanChangeRequest(id: number, request: Partial<PlanChangeRequest>): Promise<PlanChangeRequest>;
  approvePlanChangeRequest(id: number, adminId: number, adminResponse?: string): Promise<void>;
  rejectPlanChangeRequest(id: number, adminId: number, adminResponse?: string): Promise<void>;
  
  // Admin check
  isUserAdmin(userId: number): Promise<boolean>;
  
  // Plan limitations
  getUserCurrentPlan(userId: number): Promise<Plan | undefined>;
  checkPlanLimit(userId: number, limitType: 'maxClients' | 'maxReceivables' | 'maxPayables' | 'maxWhatsappMessages'): Promise<{ canCreate: boolean; currentCount: number; maxLimit: number }>;
  getUserPlanUsage(userId: number): Promise<{ clients: number; receivables: number; payables: number; whatsappMessages: number }>;
  
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

  // Payment Reminders operations
  getPaymentReminders(userId: number): Promise<PaymentReminder[]>;
  getPaymentReminder(id: number, userId: number): Promise<PaymentReminder | undefined>;
  createPaymentReminder(reminder: InsertPaymentReminder, userId: number): Promise<PaymentReminder>;
  updatePaymentReminder(id: number, reminder: Partial<InsertPaymentReminder>, userId: number): Promise<PaymentReminder>;
  deletePaymentReminder(id: number, userId: number): Promise<void>;
  getActivePaymentReminders(userId: number): Promise<PaymentReminder[]>;

  // Reminder Logs operations
  getReminderLogs(userId: number): Promise<(ReminderLog & { reminder: PaymentReminder, receivable: Receivable, client: Client })[]>;
  createReminderLog(log: InsertReminderLog): Promise<ReminderLog>;
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

  async getFreePlan(): Promise<Plan | undefined> {
    const [plan] = await db.select().from(plans).where(eq(plans.price, 0)).limit(1);
    return plan;
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

  async updateUserSubscription(id: number, subscriptionData: Partial<InsertUserSubscription>): Promise<UserSubscription> {
    const [subscription] = await db
      .update(userSubscriptions)
      .set(subscriptionData)
      .where(eq(userSubscriptions.id, id))
      .returning();
    return subscription;
  }

  // Admin check
  async isUserAdmin(userId: number): Promise<boolean> {
    const [user] = await db.select({ isAdmin: users.isAdmin }).from(users).where(eq(users.id, userId));
    return user?.isAdmin || false;
  }

  // Plan limitations
  async getUserCurrentPlan(userId: number): Promise<Plan | undefined> {
    const subscriptions = await this.getUserSubscriptions(userId);
    const activeSubscription = subscriptions.find(sub => sub.isActive);
    return activeSubscription?.plan;
  }

  async getUserPlanUsage(userId: number): Promise<{ clients: number; receivables: number; payables: number; whatsappMessages: number }> {
    const [clientsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(clients)
      .where(eq(clients.userId, userId));

    const [receivablesCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(receivables)
      .where(eq(receivables.userId, userId));

    const [payablesCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(payables)
      .where(eq(payables.userId, userId));

    const [whatsappCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(whatsappMessages)
      .where(eq(whatsappMessages.userId, userId));

    return {
      clients: clientsCount.count,
      receivables: receivablesCount.count,
      payables: payablesCount.count,
      whatsappMessages: whatsappCount.count,
    };
  }

  async checkPlanLimit(userId: number, limitType: 'maxClients' | 'maxTransactions' | 'maxWhatsappMessages'): Promise<{ canCreate: boolean; currentCount: number; maxLimit: number }> {
    const plan = await this.getUserCurrentPlan(userId);
    if (!plan) {
      return { canCreate: false, currentCount: 0, maxLimit: 0 };
    }

    const usage = await this.getUserPlanUsage(userId);
    
    const limitMap = {
      maxClients: { current: usage.clients, max: plan.maxClients },
      maxTransactions: { current: usage.receivables + usage.payables, max: plan.maxTransactions },
      maxWhatsappMessages: { current: usage.whatsappMessages, max: -1 }, // WhatsApp messages unlimited for now
    };

    const limit = limitMap[limitType];
    const canCreate = limit.max === -1 || limit.current < limit.max; // -1 means unlimited

    return {
      canCreate,
      currentCount: limit.current,
      maxLimit: limit.max,
    };
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

    // Check if user has sufficient transaction limits
    const userSubscriptions = await this.getUserSubscriptions(userId);
    const activeSub = userSubscriptions.find(sub => sub.isActive);
    
    if (activeSub) {
      // Count current receivables
      const currentReceivables = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(receivables)
        .where(eq(receivables.userId, userId));
      
      const currentCount = Number(currentReceivables[0]?.count || 0);
      const maxTransactions = activeSub.plan.maxTransactions;
      
      // Check if creating all installments would exceed limit
      if (currentCount + sale.installmentCount > maxTransactions) {
        throw new Error(`Não é possível criar ${sale.installmentCount} parcelas. Limite de ${maxTransactions} transações atingido. Atual: ${currentCount}`);
      }
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

  // Payment Reminders operations
  async getPaymentReminders(userId: number): Promise<PaymentReminder[]> {
    return await db.select().from(paymentReminders).where(eq(paymentReminders.userId, userId)).orderBy(paymentReminders.name);
  }

  async getPaymentReminder(id: number, userId: number): Promise<PaymentReminder | undefined> {
    const [reminder] = await db.select().from(paymentReminders).where(and(eq(paymentReminders.id, id), eq(paymentReminders.userId, userId)));
    return reminder;
  }

  async createPaymentReminder(reminder: InsertPaymentReminder, userId: number): Promise<PaymentReminder> {
    const [newReminder] = await db
      .insert(paymentReminders)
      .values({
        ...reminder,
        userId: userId,
      })
      .returning();
    return newReminder;
  }

  async updatePaymentReminder(id: number, reminder: Partial<InsertPaymentReminder>, userId: number): Promise<PaymentReminder> {
    const [updatedReminder] = await db
      .update(paymentReminders)
      .set({
        ...reminder,
        updatedAt: new Date(),
      })
      .where(and(eq(paymentReminders.id, id), eq(paymentReminders.userId, userId)))
      .returning();
    
    if (!updatedReminder) {
      throw new Error('Payment reminder not found');
    }
    
    return updatedReminder;
  }

  async deletePaymentReminder(id: number, userId: number): Promise<void> {
    await db.delete(paymentReminders).where(and(eq(paymentReminders.id, id), eq(paymentReminders.userId, userId)));
  }

  async getActivePaymentReminders(userId: number): Promise<PaymentReminder[]> {
    return await db.select().from(paymentReminders).where(and(eq(paymentReminders.userId, userId), eq(paymentReminders.isActive, true)));
  }

  // Reminder Logs operations
  async getReminderLogs(userId: number): Promise<(ReminderLog & { reminder: PaymentReminder, receivable: Receivable, client: Client })[]> {
    // Get reminder logs for user's reminders
    const userReminders = await db.select({ id: paymentReminders.id })
      .from(paymentReminders)
      .where(eq(paymentReminders.userId, userId));
    
    if (userReminders.length === 0) {
      return [];
    }
    
    const reminderIds = userReminders.map(r => r.id);
    
    return await db.query.reminderLogs.findMany({
      where: sql`${reminderLogs.reminderId} IN (${reminderIds.join(',')})`,
      with: {
        reminder: true,
        receivable: true,
        client: true,
      },
      orderBy: [desc(reminderLogs.createdAt)],
    });
  }

  async createReminderLog(log: InsertReminderLog): Promise<ReminderLog> {
    const [newLog] = await db
      .insert(reminderLogs)
      .values(log)
      .returning();
    return newLog;
  }

  // Plan change requests operations
  async createPlanChangeRequest(request: InsertPlanChangeRequest, userId: number): Promise<PlanChangeRequest> {
    const [planChangeRequest] = await db
      .insert(planChangeRequests)
      .values({
        ...request,
        userId,
      })
      .returning();
    return planChangeRequest;
  }

  async getUserPlanChangeRequests(userId: number): Promise<(PlanChangeRequest & { currentPlan: Plan | null, requestedPlan: Plan, user: User })[]> {
    const results = await db.query.planChangeRequests.findMany({
      where: eq(planChangeRequests.userId, userId),
      with: {
        user: true,
        currentPlan: true,
        requestedPlan: true,
      },
      orderBy: [desc(planChangeRequests.createdAt)],
    });
    
    return results as any;
  }

  async getAllPlanChangeRequests(): Promise<(PlanChangeRequest & { currentPlan: Plan | null, requestedPlan: Plan, user: User })[]> {
    const results = await db.query.planChangeRequests.findMany({
      with: {
        user: true,
        currentPlan: true,
        requestedPlan: true,
      },
      orderBy: [desc(planChangeRequests.createdAt)],
    });
    
    return results as any;
  }

  async getPlanChangeRequest(id: number): Promise<(PlanChangeRequest & { currentPlan: Plan | null, requestedPlan: Plan, user: User }) | undefined> {
    const result = await db.query.planChangeRequests.findFirst({
      where: eq(planChangeRequests.id, id),
      with: {
        user: true,
        currentPlan: true,
        requestedPlan: true,
      },
    });
    
    return result as any;
  }

  async updatePlanChangeRequest(id: number, request: Partial<PlanChangeRequest>): Promise<PlanChangeRequest> {
    const [updated] = await db
      .update(planChangeRequests)
      .set({
        ...request,
        updatedAt: new Date(),
      })
      .where(eq(planChangeRequests.id, id))
      .returning();
    return updated;
  }

  async approvePlanChangeRequest(id: number, adminId: number, adminResponse?: string): Promise<void> {
    const request = await this.getPlanChangeRequest(id);
    if (!request) {
      throw new Error('Solicitação de mudança de plano não encontrada');
    }

    // Update request status
    await this.updatePlanChangeRequest(id, {
      status: 'approved',
      adminResponse,
      reviewedAt: new Date(),
      reviewedBy: adminId,
    });

    // Deactivate current subscription
    const currentSubscriptions = await this.getUserSubscriptions(request.userId);
    const currentActive = currentSubscriptions.find(sub => sub.isActive);
    
    if (currentActive) {
      await this.updateUserSubscription(currentActive.id, { isActive: false });
    }
    
    // Create new subscription
    await this.createUserSubscription({
      userId: request.userId,
      planId: request.requestedPlanId,
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      isActive: true
    });

    // Create automatic recurring receivable for the plan
    await this.createPlanRecurringReceivable(request.userId, request.requestedPlan);
  }

  async createPlanRecurringReceivable(userId: number, plan: any): Promise<void> {
    // Get user information
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    // Check if user already has a client record for themselves (for plan billing)
    let systemClient = await db.query.clients.findFirst({
      where: and(
        eq(clients.userId, userId),
        eq(clients.document, 'SYSTEM')
      )
    });

    // If no system client exists, create one for plan billing
    if (!systemClient) {
      const [newClient] = await db.insert(clients).values({
        userId,
        name: `${user.firstName} ${user.lastName}`,
        whatsapp: user.phone || '',
        document: 'SYSTEM',
        email: user.email,
        address: 'Cobrança de Plano',
        city: 'Sistema',
        state: 'Sistema',
      }).returning();
      systemClient = newClient;
    }

    // Check if there's already a pending receivable for this plan
    const existingReceivable = await db.query.receivables.findFirst({
      where: and(
        eq(receivables.userId, userId),
        eq(receivables.clientId, systemClient.id),
        eq(receivables.type, 'recurring'),
        eq(receivables.status, 'pending')
      )
    });

    // Only create if there's no existing pending receivable
    if (!existingReceivable) {
      // Create recurring receivable for the plan - first payment due next month
      const nextDueDate = new Date();
      nextDueDate.setMonth(nextDueDate.getMonth() + 1);

      await db.insert(receivables).values({
        userId,
        clientId: systemClient.id,
        description: `Mensalidade do Plano ${plan.name}`,
        amount: plan.price,
        dueDate: nextDueDate,
        status: 'pending',
        type: 'recurring',
        installmentNumber: 1,
        totalInstallments: 12, // 12 months
      });
    }
  }

  // Generate next month's plan receivables for all active subscriptions
  async generateMonthlyPlanReceivables(): Promise<void> {
    const activeSubscriptions = await db.query.userSubscriptions.findMany({
      where: eq(userSubscriptions.isActive, true),
      with: {
        user: true,
        plan: true,
      }
    });

    for (const subscription of activeSubscriptions) {
      const user = subscription.user;
      const plan = subscription.plan;
      
      // Skip free plans
      if (parseFloat(plan.price) === 0) {
        continue;
      }

      // Find or create system client for this user
      let systemClient = await db.query.clients.findFirst({
        where: and(
          eq(clients.userId, user.id),
          eq(clients.document, 'SYSTEM')
        )
      });

      if (!systemClient) {
        const [newClient] = await db.insert(clients).values({
          userId: user.id,
          name: `${user.firstName} ${user.lastName}`,
          whatsapp: user.phone || '',
          document: 'SYSTEM',
          email: user.email,
          address: 'Cobrança de Plano',
          city: 'Sistema',
          state: 'Sistema',
        }).returning();
        systemClient = newClient;
      }

      // Check if there's already a pending receivable for next month
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const nextMonthStart = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1);
      const nextMonthEnd = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0);

      const existingReceivable = await db.query.receivables.findFirst({
        where: and(
          eq(receivables.userId, user.id),
          eq(receivables.clientId, systemClient.id),
          eq(receivables.type, 'recurring'),
          eq(receivables.status, 'pending'),
          and(
            gte(receivables.dueDate, nextMonthStart),
            lte(receivables.dueDate, nextMonthEnd)
          )
        )
      });

      // Only create if there's no existing receivable for next month
      if (!existingReceivable) {
        const dueDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 5); // 5th of next month
        
        await db.insert(receivables).values({
          userId: user.id,
          clientId: systemClient.id,
          description: `Mensalidade do Plano ${plan.name}`,
          amount: plan.price,
          dueDate: dueDate,
          status: 'pending',
          type: 'recurring',
          installmentNumber: 1,
          totalInstallments: 12,
        });
      }
    }
  }

  async rejectPlanChangeRequest(id: number, adminId: number, adminResponse?: string): Promise<void> {
    await this.updatePlanChangeRequest(id, {
      status: 'rejected',
      adminResponse,
      reviewedAt: new Date(),
      reviewedBy: adminId,
    });
  }
}

export const storage = new DatabaseStorage();