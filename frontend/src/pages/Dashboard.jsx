import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import api from "../api/axios";
import { useAcademicYear } from "../context/AcademicYearContext";
import { formatMoney } from "../utils/format";

const StatCard = ({ label, value, accent }) => (
  <div className="card">
    <p className="text-xs uppercase tracking-wide text-ink/50">{label}</p>
    <p className={`text-2xl font-serif mt-1 ${accent || ""}`}>{value}</p>
  </div>
);

const Dashboard = () => {
  const { selectedYearId } = useAcademicYear();
  const [data, setData] = useState(null);
  const [monthly, setMonthly] = useState([]);

  useEffect(() => {
    if (!selectedYearId) return;
    api.get("/reports/dashboard", { params: { academicYearId: selectedYearId } }).then((res) => setData(res.data));
    api.get("/reports/monthly", { params: { academicYearId: selectedYearId } }).then((res) => setMonthly(res.data));
  }, [selectedYearId]);

  if (!data) return <p className="text-ink/50">Waa la soo shubayaa...</p>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-serif">Dashboard</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Waalidiinta" value={data.totalParents} />
        <StatCard label="Wadarta Lacagta School-ka" value={formatMoney(data.totalFees)} />
        <StatCard label="Wadarta La Bixiyey" value={formatMoney(data.totalPaid)} accent="text-success" />
        <StatCard label="Wadarta Deynta" value={formatMoney(data.totalDebt)} accent="text-danger" />
        <StatCard label="Paid" value={data.paidCount} accent="text-success" />
        <StatCard label="Partial" value={data.partialCount} accent="text-amber" />
        <StatCard label="Unpaid" value={data.unpaidCount} accent="text-danger" />
      </div>

      <div className="card">
        <h3 className="font-serif text-lg mb-4">Lacagta La Bixiyey Bishii Kasta</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={monthly}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E0" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6B7280" }} />
            <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} />
            <Tooltip
              formatter={(v) => formatMoney(v)}
              contentStyle={{ background: "#FFFFFF", border: "1px solid #E7E5E0", borderRadius: 6, color: "#14181F" }}
              cursor={{ fill: "rgba(31,58,95,0.06)" }}
            />
            <Bar dataKey="totalPaid" fill="#1F3A5F" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Dashboard;
