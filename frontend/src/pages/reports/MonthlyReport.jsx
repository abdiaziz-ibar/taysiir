import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import api from "../../api/axios";
import { useAcademicYear } from "../../context/AcademicYearContext";
import { formatMoney } from "../../utils/format";
import { t } from "../../i18n";

const MonthlyReport = () => {
  const { selectedYearId, years } = useAcademicYear();
  const [data, setData] = useState([]);
  const yearName = years.find((y) => y._id === selectedYearId)?.name;

  useEffect(() => {
    if (!selectedYearId) return;
    api.get("/reports/monthly", { params: { academicYearId: selectedYearId } }).then((res) => setData(res.data));
  }, [selectedYearId]);

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold tracking-tight">{t("Warbixinta Bilaha")} {yearName ? `— ${yearName}` : ""}</h2>

      <div className="card">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E3E8EC" />
            <XAxis dataKey="month" tickFormatter={(v) => t(v)} tick={{ fontSize: 12, fill: "#6B7280" }} />
            <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} />
            <Tooltip labelFormatter={(l) => t(l)}
              formatter={(v) => formatMoney(v)}
              contentStyle={{ background: "#FFFFFF", border: "1px solid #E3E8EC", borderRadius: 6, color: "#14181F" }}
              cursor={{ stroke: "#E3E8EC" }}
            />
            <Line type="monotone" dataKey="totalPaid" stroke="#2563EB" strokeWidth={2} dot={{ r: 3, fill: "#2563EB" }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th>{t("Bil")}</th>
              <th className="text-end">{t("Lacagta La Bixiyey")}</th>
              <th className="text-end">{t("Tirada Payments")}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((m) => (
              <tr key={m.month}>
                <td>{t(m.month)}</td>
                <td className="text-end">{formatMoney(m.totalPaid)}</td>
                <td className="text-end">{m.paymentsCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MonthlyReport;
