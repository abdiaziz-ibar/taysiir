import { useEffect, useState } from "react";
import { GraduationCap, Users, Receipt, Wallet } from "lucide-react";
import api from "../../api/financeAxios";
import { formatMoney } from "../../utils/format";
import { t } from "../../i18n";

// One group of salaries (teachers or staff): what was paid out of what is owed.
const SalaryCard = ({ label, icon: Icon, group }) => (
  <div className="card">
    <div className="flex items-center justify-between mb-2">
      <p className="text-xs uppercase tracking-wide text-ink/50">{label}</p>
      <span className="w-8 h-8 rounded-full bg-navy/10 flex items-center justify-center shrink-0">
        <Icon size={16} className="text-navy" />
      </span>
    </div>
    <p className="text-xl font-serif">{formatMoney(group.paid)}</p>
    <p className="text-xs text-ink/50 mt-1">
      {t("{paid} ka mid ah {count} la bixiyey", { paid: group.paidCount, count: group.count })} · {t("Mushaharka: {amount}", { amount: formatMoney(group.due) })}
    </p>
    {group.remaining > 0 ? (
      <p className="text-xs font-medium text-danger mt-1">{t("Dhiman: {amount}", { amount: formatMoney(group.remaining) })}</p>
    ) : group.count > 0 ? (
      <p className="text-xs font-medium text-success mt-1">{t("Dhammaantood waa la bixiyey")}</p>
    ) : null}
  </div>
);

// The month at a glance: teachers' salaries, staff salaries, other expenses, what has
// gone out in total and how much salary is still to be paid.
const MonthOverview = ({ month, reloadKey }) => {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/finance/month", { params: { period: month } }).then((res) => setData(res.data));
  }, [month, reloadKey]);

  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <SalaryCard label={t("Macalimiinta")} icon={GraduationCap} group={data.teachers} />
        <SalaryCard label={t("Shaqaale")} icon={Users} group={data.staff} />
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs uppercase tracking-wide text-ink/50">{t("Qarashaadka")}</p>
            <span className="w-8 h-8 rounded-full bg-danger/10 flex items-center justify-center shrink-0">
              <Receipt size={16} className="text-danger" />
            </span>
          </div>
          <p className="text-xl font-serif">{formatMoney(data.expenses.total)}</p>
          <p className="text-xs text-ink/50 mt-1">{t("{count} kharash", { count: data.expenses.count })}</p>
        </div>
        <div className="card bg-navy text-white border-navy">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs uppercase tracking-wide text-white/70">{t("Wadarta Bisha Baxday")}</p>
            <span className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center shrink-0">
              <Wallet size={16} className="text-white" />
            </span>
          </div>
          <p className="text-xl font-serif">{formatMoney(data.totals.paid)}</p>
          <p className="text-xs text-white/70 mt-1">{t("Mushaharka + qarashaadka")}</p>
          <p className={`text-xs font-medium mt-1 ${data.totals.salaryRemaining > 0 ? "text-amber" : "text-white/80"}`}>
            {data.totals.salaryRemaining > 0
              ? t("Mushahar dhiman: {amount}", { amount: formatMoney(data.totals.salaryRemaining) })
              : t("Mushaharka oo dhan waa la bixiyey")}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MonthOverview;
