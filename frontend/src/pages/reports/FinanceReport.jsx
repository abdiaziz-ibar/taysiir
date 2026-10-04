import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { TrendingUp, TrendingDown, Banknote, Scale, Download } from "lucide-react";
import api from "../../api/axios";
import { useAcademicYear } from "../../context/AcademicYearContext";
import StatCard from "../../components/StatCard";
import { formatMoney } from "../../utils/format";
import { formatSigned } from "../../utils/finance";
import { downloadExcel } from "../../utils/excel";

const FinanceReport = () => {
  const { selectedYearId } = useAcademicYear();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!selectedYearId) return;
    setData(null);
    api.get("/finance/summary", { params: { academicYearId: selectedYearId } }).then((res) => setData(res.data));
  }, [selectedYearId]);

  if (!data) return <p className="text-ink/50">Waa la soo shubayaa...</p>;

  const { totals } = data;
  const netAccent = totals.net >= 0 ? "text-success" : "text-danger";

  const exportExcel = () => {
    const headers = ["Bil", "Dakhli (Fees)", "Mushaharka", "Qarashaadka", "Wadarta Baxday", "Faa'iido / Khasaare"];
    const rows = data.months.map((m) => [m.month, m.income, m.salaries, m.expenses, m.totalOut, m.net]);
    rows.push(["Wadarta", totals.income, totals.salaries, totals.expenses, totals.totalOut, totals.net]);
    downloadExcel(`warbixinta-maaliyadda-${data.academicYear}.xlsx`, headers, rows);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-serif">Warbixinta Maaliyadda — {data.academicYear}</h2>
          <p className="text-sm text-ink/50 mt-0.5">
            Dakhli = lacagaha waalidiinta ee sanadkan. Mushaharka &amp; qarashaadka = marka la bixiyey (Sebtembar → Ogosto).
          </p>
        </div>
        <button className="btn-secondary text-sm inline-flex items-center gap-1.5" onClick={exportExcel}>
          <Download size={15} /> Excel
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Dakhli (Fees)" value={formatMoney(totals.income)} accent="text-success" icon={TrendingUp} iconBg="bg-success/10" iconColor="text-success" />
        <StatCard label="Mushaharka" value={formatMoney(totals.salaries)} icon={Banknote} />
        <StatCard label="Qarashaadka" value={formatMoney(totals.expenses)} accent="text-danger" icon={TrendingDown} iconBg="bg-danger/10" iconColor="text-danger" />
        <StatCard label={totals.net >= 0 ? "Faa'iido" : "Khasaare"} value={formatSigned(totals.net)} accent={netAccent} icon={Scale} iconBg="bg-amber/10" iconColor="text-amber" />
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
            <Bar isAnimationActive={false} dataKey="income" name="Dakhli" fill="#2F7A4D" radius={[3, 3, 0, 0]} />
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
              <th className="text-right">Dakhli</th>
              <th className="text-right">Mushaharka</th>
              <th className="text-right">Qarashaadka</th>
              <th className="text-right">Wadarta Baxday</th>
              <th className="text-right">Faa'iido / Khasaare</th>
            </tr>
          </thead>
          <tbody>
            {data.months.map((m) => (
              <tr key={m.month}>
                <td>{m.month}</td>
                <td className="text-right">{formatMoney(m.income)}</td>
                <td className="text-right">{formatMoney(m.salaries)}</td>
                <td className="text-right">{formatMoney(m.expenses)}</td>
                <td className="text-right">{formatMoney(m.totalOut)}</td>
                <td className={`text-right ${m.net >= 0 ? "text-success" : "text-danger"}`}>{formatSigned(m.net)}</td>
              </tr>
            ))}
            <tr className="font-semibold">
              <td>Wadarta</td>
              <td className="text-right">{formatMoney(totals.income)}</td>
              <td className="text-right">{formatMoney(totals.salaries)}</td>
              <td className="text-right">{formatMoney(totals.expenses)}</td>
              <td className="text-right">{formatMoney(totals.totalOut)}</td>
              <td className={`text-right ${netAccent}`}>{formatSigned(totals.net)}</td>
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
    </div>
  );
};

export default FinanceReport;
