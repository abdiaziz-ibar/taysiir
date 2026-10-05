import { t } from "../i18n";

export const formatMoney = (n) =>
  `$${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

export const formatDate = (d) => {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
};

export const statusLabel = (status) => {
  if (status === "paid" || status === "confirmed") return status === "confirmed" ? t("La Xaqiijiyay") : t("La Bixiyey (Paid)");
  if (status === "partial") return t("Qeyb (Partial)");
  if (status === "pending") return t("La Sugayo");
  return t("Lama Bixin (Unpaid)");
};

export { COLORS, RADIUS, SHADOW } from "./theme";
