export const formatMoney = (amount) => {
  const n = Number(amount || 0);
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

export const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-GB");
};

export const statusLabel = (status) => {
  const map = { paid: "La Bixiyey (Paid)", partial: "Qayb Laga Bixiyey (Partial)", unpaid: "Lama Bixin (Unpaid)" };
  return map[status] || status;
};

export const statusBadgeClass = (status) => {
  const map = { paid: "badge-paid", partial: "badge-partial", unpaid: "badge-unpaid" };
  return `badge ${map[status] || ""}`;
};
