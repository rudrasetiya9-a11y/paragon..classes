import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertBatchSchema, 
  insertPaymentSchema, 
  insertNotificationSchema, 
  insertStudyMaterialSchema 
} from "@shared/schema";
import Stripe from "stripe";
import multer from "multer";
import path from "path";
import fs from "fs";

// Initialize Stripe only if the secret key is available
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-06-30.basil",
  });
}

// Configure multer for file uploads
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({
  dest: uploadsDir,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.ppt', '.pptx'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, DOCX, PPT, PPTX files are allowed'));
    }
  },
});

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

  // Update user role (for initial setup)
  app.post('/api/auth/setup-role', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { role, batchId } = req.body;
      
      if (!['teacher', 'student'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      const user = await storage.updateUserRole(userId, role, batchId);
      res.json(user);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Batch routes
  app.get('/api/batches', isAuthenticated, async (req, res) => {
    try {
      const batches = await storage.getBatches();
      res.json(batches);
    } catch (error) {
      console.error("Error fetching batches:", error);
      res.status(500).json({ message: "Failed to fetch batches" });
    }
  });

  app.post('/api/batches', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'teacher') {
        return res.status(403).json({ message: "Only teachers can create batches" });
      }

      const validatedData = insertBatchSchema.parse(req.body);
      const batch = await storage.createBatch(validatedData);
      res.json(batch);
    } catch (error) {
      console.error("Error creating batch:", error);
      res.status(500).json({ message: "Failed to create batch" });
    }
  });

  // Student routes
  app.get('/api/students', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'teacher') {
        return res.status(403).json({ message: "Only teachers can view all students" });
      }

      const students = await storage.getAllStudents();
      res.json(students);
    } catch (error) {
      console.error("Error fetching students:", error);
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  app.get('/api/students/batch/:batchId', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'teacher') {
        return res.status(403).json({ message: "Only teachers can view batch students" });
      }

      const batchId = parseInt(req.params.batchId);
      const students = await storage.getStudentsByBatch(batchId);
      res.json(students);
    } catch (error) {
      console.error("Error fetching batch students:", error);
      res.status(500).json({ message: "Failed to fetch batch students" });
    }
  });

  // Payment routes
  app.get('/api/payments', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let payments;
      if (user.role === 'teacher') {
        payments = await storage.getPayments();
      } else {
        payments = await storage.getPaymentsByStudent(user.id);
      }
      res.json(payments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  app.post('/api/payments', isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertPaymentSchema.parse(req.body);
      const payment = await storage.createPayment(validatedData);
      res.json(payment);
    } catch (error) {
      console.error("Error creating payment:", error);
      res.status(500).json({ message: "Failed to create payment" });
    }
  });

  app.patch('/api/payments/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'teacher') {
        return res.status(403).json({ message: "Only teachers can update payment status" });
      }

      const paymentId = parseInt(req.params.id);
      const { status } = req.body;
      const paidAt = status === 'paid' ? new Date() : undefined;
      
      const payment = await storage.updatePaymentStatus(paymentId, status, paidAt);
      res.json(payment);
    } catch (error) {
      console.error("Error updating payment status:", error);
      res.status(500).json({ message: "Failed to update payment status" });
    }
  });

  // Stripe payment routes
  app.post("/api/create-payment-intent", isAuthenticated, async (req, res) => {
    try {
      const { amount, paymentId } = req.body;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "inr",
        metadata: {
          paymentId: paymentId.toString(),
        },
      });
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  // Notification routes
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let notifications;
      if (user.role === 'teacher') {
        notifications = await storage.getNotifications();
      } else if (user.batchId) {
        notifications = await storage.getNotificationsByBatch(user.batchId);
      } else {
        notifications = [];
      }
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.post('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'teacher') {
        return res.status(403).json({ message: "Only teachers can create notifications" });
      }

      const validatedData = insertNotificationSchema.parse({
        ...req.body,
        createdBy: user.id,
      });
      const notification = await storage.createNotification(validatedData);
      res.json(notification);
    } catch (error) {
      console.error("Error creating notification:", error);
      res.status(500).json({ message: "Failed to create notification" });
    }
  });

  // Study material routes
  app.get('/api/study-materials', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let materials;
      if (user.role === 'teacher') {
        materials = await storage.getStudyMaterials();
      } else if (user.batchId) {
        materials = await storage.getStudyMaterialsByBatch(user.batchId);
      } else {
        materials = [];
      }
      res.json(materials);
    } catch (error) {
      console.error("Error fetching study materials:", error);
      res.status(500).json({ message: "Failed to fetch study materials" });
    }
  });

  app.post('/api/study-materials', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'teacher') {
        return res.status(403).json({ message: "Only teachers can upload study materials" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { title, batchId } = req.body;
      const fileName = req.file.originalname;
      const filePath = req.file.path;
      const fileSize = req.file.size;

      const validatedData = insertStudyMaterialSchema.parse({
        title,
        fileName,
        filePath,
        fileSize,
        batchId: parseInt(batchId),
        uploadedBy: user.id,
      });

      const material = await storage.createStudyMaterial(validatedData);
      res.json(material);
    } catch (error) {
      console.error("Error uploading study material:", error);
      res.status(500).json({ message: "Failed to upload study material" });
    }
  });

  app.get('/api/study-materials/:id/download', isAuthenticated, async (req: any, res) => {
    try {
      const materialId = parseInt(req.params.id);
      const materials = await storage.getStudyMaterials();
      const material = materials.find(m => m.id === materialId);

      if (!material) {
        return res.status(404).json({ message: "Material not found" });
      }

      const user = await storage.getUser(req.user.claims.sub);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check access permissions
      if (user.role === 'student' && user.batchId !== material.batchId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.download(material.filePath, material.fileName);
    } catch (error) {
      console.error("Error downloading study material:", error);
      res.status(500).json({ message: "Failed to download study material" });
    }
  });

  app.delete('/api/study-materials/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'teacher') {
        return res.status(403).json({ message: "Only teachers can delete study materials" });
      }

      const materialId = parseInt(req.params.id);
      await storage.deleteStudyMaterial(materialId);
      res.json({ message: "Material deleted successfully" });
    } catch (error) {
      console.error("Error deleting study material:", error);
      res.status(500).json({ message: "Failed to delete study material" });
    }
  });

  // Statistics route
  app.get('/api/stats', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'teacher') {
        return res.status(403).json({ message: "Only teachers can view statistics" });
      }

      const stats = await storage.getTeacherStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching statistics:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
