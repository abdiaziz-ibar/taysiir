import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { TrendingDown, Download } from "lucide-react";
import StatCard from "../StatCard";
import YearSelect from "./YearSelect";
import useYear from "./useYear";
import { formatMoney } from "../../utils/format";
import { downloadExcel } from "../../utils/excel";
import { t } from "../../i18n";

// The other-expenses report for a school year: by month and by category.
const ExpenseReport = () => {
  const { startYear, setStartYear, data } = useYear();

  const exportExcel = () => {
    const rows = data.months.map((m) => [m.month, m.expenses]);
    rows.push(["Wadarta", data.totals.expenses]);
    rows.push([]);
    data.expensesByCategory.forEach((c) => rows.push([c.category, c.total]));
    downloadExcel(`warbixinta-qarashaadka-${data.schoolYear}.xlsx`, ["Bil / Nooc", "Lacag"], rows);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-serif text-lg">{t("Warbixinta Qarashaadka")}{data ? ` — ${data.schoolYear}` : ""}</h3>
          <p className="text-sm text-ink/50 mt-0.5">{t("Qarashaadka kale bil kasta iyo nooc kasta (Sebtembar → Ogosto).")}</p>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatCard label={t("Wadarta Qarashaadka")} value={formatMoney(data.totals.expenses)} accent="text-danger" icon={TrendingDown} iconBg="bg-danger/10" iconColor="text-danger" />
            <StatCard label={t("Celceliska Bishii")} value={formatMoney(Math.round(data.totals.expenses / Math.max(1, data.months.filter((m) => !m.future).length)))} />
          </div>

          <div className="card">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.months}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E0" />
                <XAxis dataKey="month" tickFormatter={(v) => t(v)} tick={{ fontSize: 12, fill: "#6B7280" }} />
                <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} />
                <Tooltip labelFormatter={(l) => t(l)} formatter={(v) => [formatMoney(v), t("Qarashaadka")]} contentStyle={{ background: "#FFFFFF", border: "1px solid #E7E5E0", borderRadius: 6, color: "#14181F" }} cursor={{ fill: "#F5F5F4" }} />
                <Bar isAnimationActive={false} dataKey="expenses" fill="#C98A2C" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="card overflow-x-auto">
              <h4 className="font-serif text-base mb-3">{t("Bil Kasta")}</h4>
              <table className="table-base">
                <thead>
                  <tr>
                    <th>{t("Bil")}</th>
                    <th className="text-end">{t("Qarashaadka")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.months.map((m) => (
                    <tr key={m.period} className={m.future ? "opacity-40" : ""}>
                      <td>{t(m.month)}</td>
                      <td className="text-end">{formatMoney(m.expenses)}</td>
                    </tr>
                  ))}
                  <tr className="font-semibold">
                    <td>{t("Wadarta")}</td>
                    <td className="text-end">{formatMoney(data.totals.expenses)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="card">
              <h4 className="font-serif text-base mb-3">{t("Qarashaadka Noocyadooda")}</h4>
              {data.expensesByCategory.length === 0 ? (
                <p className="text-sm text-ink/40">-</p>
              ) : (
                <div className="divide-y divide-line">
                  {data.expensesByCategory.map((c) => (
                    <div key={c.category} className="flex justify-between py-2 text-sm">
                      <span>{t(c.category)}</span>
                      <span className="font-medium">{formatMoney(c.total)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ExpenseReport;
