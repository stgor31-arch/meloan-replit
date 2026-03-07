interface ReceiptData {
  lenderName: string;
  lenderPassport: string;
  lenderAddress: string;
  lenderPhone: string;
  borrowerName: string;
  borrowerPassport: string;
  borrowerAddress: string;
  borrowerPhone: string;
  amount: number;
  ratePercent: number;
  termMonths: number;
  monthlyPayment: number;
  totalRepayment: number;
  startDate: string;
  frequency: string;
  signedDate?: string;
}

function numberToWordsRu(n: number): string {
  if (n === 0) return "ноль";

  const ones = ["", "один", "два", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять",
    "десять", "одиннадцать", "двенадцать", "тринадцать", "четырнадцать", "пятнадцать",
    "шестнадцать", "семнадцать", "восемнадцать", "девятнадцать"];
  const tens = ["", "", "двадцать", "тридцать", "сорок", "пятьдесят", "шестьдесят", "семьдесят", "восемьдесят", "девяносто"];
  const hundreds = ["", "сто", "двести", "триста", "четыреста", "пятьсот", "шестьсот", "семьсот", "восемьсот", "девятьсот"];
  const thousands = ["тысяча", "тысячи", "тысяч"];
  const millions = ["миллион", "миллиона", "миллионов"];

  function pluralForm(n: number, forms: string[]): string {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod100 >= 11 && mod100 <= 19) return forms[2];
    if (mod10 === 1) return forms[0];
    if (mod10 >= 2 && mod10 <= 4) return forms[1];
    return forms[2];
  }

  function convertGroup(num: number): string {
    const parts: string[] = [];
    if (num >= 100) {
      parts.push(hundreds[Math.floor(num / 100)]);
      num %= 100;
    }
    if (num >= 20) {
      parts.push(tens[Math.floor(num / 10)]);
      num %= 10;
    }
    if (num > 0) {
      parts.push(ones[num]);
    }
    return parts.join(" ");
  }

  const parts: string[] = [];

  if (n >= 1000000) {
    const mil = Math.floor(n / 1000000);
    parts.push(convertGroup(mil) + " " + pluralForm(mil, millions));
    n %= 1000000;
  }

  if (n >= 1000) {
    let th = Math.floor(n / 1000);
    let thWord = convertGroup(th);
    if (th % 10 === 1 && th % 100 !== 11) thWord = thWord.replace(/один$/, "одна");
    if (th % 10 === 2 && th % 100 !== 12) thWord = thWord.replace(/два$/, "две");
    parts.push(thWord + " " + pluralForm(th, thousands));
    n %= 1000;
  }

  if (n > 0) {
    parts.push(convertGroup(n));
  }

  return parts.join(" ").replace(/\s+/g, " ").trim();
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const months = [
      "января", "февраля", "марта", "апреля", "мая", "июня",
      "июля", "августа", "сентября", "октября", "ноября", "декабря"
    ];
    return `«${d.getDate()}» ${months[d.getMonth()]} ${d.getFullYear()} г.`;
  } catch {
    return dateStr;
  }
}

function formatFrequency(freq: string): string {
  const map: Record<string, string> = {
    monthly: "ежемесячно",
    weekly: "еженедельно",
    daily: "ежедневно",
    once: "единовременно",
  };
  return map[freq] || "ежемесячно";
}

export function generateReceiptText(data: ReceiptData): string {
  const amountWords = numberToWordsRu(data.amount);
  const today = data.signedDate ? formatDate(data.signedDate) : formatDate(new Date().toISOString());
  const startFormatted = formatDate(data.startDate);

  return `РАСПИСКА
о получении денежных средств в долг

Дата составления: ${today}

Я, ${data.borrowerName || "___________________________"},
паспорт: ${data.borrowerPassport || "___________________________"},
зарегистрированный(-ая) по адресу: ${data.borrowerAddress || "___________________________"},
контактный телефон: ${data.borrowerPhone || "___________________________"},
(далее — «Заёмщик»),

настоящей распиской подтверждаю, что получил(-а) от:

${data.lenderName || "___________________________"},
паспорт: ${data.lenderPassport || "___________________________"},
зарегистрированный(-ая) по адресу: ${data.lenderAddress || "___________________________"},
контактный телефон: ${data.lenderPhone || "___________________________"},
(далее — «Кредитор»),

денежные средства в размере ${data.amount.toLocaleString("ru-RU")} (${amountWords}) рублей.

УСЛОВИЯ ЗАЙМА:

1. Процентная ставка: ${data.ratePercent}% годовых.
2. Срок займа: ${data.termMonths} мес., начиная с ${startFormatted}.
3. Периодичность платежей: ${formatFrequency(data.frequency)}.
4. Размер периодического платежа: ${data.monthlyPayment.toLocaleString("ru-RU")} руб.
5. Общая сумма к возврату (с процентами): ${data.totalRepayment.toLocaleString("ru-RU")} руб.

ОБЯЗАТЕЛЬСТВА ЗАЁМЩИКА:

Заёмщик обязуется вернуть указанную сумму с процентами в полном объёме в соответствии с графиком платежей. В случае досрочного погашения проценты пересчитываются на фактический срок пользования денежными средствами.

Настоящая расписка составлена в электронной форме и подтверждена обеими сторонами через платформу Meloan. Электронная подпись имеет юридическую силу в соответствии со ст. 808 ГК РФ.

Заёмщик: ${data.borrowerName || "___________________________"}
Дата подписания: ${today}

Кредитор: ${data.lenderName || "___________________________"}`;
}

export function generateReceiptHTML(data: ReceiptData): string {
  const text = generateReceiptText(data);
  const lines = text.split("\n");

  let html = `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<title>Расписка — Meloan</title>
<style>
  @page { margin: 2cm; }
  body {
    font-family: "Times New Roman", Times, Georgia, serif;
    font-size: 14px;
    line-height: 1.8;
    color: #1a1a1a;
    max-width: 700px;
    margin: 0 auto;
    padding: 40px;
  }
  .title {
    text-align: center;
    font-size: 20px;
    font-weight: bold;
    letter-spacing: 4px;
    text-transform: uppercase;
    margin-bottom: 4px;
  }
  .subtitle {
    text-align: center;
    font-size: 14px;
    margin-bottom: 30px;
    color: #444;
  }
  .section-title {
    font-weight: bold;
    margin-top: 24px;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .signature-line {
    margin-top: 40px;
    border-top: 1px solid #333;
    display: inline-block;
    min-width: 300px;
    padding-top: 4px;
  }
</style>
</head>
<body>`;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "РАСПИСКА") {
      html += `<div class="title">${trimmed}</div>`;
    } else if (trimmed === "о получении денежных средств в долг") {
      html += `<div class="subtitle">${trimmed}</div>`;
    } else if (trimmed === "УСЛОВИЯ ЗАЙМА:" || trimmed === "ОБЯЗАТЕЛЬСТВА ЗАЁМЩИКА:") {
      html += `<div class="section-title">${trimmed}</div>`;
    } else if (trimmed === "") {
      html += `<br>`;
    } else {
      html += `<p style="margin:2px 0">${trimmed}</p>`;
    }
  }

  html += `</body></html>`;
  return html;
}

export function downloadReceiptAsHTML(data: ReceiptData) {
  const html = generateReceiptHTML(data);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Расписка_Meloan_${new Date().toISOString().slice(0, 10)}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
