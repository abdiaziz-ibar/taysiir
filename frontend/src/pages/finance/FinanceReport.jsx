import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { TrendingDown, Banknote, Wallet, Download } from "lucide-react";
import api from "../../api/financeAxios";
import StatCard from "../../components/StatCard";
import { formatMoney } from "../../utils/format";
import { downloadExcel } from "../../utils/excel";

// School years run September → August, so a date before September belongs to the year that began last calendar year.
const currentStartYear = () => {
  const now = new Date();
  return now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
};

const FinanceReport = () => {
  const [startYear, setStartYear] = useState(currentStartYear());
  const [data, setData] = useState(null);

  // The year picker: next school year back to four years ago.
  const years = Array.from({ length: 6 }, (_, i) => currentStartYear() + 1 - i);

  useEffect(() => {
    setData(null);
    api.get("/finance/summary", { params: { startYear } }).then((res) => setData(res.data));
  }, [startYear]);

  const exportExcel = () => {
    const headers = ["Bil", "Mushaharka", "Qarashaadka", "Wadarta"];
    const rows = data.months.map((m) => [m.month, m.salaries, m.expenses, m.total]);
    rows.push(["Wadarta", data.totals.salaries, data.totals.expenses, data.totals.total]);
    downloadExcel(`warbixinta-maaliyadda-${data.schoolYear}.xlsx`, headers, rows);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-serif">Warbixinta Maaliyadda{data ? ` — ${data.schoolYear}` : ""}</h2>
          <p className="text-sm text-ink/50 mt-0.5">Mushaharka iyo qarashaadka marka la bixiyey (Sebtembar → Ogosto).</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="input-field !w-auto" value={startYear} onChange={(e) => setStartYear(Number(e.target.value))}>
            {years.map((y) => (
              <option key={y} value={y}>{y}-{y + 1}</option>
            ))}
          </select>
          <button className="btn-secondary text-sm inline-flex items-center gap-1.5" onClick={exportExcel} disabled={!data}>
            <Download size={15} /> Excel
          </button>
        </div>
      </div>

      {!data ? (
        <p className="text-ink/50">Waa la soo shubayaa...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Mushaharka" value={formatMoney(data.totals.salaries)} icon={Banknote} />
            <StatCard label="Qarashaadka" value={formatMoney(data.totals.expenses)} accent="text-danger" icon={TrendingDown} iconBg="bg-danger/10" iconColor="text-danger" />
            <StatCard label="Wadarta Baxday" value={formatMoney(data.totals.total)} accent="text-danger" icon={Wallet} iconBg="bg-amber/10" iconColor="text-amber" />
          </div>

          <div className="card">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.months}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6B7280" }} />
                <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} />
                <Tooltip
                  formatter={(v) => formatMoney(v)}
                  contentStyle={{ background: "#FFFFFF", border: "1px solid #E7E5E0", borderRadius: 6, color: "#14181F" }}
                  cursor={{ fill: "#F5F5F4" }}
                />
                <Legend />
                <Bar isAnimationActive={false} dataKey="salaries" name="Mushaharka" fill="#1F3A5F" radius={[3, 3, 0, 0]} />
                <Bar isAnimationActive={false} dataKey="expenses" name="Qarashaadka" fill="#C98A2C" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Bil</th>
                  <th className="text-right">Mushaharka</th>
                  <th className="text-right">Qarashaadka</th>
                  <th className="text-right">Wadarta</th>
                </tr>
              </thead>
              <tbody>
                {data.months.map((m) => (
                  <tr key={m.month}>
                    <td>{m.month}</td>
                    <td className="text-right">{formatMoney(m.salaries)}</td>
                    <td className="text-right">{formatMoney(m.expenses)}</td>
                    <td className="text-right">{formatMoney(m.total)}</td>
                  </tr>
                ))}
                <tr className="font-semibold">
                  <td>Wadarta</td>
                  <td className="text-right">{formatMoney(data.totals.salaries)}</td>
                  <td className="text-right">{formatMoney(data.totals.expenses)}</td>
                  <td className="text-right">{formatMoney(data.totals.total)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {data.expensesByCategory.length > 0 && (
            <div className="card">
              <h3 className="font-serif text-lg mb-3">Qarashaadka Noocyadooda</h3>
              <div className="divide-y divide-line">
                {data.expensesByCategory.map((c) => (
                  <div key={c.category} className="flex justify-between py-2 text-sm">
                    <span>{c.category}</span>
                    <span className="font-medium">{formatMoney(c.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FinanceReport;
