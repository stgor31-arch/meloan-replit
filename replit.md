# Meloan - P2P Lending MVP

## Overview
Russian-language peer-to-peer lending platform where users can act as Lender (Кредитор) or Borrower (Заемщик).

## Architecture
- **Frontend**: React + Vite + TanStack Query + wouter routing + Framer Motion
- **Backend**: Express.js + Drizzle ORM + PostgreSQL
- **Auth**: Dual authentication — Telegram Login Widget (primary) + Replit Auth OIDC (Google/GitHub/Apple/email). Lender features require authentication; Borrower flow is phone-based (no auth required).
- **State**: Zustand (localStorage) for borrower session context only (currentUserType, currentBorrowerLoanId, borrowerPhone)
- **Data persistence**: PostgreSQL via Drizzle ORM (all loan data, profiles, schedules, payment requests, users, sessions)

## Database Schema
- `users` - Auth users (id, email, firstName, lastName, profileImageUrl, telegramId)
- `sessions` - Session storage for passport (shared by Replit Auth + Telegram Auth)
- `lender_profiles` - Lender personal data (userId, name, passport, address, payment info, phone)
- `loans` - Loan records with calculated fields (monthlyPayment, totalRepayment, remainingAmount)
- `schedule_items` - Payment schedule items per loan (date, amount, principalPart, interestPart, remainingAfter, status, paidDate, paidAmount)
- `payment_requests` - Payment confirmation requests (loanId, amount, status, timestamp)
- `push_subscriptions` - Web Push subscriptions (endpoint, p256dh, auth, type lender/borrower, userId, phone)

## Authentication
- **Telegram Login**: Primary login method via Telegram Login Widget. Bot: @meloan_auth_bot. Env vars: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`. Verification uses HMAC-SHA256 per Telegram docs.
- **Yandex ID**: OAuth 2.0 Authorization Code flow via oauth.yandex.ru. Routes: `GET /api/auth/yandex` (start), `GET /api/auth/yandex/callback`. Env vars: `YANDEX_CLIENT_ID`, `YANDEX_CLIENT_SECRET`. Implemented in `server/oauthProviders.ts`.
- **VK ID**: OAuth 2.1 + PKCE flow via id.vk.com. Routes: `GET /api/auth/vk` (start), `GET /api/auth/vk/callback`. Env var: `VK_CLIENT_ID`. Implemented in `server/oauthProviders.ts`.
- **Replit Auth**: Legacy OIDC (disabled at platform level; server code kept, UI button removed from login page).
- **Branded login page**: `/login` — Meloan branding, Telegram widget, Yandex/VK buttons (shown only when configured, via `GET /api/auth/providers`).
- **Account linking**: Provider logins upsert into `users` by provider ID (`telegramId`/`yandexId`/`vkId`); if provider email matches an existing user, the provider ID is attached to that account instead of creating a duplicate.
- **Session security**: session ID is regenerated on every successful login (Telegram/Yandex/VK) via `loginWithRegeneratedSession`.
- **userId abstraction**: `getUserId(req)` helper in routes.ts extracts userId from either `req.user.claims.sub` (Replit) or `req.user.userId` (Telegram/Yandex/VK).
- **isAuthenticated middleware**: Any user with `authProvider` set (telegram/yandex/vk) bypasses OIDC token refresh checks.

## Key Features
- Dual authentication (Telegram + Google/GitHub/Apple/email) for Lender role
- Phone-based loan lookup (last 10 digits normalization); returns ALL loans for a phone number
- Borrower multi-loan dashboard: list view with summary card, detail view per loan
- Server-side annuity calculation: `PMT = (P * r) / (1 - (1+r)^-n)`
- Principal/interest breakdown per schedule item (amortization table)
- Bank-style early/overpayment: interest accrued from last payment date, remaining schedule recalculated
- Automatic loan closure when remainingAmount reaches 0
- Mutual rating system (1-5 stars) upon closure
- Share loan invite via Telegram / WhatsApp (after creation + in loan details)
- UI tooltips on key action buttons for first-time users
- Tiered monetization UI (Free/Expert/PRO)
- Interactive stories carousel on welcome page
- PWA support (manifest.json, icons, service worker)
- Push notifications: day-before-payment reminders, payment request to lender, payment confirmation to borrower
- PWA installation story with step-by-step instructions for iOS/Android

## API Endpoints
- `GET /api/auth/user` - Get current authenticated user (protected, supports both auth providers)
- `POST /api/auth/telegram` - Authenticate via Telegram Login Widget data
- `GET /api/telegram-bot-username` - Get bot username for Telegram widget config
- `GET /api/login` - Begin Replit Auth login flow
- `GET /api/logout` - Begin logout flow
- `GET /api/my-profile` - Get lender profile for current auth user (protected)
- `POST /api/lender-profile` - Create lender profile (protected, userId set from auth)
- `GET /api/lender-profile/:id` - Get lender profile by ID
- `PUT /api/lender-profile/:id` - Update lender profile (protected, ownership check)
- `POST /api/loans` - Create loan with server-side schedule calculation (protected)
- `GET /api/loans` - Get all loans for current auth user (protected, uses userId)
- `GET /api/loans/:id` - Get single loan with schedule
- `GET /api/loans/by-phone/:phone` - Borrower phone lookup
- `POST /api/loans/:id/accept` - Borrower signs/accepts loan
- `POST /api/loans/:id/rate` - Rate borrower/lender
- `POST /api/payment-requests` - Create payment request
- `GET /api/payment-requests/:loanId` - Get requests for loan
- `POST /api/payment-requests/:id/confirm` - Confirm payment with recalculation (protected)
- `GET /api/vapid-public-key` - Get VAPID public key for push subscriptions
- `POST /api/push/subscribe` - Subscribe to push notifications
- `POST /api/push/unsubscribe` - Unsubscribe from push notifications

## Project Structure
- `shared/schema.ts` - Drizzle schema + Zod validation + re-exports auth models
- `shared/models/auth.ts` - Auth-related Drizzle schema (users, sessions — includes telegramId)
- `server/db.ts` - Database connection
- `server/storage.ts` - Storage interface with all business logic
- `server/routes.ts` - Express API routes (auth wired in, getUserId helper)
- `server/telegramAuth.ts` - Telegram Login verification (HMAC-SHA256) + user upsert
- `server/replit_integrations/auth/` - Replit Auth module (OIDC, passport, session storage)
- `client/src/pages/login.tsx` - Branded login page with Telegram widget + alternative auth
- `client/src/hooks/use-auth.ts` - React hook for auth state
- `client/src/lib/auth-utils.ts` - Auth utility functions
- `client/src/lib/store.ts` - Zustand (borrower session context only) + translations
- `client/src/lib/api.ts` - API client functions
- `client/src/lib/pushNotifications.ts` - Push notification subscription utilities
- `client/src/lib/receiptGenerator.ts` - Legal receipt text/HTML generation + download
- `client/src/lib/loanCalculator.ts` - Client-side annuity calculator (payment from term, term from payment)
- `client/src/pages/` - React pages (master/*, borrower/*, login)
- `client/public/sw.js` - Service worker for push notifications
- `server/pushNotifications.ts` - Server-side push notification sending + scheduled reminders

## Custom Assets
- Logo: `client/public/logo.png`, `client/public/logo-shield.png`
- PWA icons: `client/public/icon-512.png`, `client/public/icon-192.png`
- Storage key: `meloan-storage-v9`
- Store fields: `currentUserType`, `currentBorrowerLoanId`, `borrowerPhone`

## Environment Variables
- `TELEGRAM_BOT_TOKEN` - Telegram bot token (from @BotFather)
- `TELEGRAM_BOT_USERNAME` - Telegram bot username (without @)
- `YANDEX_CLIENT_ID` / `YANDEX_CLIENT_SECRET` - Yandex ID OAuth app credentials (oauth.yandex.ru)
- `VK_CLIENT_ID` - VK ID app ID (id.vk.com, PKCE flow — no secret needed)
- `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` - Web Push VAPID keys
- `SESSION_SECRET` - Express session secret
- `DATABASE_URL` - PostgreSQL connection string

## Monetization Plan (future)

### Current state
Тарифный UI уже реализован в `client/src/pages/master/dashboard.tsx` (drawer "Выберите тариф"):
- **Free** — бесплатно, до 2 займов
- **Expert** — 149 ₽/мес, до 10 займов, досудебная претензия
- **PRO** — 399 ₽/мес, безлимит, аналитика, учёт средств

Кнопки «Выбрать» ни к чему не подключены. В `loan-details.tsx` есть задел с `toast("Доступно в Expert")`. Реальных ограничений на бэкенде нет.

### Платёжный шлюз: ЮKassa
Рекомендуется **ЮKassa** (yookassa.ru) — оптимальный выбор для российского SaaS:
- Поддерживает карты Мир/Visa/MC, СБП, Apple/Google Pay
- Рекуррентные платежи (автоподписка)
- Комиссия ~2.8% с карт, 0% через СБП
- Требуется ИП или ООО
- Env vars: `YOOKASSA_SHOP_ID`, `YOOKASSA_SECRET_KEY`

### Что нужно реализовать

**1. База данных** — добавить в `users`:
- `subscriptionTier` (`free` / `expert` / `pro`)
- `subscriptionExpiresAt` (timestamp)
- `yookassaCustomerId`
- Новая таблица `subscription_payments` (история платежей)

**2. Бэкенд** (`server/routes.ts` + `server/storage.ts`):
- `POST /api/subscribe` — создать платёж через ЮKassa API
- `GET /api/subscription/status` — текущий тариф пользователя
- `POST /api/subscription/cancel` — отмена подписки
- `POST /api/yookassa/webhook` — обработка событий оплаты от ЮKassa
- Middleware на `POST /api/loans` — реальная проверка лимита займов по тарифу

**3. Фронтенд**:
- Кнопки «Выбрать» → переход на страницу оплаты ЮKassa
- Страница `/master/subscription` — управление подпиской, история, отмена
- Реальная блокировка «Создать заём» при достижении лимита Free
- Добавить годовые тарифы со скидкой ~20% (Expert ~1430 ₽/год, PRO ~3830 ₽/год)

**4. Шаги запуска**:
1. Зарегистрироваться на yookassa.ru (ИП/ООО)
2. Получить shopId и secretKey в личном кабинете
3. Добавить в переменные окружения production
4. Настроить webhook URL в панели ЮKassa на `/api/yookassa/webhook`
