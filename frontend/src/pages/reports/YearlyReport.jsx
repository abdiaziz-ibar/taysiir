import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import api from "../../api/axios";
import { useAcademicYear } from "../../context/AcademicYearContext";
import { formatMoney } from "../../utils/format";

const StatCard = ({ label, value, accent }) => (
  <div className="card">
    <p className="text-xs uppercase tracking-wide text-ink/50">{label}</p>
    <p className={`text-xl font-serif mt-1 ${accent || ""}`}>{value}</p>
  </div>
);

const YearlyReport = () => {
  const { selectedYearId } = useAcademicYear();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!selectedYearId) return;
    api.get("/reports/yearly", { params: { academicYearId: selectedYearId } }).then((res) => setData(res.data));
  }, [selectedYearId]);

  if (!data) return <p className="text-ink/50">Waa la soo shubayaa...</p>;

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-serif">Warbixinta Sanad Dugsiyeedka — {data.academicYear}</h2>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Waalidiinta" value={data.totalParents} />
        <StatCard label="Wadarta Fees" value={formatMoney(data.totalFees)} />
        <StatCard label="Wadarta La Bixiyey" value={formatMoney(data.totalPaid)} accent="text-success" />
        <StatCard label="Wadarta Deynta" value={formatMoney(data.totalDebt)} accent="text-danger" />
        <StatCard label="Collection Rate" value={`${data.collectionRate}%`} accent="text-amber" />
      </div>

      <div className="card">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.monthly}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E0" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6B7280" }} />
            <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} />
            <Tooltip
              formatter={(v) => formatMoney(v)}
              contentStyle={{ background: "#FFFFFF", border: "1px solid #E7E5E0", borderRadius: 6, color: "#14181F" }}
              cursor={{ fill: "rgba(31,58,95,0.06)" }}
            />
            <Legend wrapperStyle={{ color: "#6B7280" }} />
            <Bar dataKey="paid" name="Paid" fill="#1F3A5F" radius={[3, 3, 0, 0]} />
            <Bar dataKey="balance" name="Balance" fill="#C98A2C" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr><th>Bil</th><th className="text-right">Fees</th><th className="text-right">Paid</th><th className="text-right">Balance</th></tr>
          </thead>
          <tbody>
            {data.monthly.map((m) => (
              <tr key={m.month}>
                <td>{m.month}</td>
                <td className="text-right">{formatMoney(m.fees)}</td>
                <td className="text-right">{formatMoney(m.paid)}</td>
                <td className="text-right">{formatMoney(m.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default YearlyReport;
