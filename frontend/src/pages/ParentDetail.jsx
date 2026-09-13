import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios";
import { useAcademicYear } from "../context/AcademicYearContext";
import { formatMoney, formatDate, statusLabel, statusBadgeClass } from "../utils/format";

const ParentDetail = () => {
  const { id } = useParams();
  const { years } = useAcademicYear();
  const [parent, setParent] = useState(null);
  const [payments, setPayments] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [showFeeForm, setShowFeeForm] = useState(false);
  const [feeAmount, setFeeAmount] = useState("");
  const [feeYear, setFeeYear] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    const res = await api.get(`/parents/${id}`);
    setParent(res.data);
    const paymentsRes = await api.get("/payments", { params: { parentId: id } });
    setPayments(paymentsRes.data);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleAddFee = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/fees", { parentId: id, academicYearId: feeYear, totalAmount: Number(feeAmount) });
      setShowFeeForm(false);
      setFeeAmount("");
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Khalad ayaa dhacay.");
    }
  };

  if (!parent) return <p className="text-ink/50">Waa la soo shubayaa...</p>;

  const feesForYear = selectedYear ? parent.fees.filter((f) => f.academicYearId?._id === selectedYear) : parent.fees;
  const currentFee = feesForYear[0];

  return (
    <div className="space-y-6">
      <Link to="/parents" className="text-sm text-link hover:underline">&larr; Ku Noqo Waalidiinta</Link>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card md:col-span-1">
          <h3 className="font-serif text-lg mb-3">Xogta Waalidka</h3>
          <p className="text-sm text-ink/50">Parent ID</p>
          <p className="mb-2">{parent.parentId}</p>
          <p className="text-sm text-ink/50">Magaca</p>
          <p className="mb-2">{parent.fullName}</p>
          <p className="text-sm text-ink/50">Phone</p>
          <p className="mb-2">{parent.phone}</p>
          {parent.alternativePhone && (<><p className="text-sm text-ink/50">Alternative Phone</p><p className="mb-2">{parent.alternativePhone}</p></>)}
          <p className="text-sm text-ink/50">Address</p>
          <p className="mb-2">{parent.address || "-"}</p>
          {parent.notes && (<><p className="text-sm text-ink/50">Notes</p><p>{parent.notes}</p></>)}
        </div>

        <div className="card md:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-serif text-lg">Sanad Dugsiyeedka</h3>
            <button className="btn-secondary text-sm" onClick={() => setShowFeeForm((v) => !v)}>
              {showFeeForm ? "Jooji" : "+ U Samee Fee Sanad Cusub"}
            </button>
          </div>

          {showFeeForm && (
            <form onSubmit={handleAddFee} className="flex flex-wrap gap-3 items-end mb-4 bg-paper p-3 rounded-md">
              {error && <div className="w-full bg-danger/10 text-danger text-sm rounded-md px-3 py-2">{error}</div>}
              <div>
                <label className="label-field">Sanad Dugsiyeed</label>
                <select className="input-field" required value={feeYear} onChange={(e) => setFeeYear(e.target.value)}>
                  <option value="">Dooro...</option>
                  {years.map((y) => <option key={y._id} value={y._id}>{y.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label-field">Total Fee ($)</label>
                <input type="number" min="0" step="0.01" required className="input-field" value={feeAmount} onChange={(e) => setFeeAmount(e.target.value)} />
              </div>
              <button className="btn-primary">Kaydi</button>
            </form>
          )}

          <table className="table-base">
            <thead>
              <tr>
                <th>Academic Year</th>
                <th className="text-right">Total Fee</th>
                <th className="text-right">Paid</th>
                <th className="text-right">Balance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {parent.fees.map((f) => (
                <tr key={f._id}>
                  <td>{f.academicYearId?.name}</td>
                  <td className="text-right">{formatMoney(f.totalAmount)}</td>
                  <td className="text-right">{formatMoney(f.totalPaid)}</td>
                  <td className="text-right">{formatMoney(f.balance)}</td>
                  <td><span className={statusBadgeClass(f.status)}>{statusLabel(f.status)}</span></td>
                </tr>
              ))}
              {parent.fees.length === 0 && (
                <tr><td colSpan={5} className="text-center text-ink/40 py-4">Weli Fee lama dhigin.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3 className="font-serif text-lg mb-3">Payment History</h3>
        <table className="table-base">
          <thead>
            <tr>
              <th>Receipt</th>
              <th>Taariikh</th>
              <th>Sanad Dugsiyeed</th>
              <th className="text-right">Lacag</th>
              <th>Habka Lacagta</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p._id}>
                <td><Link to={`/payments/${p._id}`} className="text-link hover:underline">{p.receiptNumber}</Link></td>
                <td>{formatDate(p.paymentDate)}</td>
                <td>{p.academicYearId?.name}</td>
                <td className="text-right">{formatMoney(p.amount)}</td>
                <td>{p.paymentMethod}</td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr><td colSpan={5} className="text-center text-ink/40 py-4">Weli lacag lama bixin.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ParentDetail;
