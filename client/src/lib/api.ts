import { apiRequest } from "./queryClient";

export async function getMyProfile() {
  const res = await fetch("/api/my-profile", { credentials: "include" });
  if (!res.ok) {
    if (res.status === 401) return null;
    throw new Error("Failed to fetch profile");
  }
  return res.json();
}

export async function createLenderProfile(data: {
  name: string;
  passport: string;
  address: string;
  paymentInfo: string;
  phone: string;
}) {
  const res = await apiRequest("POST", "/api/lender-profile", data);
  return res.json();
}

export async function getLenderProfile(id: string) {
  const res = await fetch(`/api/lender-profile/${id}`);
  if (!res.ok) return null;
  return res.json();
}

export async function updateLenderProfile(id: string, data: any) {
  const res = await apiRequest("PUT", `/api/lender-profile/${id}`, data);
  return res.json();
}

export async function createLoan(data: {
  lenderProfileId: string;
  borrowerName: string;
  borrowerContact: string;
  amount: number;
  termMonths: number;
  ratePercent: number;
  startDate: string;
  frequency: string;
}) {
  const res = await apiRequest("POST", "/api/loans", data);
  return res.json();
}

export async function getLoans() {
  const res = await fetch("/api/loans", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch loans");
  return res.json();
}

export async function getLoan(id: string) {
  const res = await fetch(`/api/loans/${id}`);
  if (!res.ok) return null;
  return res.json();
}

export async function findLoanByPhone(phone: string) {
  const res = await fetch(`/api/loans/by-phone/${encodeURIComponent(phone)}`);
  if (!res.ok) return null;
  const data = await res.json();
  if (Array.isArray(data)) return data[0] || null;
  return data;
}

export async function findLoansByPhone(phone: string) {
  const res = await fetch(`/api/loans/by-phone/${encodeURIComponent(phone)}`);
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [data];
}

export async function acceptLoan(id: string, data: { borrowerPassport: string; borrowerAddress: string }) {
  const res = await apiRequest("POST", `/api/loans/${id}/accept`, data);
  return res.json();
}

export async function rateLoan(id: string, type: "borrower" | "lender", stars: number) {
  const res = await apiRequest("POST", `/api/loans/${id}/rate`, { type, stars });
  return res.json();
}

export async function createPaymentRequest(data: { loanId: string; amount: number; timestamp: string }) {
  const res = await apiRequest("POST", "/api/payment-requests", data);
  return res.json();
}

export async function getPaymentRequests(loanId: string) {
  const res = await fetch(`/api/payment-requests/${loanId}`);
  if (!res.ok) throw new Error("Failed to fetch payment requests");
  return res.json();
}

export async function confirmPayment(requestId: string) {
  const res = await apiRequest("POST", `/api/payment-requests/${requestId}/confirm`);
  return res.json();
}
