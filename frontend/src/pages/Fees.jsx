import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAcademicYear } from "../context/AcademicYearContext";
import { formatMoney, statusLabel, statusBadgeClass } from "../utils/format";

const Fees = () => {
  const { selectedYearId } = useAcademicYear();
  const [fees, setFees] = useState([]);

  useEffect(() => {
    if (!selectedYearId) return;
    api.get("/fees", { params: { academicYearId: selectedYearId } }).then((res) => setFees(res.data));
  }, [selectedYearId]);

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-serif">Lacagaha School-ka (Fees)</h2>
      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th>Waalid</th>
              <th className="text-right">Total Fee</th>
              <th className="text-right">La Bixiyey</th>
              <th className="text-right">Ku Dhiman</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {fees.map((f) => (
              <tr key={f._id}>
                <td><Link to={`/parents/${f.parentId?._id}`} className="text-navy hover:underline">{f.parentId?.fullName}</Link></td>
                <td className="text-right">{formatMoney(f.totalAmount)}</td>
                <td className="text-right">{formatMoney(f.totalPaid)}</td>
                <td className="text-right">{formatMoney(f.balance)}</td>
                <td><span className={statusBadgeClass(f.status)}>{statusLabel(f.status)}</span></td>
              </tr>
            ))}
            {fees.length === 0 && (
              <tr><td colSpan={5} className="text-center text-ink/40 py-6">Fee lama helin sanad dugsiyeedkan.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Fees;
