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
  borrowerName: string; 
  borrowerContact: string; // This is the phone/email used for lookup
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

export type Language = "ru" | "en";

interface AppState {
  lenderProfile: LenderProfile | null;
  loans: Loan[];
  currentUserType: "master" | "borrower" | null;
  currentBorrowerLoan: Loan | null;
  language: Language;
  
  setLenderProfile: (profile: LenderProfile) => void;
  createLoan: (loan: Omit<Loan, "id" | "status" | "monthlyPayment" | "totalRepayment">) => void;
  updateLoanStatus: (id: string, status: LoanStatus, data?: Partial<Loan>) => void;
  setCurrentUser: (type: "master" | "borrower" | null) => void;
  setCurrentBorrowerLoan: (loan: Loan | null) => void;
  setLanguage: (lang: Language) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      lenderProfile: null,
      loans: [],
      currentUserType: null,
      currentBorrowerLoan: null,
      language: "ru",

      setLenderProfile: (profile: LenderProfile) => set({ lenderProfile: profile }),
      
      createLoan: (loanData) => set((state) => {
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
        loans: state.loans.map((l: Loan) => l.id === id ? { ...l, status, ...data } : l),
        currentBorrowerLoan: state.currentBorrowerLoan?.id === id ? { ...state.currentBorrowerLoan, status, ...data } : state.currentBorrowerLoan
      })),

      setCurrentUser: (type: "master" | "borrower" | null) => set({ currentUserType: type }),
      setCurrentBorrowerLoan: (loan: Loan | null) => set({ currentBorrowerLoan: loan }),
      setLanguage: (language: Language) => set({ language }),
    }),
    {
      name: "meloan-storage-v3",
    }
  )
);

export const translations = {
  ru: {
    welcome: "Добро пожаловать",
    lender: "Я Кредитор (Мастер)",
    borrower: "Я Заемщик",
    meloan: "meloan",
    simple_lending: "Частные займы — это просто.",
    dashboard: "Обзор",
    loans: "Займы",
    new_loan: "Новый заём",
    profile: "Профиль",
    total_active: "Активные займы",
    recent_loans: "Последние займы",
    amount: "Сумма",
    term: "Срок",
    rate: "Ставка",
    monthly_payment: "Ежемесячный платеж",
    total_repayment: "Итого к возврату",
    create_and_invite: "Создать и отправить ссылку",
    borrower_details: "Данные заемщика",
    contact_name: "Имя контакта",
    email_phone: "Email или Телефон",
    enter_phone: "Введите ваш номер телефона",
    find_loan: "Найти предложение",
    no_loan_found: "Предложение не найдено",
    loan_found: "Найдено предложение",
    first_payment: "Дата первого платежа",
    save_profile: "Сохранить профиль",
    copy_link: "Скопировать ссылку",
    link_copied: "Ссылка скопирована",
    loan_details: "Детали займа",
    status: "Статус",
    schedule: "График платежей",
    months: "мес.",
    yearly: "годовых",
    accept_terms: "Я подтверждаю условия займа",
    continue: "Продолжить",
    sign_receipt: "Подписать расписку и принять заём",
    passport: "Паспортные данные",
    address: "Адрес проживания",
    lender_data: "Данные кредитора",
    receipt_text: "Я подтверждаю, что получил(а) денежные средства и обязуюсь вернуть их на указанных условиях",
  },
  en: {
    welcome: "Welcome",
    lender: "I am a Lender (Master)",
    borrower: "I am a Borrower",
    meloan: "meloan",
    simple_lending: "Private lending made simple.",
    dashboard: "Overview",
    loans: "Loans",
    new_loan: "New Loan",
    profile: "Profile",
    total_active: "Active Loans",
    recent_loans: "Recent Loans",
    amount: "Amount",
    term: "Term",
    rate: "Rate",
    monthly_payment: "Monthly Payment",
    total_repayment: "Total Repayment",
    create_and_invite: "Create & Send Invite",
    borrower_details: "Borrower Details",
    contact_name: "Contact Name",
    email_phone: "Email or Phone",
    enter_phone: "Enter your phone number",
    find_loan: "Find Loan Offer",
    no_loan_found: "No offer found",
    loan_found: "Offer found",
    first_payment: "First Payment Date",
    save_profile: "Save Profile",
    copy_link: "Copy Link",
    link_copied: "Link Copied",
    loan_details: "Loan Details",
    status: "Status",
    schedule: "Payment Schedule",
    months: "mo.",
    yearly: "APR",
    accept_terms: "I confirm the loan terms",
    continue: "Continue",
    sign_receipt: "Sign Receipt & Accept Loan",
    passport: "Passport Details",
    address: "Residential Address",
    lender_data: "Lender Details",
    receipt_text: "I confirm that I received the funds and promise to return them on the specified terms",
  }
};
