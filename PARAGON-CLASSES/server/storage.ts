import {
  users,
  batches,
  payments,
  notifications,
  studyMaterials,
  type User,
  type UpsertUser,
  type Batch,
  type InsertBatch,
  type Payment,
  type InsertPayment,
  type Notification,
  type InsertNotification,
  type StudyMaterial,
  type InsertStudyMaterial,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, isNull, or } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserRole(userId: string, role: "teacher" | "student", batchId?: number): Promise<User>;

  // Batch operations
  getBatches(): Promise<Batch[]>;
  getBatch(id: number): Promise<Batch | undefined>;
  createBatch(batch: InsertBatch): Promise<Batch>;
  updateBatch(id: number, batch: Partial<InsertBatch>): Promise<Batch>;

  // Student operations
  getStudentsByBatch(batchId: number): Promise<User[]>;
  getAllStudents(): Promise<User[]>;

  // Payment operations
  getPayments(): Promise<Payment[]>;
  getPaymentsByStudent(studentId: string): Promise<Payment[]>;
  getPaymentsByBatch(batchId: number): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePaymentStatus(id: number, status: "pending" | "paid" | "failed", paidAt?: Date): Promise<Payment>;

  // Notification operations
  getNotifications(): Promise<Notification[]>;
  getNotificationsByBatch(batchId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;

  // Study material operations
  getStudyMaterials(): Promise<StudyMaterial[]>;
  getStudyMaterialsByBatch(batchId: number): Promise<StudyMaterial[]>;
  createStudyMaterial(material: InsertStudyMaterial): Promise<StudyMaterial>;
  deleteStudyMaterial(id: number): Promise<void>;

  // Statistics
  getTeacherStats(): Promise<{
    totalStudents: number;
    monthlyRevenue: number;
    pendingFees: number;
    materialsCount: number;
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

  async updateUserRole(userId: string, role: "teacher" | "student", batchId?: number): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ role, batchId, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Batch operations
  async getBatches(): Promise<Batch[]> {
    return await db.select().from(batches).where(eq(batches.isActive, true)).orderBy(batches.className);
  }

  async getBatch(id: number): Promise<Batch | undefined> {
    const [batch] = await db.select().from(batches).where(eq(batches.id, id));
    return batch;
  }

  async createBatch(batch: InsertBatch): Promise<Batch> {
    const [newBatch] = await db.insert(batches).values(batch).returning();
    return newBatch;
  }

  async updateBatch(id: number, batch: Partial<InsertBatch>): Promise<Batch> {
    const [updatedBatch] = await db
      .update(batches)
      .set(batch)
      .where(eq(batches.id, id))
      .returning();
    return updatedBatch;
  }

  // Student operations
  async getStudentsByBatch(batchId: number): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(and(eq(users.role, "student"), eq(users.batchId, batchId)));
  }

  async getAllStudents(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, "student"));
  }

  // Payment operations
  async getPayments(): Promise<Payment[]> {
    return await db.select().from(payments).orderBy(desc(payments.createdAt));
  }

  async getPaymentsByStudent(studentId: string): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.studentId, studentId))
      .orderBy(desc(payments.createdAt));
  }

  async getPaymentsByBatch(batchId: number): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.batchId, batchId))
      .orderBy(desc(payments.createdAt));
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db.insert(payments).values(payment).returning();
    return newPayment;
  }

  async updatePaymentStatus(id: number, status: "pending" | "paid" | "failed", paidAt?: Date): Promise<Payment> {
    const [updatedPayment] = await db
      .update(payments)
      .set({ status, paidAt })
      .where(eq(payments.id, id))
      .returning();
    return updatedPayment;
  }

  // Notification operations
  async getNotifications(): Promise<Notification[]> {
    return await db.select().from(notifications).orderBy(desc(notifications.createdAt));
  }

  async getNotificationsByBatch(batchId: number): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(or(eq(notifications.targetBatchId, batchId), isNull(notifications.targetBatchId)))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  // Study material operations
  async getStudyMaterials(): Promise<StudyMaterial[]> {
    return await db.select().from(studyMaterials).orderBy(desc(studyMaterials.createdAt));
  }

  async getStudyMaterialsByBatch(batchId: number): Promise<StudyMaterial[]> {
    return await db
      .select()
      .from(studyMaterials)
      .where(eq(studyMaterials.batchId, batchId))
      .orderBy(desc(studyMaterials.createdAt));
  }

  async createStudyMaterial(material: InsertStudyMaterial): Promise<StudyMaterial> {
    const [newMaterial] = await db.insert(studyMaterials).values(material).returning();
    return newMaterial;
  }

  async deleteStudyMaterial(id: number): Promise<void> {
    await db.delete(studyMaterials).where(eq(studyMaterials.id, id));
  }

  // Statistics
  async getTeacherStats(): Promise<{
    totalStudents: number;
    monthlyRevenue: number;
    pendingFees: number;
    materialsCount: number;
  }> {
    const students = await this.getAllStudents();
    const allPayments = await this.getPayments();
    const materials = await this.getStudyMaterials();

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthlyRevenue = allPayments
      .filter((p) => {
        const paymentDate = p.paidAt || p.createdAt;
        return (
          p.status === "paid" &&
          paymentDate &&
          paymentDate.getMonth() === currentMonth &&
          paymentDate.getFullYear() === currentYear
        );
      })
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);

    const pendingFees = allPayments
      .filter((p) => p.status === "pending")
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);

    return {
      totalStudents: students.length,
      monthlyRevenue,
      pendingFees,
      materialsCount: materials.length,
    };
  }
}

export const storage = new DatabaseStorage();
