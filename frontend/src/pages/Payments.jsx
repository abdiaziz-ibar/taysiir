import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAcademicYear } from "../context/AcademicYearContext";
import { formatMoney, formatDate } from "../utils/format";

const Payments = () => {
  const { selectedYearId } = useAcademicYear();
  const [payments, setPayments] = useState([]);

  const load = () => {
    if (!selectedYearId) return;
    api.get("/payments", { params: { academicYearId: selectedYearId } }).then((res) => setPayments(res.data));
  };

  useEffect(load, [selectedYearId]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-serif">Lacag Bixinta</h2>
        <Link to="/payments/new" className="btn-primary">+ Lacag Bixin Cusub</Link>
      </div>

      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th>Receipt</th>
              <th>Waalid</th>
              <th>Taariikh</th>
              <th className="text-right">Lacag</th>
              <th>Habka Lacagta</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p._id}>
                <td><Link to={`/payments/${p._id}`} className="text-navy hover:underline">{p.receiptNumber}</Link></td>
                <td><Link to={`/parents/${p.parentId?._id}`} className="text-navy hover:underline">{p.parentId?.fullName}</Link></td>
                <td>{formatDate(p.paymentDate)}</td>
                <td className="text-right">{formatMoney(p.amount)}</td>
                <td>{p.paymentMethod}</td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr><td colSpan={5} className="text-center text-ink/40 py-6">Weli lacag lama bixin.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Payments;
