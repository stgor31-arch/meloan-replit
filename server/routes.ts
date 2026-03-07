import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertLenderProfileSchema } from "@shared/schema";

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

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.post("/api/lender-profile", async (req, res) => {
    try {
      const parsed = insertLenderProfileSchema.parse(req.body);
      const profile = await storage.createLenderProfile(parsed);
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

  app.put("/api/lender-profile/:id", async (req, res) => {
    try {
      const parsed = insertLenderProfileSchema.partial().parse(req.body);
      const profile = await storage.updateLenderProfile(req.params.id, parsed);
      if (!profile) return res.status(404).json({ message: "Not found" });
      res.json(profile);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post("/api/loans", async (req, res) => {
    try {
      const parsed = createLoanBodySchema.parse(req.body);
      const loan = await storage.createLoan(parsed);
      res.json(loan);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/loans", async (req, res) => {
    const lenderProfileId = req.query.lenderProfileId as string;
    if (!lenderProfileId) return res.status(400).json({ message: "lenderProfileId required" });
    const result = await storage.getLoansByLender(lenderProfileId);
    res.json(result);
  });

  app.get("/api/loans/:id", async (req, res) => {
    const loan = await storage.getLoan(req.params.id);
    if (!loan) return res.status(404).json({ message: "Not found" });
    res.json(loan);
  });

  app.get("/api/loans/by-phone/:phone", async (req, res) => {
    const loan = await storage.findLoanByPhone(req.params.phone);
    if (!loan) return res.status(404).json({ message: "Not found" });
    res.json(loan);
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
      res.json(request);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/payment-requests/:loanId", async (req, res) => {
    const requests = await storage.getPaymentRequestsByLoan(req.params.loanId);
    res.json(requests);
  });

  app.post("/api/payment-requests/:id/confirm", async (req, res) => {
    try {
      const result = await storage.confirmPayment(req.params.id);
      if (!result) return res.status(404).json({ message: "Not found" });
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  return httpServer;
}
