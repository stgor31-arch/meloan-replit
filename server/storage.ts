import {
  type LenderProfile, type InsertLenderProfile,
  type Loan, type InsertLoan,
  type ScheduleItem, type InsertScheduleItem,
  type PaymentRequest, type InsertPaymentRequest,
  lenderProfiles, loans, scheduleItems, paymentRequests,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc } from "drizzle-orm";
import { addDays, addWeeks, addMonths, format, parseISO } from "date-fns";

export interface IStorage {
  createLenderProfile(profile: InsertLenderProfile): Promise<LenderProfile>;
  getLenderProfile(id: string): Promise<LenderProfile | undefined>;
  updateLenderProfile(id: string, profile: Partial<InsertLenderProfile>): Promise<LenderProfile | undefined>;

  createLoan(data: {
    lenderProfileId: string;
    borrowerName: string;
    borrowerContact: string;
    amount: number;
    termMonths: number;
    ratePercent: number;
    startDate: string;
    frequency: "once" | "monthly" | "weekly" | "daily";
  }): Promise<Loan & { schedule: ScheduleItem[] }>;
  getLoan(id: string): Promise<(Loan & { schedule: ScheduleItem[] }) | undefined>;
  getLoansByLender(lenderProfileId: string): Promise<(Loan & { schedule: ScheduleItem[] })[]>;
  findLoanByPhone(phone: string): Promise<(Loan & { schedule: ScheduleItem[] }) | undefined>;
  updateLoanStatus(id: string, status: string, data?: Partial<Loan>): Promise<Loan | undefined>;

  createPaymentRequest(data: InsertPaymentRequest): Promise<PaymentRequest>;
  getPaymentRequestsByLoan(loanId: string): Promise<PaymentRequest[]>;
  confirmPayment(requestId: string): Promise<{ loan: Loan & { schedule: ScheduleItem[] }; request: PaymentRequest } | undefined>;

  rateLoan(loanId: string, type: "borrower" | "lender", stars: number): Promise<Loan | undefined>;
}

function calculateSchedule(
  amount: number,
  rate: number,
  term: number,
  frequency: "once" | "monthly" | "weekly" | "daily",
  startDate: string
): { schedule: { date: string; amount: number }[]; pmt: number } {
  const start = parseISO(startDate);
  const schedule: { date: string; amount: number }[] = [];
  let pmt = 0;

  if (frequency === "once") {
    pmt = amount * (1 + (rate / 100) * (term / 12));
    schedule.push({
      date: format(addMonths(start, term), "yyyy-MM-dd"),
      amount: Math.round(pmt),
    });
  } else {
    let periods = term;
    let ratePerPeriod = rate / 100 / 12;

    if (frequency === "weekly") {
      periods = term * 4;
      ratePerPeriod = rate / 100 / 52;
    } else if (frequency === "daily") {
      periods = term * 30;
      ratePerPeriod = rate / 100 / 365;
    }

    if (ratePerPeriod > 0) {
      pmt = (amount * ratePerPeriod) / (1 - Math.pow(1 + ratePerPeriod, -periods));
    } else {
      pmt = amount / periods;
    }

    for (let i = 1; i <= periods; i++) {
      let date;
      if (frequency === "monthly") date = addMonths(start, i);
      else if (frequency === "weekly") date = addWeeks(start, i);
      else date = addDays(start, i);

      schedule.push({
        date: format(date, "yyyy-MM-dd"),
        amount: Math.round(pmt),
      });
    }
  }

  return { schedule, pmt: Math.round(pmt) };
}

export class DatabaseStorage implements IStorage {
  async createLenderProfile(profile: InsertLenderProfile): Promise<LenderProfile> {
    const [result] = await db.insert(lenderProfiles).values(profile).returning();
    return result;
  }

  async getLenderProfile(id: string): Promise<LenderProfile | undefined> {
    const [result] = await db.select().from(lenderProfiles).where(eq(lenderProfiles.id, id));
    return result;
  }

  async updateLenderProfile(id: string, profile: Partial<InsertLenderProfile>): Promise<LenderProfile | undefined> {
    const [result] = await db.update(lenderProfiles).set(profile).where(eq(lenderProfiles.id, id)).returning();
    return result;
  }

  async createLoan(data: {
    lenderProfileId: string;
    borrowerName: string;
    borrowerContact: string;
    amount: number;
    termMonths: number;
    ratePercent: number;
    startDate: string;
    frequency: "once" | "monthly" | "weekly" | "daily";
  }): Promise<Loan & { schedule: ScheduleItem[] }> {
    const { schedule, pmt } = calculateSchedule(
      data.amount, data.ratePercent, data.termMonths, data.frequency, data.startDate
    );

    const periodsCount = data.frequency === "once" ? 1
      : data.frequency === "weekly" ? data.termMonths * 4
      : data.frequency === "daily" ? data.termMonths * 30
      : data.termMonths;
    const total = pmt * periodsCount;

    const [loan] = await db.insert(loans).values({
      lenderProfileId: data.lenderProfileId,
      borrowerName: data.borrowerName,
      borrowerContact: data.borrowerContact,
      amount: data.amount,
      termMonths: data.termMonths,
      ratePercent: String(data.ratePercent),
      startDate: data.startDate,
      frequency: data.frequency,
      status: "pending",
      monthlyPayment: pmt,
      totalRepayment: total,
      remainingAmount: total,
    }).returning();

    const scheduleRows: InsertScheduleItem[] = schedule.map((item, index) => ({
      loanId: loan.id,
      itemIndex: index,
      date: item.date,
      amount: item.amount,
      status: "upcoming" as const,
    }));

    const insertedSchedule = await db.insert(scheduleItems).values(scheduleRows).returning();

    return { ...loan, schedule: insertedSchedule };
  }

  async getLoan(id: string): Promise<(Loan & { schedule: ScheduleItem[] }) | undefined> {
    const [loan] = await db.select().from(loans).where(eq(loans.id, id));
    if (!loan) return undefined;

    const schedule = await db.select().from(scheduleItems)
      .where(eq(scheduleItems.loanId, id))
      .orderBy(asc(scheduleItems.itemIndex));

    return { ...loan, schedule };
  }

  async getLoansByLender(lenderProfileId: string): Promise<(Loan & { schedule: ScheduleItem[] })[]> {
    const loanRows = await db.select().from(loans)
      .where(eq(loans.lenderProfileId, lenderProfileId))
      .orderBy(desc(loans.id));

    const result: (Loan & { schedule: ScheduleItem[] })[] = [];
    for (const loan of loanRows) {
      const schedule = await db.select().from(scheduleItems)
        .where(eq(scheduleItems.loanId, loan.id))
        .orderBy(asc(scheduleItems.itemIndex));
      result.push({ ...loan, schedule });
    }
    return result;
  }

  async findLoanByPhone(phone: string): Promise<(Loan & { schedule: ScheduleItem[] }) | undefined> {
    const searchDigits = phone.replace(/\D/g, '');
    const normalizedSearch = searchDigits.length >= 10 ? searchDigits.slice(-10) : searchDigits;

    const allLoans = await db.select().from(loans);
    const matched = allLoans.find(l => {
      const contactDigits = l.borrowerContact.replace(/\D/g, '');
      const normalizedContact = contactDigits.length >= 10 ? contactDigits.slice(-10) : contactDigits;
      return normalizedContact === normalizedSearch;
    });

    if (!matched) return undefined;
    return this.getLoan(matched.id);
  }

  async updateLoanStatus(id: string, status: string, data?: Partial<Loan>): Promise<Loan | undefined> {
    const updateData: any = { status };
    if (data?.borrowerPassport) updateData.borrowerPassport = data.borrowerPassport;
    if (data?.borrowerAddress) updateData.borrowerAddress = data.borrowerAddress;
    if (data?.signedAt) updateData.signedAt = data.signedAt;

    const [result] = await db.update(loans).set(updateData).where(eq(loans.id, id)).returning();
    return result;
  }

  async createPaymentRequest(data: InsertPaymentRequest): Promise<PaymentRequest> {
    const [result] = await db.insert(paymentRequests).values({
      ...data,
      status: "pending",
    }).returning();
    return result;
  }

  async getPaymentRequestsByLoan(loanId: string): Promise<PaymentRequest[]> {
    return db.select().from(paymentRequests)
      .where(eq(paymentRequests.loanId, loanId))
      .orderBy(desc(paymentRequests.id));
  }

  async confirmPayment(requestId: string): Promise<{ loan: Loan & { schedule: ScheduleItem[] }; request: PaymentRequest } | undefined> {
    const [req] = await db.select().from(paymentRequests).where(eq(paymentRequests.id, requestId));
    if (!req) return undefined;

    const [updatedReq] = await db.update(paymentRequests)
      .set({ status: "confirmed" })
      .where(eq(paymentRequests.id, requestId))
      .returning();

    const loanData = await this.getLoan(req.loanId);
    if (!loanData) return undefined;

    const paidAmount = req.amount;
    const newRemaining = Math.max(0, loanData.remainingAmount - paidAmount);

    const nextItem = loanData.schedule.find(s => s.status === "upcoming");
    if (nextItem) {
      await db.update(scheduleItems).set({
        status: "paid",
        paidDate: new Date().toISOString(),
        paidAmount: paidAmount,
        amount: paidAmount,
      }).where(eq(scheduleItems.id, nextItem.id));

      if (newRemaining > 0 && loanData.frequency !== "once") {
        const remainingItems = loanData.schedule.filter(s => s.status === "upcoming" && s.id !== nextItem.id);
        if (remainingItems.length > 0) {
          const ratePercent = Number(loanData.ratePercent);
          let ratePerPeriod = (ratePercent / 100) / 12;
          if (loanData.frequency === "weekly") ratePerPeriod = (ratePercent / 100) / 52;
          else if (loanData.frequency === "daily") ratePerPeriod = (ratePercent / 100) / 365;

          let newPmt: number;
          if (ratePerPeriod > 0) {
            newPmt = Math.round((newRemaining * ratePerPeriod) / (1 - Math.pow(1 + ratePerPeriod, -remainingItems.length)));
          } else {
            newPmt = Math.round(newRemaining / remainingItems.length);
          }

          for (const item of remainingItems) {
            await db.update(scheduleItems).set({ amount: newPmt }).where(eq(scheduleItems.id, item.id));
          }
        }
      }
    }

    const newStatus = newRemaining <= 0 ? "closed" : loanData.status;
    const [updatedLoan] = await db.update(loans).set({
      remainingAmount: newRemaining,
      status: newStatus,
    }).where(eq(loans.id, req.loanId)).returning();

    const finalLoan = await this.getLoan(req.loanId);
    return { loan: finalLoan!, request: updatedReq };
  }

  async rateLoan(loanId: string, type: "borrower" | "lender", stars: number): Promise<Loan | undefined> {
    const field = type === "borrower" ? { borrowerRating: stars } : { lenderRating: stars };
    const [result] = await db.update(loans).set(field).where(eq(loans.id, loanId)).returning();
    return result;
  }
}

export const storage = new DatabaseStorage();
