import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAcademicYear } from "../context/AcademicYearContext";
import { formatMoney } from "../utils/format";

const PaymentNew = () => {
  const navigate = useNavigate();
  const { selectedYearId } = useAcademicYear();
  const [parents, setParents] = useState([]);
  const [parentId, setParentId] = useState("");
  const [fee, setFee] = useState(null);
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [allowOverpayment, setAllowOverpayment] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/parents", { params: { academicYearId: selectedYearId } }).then((res) => setParents(res.data));
  }, [selectedYearId]);

  useEffect(() => {
    setFee(null);
    if (!parentId || !selectedYearId) return;
    api.get("/fees", { params: { parentId, academicYearId: selectedYearId } }).then((res) => {
      setFee(res.data[0] || null);
    });
  }, [parentId, selectedYearId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!fee) {
      setError("Waalidkan Fee lama dhigin sanad dugsiyeedkan. Fadlan hore u samee Fee bogga Parent Detail.");
      return;
    }
    setSaving(true);
    try {
      const res = await api.post("/payments", {
        parentId,
        academicYearId: selectedYearId,
        feeId: fee._id,
        amount: Number(amount),
        paymentDate,
        paymentMethod,
        referenceNumber,
        notes,
        allowOverpayment,
      });
      navigate(`/payments/${res.data.payment._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Khalad ayaa dhacay.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-5">
      <h2 className="text-xl font-serif">Lacag Bixin Cusub</h2>

      <form onSubmit={handleSubmit} className="card space-y-4">
        {error && <div className="bg-danger/10 text-danger text-sm rounded-md px-3 py-2">{error}</div>}

        <div>
          <label className="label-field">1. Dooro Waalidka</label>
          <select className="input-field" required value={parentId} onChange={(e) => setParentId(e.target.value)}>
            <option value="">Dooro Waalid...</option>
            {parents.map((p) => (
              <option key={p._id} value={p._id}>{p.fullName} — {p.phone}</option>
            ))}
          </select>
        </div>

        {parentId && (
          <div className="bg-paper rounded-md p-3 grid grid-cols-3 gap-3 text-sm">
            <div><p className="text-ink/50">Wadarta Fee</p><p className="font-medium">{fee ? formatMoney(fee.totalAmount) : "-"}</p></div>
            <div><p className="text-ink/50">La Bixiyey</p><p className="font-medium">{fee ? formatMoney(fee.totalPaid) : "-"}</p></div>
            <div><p className="text-ink/50">Ku Dhiman</p><p className="font-medium">{fee ? formatMoney(fee.balance) : "-"}</p></div>
            {!fee && <p className="col-span-3 text-danger">Waalidkan Fee lama dhigin sanad dugsiyeedkan.</p>}
          </div>
        )}

        <div>
          <label className="label-field">3. Geli Lacagta La Bixiyey</label>
          <input type="number" min="0.01" step="0.01" required className="input-field" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>

        <div>
          <label className="label-field">4. Taariikhda</label>
          <input type="date" required className="input-field" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
        </div>

        <div>
          <label className="label-field">5. Habka Lacagta (Payment Method)</label>
          <select className="input-field" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            <option>Cash</option>
            <option>Mobile Money</option>
            <option>Bank</option>
            <option>Other</option>
          </select>
        </div>

        <div>
          <label className="label-field">6. Reference Number (haddii loo baahdo)</label>
          <input className="input-field" value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} />
        </div>

        <div>
          <label className="label-field">Notes</label>
          <textarea className="input-field" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <label className="flex items-center gap-2 text-sm text-ink/70">
          <input type="checkbox" checked={allowOverpayment} onChange={(e) => setAllowOverpayment(e.target.checked)} />
          Ogolow overpayment (lacag ka badan Ku Dhiman-ka)
        </label>

        <button className="btn-primary" disabled={saving}>{saving ? "Waa la kaydinayaa..." : "7. Save"}</button>
      </form>
    </div>
  );
};

export default PaymentNew;
