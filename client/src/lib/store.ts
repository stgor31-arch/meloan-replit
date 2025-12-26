// Mock Data Store for Meloan MVP
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { addDays, addWeeks, addMonths, format, parseISO } from "date-fns";

export type LoanStatus = "draft" | "pending" | "active" | "closed" | "cancelled";
export type PaymentFrequency = "once" | "monthly" | "weekly" | "daily";

export interface LenderProfile {
  name: string;
  passport: string;
  address: string;
  paymentInfo: string;
  phone: string;
}

export interface ScheduleItem {
  date: string;
  amount: number;
  status: "upcoming" | "paid" | "overdue";
}

export interface PaymentRequest {
  id: string;
  loanId: string;
  amount: number;
  status: "pending" | "confirmed" | "rejected";
  timestamp: string;
}

export interface Loan {
  id: string;
  borrowerName: string; 
  borrowerContact: string; 
  amount: number;
  termMonths: number;
  ratePercent: number;
  startDate: string;
  status: LoanStatus;
  frequency: PaymentFrequency;
  monthlyPayment: number;
  totalRepayment: number;
  schedule: ScheduleItem[];
  borrowerPassport?: string;
  borrowerAddress?: string;
  signedAt?: string;
}

interface AppState {
  lenderProfile: LenderProfile | null;
  loans: Loan[];
  paymentRequests: PaymentRequest[];
  currentUserType: "master" | "borrower" | null;
  currentBorrowerLoan: Loan | null;
  
  setLenderProfile: (profile: LenderProfile) => void;
  createLoan: (loan: Omit<Loan, "id" | "status" | "monthlyPayment" | "totalRepayment" | "schedule">) => void;
  updateLoanStatus: (id: string, status: LoanStatus, data?: Partial<Loan>) => void;
  requestPayment: (loanId: string, amount: number) => void;
  confirmPayment: (requestId: string) => void;
  setCurrentUser: (type: "master" | "borrower" | null) => void;
  setCurrentBorrowerLoan: (loan: Loan | null) => void;
}

const calculateSchedule = (amount: number, rate: number, term: number, frequency: PaymentFrequency, startDate: string): { schedule: ScheduleItem[], pmt: number } => {
  const start = parseISO(startDate);
  const schedule: ScheduleItem[] = [];
  let pmt = 0;
  
  if (frequency === "once") {
    pmt = amount * (1 + (rate / 100) * (term / 12));
    schedule.push({
      date: format(addMonths(start, term), "yyyy-MM-dd"),
      amount: Math.round(pmt),
      status: "upcoming"
    });
  } else {
    let periods = term;
    let ratePerPeriod = rate / 100 / 12;
    
    if (frequency === "weekly") {
        periods = term * 4;
        ratePerPeriod = rate / 100 / 52;
    } else if (frequency === "daily") {
        periods = term * 30;
        ratePerPeriod = rate / 100 / 365;
    }
    
    pmt = (amount * ratePerPeriod) / (1 - Math.pow(1 + ratePerPeriod, -periods));
    
    for (let i = 1; i <= periods; i++) {
        let date;
        if (frequency === "monthly") date = addMonths(start, i);
        else if (frequency === "weekly") date = addWeeks(start, i);
        else date = addDays(start, i);
        
        schedule.push({
            date: format(date, "yyyy-MM-dd"),
            amount: Math.round(pmt),
            status: "upcoming"
        });
    }
  }
  
  return { schedule, pmt: Math.round(pmt) };
};

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      lenderProfile: null,
      loans: [],
      paymentRequests: [],
      currentUserType: null,
      currentBorrowerLoan: null,

      setLenderProfile: (profile) => set({ lenderProfile: profile }),
      
      createLoan: (loanData) => set((state) => {
        const { schedule, pmt } = calculateSchedule(loanData.amount, loanData.ratePercent, loanData.termMonths, loanData.frequency, loanData.startDate);
        
        const newLoan: Loan = {
          ...loanData,
          id: `loan-${Date.now()}`,
          status: "pending",
          monthlyPayment: pmt,
          totalRepayment: pmt * (loanData.frequency === "once" ? 1 : (loanData.frequency === "weekly" ? loanData.termMonths * 4 : (loanData.frequency === "daily" ? loanData.termMonths * 30 : loanData.termMonths))),
          schedule,
        };
        
        return { loans: [newLoan, ...state.loans] };
      }),
      
      requestPayment: (loanId, amount) => set((state) => ({
        paymentRequests: [{
            id: `req-${Date.now()}`,
            loanId,
            amount,
            status: "pending",
            timestamp: new Date().toISOString()
        }, ...state.paymentRequests]
      })),

      confirmPayment: (requestId) => set((state) => {
        const req = state.paymentRequests.find(r => r.id === requestId);
        if (!req) return state;

        const updatedLoans = state.loans.map(loan => {
            if (loan.id === req.loanId) {
                const newSchedule = [...loan.schedule];
                const nextItem = newSchedule.find(s => s.status === "upcoming");
                if (nextItem) nextItem.status = "paid";
                return { ...loan, schedule: newSchedule };
            }
            return loan;
        });

        return {
            paymentRequests: state.paymentRequests.map(r => r.id === requestId ? { ...r, status: "confirmed" } : r),
            loans: updatedLoans,
            currentBorrowerLoan: state.currentBorrowerLoan?.id === req.loanId ? updatedLoans.find(l => l.id === req.loanId) || null : state.currentBorrowerLoan
        };
      }),

      updateLoanStatus: (id, status, data) => set((state) => ({
        loans: state.loans.map(l => l.id === id ? { ...l, status, ...data } : l),
        currentBorrowerLoan: state.currentBorrowerLoan?.id === id ? { ...state.currentBorrowerLoan, status, ...data } : state.currentBorrowerLoan
      })),

      setCurrentUser: (type) => set({ currentUserType: type }),
      setCurrentBorrowerLoan: (loan) => set({ currentBorrowerLoan: loan }),
    }),
    {
      name: "meloan-storage-v5",
    }
  )
);

export const translations = {
  welcome: "Добро пожаловать",
  lender: "Я Кредитор (Мастер)",
  borrower: "Я Заемщик",
  meloan: "Meloan",
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
  monthly_payment: "Платеж",
  total_repayment: "Итого к возврату",
  create_and_invite: "Создать и отправить ссылку",
  borrower_details: "Данные заемщика",
  contact_name: "Имя контакта",
  email_phone: "Телефон",
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
  frequency: "Периодичность",
  freq_once: "В конце срока",
  freq_monthly: "Раз в месяц",
  freq_weekly: "Раз в неделю",
  freq_daily: "Раз в день",
  confirm_payment: "Подтвердить оплату",
  payment_amount: "Сумма платежа",
  confirm: "Подтвердить",
  payment_requested: "Запрос на оплату отправлен",
  payment_confirmation: "Подтверждение оплаты",
  paid: "Оплачено",
  upcoming: "Ожидается",
  profile_missing: "Профиль не заполнен",
  fill_profile_first: "Сначала необходимо заполнить профиль кредитора.",
  go_to_profile: "Перейти в профиль",
  borrower_login_subtitle: "Мы найдем предложение по вашему номеру телефона.",
  payment_number: "Платеж",
  lender_details_tip: "Эти данные будут использованы для автоматического формирования расписки.",
  fio_placeholder: "Иванов Иван Иванович",
  passport_placeholder: "Серия, номер, кем выдан...",
  address_placeholder: "Город, улица, дом, кв...",
  requisites_placeholder: "Название банка, номер счета, телефон для СБП...",
  requisites_tip: "Заемщики будут видеть это при совершении платежей.",
};
