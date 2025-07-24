import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  decimal,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { enum: ["teacher", "student"] }).notNull().default("student"),
  batchId: integer("batch_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const batches = pgTable("batches", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  className: varchar("class_name").notNull(), // "11th" or "12th"
  schedule: varchar("schedule").notNull(),
  fee: decimal("fee", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  studentId: varchar("student_id").notNull(),
  batchId: integer("batch_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  method: varchar("method", { enum: ["online", "cash"] }).notNull(),
  status: varchar("status", { enum: ["pending", "paid", "failed"] }).notNull().default("pending"),
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  dueDate: timestamp("due_date").notNull(),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  targetBatchId: integer("target_batch_id"), // null means all students
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const studyMaterials = pgTable("study_materials", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  fileName: varchar("file_name").notNull(),
  filePath: varchar("file_path").notNull(),
  fileSize: integer("file_size").notNull(),
  batchId: integer("batch_id").notNull(),
  uploadedBy: varchar("uploaded_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  batch: one(batches, {
    fields: [users.batchId],
    references: [batches.id],
  }),
  payments: many(payments),
}));

export const batchesRelations = relations(batches, ({ many }) => ({
  students: many(users),
  payments: many(payments),
  studyMaterials: many(studyMaterials),
  notifications: many(notifications),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  student: one(users, {
    fields: [payments.studentId],
    references: [users.id],
  }),
  batch: one(batches, {
    fields: [payments.batchId],
    references: [batches.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  targetBatch: one(batches, {
    fields: [notifications.targetBatchId],
    references: [batches.id],
  }),
  creator: one(users, {
    fields: [notifications.createdBy],
    references: [users.id],
  }),
}));

export const studyMaterialsRelations = relations(studyMaterials, ({ one }) => ({
  batch: one(batches, {
    fields: [studyMaterials.batchId],
    references: [batches.id],
  }),
  uploader: one(users, {
    fields: [studyMaterials.uploadedBy],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
  role: true,
  batchId: true,
});

export const insertBatchSchema = createInsertSchema(batches).pick({
  name: true,
  className: true,
  schedule: true,
  fee: true,
  isActive: true,
});

export const insertPaymentSchema = createInsertSchema(payments).pick({
  studentId: true,
  batchId: true,
  amount: true,
  method: true,
  dueDate: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).pick({
  title: true,
  message: true,
  targetBatchId: true,
  createdBy: true,
});

export const insertStudyMaterialSchema = createInsertSchema(studyMaterials).pick({
  title: true,
  fileName: true,
  filePath: true,
  fileSize: true,
  batchId: true,
  uploadedBy: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertBatch = z.infer<typeof insertBatchSchema>;
export type Batch = typeof batches.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertStudyMaterial = z.infer<typeof insertStudyMaterialSchema>;
export type StudyMaterial = typeof studyMaterials.$inferSelect;
