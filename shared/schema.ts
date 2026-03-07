import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, numeric, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const loanStatusEnum = pgEnum("loan_status", ["draft", "pending", "active", "closed", "cancelled"]);
export const paymentFrequencyEnum = pgEnum("payment_frequency", ["once", "monthly", "weekly", "daily"]);
export const scheduleStatusEnum = pgEnum("schedule_status", ["upcoming", "paid", "overdue"]);
export const paymentRequestStatusEnum = pgEnum("payment_request_status", ["pending", "confirmed", "rejected"]);

export const lenderProfiles = pgTable("lender_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  passport: text("passport").notNull(),
  address: text("address").notNull(),
  paymentInfo: text("payment_info").notNull(),
  phone: text("phone").notNull(),
});

export const loans = pgTable("loans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lenderProfileId: varchar("lender_profile_id").references(() => lenderProfiles.id),
  borrowerName: text("borrower_name").notNull(),
  borrowerContact: text("borrower_contact").notNull(),
  amount: integer("amount").notNull(),
  termMonths: integer("term_months").notNull(),
  ratePercent: numeric("rate_percent", { precision: 10, scale: 4 }).notNull(),
  startDate: text("start_date").notNull(),
  status: loanStatusEnum("status").notNull().default("pending"),
  frequency: paymentFrequencyEnum("frequency").notNull().default("monthly"),
  monthlyPayment: integer("monthly_payment").notNull(),
  totalRepayment: integer("total_repayment").notNull(),
  remainingAmount: integer("remaining_amount").notNull(),
  borrowerPassport: text("borrower_passport"),
  borrowerAddress: text("borrower_address"),
  signedAt: text("signed_at"),
  borrowerRating: integer("borrower_rating"),
  lenderRating: integer("lender_rating"),
});

export const scheduleItems = pgTable("schedule_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  loanId: varchar("loan_id").notNull().references(() => loans.id),
  itemIndex: integer("item_index").notNull(),
  date: text("date").notNull(),
  amount: integer("amount").notNull(),
  principalPart: integer("principal_part").notNull().default(0),
  interestPart: integer("interest_part").notNull().default(0),
  remainingAfter: integer("remaining_after").notNull().default(0),
  status: scheduleStatusEnum("status").notNull().default("upcoming"),
  paidDate: text("paid_date"),
  paidAmount: integer("paid_amount"),
});

export const paymentRequests = pgTable("payment_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  loanId: varchar("loan_id").notNull().references(() => loans.id),
  amount: integer("amount").notNull(),
  status: paymentRequestStatusEnum("status").notNull().default("pending"),
  timestamp: text("timestamp").notNull(),
});

export const insertLenderProfileSchema = createInsertSchema(lenderProfiles).omit({ id: true });
export type InsertLenderProfile = z.infer<typeof insertLenderProfileSchema>;
export type LenderProfile = typeof lenderProfiles.$inferSelect;

export const insertLoanSchema = createInsertSchema(loans).omit({
  id: true, status: true, monthlyPayment: true, totalRepayment: true, remainingAmount: true,
  borrowerPassport: true, borrowerAddress: true, signedAt: true, borrowerRating: true, lenderRating: true,
});
export type InsertLoan = z.infer<typeof insertLoanSchema>;
export type Loan = typeof loans.$inferSelect;

export const insertScheduleItemSchema = createInsertSchema(scheduleItems).omit({ id: true });
export type InsertScheduleItem = z.infer<typeof insertScheduleItemSchema>;
export type ScheduleItem = typeof scheduleItems.$inferSelect;

export const insertPaymentRequestSchema = createInsertSchema(paymentRequests).omit({ id: true, status: true });
export type InsertPaymentRequest = z.infer<typeof insertPaymentRequestSchema>;
export type PaymentRequest = typeof paymentRequests.$inferSelect;

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
