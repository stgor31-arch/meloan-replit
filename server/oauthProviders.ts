import crypto from "crypto";
import type { Express } from "express";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

interface ProviderProfile {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  profileImageUrl: string | null;
}

async function upsertProviderUser(
  provider: "yandex" | "vk",
  providerId: string,
  profile: ProviderProfile
): Promise<{ id: string }> {
  const column = provider === "yandex" ? users.yandexId : users.vkId;

  const [existing] = await db.select().from(users).where(eq(column, providerId));

  if (existing) {
    await db
      .update(users)
      .set({
        firstName: profile.firstName || existing.firstName,
        lastName: profile.lastName || existing.lastName,
        profileImageUrl: profile.profileImageUrl || existing.profileImageUrl,
        updatedAt: new Date(),
      })
      .where(eq(users.id, existing.id));
    return { id: existing.id };
  }

  let email: string | null = profile.email;
  if (email) {
    const [emailTaken] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
    if (emailTaken) email = null;
  }

  const values: Record<string, any> = {
    firstName: profile.firstName,
    lastName: profile.lastName,
    email,
    profileImageUrl: profile.profileImageUrl,
  };
  if (provider === "yandex") values.yandexId = providerId;
  else values.vkId = providerId;

  const [newUser] = await db.insert(users).values(values as any).returning({ id: users.id });
  return { id: newUser.id };
}

export function loginWithRegeneratedSession(
  req: any,
  sessionUser: { userId: string; authProvider: string },
  cb: (err?: any) => void
) {
  req.session.regenerate((regenErr: any) => {
    if (regenErr) return cb(regenErr);
    req.login(sessionUser, cb);
  });
}

function getBaseUrl(req: any): string {
  return `https://${req.hostname}`;
}

function randomString(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("base64url");
}

export function registerOAuthProviderRoutes(app: Express) {
  app.get("/api/auth/providers", (_req, res) => {
    res.json({
      yandex: !!(process.env.YANDEX_CLIENT_ID && process.env.YANDEX_CLIENT_SECRET),
      vk: !!process.env.VK_CLIENT_ID,
    });
  });

  // ---------- Yandex ID ----------

  app.get("/api/auth/yandex", (req: any, res) => {
    const clientId = process.env.YANDEX_CLIENT_ID;
    if (!clientId || !process.env.YANDEX_CLIENT_SECRET) {
      return res.redirect("/login?error=yandex_not_configured");
    }
    const state = randomString(16);
    req.session.yandexState = state;

    const redirectUri = `${getBaseUrl(req)}/api/auth/yandex/callback`;
    const url = new URL("https://oauth.yandex.ru/authorize");
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("state", state);
    res.redirect(url.href);
  });

  app.get("/api/auth/yandex/callback", async (req: any, res) => {
    try {
      const { code, state, error } = req.query;
      if (error || !code) {
        return res.redirect("/login?error=yandex_denied");
      }
      if (!state || state !== req.session.yandexState) {
        return res.redirect("/login?error=yandex_state");
      }
      delete req.session.yandexState;

      const redirectUri = `${getBaseUrl(req)}/api/auth/yandex/callback`;
      const tokenRes = await fetch("https://oauth.yandex.ru/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: String(code),
          client_id: process.env.YANDEX_CLIENT_ID!,
          client_secret: process.env.YANDEX_CLIENT_SECRET!,
          redirect_uri: redirectUri,
        }),
      });

      if (!tokenRes.ok) {
        const body = await tokenRes.text();
        console.error("Yandex token exchange failed:", tokenRes.status, body);
        return res.redirect("/login?error=yandex_token");
      }

      const tokens = await tokenRes.json();
      const infoRes = await fetch("https://login.yandex.ru/info?format=json", {
        headers: { Authorization: `OAuth ${tokens.access_token}` },
      });

      if (!infoRes.ok) {
        console.error("Yandex userinfo failed:", infoRes.status);
        return res.redirect("/login?error=yandex_profile");
      }

      const info = await infoRes.json();
      if (!info.id) {
        return res.redirect("/login?error=yandex_profile");
      }

      const avatar =
        info.default_avatar_id && info.is_avatar_empty === false
          ? `https://avatars.yandex.net/get-yapic/${info.default_avatar_id}/islands-200`
          : null;

      const user = await upsertProviderUser("yandex", String(info.id), {
        firstName: info.first_name || null,
        lastName: info.last_name || null,
        email: info.default_email || null,
        profileImageUrl: avatar,
      });

      loginWithRegeneratedSession(req, { userId: user.id, authProvider: "yandex" }, (err: any) => {
        if (err) {
          console.error("Yandex session error:", err);
          return res.redirect("/login?error=session");
        }
        res.redirect("/master/dashboard");
      });
    } catch (e) {
      console.error("Yandex auth error:", e);
      res.redirect("/login?error=yandex_failed");
    }
  });

  // ---------- VK ID (OAuth 2.1 + PKCE) ----------

  app.get("/api/auth/vk", (req: any, res) => {
    const clientId = process.env.VK_CLIENT_ID;
    if (!clientId) {
      return res.redirect("/login?error=vk_not_configured");
    }
    const state = randomString(16);
    const codeVerifier = randomString(48);
    const codeChallenge = crypto
      .createHash("sha256")
      .update(codeVerifier)
      .digest("base64url");

    req.session.vkState = state;
    req.session.vkCodeVerifier = codeVerifier;

    const redirectUri = `${getBaseUrl(req)}/api/auth/vk/callback`;
    const url = new URL("https://id.vk.com/authorize");
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("code_challenge", codeChallenge);
    url.searchParams.set("code_challenge_method", "S256");
    url.searchParams.set("scope", "email");
    res.redirect(url.href);
  });

  app.get("/api/auth/vk/callback", async (req: any, res) => {
    try {
      const { code, state, device_id, error } = req.query;
      if (error || !code) {
        return res.redirect("/login?error=vk_denied");
      }
      if (!state || state !== req.session.vkState) {
        return res.redirect("/login?error=vk_state");
      }
      const codeVerifier = req.session.vkCodeVerifier;
      delete req.session.vkState;
      delete req.session.vkCodeVerifier;
      if (!codeVerifier) {
        return res.redirect("/login?error=vk_state");
      }

      const redirectUri = `${getBaseUrl(req)}/api/auth/vk/callback`;
      const tokenRes = await fetch("https://id.vk.com/oauth2/auth", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: String(code),
          code_verifier: codeVerifier,
          client_id: process.env.VK_CLIENT_ID!,
          device_id: String(device_id || ""),
          redirect_uri: redirectUri,
          state: String(state),
        }),
      });

      if (!tokenRes.ok) {
        const body = await tokenRes.text();
        console.error("VK token exchange failed:", tokenRes.status, body);
        return res.redirect("/login?error=vk_token");
      }

      const tokens = await tokenRes.json();
      if (!tokens.access_token) {
        console.error("VK token response missing access_token:", tokens);
        return res.redirect("/login?error=vk_token");
      }

      const infoRes = await fetch("https://id.vk.com/oauth2/user_info", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          access_token: tokens.access_token,
          client_id: process.env.VK_CLIENT_ID!,
        }),
      });

      if (!infoRes.ok) {
        console.error("VK userinfo failed:", infoRes.status);
        return res.redirect("/login?error=vk_profile");
      }

      const infoBody = await infoRes.json();
      const vkUser = infoBody.user;
      const vkUserId = vkUser?.user_id || tokens.user_id;
      if (!vkUserId) {
        return res.redirect("/login?error=vk_profile");
      }

      const user = await upsertProviderUser("vk", String(vkUserId), {
        firstName: vkUser?.first_name || null,
        lastName: vkUser?.last_name || null,
        email: vkUser?.email || null,
        profileImageUrl: vkUser?.avatar || null,
      });

      loginWithRegeneratedSession(req, { userId: user.id, authProvider: "vk" }, (err: any) => {
        if (err) {
          console.error("VK session error:", err);
          return res.redirect("/login?error=session");
        }
        res.redirect("/master/dashboard");
      });
    } catch (e) {
      console.error("VK auth error:", e);
      res.redirect("/login?error=vk_failed");
    }
  });
}
