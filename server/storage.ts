import {
  type LenderProfile, type InsertLenderProfile,
  type Loan,
  type ScheduleItem, type InsertScheduleItem,
  type PaymentRequest, type InsertPaymentRequest,
  lenderProfiles, loans, scheduleItems, paymentRequests,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc } from "drizzle-orm";
import { addDays, addWeeks, addMonths, format, parseISO, differenceInDays } from "date-fns";

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

function getRatePerPeriod(ratePercent: number, frequency: string): number {
  if (frequency === "weekly") return ratePercent / 100 / 52;
  if (frequency === "daily") return ratePercent / 100 / 365;
  return ratePercent / 100 / 12;
}

function getPeriodsCount(termMonths: number, frequency: string): number {
  if (frequency === "weekly") return termMonths * 4;
  if (frequency === "daily") return termMonths * 30;
  return termMonths;
}

function addPeriod(date: Date, frequency: string, periods: number): Date {
  if (frequency === "monthly") return addMonths(date, periods);
  if (frequency === "weekly") return addWeeks(date, periods);
  return addDays(date, periods);
}

function getDailyRate(ratePercent: number): number {
  return ratePercent / 100 / 365;
}

interface ScheduleRow {
  date: string;
  amount: number;
  principalPart: number;
  interestPart: number;
  remainingAfter: number;
}

function buildAmortizationSchedule(
  principal: number,
  ratePercent: number,
  termMonths: number,
  frequency: "once" | "monthly" | "weekly" | "daily",
  startDate: string
): { schedule: ScheduleRow[]; pmt: number } {
  const start = parseISO(startDate);
  const schedule: ScheduleRow[] = [];

  if (frequency === "once") {
    const interest = Math.round(principal * (ratePercent / 100) * (termMonths / 12));
    const total = principal + interest;
    schedule.push({
      date: format(addMonths(start, termMonths), "yyyy-MM-dd"),
      amount: total,
      principalPart: principal,
      interestPart: interest,
      remainingAfter: 0,
    });
    return { schedule, pmt: total };
  }

  const periods = getPeriodsCount(termMonths, frequency);
  const r = getRatePerPeriod(ratePercent, frequency);

  let pmt: number;
  if (r > 0) {
    pmt = (principal * r) / (1 - Math.pow(1 + r, -periods));
  } else {
    pmt = principal / periods;
  }
  pmt = Math.round(pmt);

  let remaining = principal;
  for (let i = 1; i <= periods; i++) {
    const interestPart = Math.round(remaining * r);
    let principalPart = pmt - interestPart;

    if (i === periods) {
      principalPart = remaining;
      const finalAmount = principalPart + interestPart;
      schedule.push({
        date: format(addPeriod(start, frequency, i), "yyyy-MM-dd"),
        amount: finalAmount,
        principalPart,
        interestPart,
        remainingAfter: 0,
      });
    } else {
      remaining -= principalPart;
      schedule.push({
        date: format(addPeriod(start, frequency, i), "yyyy-MM-dd"),
        amount: pmt,
        principalPart,
        interestPart,
        remainingAfter: Math.max(0, remaining),
      });
    }
  }

  return { schedule, pmt };
}

function rebuildScheduleFromDate(
  remainingPrincipal: number,
  ratePercent: number,
  frequency: "once" | "monthly" | "weekly" | "daily",
  fromDate: string,
  periodsLeft: number
): ScheduleRow[] {
  if (periodsLeft <= 0 || remainingPrincipal <= 0) return [];

  const start = parseISO(fromDate);
  const r = getRatePerPeriod(ratePercent, frequency);
  const schedule: ScheduleRow[] = [];

  let pmt: number;
  if (r > 0) {
    pmt = (remainingPrincipal * r) / (1 - Math.pow(1 + r, -periodsLeft));
  } else {
    pmt = remainingPrincipal / periodsLeft;
  }
  pmt = Math.round(pmt);

  let remaining = remainingPrincipal;
  for (let i = 1; i <= periodsLeft; i++) {
    const interestPart = Math.round(remaining * r);
    let principalPart = pmt - interestPart;

    if (i === periodsLeft) {
      principalPart = remaining;
      const finalAmount = principalPart + interestPart;
      schedule.push({
        date: format(addPeriod(start, frequency, i), "yyyy-MM-dd"),
        amount: finalAmount,
        principalPart,
        interestPart,
        remainingAfter: 0,
      });
    } else {
      remaining -= principalPart;
      schedule.push({
        date: format(addPeriod(start, frequency, i), "yyyy-MM-dd"),
        amount: pmt,
        principalPart,
        interestPart,
        remainingAfter: Math.max(0, remaining),
      });
    }
  }

  return schedule;
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
    const { schedule, pmt } = buildAmortizationSchedule(
      data.amount, data.ratePercent, data.termMonths, data.frequency, data.startDate
    );

    const totalRepayment = schedule.reduce((sum, item) => sum + item.amount, 0);

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
      totalRepayment,
      remainingAmount: data.amount,
    }).returning();

    const scheduleRows: InsertScheduleItem[] = schedule.map((item, index) => ({
      loanId: loan.id,
      itemIndex: index,
      date: item.date,
      amount: item.amount,
      principalPart: item.principalPart,
      interestPart: item.interestPart,
      remainingAfter: item.remainingAfter,
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
    const confirmationDate = new Date().toISOString();
    const confirmationDateStr = format(new Date(), "yyyy-MM-dd");
    const ratePercent = Number(loanData.ratePercent);
    const currentRemainingPrincipal = loanData.remainingAmount;

    const nextItem = loanData.schedule.find(s => s.status === "upcoming");
    if (!nextItem) return undefined;

    const isOverpayment = paidAmount > nextItem.amount;
    const isEarlyPayment = differenceInDays(parseISO(nextItem.date), new Date()) > 3;
    const needsRecalculation = isOverpayment || isEarlyPayment;

    let principalRepaid: number;
    let interestCharged: number;
    let newRemainingPrincipal: number;

    if (needsRecalculation) {
      const lastPaidItem = [...loanData.schedule].reverse().find(s => s.status === "paid");
      const lastPaymentDate = lastPaidItem?.paidDate
        ? parseISO(lastPaidItem.paidDate.split('T')[0])
        : parseISO(loanData.startDate);

      const daysElapsed = Math.max(0, differenceInDays(new Date(), lastPaymentDate));
      const dailyRate = getDailyRate(ratePercent);
      interestCharged = Math.round(currentRemainingPrincipal * dailyRate * daysElapsed);
      principalRepaid = Math.max(0, paidAmount - interestCharged);
      newRemainingPrincipal = Math.max(0, currentRemainingPrincipal - principalRepaid);
    } else {
      interestCharged = nextItem.interestPart;
      principalRepaid = Math.min(paidAmount, nextItem.principalPart);
      if (paidAmount >= nextItem.amount) {
        principalRepaid = paidAmount - interestCharged;
      }
      newRemainingPrincipal = Math.max(0, currentRemainingPrincipal - principalRepaid);
    }

    await db.update(scheduleItems).set({
      status: "paid",
      paidDate: confirmationDate,
      paidAmount: paidAmount,
      principalPart: principalRepaid,
      interestPart: interestCharged,
      remainingAfter: newRemainingPrincipal,
    }).where(eq(scheduleItems.id, nextItem.id));

    if (needsRecalculation && newRemainingPrincipal > 0 && loanData.frequency !== "once") {
      const remainingItems = loanData.schedule.filter(s => s.status === "upcoming" && s.id !== nextItem.id);

      if (remainingItems.length > 0) {
        const newSchedule = rebuildScheduleFromDate(
          newRemainingPrincipal,
          ratePercent,
          loanData.frequency as "once" | "monthly" | "weekly" | "daily",
          confirmationDateStr,
          remainingItems.length
        );

        for (let i = 0; i < remainingItems.length; i++) {
          const newRow = newSchedule[i];
          if (newRow) {
            await db.update(scheduleItems).set({
              date: newRow.date,
              amount: newRow.amount,
              principalPart: newRow.principalPart,
              interestPart: newRow.interestPart,
              remainingAfter: newRow.remainingAfter,
            }).where(eq(scheduleItems.id, remainingItems[i].id));
          }
        }
      }
    } else if (!needsRecalculation) {
      const remainingItems = loanData.schedule.filter(s => s.status === "upcoming" && s.id !== nextItem.id);
      const r = getRatePerPeriod(ratePercent, loanData.frequency);
      let remaining = newRemainingPrincipal;
      for (const item of remainingItems) {
        const interest = Math.round(remaining * r);
        const principal = item.amount - interest;
        remaining = Math.max(0, remaining - principal);
        await db.update(scheduleItems).set({
          principalPart: principal,
          interestPart: interest,
          remainingAfter: remaining,
        }).where(eq(scheduleItems.id, item.id));
      }
    }

    const newStatus = newRemainingPrincipal <= 0 ? "closed" : loanData.status;
    const newMonthlyPayment = newRemainingPrincipal <= 0 ? loanData.monthlyPayment : (() => {
      if (!needsRecalculation) return loanData.monthlyPayment;
      const remainingItems = loanData.schedule.filter(s => s.status === "upcoming" && s.id !== nextItem.id);
      if (remainingItems.length === 0) return loanData.monthlyPayment;
      const r = getRatePerPeriod(ratePercent, loanData.frequency);
      if (r > 0) return Math.round((newRemainingPrincipal * r) / (1 - Math.pow(1 + r, -remainingItems.length)));
      return Math.round(newRemainingPrincipal / remainingItems.length);
    })();

    await db.update(loans).set({
      remainingAmount: newRemainingPrincipal,
      status: newStatus,
      monthlyPayment: newMonthlyPayment,
    }).where(eq(loans.id, req.loanId));

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
