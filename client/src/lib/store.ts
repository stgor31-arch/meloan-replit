import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AppState {
  lenderProfileId: string | null;
  currentUserType: "master" | "borrower" | null;
  currentBorrowerLoanId: string | null;
  borrowerPhone: string | null;

  setLenderProfileId: (id: string | null) => void;
  setCurrentUser: (type: "master" | "borrower" | null) => void;
  setCurrentBorrowerLoanId: (id: string | null) => void;
  setBorrowerPhone: (phone: string | null) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      lenderProfileId: null,
      currentUserType: null,
      currentBorrowerLoanId: null,
      borrowerPhone: null,

      setLenderProfileId: (id) => set({ lenderProfileId: id }),
      setCurrentUser: (type) => set({ currentUserType: type }),
      setCurrentBorrowerLoanId: (id) => set({ currentBorrowerLoanId: id }),
      setBorrowerPhone: (phone) => set({ borrowerPhone: phone }),
    }),
    {
      name: "meloan-storage-v9",
    }
  )
);

export const translations = {
  welcome: "Добро пожаловать",
  lender: "Кредитор",
  borrower: "Заемщик",
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
  remaining_amount: "Остаток долга",
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
  loan_closed: "Заём закрыт",
  congrats_borrower: "Поздравляем! Вы полностью погасили заём.",
  congrats_lender: "Заём успешно завершен. Все средства возвращены.",
  rate_lender: "Оцените Кредитора",
  rate_borrower: "Оцените Заемщика",
  rating_saved: "Оценка сохранена",
};
