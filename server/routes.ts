import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertLenderProfileSchema, pushSubscriptions } from "@shared/schema";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { notifyLenderPaymentRequest, notifyBorrowerPaymentConfirmed, startPaymentReminders } from "./pushNotifications";
import { verifyTelegramAuth, checkAuthDate, upsertTelegramUser } from "./telegramAuth";

const createLoanBodySchema = z.object({
  lenderProfileId: z.string().min(1),
  borrowerName: z.string().min(1),
  borrowerContact: z.string().min(1),
  amount: z.number().int().positive(),
  termMonths: z.number().int().positive().max(360),
  ratePercent: z.number().min(0).max(1000),
  startDate: z.string().min(1),
  frequency: z.enum(["once", "monthly", "weekly", "daily"]),
});

const acceptLoanBodySchema = z.object({
  borrowerPassport: z.string().min(1),
  borrowerAddress: z.string().min(1),
});

const rateLoanBodySchema = z.object({
  type: z.enum(["borrower", "lender"]),
  stars: z.number().int().min(1).max(5),
});

const paymentRequestBodySchema = z.object({
  loanId: z.string().min(1),
  amount: z.number().positive(),
  timestamp: z.string().min(1),
});

const pushSubscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
  type: z.enum(["lender", "borrower"]),
  phone: z.string().optional(),
});

const telegramAuthSchema = z.object({
  id: z.number(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  username: z.string().optional(),
  photo_url: z.string().optional(),
  auth_date: z.number(),
  hash: z.string(),
});

function getUserId(req: any): string {
  if (req.user?.claims?.sub) {
    return req.user.claims.sub;
  }
  if (req.user?.userId) {
    return req.user.userId;
  }
  throw new Error("No user ID found");
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  await setupAuth(app);
  registerAuthRoutes(app);

  startPaymentReminders();

  app.get("/api/telegram-bot-username", (_req, res) => {
    res.json({ username: process.env.TELEGRAM_BOT_USERNAME || "" });
  });

  app.post("/api/auth/telegram", (req: any, res) => {
    try {
      const data = telegramAuthSchema.parse(req.body);
      const botToken = process.env.TELEGRAM_BOT_TOKEN;

      if (!botToken) {
        return res.status(500).json({ message: "Telegram auth not configured" });
      }

      if (!verifyTelegramAuth(data, botToken)) {
        return res.status(401).json({ message: "Invalid Telegram auth data" });
      }

      if (!checkAuthDate(data.auth_date)) {
        return res.status(401).json({ message: "Auth data expired" });
      }

      upsertTelegramUser(data).then((user) => {
        req.login({ userId: user.id, authProvider: "telegram" }, (err: any) => {
          if (err) {
            return res.status(500).json({ message: "Session creation failed" });
          }
          res.json({
            id: user.id,
            firstName: data.first_name || null,
            lastName: data.last_name || null,
            profileImageUrl: data.photo_url || null,
          });
        });
      }).catch((err) => {
        console.error("Telegram auth error:", err);
        res.status(500).json({ message: "Auth failed" });
      });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/vapid-public-key", (_req, res) => {
    res.json({ key: process.env.VAPID_PUBLIC_KEY || "" });
  });

  app.post("/api/push/subscribe", async (req: any, res) => {
    try {
      const parsed = pushSubscribeSchema.parse(req.body);

      if (parsed.type === "lender") {
        if (!req.isAuthenticated || !req.isAuthenticated()) {
          return res.status(401).json({ message: "Unauthorized" });
        }
        const userId = getUserId(req);
        await db.insert(pushSubscriptions).values({
          endpoint: parsed.endpoint,
          p256dh: parsed.keys.p256dh,
          auth: parsed.keys.auth,
          type: "lender",
          userId: userId,
          phone: null,
        }).onConflictDoUpdate({
          target: pushSubscriptions.endpoint,
          set: {
            p256dh: parsed.keys.p256dh,
            auth: parsed.keys.auth,
            type: "lender",
            userId: userId,
          },
        });
      } else {
        if (!parsed.phone) {
          return res.status(400).json({ message: "Phone required for borrower subscription" });
        }
        const phoneDigits = parsed.phone.replace(/\D/g, "");
        const normalizedPhone = phoneDigits.length >= 10 ? phoneDigits.slice(-10) : phoneDigits;
        const matchingLoans = await storage.findLoansByPhone(parsed.phone);
        if (matchingLoans.length === 0) {
          return res.status(400).json({ message: "No loans found for this phone" });
        }
        await db.insert(pushSubscriptions).values({
          endpoint: parsed.endpoint,
          p256dh: parsed.keys.p256dh,
          auth: parsed.keys.auth,
          type: "borrower",
          userId: null,
          phone: normalizedPhone,
        }).onConflictDoUpdate({
          target: pushSubscriptions.endpoint,
          set: {
            p256dh: parsed.keys.p256dh,
            auth: parsed.keys.auth,
            type: "borrower",
            phone: normalizedPhone,
          },
        });
      }

      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post("/api/push/unsubscribe", async (req: any, res) => {
    try {
      const { endpoint } = req.body;
      if (!endpoint) return res.json({ success: true });

      const [existing] = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
      if (existing) {
        if (existing.type === "lender" && req.isAuthenticated && req.isAuthenticated()) {
          if (existing.userId === getUserId(req)) {
            await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
          }
        } else if (existing.type === "borrower") {
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
        }
      }
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/my-profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const profile = await storage.getLenderProfileByUserId(userId);
      if (!profile) return res.json(null);
      res.json(profile);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/lender-profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const existing = await storage.getLenderProfileByUserId(userId);
      if (existing) {
        return res.status(400).json({ message: "Profile already exists" });
      }
      const parsed = insertLenderProfileSchema.parse(req.body);
      const profile = await storage.createLenderProfile({ ...parsed, userId });
      res.json(profile);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/lender-profile/:id", async (req, res) => {
    const profile = await storage.getLenderProfile(req.params.id);
    if (!profile) return res.status(404).json({ message: "Not found" });
    res.json(profile);
  });

  app.put("/api/lender-profile/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const profile = await storage.getLenderProfile(req.params.id);
      if (!profile || profile.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const parsed = insertLenderProfileSchema.partial().parse(req.body);
      const updated = await storage.updateLenderProfile(req.params.id, parsed);
      if (!updated) return res.status(404).json({ message: "Not found" });
      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post("/api/loans", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const parsed = createLoanBodySchema.parse(req.body);
      const profile = await storage.getLenderProfile(parsed.lenderProfileId);
      if (!profile || profile.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const loan = await storage.createLoan(parsed);
      res.json(loan);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/loans", isAuthenticated, async (req: any, res) => {
    const userId = getUserId(req);
    const profile = await storage.getLenderProfileByUserId(userId);
    if (!profile) return res.json([]);
    const result = await storage.getLoansByLender(profile.id);
    res.json(result);
  });

  app.get("/api/loans/:id", async (req, res) => {
    const loan = await storage.getLoan(req.params.id);
    if (!loan) return res.status(404).json({ message: "Not found" });
    res.json(loan);
  });

  app.get("/api/loans/by-phone/:phone", async (req, res) => {
    const loans = await storage.findLoansByPhone(req.params.phone);
    if (loans.length === 0) return res.status(404).json({ message: "Not found" });
    res.json(loans);
  });

  app.post("/api/loans/:id/accept", async (req, res) => {
    try {
      const parsed = acceptLoanBodySchema.parse(req.body);
      const loan = await storage.updateLoanStatus(req.params.id, "active", {
        borrowerPassport: parsed.borrowerPassport,
        borrowerAddress: parsed.borrowerAddress,
        signedAt: new Date().toISOString(),
      } as any);
      if (!loan) return res.status(404).json({ message: "Not found" });
      const full = await storage.getLoan(loan.id);
      res.json(full);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post("/api/loans/:id/rate", async (req, res) => {
    try {
      const parsed = rateLoanBodySchema.parse(req.body);
      const loan = await storage.rateLoan(req.params.id, parsed.type, parsed.stars);
      if (!loan) return res.status(404).json({ message: "Not found" });
      res.json(loan);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post("/api/payment-requests", async (req, res) => {
    try {
      const parsed = paymentRequestBodySchema.parse(req.body);
      const request = await storage.createPaymentRequest(parsed);
      notifyLenderPaymentRequest(parsed.loanId, parsed.amount).catch(err =>
        console.error("Push notify lender error:", err)
      );
      res.json(request);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/payment-requests/:loanId", async (req, res) => {
    const requests = await storage.getPaymentRequestsByLoan(req.params.loanId);
    res.json(requests);
  });

  app.post("/api/payment-requests/:id/confirm", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const profile = await storage.getLenderProfileByUserId(userId);
      if (!profile) return res.status(403).json({ message: "Forbidden" });

      const result = await storage.confirmPayment(req.params.id);
      if (!result) return res.status(404).json({ message: "Not found" });

      if (result.loan.lenderProfileId !== profile.id) {
        return res.status(403).json({ message: "Forbidden" });
      }

      notifyBorrowerPaymentConfirmed(result.loan.id, result.request.amount).catch(err =>
        console.error("Push notify borrower error:", err)
      );

      res.json(result);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  return httpServer;
}
