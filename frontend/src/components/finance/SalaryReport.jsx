import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { GraduationCap, Users, CheckCircle2, AlertCircle, Download } from "lucide-react";
import StatCard from "../StatCard";
import YearSelect from "./YearSelect";
import useYear from "./useYear";
import { formatMoney } from "../../utils/format";
import { downloadExcel } from "../../utils/excel";
import { t } from "../../i18n";

// The salaries report for a school year: teachers and staff month by month — paid, owed and still to pay.
const SalaryReport = () => {
  const { startYear, setStartYear, data } = useYear();

  const exportExcel = () => {
    const headers = ["Bil", "Macalimiinta", "Shaqaale", "Wadarta La Bixiyey", "Mushaharka La Rabay", "Ku Dhiman"];
    const rows = data.months.map((m) => [m.month, m.teachers.paid, m.staff.paid, m.salaryPaid, m.salaryDue, m.salaryRemaining]);
    const tot = data.totals;
    rows.push(["Wadarta", tot.teachersPaid, tot.staffPaid, tot.salaryPaid, tot.salaryDue, tot.salaryRemaining]);
    downloadExcel(`warbixinta-mushaharka-${data.schoolYear}.xlsx`, headers, rows);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-serif text-lg">{t("Warbixinta Mushaharka")}{data ? ` — ${data.schoolYear}` : ""}</h3>
          <p className="text-sm text-ink/50 mt-0.5">{t("Macalimiinta iyo shaqaalaha bil kasta (Sebtembar → Ogosto).")}</p>
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
            <StatCard label={t("Macalimiinta La Bixiyey")} value={formatMoney(data.totals.teachersPaid)} icon={GraduationCap} />
            <StatCard label={t("Shaqaale La Bixiyey")} value={formatMoney(data.totals.staffPaid)} icon={Users} />
            <StatCard label={t("Wadarta La Bixiyey")} value={formatMoney(data.totals.salaryPaid)} accent="text-success" icon={CheckCircle2} iconBg="bg-success/10" iconColor="text-success" />
            <StatCard label={t("Ku Dhiman")} value={formatMoney(data.totals.salaryRemaining)} accent="text-danger" icon={AlertCircle} iconBg="bg-danger/10" iconColor="text-danger" />
          </div>

          <div className="card">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.months.map((m) => ({ month: m.month, teachers: m.teachers.paid, staff: m.staff.paid }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E0" />
                <XAxis dataKey="month" tickFormatter={(v) => t(v)} tick={{ fontSize: 12, fill: "#6B7280" }} />
                <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} />
                <Tooltip labelFormatter={(l) => t(l)} formatter={(v) => formatMoney(v)} contentStyle={{ background: "#FFFFFF", border: "1px solid #E7E5E0", borderRadius: 6, color: "#14181F" }} cursor={{ fill: "#F5F5F4" }} />
                <Legend />
                <Bar isAnimationActive={false} dataKey="teachers" stackId="s" name={t("Macalimiinta")} fill="#1F3A5F" />
                <Bar isAnimationActive={false} dataKey="staff" stackId="s" name={t("Shaqaale")} fill="#2F7A4D" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>{t("Bil")}</th>
                  <th className="text-end">{t("Macalimiinta")}</th>
                  <th className="text-end">{t("Shaqaale")}</th>
                  <th className="text-end">{t("La Bixiyey")}</th>
                  <th className="text-end">{t("Mushaharka La Rabay")}</th>
                  <th className="text-end">{t("Ku Dhiman")}</th>
                </tr>
              </thead>
              <tbody>
                {data.months.map((m) => (
                  <tr key={m.period} className={m.future ? "opacity-40" : ""}>
                    <td>{t(m.month)}</td>
                    <td className="text-end">{formatMoney(m.teachers.paid)}</td>
                    <td className="text-end">{formatMoney(m.staff.paid)}</td>
                    <td className="text-end font-medium text-success">{formatMoney(m.salaryPaid)}</td>
                    <td className="text-end">{formatMoney(m.salaryDue)}</td>
                    <td className="text-end text-danger">{formatMoney(m.salaryRemaining)}</td>
                  </tr>
                ))}
                <tr className="font-semibold">
                  <td>{t("Wadarta")}</td>
                  <td className="text-end">{formatMoney(data.totals.teachersPaid)}</td>
                  <td className="text-end">{formatMoney(data.totals.staffPaid)}</td>
                  <td className="text-end text-success">{formatMoney(data.totals.salaryPaid)}</td>
                  <td className="text-end">{formatMoney(data.totals.salaryDue)}</td>
                  <td className="text-end text-danger">{formatMoney(data.totals.salaryRemaining)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default SalaryReport;
