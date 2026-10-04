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

// formatMoney() puts the sign after the "$" ("$-510"); a profit/loss figure reads better as "-$510".
export const formatSigned = (n) => (n < 0 ? `-${formatMoney(-n)}` : formatMoney(n));

const pad = (n) => String(n).padStart(2, "0");

// Local-date helpers (toISOString() would shift the day for timezones ahead of/behind UTC).
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

export const monthLabel = (period) => {
  const [y, m] = period.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
};
