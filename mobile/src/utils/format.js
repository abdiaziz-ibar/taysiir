export const formatMoney = (n) =>
  `$${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

export const formatDate = (d) => {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
};

export const statusLabel = (status) => {
  if (status === "paid" || status === "confirmed") return status === "confirmed" ? "La Xaqiijiyay" : "La Bixiyey (Paid)";
  if (status === "partial") return "Qeyb (Partial)";
  if (status === "pending") return "La Sugayo";
  return "Lama Bixin (Unpaid)";
};

export const COLORS = {
  navy: "#1F3A5F",
  navyLight: "#2E5386",
  navyDark: "#152943",
  amber: "#C98A2C",
  brand: "#C2410C",
  success: "#2F7A4D",
  danger: "#B3402A",
  paper: "#FAFAF9",
  surface: "#FFFFFF",
  ink: "#14181F",
  line: "#E7E5E0",
};
