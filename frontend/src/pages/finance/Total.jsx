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
      "Qarashaadka La Rabay (qiyaas)", "Qarashaadka La Bixiyey", "Qarashaadka Lama Bixin (qiyaas)",
      "Wadarta La Rabay", "Wadarta La Bixiyey", "Wadarta Lama Bixin", "Isku Dar",
    ];
    const line = (m) => [m.salaryDue, m.salaryPaid, m.salaryRemaining, m.expenseDue, m.expenses, m.expenseUnpaid.estimate, m.due, m.paid, m.unpaid, m.paid + m.unpaid];
    const rows = data.months.map((m) => [m.month, ...line(m)]);
    const tot = data.totals;
    rows.push(["Wadarta", tot.salaryDue, tot.salaryPaid, tot.salaryRemaining, tot.expenseDue, tot.expenses, tot.expenseUnpaid, tot.due, tot.paid, tot.unpaid, tot.paid + tot.unpaid]);
    downloadExcel(`wadarta-maaliyadda-${data.schoolYear}.xlsx`, headers, rows);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("Wadarta Guud")}{data ? ` — ${data.schoolYear}` : ""}</h2>
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
            <StatCard tone="purple" label={t("Wadarta La Bixiyey")} value={formatMoney(data.totals.paid)} icon={Wallet} footer={t("Mushaharka + qarashaadka")} />
            <StatCard tone="teal" label={t("Mushaharka La Bixiyey")} value={formatMoney(data.totals.salaryPaid)} icon={Banknote} />
            <StatCard tone="blue" label={t("Qarashaadka La Bixiyey")} value={formatMoney(data.totals.expenses)} icon={TrendingDown} />
            <StatCard tone="pink" label={t("Mushaharka Lama Bixin")} value={formatMoney(data.totals.salaryRemaining)} icon={AlertCircle} footer={t("Qarashaad lama bixin: {count} nooc", { count: data.totals.expenseUnpaidCount })} />
          </div>

          <div className="card">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.months.map((m) => ({ month: m.month, salaries: m.salaryPaid, expenses: m.expenses, unpaid: m.unpaid }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E3E8EC" />
                <XAxis dataKey="month" tickFormatter={(v) => t(v)} tick={{ fontSize: 12, fill: "#6B7280" }} />
                <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} />
                <Tooltip labelFormatter={(l) => t(l)} formatter={(v) => formatMoney(v)} contentStyle={{ background: "#FFFFFF", border: "1px solid #E3E8EC", borderRadius: 6, color: "#14181F" }} cursor={{ fill: "#F5F5F4" }} />
                <Legend />
                <Bar isAnimationActive={false} dataKey="salaries" stackId="paid" name={t("Mushaharka")} fill="#2563EB" />
                <Bar isAnimationActive={false} dataKey="expenses" stackId="paid" name={t("Qarashaadka")} fill="#10B981" radius={[3, 3, 0, 0]} />
                <Bar isAnimationActive={false} dataKey="unpaid" name={t("Lama Bixin")} fill="#F43F5E" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card overflow-x-auto">
            <table className="table-base total-table">
              <thead>
                <tr className="text-center">
                  <th rowSpan={2}>{t("Bil")}</th>
                  <th colSpan={3} className="!text-center border-s border-line">{t("Mushaharka")}</th>
                  <th colSpan={3} className="!text-center border-s border-line">{t("Qarashaadka")}</th>
                  <th colSpan={4} className="!text-center border-s border-line">{t("Wadarta")}</th>
                </tr>
                <tr>
                  <th className="text-end border-s border-line">{t("La Rabay")}</th>
                  <th className="text-end">{t("La Bixiyey")}</th>
                  <th className="text-end">{t("Lama Bixin")}</th>
                  <th className="text-end border-s border-line">{t("La Rabay")}</th>
                  <th className="text-end">{t("La Bixiyey")}</th>
                  <th className="text-end">{t("Lama Bixin")}</th>
                  <th className="text-end border-s border-line">{t("La Rabay")}</th>
                  <th className="text-end">{t("La Bixiyey")}</th>
                  <th className="text-end">{t("Lama Bixin")}</th>
                  <th className="text-end">{t("Isku Dar")}</th>
                </tr>
              </thead>
              <tbody>
                {data.months.map((m) => (
                  <tr key={m.period} className={`${m.idle || (m.future && m.paid === 0) ? "opacity-40" : ""} ${m.period === data.currentPeriod ? "bg-navy/5" : ""}`}>
                    <td>{t(m.month)}</td>
                    <Cells due={m.salaryDue} paid={m.salaryPaid} unpaid={m.salaryRemaining} />
                    <td className="text-end border-s border-line">{m.expenseUnpaid.estimate > 0 ? "~" : ""}{formatMoney(m.expenseDue)}</td>
                    <td className="text-end text-success">{formatMoney(m.expenses)}</td>
                    <td className="text-end text-ink/70">
                      {m.future || m.idle ? "-" : (
                        <>
                          {m.expenseUnpaid.estimate > 0 && <span>~{formatMoney(m.expenseUnpaid.estimate)} · </span>}
                          <span className="text-xs">{t("{count} nooc", { count: m.expenseUnpaid.count })}</span>
                        </>
                      )}
                    </td>
                    <td className="text-end border-s border-line">{m.expenseUnpaid.estimate > 0 ? "~" : ""}{formatMoney(m.due)}</td>
                    <td className="text-end text-success font-medium">{formatMoney(m.paid)}</td>
                    <td className={`text-end ${m.unpaid > 0 ? "text-danger font-medium" : "text-ink/50"}`}>{m.expenseUnpaid.estimate > 0 ? "~" : ""}{formatMoney(m.unpaid)}</td>
                    <td className="text-end font-semibold">{formatMoney(m.paid + m.unpaid)}</td>
                  </tr>
                ))}
                <tr className="font-semibold">
                  <td>{t("Wadarta")}</td>
                  <Cells due={data.totals.salaryDue} paid={data.totals.salaryPaid} unpaid={data.totals.salaryRemaining} />
                  <td className="text-end border-s border-line">~{formatMoney(data.totals.expenseDue)}</td>
                  <td className="text-end text-success">{formatMoney(data.totals.expenses)}</td>
                  <td className="text-end">~{formatMoney(data.totals.expenseUnpaid)}</td>
                  <td className="text-end border-s border-line">~{formatMoney(data.totals.due)}</td>
                  <td className="text-end text-success">{formatMoney(data.totals.paid)}</td>
                  <td className="text-end text-danger">{formatMoney(data.totals.unpaid)}</td>
                  <td className="text-end">{formatMoney(data.totals.paid + data.totals.unpaid)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-ink/50 flex items-center gap-1.5"><CheckCircle2 size={13} /> {t("Qarashaadka la rabay iyo lama bixin (~) waa qiyaas: nooc kasta oo bishaas aan la bixin wuxuu qiimo u qaadanayaa lacagtii ugu dambeysay ee nooca la bixiyey. Isku Dar = La Bixiyey + Lama Bixin.")}</p>
        </>
      )}
    </div>
  );
};

export default Total;
