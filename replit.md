# Meloan - P2P Lending MVP

## Overview
Russian-language peer-to-peer lending platform where users can act as Lender (Кредитор) or Borrower (Заемщик).

## Architecture
- **Frontend**: React + Vite + TanStack Query + wouter routing + Framer Motion
- **Backend**: Express.js + Drizzle ORM + PostgreSQL
- **State**: Zustand (localStorage) for session context only (lenderProfileId, currentUserType, currentBorrowerLoanId)
- **Data persistence**: PostgreSQL via Drizzle ORM (all loan data, profiles, schedules, payment requests)

## Database Schema
- `lender_profiles` - Lender personal data (name, passport, address, payment info, phone)
- `loans` - Loan records with calculated fields (monthlyPayment, totalRepayment, remainingAmount)
- `schedule_items` - Payment schedule items per loan (date, amount, principalPart, interestPart, remainingAfter, status, paidDate, paidAmount)
- `payment_requests` - Payment confirmation requests (loanId, amount, status, timestamp)

## Key Features
- Phone-based loan lookup (last 10 digits normalization)
- Server-side annuity calculation: `PMT = (P * r) / (1 - (1+r)^-n)`
- Principal/interest breakdown per schedule item (amortization table)
- Bank-style early/overpayment: interest accrued from last payment date, remaining schedule recalculated
- Automatic loan closure when remainingAmount reaches 0
- Mutual rating system (1-5 stars) upon closure
- Auto-redirect returning users (Zustand-persisted session) to their dashboard
- Share loan invite via Telegram / WhatsApp (after creation + in loan details)
- UI tooltips on key action buttons for first-time users
- Tiered monetization UI (Free/Expert/PRO)
- Interactive stories carousel on welcome page

## API Endpoints
- `POST/GET/PUT /api/lender-profile` - CRUD for lender profiles
- `POST /api/loans` - Create loan with server-side schedule calculation
- `GET /api/loans?lenderProfileId=` - Get loans by lender
- `GET /api/loans/:id` - Get single loan with schedule
- `GET /api/loans/by-phone/:phone` - Borrower phone lookup
- `POST /api/loans/:id/accept` - Borrower signs/accepts loan
- `POST /api/loans/:id/rate` - Rate borrower/lender
- `POST /api/payment-requests` - Create payment request
- `GET /api/payment-requests/:loanId` - Get requests for loan
- `POST /api/payment-requests/:id/confirm` - Confirm payment with recalculation

## Project Structure
- `shared/schema.ts` - Drizzle schema + Zod validation
- `server/db.ts` - Database connection
- `server/storage.ts` - Storage interface with all business logic
- `server/routes.ts` - Express API routes
- `client/src/lib/store.ts` - Zustand (session context only) + translations
- `client/src/lib/api.ts` - API client functions
- `client/src/pages/` - React pages (master/*, borrower/*)

## Custom Assets
- Logo: `client/public/logo.png`
- Storage key: `meloan-storage-v8`
