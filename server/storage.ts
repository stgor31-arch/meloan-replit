import {
  type LenderProfile, type InsertLenderProfile,
  type Loan,
  type ScheduleItem, type InsertScheduleItem,
  type PaymentRequest, type InsertPaymentRequest,
  lenderProfiles, loans, scheduleItems, paymentRequests,
  users, pushSubscriptions,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc } from "drizzle-orm";
import { addDays, addWeeks, addMonths, format, parseISO, differenceInDays } from "date-fns";

export type OverpaymentStrategy = "reduce_term" | "reduce_payment";

export interface IStorage {
  createLenderProfile(profile: InsertLenderProfile & { userId: string }): Promise<LenderProfile>;
  getLenderProfile(id: string): Promise<LenderProfile | undefined>;
  getLenderProfileByUserId(userId: string): Promise<LenderProfile | undefined>;
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
  confirmPayment(
    requestId: string,
    strategy?: OverpaymentStrategy
  ): Promise<{ loan: Loan & { schedule: ScheduleItem[] }; request: PaymentRequest } | undefined>;

  rateLoan(loanId: string, type: "borrower" | "lender", stars: number): Promise<Loan | undefined>;

  mergeAccounts(canonicalUserId: string, sourceUserIds: string[]): Promise<MergeAccountsResult>;
}

export interface MergeAccountsResult {
  canonicalUserId: string;
  movedProfiles: number;
  movedPushSubs: number;
  deletedUsers: string[];
  skippedSources: string[];
  appliedIdentity: Record<string, unknown>;
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

function calcPeriodsForReduceTerm(
  remainingPrincipal: number,
  currentPMT: number,
  ratePercent: number,
  frequency: string
): number {
  const r = getRatePerPeriod(ratePercent, frequency);
  if (remainingPrincipal <= 0) return 0;
  if (r === 0) return Math.max(1, Math.ceil(remainingPrincipal / currentPMT));
  const ratio = remainingPrincipal * r / currentPMT;
  if (ratio >= 1) return 99999;
  return Math.max(1, Math.ceil(-Math.log(1 - ratio) / Math.log(1 + r)));
}

export class DatabaseStorage implements IStorage {
  async createLenderProfile(profile: InsertLenderProfile & { userId: string }): Promise<LenderProfile> {
    const [result] = await db.insert(lenderProfiles).values(profile).returning();
    return result;
  }

  async getLenderProfile(id: string): Promise<LenderProfile | undefined> {
    const [result] = await db.select().from(lenderProfiles).where(eq(lenderProfiles.id, id));
    return result;
  }

  async getLenderProfileByUserId(userId: string): Promise<LenderProfile | undefined> {
    const [result] = await db.select().from(lenderProfiles).where(eq(lenderProfiles.userId, userId));
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
    const results = await this.findLoansByPhone(phone);
    return results.length > 0 ? results[0] : undefined;
  }

  async findLoansByPhone(phone: string): Promise<(Loan & { schedule: ScheduleItem[] })[]> {
    const searchDigits = phone.replace(/\D/g, '');
    const normalizedSearch = searchDigits.length >= 10 ? searchDigits.slice(-10) : searchDigits;

    const allLoans = await db.select().from(loans);
    const matched = allLoans.filter(l => {
      const contactDigits = l.borrowerContact.replace(/\D/g, '');
      const normalizedContact = contactDigits.length >= 10 ? contactDigits.slice(-10) : contactDigits;
      return normalizedContact === normalizedSearch;
    });

    const results: (Loan & { schedule: ScheduleItem[] })[] = [];
    for (const loan of matched) {
      const full = await this.getLoan(loan.id);
      if (full) results.push(full);
    }
    return results;
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

  async confirmPayment(
    requestId: string,
    strategy: OverpaymentStrategy = "reduce_payment"
  ): Promise<{ loan: Loan & { schedule: ScheduleItem[] }; request: PaymentRequest } | undefined> {
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

    const remainingItems = loanData.schedule.filter(s => s.status === "upcoming" && s.id !== nextItem.id);
    let newMonthlyPayment = loanData.monthlyPayment;

    if (needsRecalculation && newRemainingPrincipal > 0 && loanData.frequency !== "once") {
      if (strategy === "reduce_term" && isOverpayment) {
        // Keep the same monthly payment, reduce the number of remaining periods
        const currentPMT = loanData.monthlyPayment;
        const newPeriods = calcPeriodsForReduceTerm(newRemainingPrincipal, currentPMT, ratePercent, loanData.frequency);
        const effectivePeriods = Math.min(newPeriods, remainingItems.length);

        // Delete schedule items beyond what's needed
        const itemsToKeep = remainingItems.slice(0, effectivePeriods);
        const itemsToDelete = remainingItems.slice(effectivePeriods);
        for (const item of itemsToDelete) {
          await db.delete(scheduleItems).where(eq(scheduleItems.id, item.id));
        }

        // Rebuild kept items with new amounts
        if (itemsToKeep.length > 0) {
          const newSchedule = rebuildScheduleFromDate(
            newRemainingPrincipal,
            ratePercent,
            loanData.frequency as "once" | "monthly" | "weekly" | "daily",
            confirmationDateStr,
            itemsToKeep.length
          );
          for (let i = 0; i < itemsToKeep.length; i++) {
            const newRow = newSchedule[i];
            if (newRow) {
              await db.update(scheduleItems).set({
                date: newRow.date,
                amount: newRow.amount,
                principalPart: newRow.principalPart,
                interestPart: newRow.interestPart,
                remainingAfter: newRow.remainingAfter,
              }).where(eq(scheduleItems.id, itemsToKeep[i].id));
            }
          }
        }

        newMonthlyPayment = currentPMT;
      } else {
        // strategy === "reduce_payment": keep same periods, reduce monthly payment
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
          const r = getRatePerPeriod(ratePercent, loanData.frequency);
          if (r > 0) {
            newMonthlyPayment = Math.round((newRemainingPrincipal * r) / (1 - Math.pow(1 + r, -remainingItems.length)));
          } else {
            newMonthlyPayment = Math.round(newRemainingPrincipal / remainingItems.length);
          }
        }
      }
    } else if (!needsRecalculation) {
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

  async mergeAccounts(canonicalUserId: string, sourceUserIds: string[]): Promise<MergeAccountsResult> {
    const sources = Array.from(new Set(sourceUserIds)).filter(
      (id) => id && id !== canonicalUserId
    );

    return await db.transaction(async (tx) => {
      const [canonical] = await tx.select().from(users).where(eq(users.id, canonicalUserId));
      if (!canonical) {
        throw new Error(`Canonical user ${canonicalUserId} not found`);
      }

      let movedProfiles = 0;
      let movedPushSubs = 0;
      const deletedUsers: string[] = [];
      const skippedSources: string[] = [];
      const identity: Record<string, string> = {};

      for (const sourceId of sources) {
        const [source] = await tx.select().from(users).where(eq(users.id, sourceId));
        if (!source) {
          // Already merged/removed — idempotent no-op.
          skippedSources.push(sourceId);
          continue;
        }

        const movedP = await tx
          .update(lenderProfiles)
          .set({ userId: canonicalUserId })
          .where(eq(lenderProfiles.userId, sourceId))
          .returning({ id: lenderProfiles.id });
        movedProfiles += movedP.length;

        const movedS = await tx
          .update(pushSubscriptions)
          .set({ userId: canonicalUserId })
          .where(eq(pushSubscriptions.userId, sourceId))
          .returning({ id: pushSubscriptions.id });
        movedPushSubs += movedS.length;

        // Capture identity to backfill canonical's empty fields (first non-empty wins).
        if (!identity.telegramId && source.telegramId) identity.telegramId = source.telegramId;
        if (!identity.yandexId && source.yandexId) identity.yandexId = source.yandexId;
        if (!identity.vkId && source.vkId) identity.vkId = source.vkId;
        if (!identity.email && source.email) identity.email = source.email;
        if (!identity.firstName && source.firstName) identity.firstName = source.firstName;
        if (!identity.lastName && source.lastName) identity.lastName = source.lastName;
        if (!identity.profileImageUrl && source.profileImageUrl)
          identity.profileImageUrl = source.profileImageUrl;

        // Delete source row first so its unique provider IDs are freed before we
        // (optionally) write them onto the canonical row below.
        await tx.delete(users).where(eq(users.id, sourceId));
        deletedUsers.push(sourceId);
      }

      const patch: Record<string, unknown> = {};
      if (!canonical.telegramId && identity.telegramId) patch.telegramId = identity.telegramId;
      if (!canonical.yandexId && identity.yandexId) patch.yandexId = identity.yandexId;
      if (!canonical.vkId && identity.vkId) patch.vkId = identity.vkId;
      if (!canonical.email && identity.email) patch.email = identity.email;
      if (!canonical.firstName && identity.firstName) patch.firstName = identity.firstName;
      if (!canonical.lastName && identity.lastName) patch.lastName = identity.lastName;
      if (!canonical.profileImageUrl && identity.profileImageUrl)
        patch.profileImageUrl = identity.profileImageUrl;

      if (Object.keys(patch).length > 0) {
        patch.updatedAt = new Date();
        await tx.update(users).set(patch).where(eq(users.id, canonicalUserId));
      }

      return {
        canonicalUserId,
        movedProfiles,
        movedPushSubs,
        deletedUsers,
        skippedSources,
        appliedIdentity: patch,
      };
    });
  }
}

export const storage = new DatabaseStorage();
