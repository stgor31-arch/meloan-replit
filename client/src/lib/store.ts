// Mock Data Store for Meloan MVP
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type LoanStatus = "draft" | "pending" | "active" | "closed" | "cancelled";

export interface LenderProfile {
  name: string;
  passport: string;
  address: string;
  paymentInfo: string;
}

export interface Loan {
  id: string;
  borrowerName: string; // Simplification for MVP
  borrowerContact: string;
  amount: number;
  termMonths: number;
  ratePercent: number;
  startDate: string;
  status: LoanStatus;
  
  // Calculated fields
  monthlyPayment: number;
  totalRepayment: number;
  
  // Borrower filled data
  borrowerPassport?: string;
  borrowerAddress?: string;
  signedAt?: string;
}

interface Payment {
  id: string;
  loanId: string;
  amount: number;
  date: string;
  status: "pending" | "confirmed" | "rejected";
  periodIndex: number; // Which month this pays off
}

interface AppState {
  lenderProfile: LenderProfile | null;
  loans: Loan[];
  currentUserType: "master" | "borrower" | null;
  
  setLenderProfile: (profile: LenderProfile) => void;
  createLoan: (loan: Omit<Loan, "id" | "status" | "monthlyPayment" | "totalRepayment">) => void;
  updateLoanStatus: (id: string, status: LoanStatus, data?: Partial<Loan>) => void;
  setCurrentUser: (type: "master" | "borrower" | null) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      lenderProfile: null,
      loans: [
        {
          id: "loan-123",
          borrowerName: "Ivan Ivanov",
          borrowerContact: "ivan@example.com",
          amount: 50000,
          termMonths: 6,
          ratePercent: 20,
          startDate: new Date().toISOString(),
          status: "pending",
          monthlyPayment: 8826,
          totalRepayment: 52956,
        },
        {
          id: "loan-456",
          borrowerName: "Petr Petrov",
          borrowerContact: "+79990000000",
          amount: 100000,
          termMonths: 12,
          ratePercent: 15,
          startDate: "2024-12-01",
          status: "active",
          monthlyPayment: 8976,
          totalRepayment: 107712,
        }
      ],
      currentUserType: null,

      setLenderProfile: (profile: LenderProfile) => set({ lenderProfile: profile }),
      
      createLoan: (loanData) => set((state) => {
        // Simple annuity calc
        const monthlyRate = loanData.ratePercent / 12 / 100;
        const pmt = (loanData.amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -loanData.termMonths));
        
        const newLoan: Loan = {
          ...loanData,
          id: `loan-${Date.now()}`,
          status: "pending",
          monthlyPayment: Math.round(pmt),
          totalRepayment: Math.round(pmt * loanData.termMonths),
        };
        
        return { loans: [newLoan, ...state.loans] };
      }),
      
      updateLoanStatus: (id: string, status: LoanStatus, data?: Partial<Loan>) => set((state) => ({
        loans: state.loans.map((l: Loan) => l.id === id ? { ...l, status, ...data } : l)
      })),

      setCurrentUser: (type: "master" | "borrower" | null) => set({ currentUserType: type }),
    }),
    {
      name: "meloan-storage",
    }
  )
);
