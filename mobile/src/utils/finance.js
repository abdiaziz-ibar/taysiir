import { formatMoney } from "./format";

export const PAYMENT_METHODS = ["Cash", "Mobile Money", "Bank", "Other"];

export const EMPLOYEE_TYPES = { teacher: "Macalin", staff: "Shaqaale" };

export const EXPENSE_CATEGORIES = [
  "Koronto",
  "Biyaha",
  "Kiro",
  "Internet & Telefoon",
  "Agabka & Qalabka",
  "Qalin & Buugaag",
  "Dayactir",
  "Gaadiid & Shidaal",
  "Nadaafad",
  "Cunto & Casuumaad",
  "Kale",
];

const pad = (n) => String(n).padStart(2, "0");

export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const currentMonth = () => todayISO().slice(0, 7);

// "2026-09" + 1 -> "2026-10"
export const shiftMonth = (period, delta) => {
  const [y, m] = period.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
};

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export const monthLabel = (period) => {
  const [y, m] = period.split("-").map(Number);
  return `${MONTH_NAMES[m - 1]} ${y}`;
};

// formatMoney() puts the sign after the "$" ("$-510"); a profit/loss figure reads better as "-$510".
export const formatSigned = (n) => (n < 0 ? `-${formatMoney(-n)}` : formatMoney(n));

export const isValidDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(new Date(s).getTime());
