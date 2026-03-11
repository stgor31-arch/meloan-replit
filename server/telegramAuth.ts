import crypto from "crypto";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

interface TelegramAuthData {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export function verifyTelegramAuth(data: TelegramAuthData, botToken: string): boolean {
  const { hash, ...rest } = data;

  const checkString = Object.keys(rest)
    .sort()
    .map((key) => `${key}=${(rest as any)[key]}`)
    .join("\n");

  const secretKey = crypto.createHash("sha256").update(botToken).digest();
  const hmac = crypto.createHmac("sha256", secretKey).update(checkString).digest("hex");

  const hmacBuf = Buffer.from(hmac, "hex");
  const hashBuf = Buffer.from(hash, "hex");

  if (hmacBuf.length !== hashBuf.length) return false;
  return crypto.timingSafeEqual(hmacBuf, hashBuf);
}

export function checkAuthDate(authDate: number): boolean {
  const now = Math.floor(Date.now() / 1000);
  return now - authDate < 86400;
}

export async function upsertTelegramUser(data: TelegramAuthData): Promise<{ id: string }> {
  const telegramId = String(data.id);

  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.telegramId, telegramId));

  if (existing) {
    await db
      .update(users)
      .set({
        firstName: data.first_name || existing.firstName,
        lastName: data.last_name || existing.lastName,
        profileImageUrl: data.photo_url || existing.profileImageUrl,
        updatedAt: new Date(),
      })
      .where(eq(users.id, existing.id));
    return { id: existing.id };
  }

  const [newUser] = await db
    .insert(users)
    .values({
      telegramId,
      firstName: data.first_name || null,
      lastName: data.last_name || null,
      profileImageUrl: data.photo_url || null,
    })
    .returning({ id: users.id });

  return { id: newUser.id };
}
