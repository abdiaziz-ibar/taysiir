import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Users, Wallet, CheckCircle2, AlertCircle, Clock, XCircle, TrendingUp } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useAcademicYear } from "../context/AcademicYearContext";
import { formatMoney, formatLongDate } from "../utils/format";
import StatCard from "../components/StatCard";
import { t } from "../i18n";


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

  if (!data) return <p className="text-ink/50">{t("Waa la soo shubayaa...")}</p>;

  const collectionRate = data.totalFees > 0 ? Math.round((data.totalPaid / data.totalFees) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {t("Ku Soo Dhawoow,")} {user?.fullName?.split(" ")[0] || t("Admin")}
          </h2>
          <p className="text-sm text-ink/60 mt-0.5">{t("Halkan waxaad ka arki kartaa dulmar guud oo ku saabsan lacagaha, waalidiinta iyo deymaha.")}</p>
        </div>
        <p className="text-sm text-ink/50">{formatLongDate()}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard tone="pink" label={t("Waalidiinta")} value={data.totalParents} icon={Users} />
        <StatCard tone="purple" label={t("Wadarta Lacagta School-ka")} value={formatMoney(data.totalFees)} icon={Wallet} />
        <StatCard tone="blue" label={t("Wadarta La Bixiyey")} value={formatMoney(data.totalPaid)} icon={CheckCircle2} footer={`${t("Collection Rate")}: ${collectionRate}%`} />
        <StatCard tone="teal" label={t("Wadarta Deynta")} value={formatMoney(data.totalDebt)} icon={AlertCircle} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label={t("Paid")} value={data.paidCount} accent="text-success" icon={CheckCircle2} iconBg="bg-success/10" iconColor="text-success" />
        <StatCard label={t("Partial")} value={data.partialCount} accent="text-amber" icon={Clock} iconBg="bg-amber/10" iconColor="text-amber" />
        <StatCard label={t("Unpaid")} value={data.unpaidCount} accent="text-danger" icon={XCircle} iconBg="bg-danger/10" iconColor="text-danger" />
      </div>

      <div className="card">
        <h3 className="font-serif text-lg mb-4 flex items-center gap-2">
          <TrendingUp size={18} className="text-navy" />
          {t("Lacagta La Bixiyey Bishii Kasta")}
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={monthly}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E3E8EC" />
            <XAxis dataKey="month" tickFormatter={(v) => t(v)} tick={{ fontSize: 12, fill: "#6B7280" }} />
            <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} />
            <Tooltip labelFormatter={(l) => t(l)}
              formatter={(v) => formatMoney(v)}
              contentStyle={{ background: "#FFFFFF", border: "1px solid #E3E8EC", borderRadius: 6, color: "#14181F" }}
              cursor={{ fill: "rgba(37,99,235,0.06)" }}
            />
            <Bar dataKey="totalPaid" fill="#2563EB" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Dashboard;
