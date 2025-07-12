import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  decimal,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for local authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username").unique().notNull(),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Clients table
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  whatsapp: varchar("whatsapp").notNull(),
  document: varchar("document").notNull(), // CPF or CNPJ
  email: varchar("email"),
  address: text("address"),
  zipCode: varchar("zip_code"),
  city: varchar("city"),
  state: varchar("state"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Accounts Receivable table
export const receivables = pgTable("receivables", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  clientId: integer("client_id").notNull().references(() => clients.id),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  dueDate: timestamp("due_date").notNull(),
  status: varchar("status").notNull().default("pending"), // pending, paid, overdue
  type: varchar("type").notNull().default("single"), // single, installment, recurring
  installmentNumber: integer("installment_number"),
  totalInstallments: integer("total_installments"),
  parentId: integer("parent_id"), // For linking installments
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Accounts Payable table
export const payables = pgTable("payables", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  receiverId: integer("receiver_id").notNull().references(() => clients.id),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  dueDate: timestamp("due_date").notNull(),
  status: varchar("status").notNull().default("pending"), // pending, paid, overdue
  type: varchar("type").notNull().default("single"), // single, installment, recurring
  installmentNumber: integer("installment_number"),
  totalInstallments: integer("total_installments"),
  parentId: integer("parent_id"), // For linking installments
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// WhatsApp Messages table
export const whatsappMessages = pgTable("whatsapp_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  clientId: integer("client_id").notNull().references(() => clients.id),
  content: text("content").notNull(),
  templateType: varchar("template_type"), // reminder, overdue, custom
  status: varchar("status").notNull().default("sent"), // sent, delivered, read, failed
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
export const plans = pgTable("plans", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  features: text("features").array().notNull(),
  maxClients: integer("max_clients").default(100).notNull(),
  maxTransactions: integer("max_transactions").default(1000).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User subscriptions table
export const userSubscriptions = pgTable("user_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  planId: integer("plan_id").references(() => plans.id, { onDelete: "cascade" }).notNull(),
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

// Installment Sales table
export const installmentSales = pgTable("installment_sales", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  clientId: integer("client_id").references(() => clients.id, { onDelete: "cascade" }).notNull(),
  description: text("description").notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  installmentCount: integer("installment_count").notNull(),
  installmentValue: decimal("installment_value", { precision: 10, scale: 2 }).notNull(),
  firstDueDate: timestamp("first_due_date").notNull(),
  confirmationToken: varchar("confirmation_token").unique().notNull(),
  status: varchar("status").notNull().default("pending"), // pending, confirmed, approved, rejected
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
export const userWhatsappInstances = pgTable("user_whatsapp_instances", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
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

export type Plan = typeof plans.$inferSelect;
export type InsertPlan = z.infer<typeof insertPlanSchema>;
export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type InsertUserSubscription = z.infer<typeof insertUserSubscriptionSchema>;
export type InstallmentSale = typeof installmentSales.$inferSelect;
export type InsertInstallmentSale = z.infer<typeof insertInstallmentSaleSchema>;
export type UserWhatsappInstance = typeof userWhatsappInstances.$inferSelect;
export type InsertUserWhatsappInstance = z.infer<typeof insertUserWhatsappInstanceSchema>;
