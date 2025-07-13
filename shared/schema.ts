import {
  mysqlTable,
  text,
  varchar,
  timestamp,
  json,
  index,
  int,
  decimal,
  boolean,
  serial,
} from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table for Replit Auth
export const sessions = mysqlTable(
  "sessions",
  {
    sid: varchar("sid", { length: 128 }).primaryKey(),
    sess: json("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for local authentication
export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  username: varchar("username", { length: 255 }).unique().notNull(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Clients table
export const clients = mysqlTable("clients", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull().references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  whatsapp: varchar("whatsapp", { length: 20 }).notNull(),
  document: varchar("document", { length: 20 }).notNull(), // CPF or CNPJ
  email: varchar("email", { length: 255 }),
  address: text("address"),
  zipCode: varchar("zip_code", { length: 10 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Accounts Receivable table
export const receivables = mysqlTable("receivables", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull().references(() => users.id),
  clientId: int("client_id").notNull().references(() => clients.id),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  dueDate: timestamp("due_date").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("pending"), // pending, paid, overdue
  type: varchar("type", { length: 50 }).notNull().default("single"), // single, installment, recurring
  installmentNumber: int("installment_number"),
  totalInstallments: int("total_installments"),
  parentId: int("parent_id"), // For linking installments
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Accounts Payable table
export const payables = mysqlTable("payables", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull().references(() => users.id),
  receiverId: int("receiver_id").notNull().references(() => clients.id),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  dueDate: timestamp("due_date").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("pending"), // pending, paid, overdue
  type: varchar("type", { length: 50 }).notNull().default("single"), // single, installment, recurring
  installmentNumber: int("installment_number"),
  totalInstallments: int("total_installments"),
  parentId: int("parent_id"), // For linking installments
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// WhatsApp Messages table
export const whatsappMessages = mysqlTable("whatsapp_messages", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull().references(() => users.id),
  clientId: int("client_id").notNull().references(() => clients.id),
  content: text("content").notNull(),
  templateType: varchar("template_type", { length: 50 }), // reminder, overdue, custom, approval, rejection
  status: varchar("status", { length: 50 }).notNull().default("sent"), // sent, delivered, read, failed
  sentAt: timestamp("sent_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  clients: many(clients),
  receivables: many(receivables),
  payables: many(payables),
  whatsappMessages: many(whatsappMessages),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  user: one(users, { fields: [clients.userId], references: [users.id] }),
  receivables: many(receivables),
  payables: many(payables),
  whatsappMessages: many(whatsappMessages),
}));

export const receivablesRelations = relations(receivables, ({ one, many }) => ({
  user: one(users, { fields: [receivables.userId], references: [users.id] }),
  client: one(clients, { fields: [receivables.clientId], references: [clients.id] }),
  parent: one(receivables, { fields: [receivables.parentId], references: [receivables.id] }),
  installments: many(receivables),
}));

export const payablesRelations = relations(payables, ({ one, many }) => ({
  user: one(users, { fields: [payables.userId], references: [users.id] }),
  receiver: one(clients, { fields: [payables.receiverId], references: [clients.id] }),
  parent: one(payables, { fields: [payables.parentId], references: [payables.id] }),
  installments: many(payables),
}));

export const whatsappMessagesRelations = relations(whatsappMessages, ({ one }) => ({
  user: one(users, { fields: [whatsappMessages.userId], references: [users.id] }),
  client: one(clients, { fields: [whatsappMessages.clientId], references: [clients.id] }),
}));

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReceivableSchema = createInsertSchema(receivables).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  dueDate: z.string().transform((val) => new Date(val)),
});

export const insertPayableSchema = createInsertSchema(payables).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  dueDate: z.string().transform((val) => new Date(val)),
});

export const insertWhatsappMessageSchema = createInsertSchema(whatsappMessages).omit({
  id: true,
  userId: true,
  sentAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Receivable = typeof receivables.$inferSelect;
export type InsertReceivable = z.infer<typeof insertReceivableSchema>;
export type Payable = typeof payables.$inferSelect;
export type InsertPayable = z.infer<typeof insertPayableSchema>;
export type WhatsappMessage = typeof whatsappMessages.$inferSelect;
export type InsertWhatsappMessage = z.infer<typeof insertWhatsappMessageSchema>;

// Plans table
export const plans = mysqlTable("plans", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  features: json("features").notNull(),
  maxClients: int("max_clients").default(100).notNull(),
  maxTransactions: int("max_transactions").default(1000).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User subscriptions table
export const userSubscriptions = mysqlTable("user_subscriptions", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  planId: int("plan_id").references(() => plans.id, { onDelete: "cascade" }).notNull(),
  startDate: timestamp("start_date").defaultNow().notNull(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const plansRelations = relations(plans, ({ many }) => ({
  subscriptions: many(userSubscriptions),
}));

export const userSubscriptionsRelations = relations(userSubscriptions, ({ one }) => ({
  user: one(users, {
    fields: [userSubscriptions.userId],
    references: [users.id],
  }),
  plan: one(plans, {
    fields: [userSubscriptions.planId],
    references: [plans.id],
  }),
}));

// Plan change requests table
export const planChangeRequests = mysqlTable("plan_change_requests", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  currentPlanId: int("current_plan_id").references(() => plans.id, { onDelete: "cascade" }),
  requestedPlanId: int("requested_plan_id").references(() => plans.id, { onDelete: "cascade" }).notNull(),
  status: varchar("status", { length: 50 }).default("pending").notNull(), // pending, approved, rejected
  userMessage: text("user_message"), // Message from user explaining why they need the plan change
  adminResponse: text("admin_response"), // Admin response when approving/rejecting
  requestedAt: timestamp("requested_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: int("reviewed_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const planChangeRequestsRelations = relations(planChangeRequests, ({ one }) => ({
  user: one(users, { fields: [planChangeRequests.userId], references: [users.id] }),
  currentPlan: one(plans, { fields: [planChangeRequests.currentPlanId], references: [plans.id] }),
  requestedPlan: one(plans, { fields: [planChangeRequests.requestedPlanId], references: [plans.id] }),
  reviewedByUser: one(users, { fields: [planChangeRequests.reviewedBy], references: [users.id] }),
}));

// Installment Sales table
export const installmentSales = mysqlTable("installment_sales", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  clientId: int("client_id").references(() => clients.id, { onDelete: "cascade" }).notNull(),
  description: text("description").notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  installmentCount: int("installment_count").notNull(),
  installmentValue: decimal("installment_value", { precision: 10, scale: 2 }).notNull(),
  firstDueDate: timestamp("first_due_date").notNull(),
  confirmationToken: varchar("confirmation_token", { length: 255 }).unique().notNull(),
  status: varchar("status", { length: 50 }).notNull().default("pending"), // pending, confirmed, approved, rejected
  documentPhotoUrl: text("document_photo_url"),
  clientSignedAt: timestamp("client_signed_at"),
  userReviewedAt: timestamp("user_reviewed_at"),
  userApprovedAt: timestamp("user_approved_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const installmentSalesRelations = relations(installmentSales, ({ one, many }) => ({
  user: one(users, { fields: [installmentSales.userId], references: [users.id] }),
  client: one(clients, { fields: [installmentSales.clientId], references: [clients.id] }),
  installments: many(receivables),
}));

// User WhatsApp instances table
export const userWhatsappInstances = mysqlTable("user_whatsapp_instances", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  instanceName: varchar("instance_name", { length: 255 }).notNull(),
  displayName: varchar("display_name", { length: 255 }).notNull(),
  phoneNumber: varchar("phone_number", { length: 20 }),
  status: varchar("status", { length: 50 }).default("disconnected").notNull(), // disconnected, connecting, connected, error
  qrCode: text("qr_code"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userWhatsappInstancesRelations = relations(userWhatsappInstances, ({ one }) => ({
  user: one(users, { fields: [userWhatsappInstances.userId], references: [users.id] }),
}));

// System Settings table
export const systemSettings = mysqlTable("system_settings", {
  id: int("id").primaryKey().autoincrement(),
  key: varchar("key", { length: 255 }).notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payment Reminders table
export const paymentReminders = mysqlTable("payment_reminders", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").references(() => users.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  messageTemplate: text("message_template").notNull(),
  triggerType: varchar("trigger_type", { length: 50 }).notNull(), // 'on_due', 'before_due', 'after_due'
  triggerDays: int("trigger_days").default(0), // days before/after due date
  triggerTime: varchar("trigger_time", { length: 8 }).notNull(), // HH:MM:SS format
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Reminder Logs table
export const reminderLogs = mysqlTable("reminder_logs", {
  id: int("id").primaryKey().autoincrement(),
  reminderId: int("reminder_id").references(() => paymentReminders.id).notNull(),
  receivableId: int("receivable_id").references(() => receivables.id).notNull(),
  clientId: int("client_id").references(() => clients.id).notNull(),
  messageContent: text("message_content").notNull(),
  status: varchar("status", { length: 50 }).notNull(), // 'sent', 'failed', 'pending'
  errorMessage: text("error_message"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const paymentRemindersRelations = relations(paymentReminders, ({ one, many }) => ({
  user: one(users, { fields: [paymentReminders.userId], references: [users.id] }),
  reminderLogs: many(reminderLogs),
}));

export const reminderLogsRelations = relations(reminderLogs, ({ one }) => ({
  reminder: one(paymentReminders, { fields: [reminderLogs.reminderId], references: [paymentReminders.id] }),
  receivable: one(receivables, { fields: [reminderLogs.receivableId], references: [receivables.id] }),
  client: one(clients, { fields: [reminderLogs.clientId], references: [clients.id] }),
}));

export const insertPlanSchema = createInsertSchema(plans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserSubscriptionSchema = createInsertSchema(userSubscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInstallmentSaleSchema = createInsertSchema(installmentSales).omit({
  id: true,
  userId: true,
  confirmationToken: true,
  clientSignedAt: true,
  userReviewedAt: true,
  userApprovedAt: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  firstDueDate: z.string().transform((val) => new Date(val)),
});

export const insertUserWhatsappInstanceSchema = createInsertSchema(userWhatsappInstances).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSystemSettingSchema = createInsertSchema(systemSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPaymentReminderSchema = createInsertSchema(paymentReminders).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  triggerTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato deve ser HH:MM"),
});

export const insertReminderLogSchema = createInsertSchema(reminderLogs).omit({
  id: true,
  createdAt: true,
});

export const insertPlanChangeRequestSchema = createInsertSchema(planChangeRequests).omit({
  id: true,
  userId: true,
  requestedAt: true,
  reviewedAt: true,
  reviewedBy: true,
  createdAt: true,
  updatedAt: true,
});

export type Plan = typeof plans.$inferSelect;
export type InsertPlan = z.infer<typeof insertPlanSchema>;
export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type InsertUserSubscription = z.infer<typeof insertUserSubscriptionSchema>;
export type InstallmentSale = typeof installmentSales.$inferSelect;
export type InsertInstallmentSale = z.infer<typeof insertInstallmentSaleSchema>;
export type UserWhatsappInstance = typeof userWhatsappInstances.$inferSelect;
export type InsertUserWhatsappInstance = z.infer<typeof insertUserWhatsappInstanceSchema>;
export type SystemSetting = typeof systemSettings.$inferSelect;
export type InsertSystemSetting = z.infer<typeof insertSystemSettingSchema>;
export type PlanChangeRequest = typeof planChangeRequests.$inferSelect;
export type InsertPlanChangeRequest = z.infer<typeof insertPlanChangeRequestSchema>;
export type PaymentReminder = typeof paymentReminders.$inferSelect;
export type InsertPaymentReminder = z.infer<typeof insertPaymentReminderSchema>;
export type ReminderLog = typeof reminderLogs.$inferSelect;
export type InsertReminderLog = z.infer<typeof insertReminderLogSchema>;
