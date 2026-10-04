import { t, getLang } from "../i18n";

export const formatMoney = (amount) => {
  const n = Number(amount || 0);
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

export const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-GB");
};

export const statusLabel = (status) => {
  const map = { paid: t("La Bixiyey (Paid)"), partial: t("Qayb Laga Bixiyey (Partial)"), unpaid: t("Lama Bixin (Unpaid)") };
  return map[status] || status;
};

export const statusBadgeClass = (status) => {
  const map = { paid: "badge-paid", partial: "badge-partial", unpaid: "badge-unpaid" };
  return `badge ${map[status] || ""}`;
};

// Long date such as "Sunday, 4 October 2026", written in the chosen language.
export const formatLongDate = (date = new Date()) => {
  const locale = { so: "so-SO", en: "en-GB", ar: "ar-u-nu-latn" }[getLang()] || "en-GB";
  return date.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
};
