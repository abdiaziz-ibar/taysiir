import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { Users, Wallet, CheckCircle2, AlertCircle, TrendingUp } from "lucide-react";
import api from "../../api/axios";
import { useAcademicYear } from "../../context/AcademicYearContext";
import { formatMoney } from "../../utils/format";
import { t } from "../../i18n";

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
    <p className={`text-xl font-serif ${accent || ""}`}>{value}</p>
  </div>
);

const YearlyReport = () => {
  const { selectedYearId } = useAcademicYear();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!selectedYearId) return;
    api.get("/reports/yearly", { params: { academicYearId: selectedYearId } }).then((res) => setData(res.data));
  }, [selectedYearId]);

  if (!data) return <p className="text-ink/50">{t("Waa la soo shubayaa...")}</p>;

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-serif">{t("Warbixinta Sanad Dugsiyeedka —")} {data.academicYear}</h2>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label={t("Waalidiinta")} value={data.totalParents} icon={Users} iconBg="bg-navy/10" iconColor="text-navy" />
        <StatCard label={t("Wadarta Fees")} value={formatMoney(data.totalFees)} icon={Wallet} iconBg="bg-navy/10" iconColor="text-navy" />
        <StatCard label={t("Wadarta La Bixiyey")} value={formatMoney(data.totalPaid)} accent="text-success" icon={CheckCircle2} iconBg="bg-success/10" iconColor="text-success" />
        <StatCard label={t("Wadarta Deynta")} value={formatMoney(data.totalDebt)} accent="text-danger" icon={AlertCircle} iconBg="bg-danger/10" iconColor="text-danger" />
        <StatCard label={t("Collection Rate")} value={`${data.collectionRate}%`} accent="text-amber" icon={TrendingUp} iconBg="bg-amber/10" iconColor="text-amber" />
      </div>

      <div className="card">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.monthly}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E0" />
            <XAxis dataKey="month" tickFormatter={(v) => t(v)} tick={{ fontSize: 12, fill: "#6B7280" }} />
            <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} />
            <Tooltip labelFormatter={(l) => t(l)}
              formatter={(v) => formatMoney(v)}
              contentStyle={{ background: "#FFFFFF", border: "1px solid #E7E5E0", borderRadius: 6, color: "#14181F" }}
              cursor={{ fill: "rgba(31,58,95,0.06)" }}
            />
            <Legend wrapperStyle={{ color: "#6B7280" }} />
            <Bar dataKey="paid" name={t("Paid")} fill="#1F3A5F" radius={[3, 3, 0, 0]} />
            <Bar dataKey="balance" name={t("Balance")} fill="#C98A2C" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr><th>{t("Bil")}</th><th className="text-end">{t("Fees")}</th><th className="text-end">{t("Paid")}</th><th className="text-end">{t("Balance")}</th></tr>
          </thead>
          <tbody>
            {data.monthly.map((m) => (
              <tr key={m.month}>
                <td>{t(m.month)}</td>
                <td className="text-end">{formatMoney(m.fees)}</td>
                <td className="text-end">{formatMoney(m.paid)}</td>
                <td className="text-end">{formatMoney(m.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default YearlyReport;
