export function getRatePerPeriod(ratePercent: number, frequency: string): number {
  if (frequency === "weekly") return ratePercent / 100 / 52;
  if (frequency === "daily") return ratePercent / 100 / 365;
  return ratePercent / 100 / 12;
}

export function getPeriodsCount(termMonths: number, frequency: string): number {
  if (frequency === "weekly") return termMonths * 4;
  if (frequency === "daily") return termMonths * 30;
  return termMonths;
}

export function calcPayment(
  principal: number,
  ratePercent: number,
  termMonths: number,
  frequency: string
): number {
  if (principal <= 0 || termMonths <= 0) return 0;

  if (frequency === "once") {
    const interest = Math.round(principal * (ratePercent / 100) * (termMonths / 12));
    return principal + interest;
  }

  const periods = getPeriodsCount(termMonths, frequency);
  const r = getRatePerPeriod(ratePercent, frequency);

  if (r <= 0) {
    return Math.round(principal / periods);
  }

  return Math.round((principal * r) / (1 - Math.pow(1 + r, -periods)));
}

export function calcTerm(
  principal: number,
  ratePercent: number,
  payment: number,
  frequency: string
): number {
  if (principal <= 0 || payment <= 0) return 0;

  if (frequency === "once") {
    if (payment <= principal) return 0;
    const interest = payment - principal;
    const rate = ratePercent / 100;
    if (rate <= 0) return 1;
    return Math.max(1, Math.round((interest / principal / rate) * 12));
  }

  const r = getRatePerPeriod(ratePercent, frequency);

  if (r <= 0) {
    const periods = Math.ceil(principal / payment);
    if (frequency === "weekly") return Math.max(1, Math.ceil(periods / 4));
    if (frequency === "daily") return Math.max(1, Math.ceil(periods / 30));
    return Math.max(1, periods);
  }

  const ratio = principal * r / payment;
  if (ratio >= 1) return 0;

  const periods = Math.ceil(-Math.log(1 - ratio) / Math.log(1 + r));

  if (frequency === "weekly") return Math.max(1, Math.ceil(periods / 4));
  if (frequency === "daily") return Math.max(1, Math.ceil(periods / 30));
  return Math.max(1, periods);
}

export function calcTotalRepayment(
  principal: number,
  ratePercent: number,
  termMonths: number,
  frequency: string
): number {
  if (frequency === "once") {
    return calcPayment(principal, ratePercent, termMonths, frequency);
  }
  const periods = getPeriodsCount(termMonths, frequency);
  const pmt = calcPayment(principal, ratePercent, termMonths, frequency);
  return pmt * periods;
}
