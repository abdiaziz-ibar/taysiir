import { useEffect, useState } from "react";
import { Wallet, CheckCircle2, AlertCircle } from "lucide-react";
import api from "../../api/axios";
import { formatMoney } from "../../utils/format";
import { downloadExcel } from "../../utils/excel";
import { t } from "../../i18n";

const StatCard = ({ label, value, icon: Icon, iconBg, iconColor, accent }) => (
  <div className="card">
    <div className="flex items-center justify-between mb-2">
      <p className="text-xs uppercase tracking-wide text-ink/50">{label}</p>
      <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}>
        <Icon size={16} className={iconColor} />
      </span>
    </div>
    <p className={`text-2xl font-serif ${accent || ""}`}>{value}</p>
  </div>
);

const AllYearsReport = () => {
  const [data, setData] = useState({ years: [], totals: { totalFees: 0, totalPaid: 0, totalDebt: 0 } });

  useEffect(() => {
    api.get("/reports/all-years").then((res) => setData(res.data));
  }, []);

  const handleExport = () => {
    const headers = ["Sanad Dugsiyeed", "Waalidiinta", "Wadarta Fee", "La Bixiyey", "Ku Dhiman", "Collection Rate"];
    const rows = data.years.map((y) => [
      y.academicYear,
      y.totalParents,
      y.totalFees,
      y.totalPaid,
      y.totalDebt,
      `${y.collectionRate}%`,
    ]);
    rows.push(["Wadarta Guud", "", data.totals.totalFees, data.totals.totalPaid, data.totals.totalDebt, ""]);
    const today = new Date().toISOString().slice(0, 10);
    downloadExcel(`dhammaan-sannadaha-${today}.xlsx`, headers, rows);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-serif">{t("Dhammaan Sannadaha — Lacagta Guud")}</h2>
        <button onClick={handleExport} className="btn-secondary text-sm">{t("⬇ Soo Deji Excel")}</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label={t("Wadarta Lacagta School-ka")} value={formatMoney(data.totals.totalFees)} icon={Wallet} iconBg="bg-navy/10" iconColor="text-navy" />
        <StatCard label={t("Wadarta La Bixiyey")} value={formatMoney(data.totals.totalPaid)} accent="text-success" icon={CheckCircle2} iconBg="bg-success/10" iconColor="text-success" />
        <StatCard label={t("Wadarta Ku Dhiman")} value={formatMoney(data.totals.totalDebt)} accent="text-danger" icon={AlertCircle} iconBg="bg-danger/10" iconColor="text-danger" />
      </div>

      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th>{t("Sanad Dugsiyeed")}</th>
              <th className="text-end">{t("Waalidiinta")}</th>
              <th className="text-end">{t("Wadarta Fee")}</th>
              <th className="text-end">{t("La Bixiyey")}</th>
              <th className="text-end">{t("Ku Dhiman")}</th>
              <th className="text-end">{t("Collection Rate")}</th>
            </tr>
          </thead>
          <tbody>
            {data.years.map((y) => (
              <tr key={y.academicYearId}>
                <td>
                  {y.academicYear}
                  {y.isActive && <span className="badge badge-paid ms-2">{t("Firfircoon")}</span>}
                </td>
                <td className="text-end">{y.totalParents}</td>
                <td className="text-end">{formatMoney(y.totalFees)}</td>
                <td className="text-end text-success">{formatMoney(y.totalPaid)}</td>
                <td className="text-end text-danger">{formatMoney(y.totalDebt)}</td>
                <td className="text-end">{y.collectionRate}%</td>
              </tr>
            ))}
            {data.years.length === 0 && (
              <tr><td colSpan={6} className="text-center text-ink/40 py-6">{t("Sanad Dugsiyeed lama helin.")}</td></tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <td className="font-medium py-3">{t("Wadarta Guud")}</td>
              <td></td>
              <td className="text-end font-medium py-3">{formatMoney(data.totals.totalFees)}</td>
              <td className="text-end font-medium py-3 text-success">{formatMoney(data.totals.totalPaid)}</td>
              <td className="text-end font-medium py-3 text-danger">{formatMoney(data.totals.totalDebt)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default AllYearsReport;
