import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Users, Wallet, CheckCircle2, AlertCircle, Clock, XCircle, TrendingUp } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useAcademicYear } from "../context/AcademicYearContext";
import { formatMoney } from "../utils/format";

const TODAY_LABEL = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

const StatCard = ({ label, value, icon: Icon, iconBg, iconColor, accent }) => (
  <div className="card">
    <div className="flex items-center justify-between mb-2">
      <p className="text-xs uppercase tracking-wide text-ink/50">{label}</p>
      {Icon && (
        <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${iconBg || "bg-navy/10"}`}>
          <Icon size={16} className={iconColor || "text-navy"} />
        </span>
      )}
    </div>
    <p className={`text-2xl font-serif ${accent || ""}`}>{value}</p>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const { selectedYearId } = useAcademicYear();
  const [data, setData] = useState(null);
  const [monthly, setMonthly] = useState([]);

  useEffect(() => {
    if (!selectedYearId) return;
    api.get("/reports/dashboard", { params: { academicYearId: selectedYearId } }).then((res) => setData(res.data));
    api.get("/reports/monthly", { params: { academicYearId: selectedYearId } }).then((res) => setMonthly(res.data));
  }, [selectedYearId]);

  if (!data) return <p className="text-ink/50">Waa la soo shubayaa...</p>;

  const collectionRate = data.totalFees > 0 ? Math.round((data.totalPaid / data.totalFees) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy via-navy-light to-navy-dark text-white p-6 md:p-8">
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/5" />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-white/5 -mb-24 -ml-24" />
        <div className="relative flex items-center justify-between flex-wrap gap-5">
          <div>
            <p className="text-white/60 text-sm">{TODAY_LABEL}</p>
            <h2 className="font-serif text-2xl md:text-3xl font-bold mt-1">
              Ku Soo Dhawoow, {user?.fullName?.split(" ")[0] || "Admin"}
            </h2>
            <p className="text-white/70 text-sm mt-1.5 max-w-md">
              Halkan waxaad ka arki kartaa dulmar guud oo ku saabsan lacagaha, waalidiinta iyo deymaha.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white/10 rounded-xl px-5 py-3 shrink-0">
            <span className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
              <TrendingUp size={20} />
            </span>
            <div>
              <p className="text-xs text-white/60">Collection Rate</p>
              <p className="text-xl font-serif font-bold">{collectionRate}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Waalidiinta" value={data.totalParents} icon={Users} iconBg="bg-navy/10" iconColor="text-navy" />
        <StatCard label="Wadarta Lacagta School-ka" value={formatMoney(data.totalFees)} icon={Wallet} iconBg="bg-navy/10" iconColor="text-navy" />
        <StatCard label="Wadarta La Bixiyey" value={formatMoney(data.totalPaid)} accent="text-success" icon={CheckCircle2} iconBg="bg-success/10" iconColor="text-success" />
        <StatCard label="Wadarta Deynta" value={formatMoney(data.totalDebt)} accent="text-danger" icon={AlertCircle} iconBg="bg-danger/10" iconColor="text-danger" />
        <StatCard label="Paid" value={data.paidCount} accent="text-success" icon={CheckCircle2} iconBg="bg-success/10" iconColor="text-success" />
        <StatCard label="Partial" value={data.partialCount} accent="text-amber" icon={Clock} iconBg="bg-amber/10" iconColor="text-amber" />
        <StatCard label="Unpaid" value={data.unpaidCount} accent="text-danger" icon={XCircle} iconBg="bg-danger/10" iconColor="text-danger" />
      </div>

      <div className="card">
        <h3 className="font-serif text-lg mb-4 flex items-center gap-2">
          <TrendingUp size={18} className="text-navy" />
          Lacagta La Bixiyey Bishii Kasta
        </h3>
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
