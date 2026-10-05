import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { Wallet, CheckCircle2, AlertCircle, Banknote, TrendingDown, Download } from "lucide-react";
import StatCard from "../../components/StatCard";
import YearSelect from "../../components/finance/YearSelect";
import useYear from "../../components/finance/useYear";
import { formatMoney } from "../../utils/format";
import { downloadExcel } from "../../utils/excel";
import { t } from "../../i18n";

// The grand total: salaries + other expenses together — what has been paid, what is still
// unpaid, and the total of every month.
// Due / paid / unpaid cells of the salaries group.
const Cells = ({ due, paid, unpaid }) => (
  <>
    <td className="text-end border-s border-line">{formatMoney(due)}</td>
    <td className="text-end text-success">{formatMoney(paid)}</td>
    <td className={`text-end ${unpaid > 0 ? "text-danger" : "text-ink/50"}`}>{formatMoney(unpaid)}</td>
  </>
);

const Total = () => {
  const { startYear, setStartYear, data } = useYear();

  const exportExcel = () => {
    const headers = [
      "Bil",
      "Mushaharka La Rabay", "Mushaharka La Bixiyey", "Mushaharka Lama Bixin",
      "Qarashaadka La Bixiyey", "Qarashaadka Lama Bixin (nooc)",
      "Wadarta La Bixiyey", "Mushaharka Lama Bixin",
    ];
    const rows = data.months.map((m) => [m.month, m.salaryDue, m.salaryPaid, m.salaryRemaining, m.expenses, m.expenseUnpaid.count, m.paid, m.unpaid]);
    const tot = data.totals;
    rows.push(["Wadarta", tot.salaryDue, tot.salaryPaid, tot.salaryRemaining, tot.expenses, "", tot.paid, tot.unpaid]);
    downloadExcel(`wadarta-maaliyadda-${data.schoolYear}.xlsx`, headers, rows);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-serif">{t("Wadarta Guud")}{data ? ` — ${data.schoolYear}` : ""}</h2>
          <p className="text-sm text-ink/50 mt-0.5">{t("Mushaharka + qarashaadka: waxa la bixiyey, waxa aan la bixin, iyo wadarta bil kasta.")}</p>
        </div>
        <div className="flex items-center gap-2">
          <YearSelect value={startYear} onChange={setStartYear} />
          <button className="btn-secondary text-sm inline-flex items-center gap-1.5" onClick={exportExcel} disabled={!data}>
            <Download size={15} /> Excel
          </button>
        </div>
      </div>

      {!data ? (
        <p className="text-ink/50">{t("Waa la soo shubayaa...")}</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="card bg-navy text-white border-navy">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs uppercase tracking-wide text-white/70">{t("Wadarta La Bixiyey")}</p>
                <span className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center shrink-0"><Wallet size={16} className="text-white" /></span>
              </div>
              <p className="text-xl font-serif">{formatMoney(data.totals.paid)}</p>
              <p className="text-xs text-white/70 mt-1">{t("Mushaharka + qarashaadka")}</p>
            </div>
            <StatCard label={t("Mushaharka La Bixiyey")} value={formatMoney(data.totals.salaryPaid)} icon={Banknote} />
            <StatCard label={t("Qarashaadka La Bixiyey")} value={formatMoney(data.totals.expenses)} icon={TrendingDown} iconBg="bg-danger/10" iconColor="text-danger" />
            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs uppercase tracking-wide text-ink/50">{t("Mushaharka Lama Bixin")}</p>
                <span className="w-8 h-8 rounded-full bg-danger/10 flex items-center justify-center shrink-0"><AlertCircle size={16} className="text-danger" /></span>
              </div>
              <p className="text-xl font-serif text-danger">{formatMoney(data.totals.unpaid)}</p>
              <p className="text-xs text-ink/50 mt-1">{t("Qarashaad lama bixin: {count} nooc", { count: data.totals.expenseUnpaidCount })}</p>
            </div>
          </div>

          <div className="card">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.months.map((m) => ({ month: m.month, salaries: m.salaryPaid, expenses: m.expenses, unpaid: m.unpaid }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E0" />
                <XAxis dataKey="month" tickFormatter={(v) => t(v)} tick={{ fontSize: 12, fill: "#6B7280" }} />
                <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} />
                <Tooltip labelFormatter={(l) => t(l)} formatter={(v) => formatMoney(v)} contentStyle={{ background: "#FFFFFF", border: "1px solid #E7E5E0", borderRadius: 6, color: "#14181F" }} cursor={{ fill: "#F5F5F4" }} />
                <Legend />
                <Bar isAnimationActive={false} dataKey="salaries" stackId="paid" name={t("Mushaharka")} fill="#1F3A5F" />
                <Bar isAnimationActive={false} dataKey="expenses" stackId="paid" name={t("Qarashaadka")} fill="#C98A2C" radius={[3, 3, 0, 0]} />
                <Bar isAnimationActive={false} dataKey="unpaid" name={t("Lama Bixin")} fill="#C0392B" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card overflow-x-auto">
            <table className="table-base total-table">
              <thead>
                <tr className="text-center">
                  <th rowSpan={2}>{t("Bil")}</th>
                  <th colSpan={3} className="!text-center border-s border-line">{t("Mushaharka")}</th>
                  <th colSpan={2} className="!text-center border-s border-line">{t("Qarashaadka")}</th>
                  <th colSpan={2} className="!text-center border-s border-line">{t("Wadarta")}</th>
                </tr>
                <tr>
                  <th className="text-end border-s border-line">{t("La Rabay")}</th>
                  <th className="text-end">{t("La Bixiyey")}</th>
                  <th className="text-end">{t("Lama Bixin")}</th>
                  <th className="text-end border-s border-line">{t("La Bixiyey")}</th>
                  <th className="text-end">{t("Lama Bixin")}</th>
                  <th className="text-end border-s border-line">{t("La Bixiyey")}</th>
                  <th className="text-end">{t("Lama Bixin")}</th>
                </tr>
              </thead>
              <tbody>
                {data.months.map((m) => (
                  <tr key={m.period} className={`${m.future ? "opacity-40" : ""} ${m.period === data.currentPeriod ? "bg-navy/5" : ""}`}>
                    <td>{t(m.month)}</td>
                    <Cells due={m.salaryDue} paid={m.salaryPaid} unpaid={m.salaryRemaining} />
                    <td className="text-end text-success border-s border-line">{formatMoney(m.expenses)}</td>
                    <td className="text-end text-ink/70 text-xs">{m.future ? "-" : t("{count} nooc", { count: m.expenseUnpaid.count })}</td>
                    <td className="text-end text-success font-medium border-s border-line">{formatMoney(m.paid)}</td>
                    <td className={`text-end ${m.unpaid > 0 ? "text-danger font-medium" : "text-ink/50"}`}>{formatMoney(m.unpaid)}</td>
                  </tr>
                ))}
                <tr className="font-semibold">
                  <td>{t("Wadarta")}</td>
                  <Cells due={data.totals.salaryDue} paid={data.totals.salaryPaid} unpaid={data.totals.salaryRemaining} />
                  <td className="text-end text-success border-s border-line">{formatMoney(data.totals.expenses)}</td>
                  <td></td>
                  <td className="text-end text-success border-s border-line">{formatMoney(data.totals.paid)}</td>
                  <td className="text-end text-danger">{formatMoney(data.totals.unpaid)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-ink/50 flex items-center gap-1.5"><CheckCircle2 size={13} /> {t("Qarashaadka kale ma lahan lacag go'an oo la rabo, sidaas darteed waxaa la muujiyaa waxa la bixiyey iyo tirada noocyada aan weli la bixin. \"Lama Bixin\" ee wadarta waa mushaharka.")}</p>
        </>
      )}
    </div>
  );
};

export default Total;
