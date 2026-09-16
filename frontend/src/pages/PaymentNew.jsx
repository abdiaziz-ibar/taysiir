import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAcademicYear } from "../context/AcademicYearContext";
import { formatMoney } from "../utils/format";

const PaymentNew = () => {
  const navigate = useNavigate();
  const { selectedYearId, years } = useAcademicYear();
  const [parents, setParents] = useState([]);
  const [parentId, setParentId] = useState("");
  const [academicYearId, setAcademicYearId] = useState(selectedYearId || "");
  const [fee, setFee] = useState(null);
  const [feeLoaded, setFeeLoaded] = useState(false);
  const [newFeeAmount, setNewFeeAmount] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [allowOverpayment, setAllowOverpayment] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/parents").then((res) => setParents(res.data));
  }, []);

  useEffect(() => {
    setFee(null);
    setFeeLoaded(false);
    setNewFeeAmount("");
    if (!parentId || !academicYearId) return;
    api.get("/fees", { params: { parentId, academicYearId } }).then((res) => {
      setFee(res.data[0] || null);
      setFeeLoaded(true);
    });
  }, [parentId, academicYearId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!fee && !(Number(newFeeAmount) > 0)) {
      setError("Waalidkan Fee lama dhigin sanad dugsiyeedkan. Fadlan geli Wadarta Fee.");
      return;
    }

    setSaving(true);
    try {
      let feeId = fee?._id;
      if (!feeId) {
        const feeRes = await api.post("/fees", {
          parentId,
          academicYearId,
          totalAmount: Number(newFeeAmount),
        });
        feeId = feeRes.data._id;
      }

      const res = await api.post("/payments", {
        parentId,
        academicYearId,
        feeId,
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

        <div>
          <label className="label-field">2. Dooro Sanad Dugsiyeedka</label>
          <select className="input-field" required value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)}>
            <option value="">Dooro Sanad Dugsiyeed...</option>
            {years.map((y) => (
              <option key={y._id} value={y._id}>{y.name}</option>
            ))}
          </select>
        </div>

        {parentId && academicYearId && feeLoaded && (
          <div className="bg-paper rounded-md p-3 text-sm">
            {fee ? (
              <div className="grid grid-cols-3 gap-3">
                <div><p className="text-ink/50">Wadarta Fee</p><p className="font-medium">{formatMoney(fee.totalAmount)}</p></div>
                <div><p className="text-ink/50">La Bixiyey</p><p className="font-medium">{formatMoney(fee.totalPaid)}</p></div>
                <div><p className="text-ink/50">Ku Dhiman</p><p className="font-medium">{formatMoney(fee.balance)}</p></div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-amber">Waalidkan Fee lama dhigin sanad dugsiyeedkan ee la doortay. Geli Wadarta Fee si aad hal mar u sameyso Fee-ga iyo lacag-bixinta.</p>
                <div>
                  <label className="label-field">Wadarta Fee (Sanad Dugsiyeedkan)</label>
                  <input type="number" min="0.01" step="0.01" required className="input-field" value={newFeeAmount} onChange={(e) => setNewFeeAmount(e.target.value)} />
                </div>
              </div>
            )}
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
