import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAcademicYear } from "../context/AcademicYearContext";
import { formatMoney, statusLabel, statusBadgeClass } from "../utils/format";
import { t } from "../i18n";

const Debts = () => {
  const { selectedYearId } = useAcademicYear();
  const [data, setData] = useState({ totalDebt: 0, debts: [] });

  useEffect(() => {
    if (!selectedYearId) return;
    api.get("/reports/debts", { params: { academicYearId: selectedYearId } }).then((res) => setData(res.data));
  }, [selectedYearId]);

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-serif">{t("Waalidiinta Deynta Lagu Leeyahay")}</h2>

      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th>{t("Waalid")}</th>
              <th>{t("Phone")}</th>
              <th className="text-end">{t("Total Fee")}</th>
              <th className="text-end">{t("La Bixiyey")}</th>
              <th className="text-end">{t("Ku Dhiman")}</th>
              <th>{t("Status")}</th>
            </tr>
          </thead>
          <tbody>
            {data.debts.map((f) => (
              <tr key={f._id}>
                <td><Link to={`/parents/${f.parentId?._id}`} className="text-link hover:underline">{f.parentId?.fullName}</Link></td>
                <td>{f.parentId?.phone}</td>
                <td className="text-end">{formatMoney(f.totalAmount)}</td>
                <td className="text-end">{formatMoney(f.totalPaid)}</td>
                <td className="text-end">{formatMoney(f.balance)}</td>
                <td><span className={statusBadgeClass(f.status)}>{statusLabel(f.status)}</span></td>
              </tr>
            ))}
            {data.debts.length === 0 && (
              <tr><td colSpan={6} className="text-center text-ink/40 py-6">{t("Mid deyn qaba lama helin. 🎉")}</td></tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} className="text-end font-medium py-3">{t("Wadarta Deynta:")}</td>
              <td className="text-end font-medium py-3">{formatMoney(data.totalDebt)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default Debts;
