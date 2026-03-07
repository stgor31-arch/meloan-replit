# Meloan - P2P Lending MVP

## Overview
Russian-language peer-to-peer lending platform where users can act as Lender (Кредитор) or Borrower (Заемщик).

## Architecture
- **Frontend**: React + Vite + TanStack Query + wouter routing + Framer Motion
- **Backend**: Express.js + Drizzle ORM + PostgreSQL
- **Auth**: Replit Auth (OIDC) — supports Google, GitHub, Apple, email login. Lender features require authentication; Borrower flow is phone-based (no auth required).
- **State**: Zustand (localStorage) for borrower session context only (currentUserType, currentBorrowerLoanId, borrowerPhone)
- **Data persistence**: PostgreSQL via Drizzle ORM (all loan data, profiles, schedules, payment requests, users, sessions)

## Database Schema
- `users` - Auth users (Replit Auth OIDC — id, email, firstName, lastName, profileImageUrl)
- `sessions` - Session storage for passport (Replit Auth)
- `lender_profiles` - Lender personal data (userId, name, passport, address, payment info, phone)
- `loans` - Loan records with calculated fields (monthlyPayment, totalRepayment, remainingAmount)
- `schedule_items` - Payment schedule items per loan (date, amount, principalPart, interestPart, remainingAfter, status, paidDate, paidAmount)
- `payment_requests` - Payment confirmation requests (loanId, amount, status, timestamp)
- `push_subscriptions` - Web Push subscriptions (endpoint, p256dh, auth, type lender/borrower, userId, phone)

## Key Features
- Google/GitHub/Apple/email authentication via Replit Auth for Lender role
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
- `GET /api/auth/user` - Get current authenticated user (protected)
- `GET /api/login` - Begin login flow
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
- `shared/models/auth.ts` - Auth-related Drizzle schema (users, sessions)
- `server/db.ts` - Database connection
- `server/storage.ts` - Storage interface with all business logic
- `server/routes.ts` - Express API routes (auth wired in)
- `server/replit_integrations/auth/` - Replit Auth module (OIDC, passport, session storage)
- `client/src/hooks/use-auth.ts` - React hook for auth state
- `client/src/lib/auth-utils.ts` - Auth utility functions
- `client/src/lib/store.ts` - Zustand (borrower session context only) + translations
- `client/src/lib/api.ts` - API client functions
- `client/src/lib/pushNotifications.ts` - Push notification subscription utilities
- `client/src/pages/` - React pages (master/*, borrower/*)
- `client/public/sw.js` - Service worker for push notifications
- `server/pushNotifications.ts` - Server-side push notification sending + scheduled reminders

## Custom Assets
- Logo: `client/public/logo.png`
- PWA icons: `client/public/icon-512.png`, `client/public/icon-192.png`
- Storage key: `meloan-storage-v9`
- Store fields: `currentUserType`, `currentBorrowerLoanId`, `borrowerPhone`
