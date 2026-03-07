import webpush from "web-push";
import { db } from "./db";
import { pushSubscriptions, scheduleItems, loans, lenderProfiles } from "@shared/schema";
import { eq, and, lte, gte } from "drizzle-orm";
import { format, addDays } from "date-fns";

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    "mailto:meloan@example.com",
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

async function sendPush(endpoint: string, p256dh: string, auth: string, payload: object) {
  try {
    await webpush.sendNotification(
      { endpoint, keys: { p256dh, auth } },
      JSON.stringify(payload)
    );
  } catch (error: any) {
    if (error.statusCode === 410 || error.statusCode === 404) {
      await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
    }
    console.error("Push send error:", error.statusCode || error.message);
  }
}

export async function notifyLenderPaymentRequest(loanId: string, amount: number) {
  const [loan] = await db.select().from(loans).where(eq(loans.id, loanId));
  if (!loan || !loan.lenderProfileId) return;

  const [profile] = await db.select().from(lenderProfiles).where(eq(lenderProfiles.id, loan.lenderProfileId));
  if (!profile) return;

  const subs = await db.select().from(pushSubscriptions)
    .where(and(
      eq(pushSubscriptions.type, "lender"),
      eq(pushSubscriptions.userId, profile.userId)
    ));

  const payload = {
    title: "Запрос на оплату",
    body: `${loan.borrowerName} отправил(а) запрос на ${amount.toLocaleString()} ₽`,
    url: `/master/loan/${loanId}`,
  };

  for (const sub of subs) {
    await sendPush(sub.endpoint, sub.p256dh, sub.auth, payload);
  }
}

export async function notifyBorrowerPaymentConfirmed(loanId: string, amount: number) {
  const [loan] = await db.select().from(loans).where(eq(loans.id, loanId));
  if (!loan) return;

  const phone = loan.borrowerContact.replace(/\D/g, "");
  const normalizedPhone = phone.length >= 10 ? phone.slice(-10) : phone;

  const allSubs = await db.select().from(pushSubscriptions)
    .where(eq(pushSubscriptions.type, "borrower"));

  const matchingSubs = allSubs.filter(sub => {
    if (!sub.phone) return false;
    const subDigits = sub.phone.replace(/\D/g, "");
    const normalized = subDigits.length >= 10 ? subDigits.slice(-10) : subDigits;
    return normalized === normalizedPhone;
  });

  const payload = {
    title: "Платёж подтвержден",
    body: `Ваш платёж на ${amount.toLocaleString()} ₽ подтверждён кредитором`,
    url: "/borrower/dashboard",
  };

  for (const sub of matchingSubs) {
    await sendPush(sub.endpoint, sub.p256dh, sub.auth, payload);
  }
}

export async function checkUpcomingPayments() {
  const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");

  const upcomingItems = await db.select().from(scheduleItems)
    .where(and(
      eq(scheduleItems.status, "upcoming"),
      eq(scheduleItems.date, tomorrow)
    ));

  for (const item of upcomingItems) {
    const [loan] = await db.select().from(loans).where(eq(loans.id, item.loanId));
    if (!loan || loan.status !== "active") continue;

    const phone = loan.borrowerContact.replace(/\D/g, "");
    const normalizedPhone = phone.length >= 10 ? phone.slice(-10) : phone;

    const allSubs = await db.select().from(pushSubscriptions)
      .where(eq(pushSubscriptions.type, "borrower"));

    const matchingSubs = allSubs.filter(sub => {
      if (!sub.phone) return false;
      const subDigits = sub.phone.replace(/\D/g, "");
      const normalized = subDigits.length >= 10 ? subDigits.slice(-10) : subDigits;
      return normalized === normalizedPhone;
    });

    const payload = {
      title: "Напоминание о платеже",
      body: `Завтра платёж ${item.amount.toLocaleString()} ₽ по займу`,
      url: "/borrower/dashboard",
    };

    for (const sub of matchingSubs) {
      await sendPush(sub.endpoint, sub.p256dh, sub.auth, payload);
    }

    if (loan.lenderProfileId) {
      const [profile] = await db.select().from(lenderProfiles).where(eq(lenderProfiles.id, loan.lenderProfileId));
      if (profile) {
        const lenderSubs = await db.select().from(pushSubscriptions)
          .where(and(
            eq(pushSubscriptions.type, "lender"),
            eq(pushSubscriptions.userId, profile.userId)
          ));

        const lenderPayload = {
          title: "Напоминание о платеже",
          body: `Завтра ожидается платёж ${item.amount.toLocaleString()} ₽ от ${loan.borrowerName}`,
          url: `/master/loan/${loan.id}`,
        };

        for (const sub of lenderSubs) {
          await sendPush(sub.endpoint, sub.p256dh, sub.auth, lenderPayload);
        }
      }
    }
  }
}

export function startPaymentReminders() {
  checkUpcomingPayments().catch(err => console.error("Payment reminder check error:", err));

  setInterval(() => {
    checkUpcomingPayments().catch(err => console.error("Payment reminder check error:", err));
  }, 60 * 60 * 1000);
}
