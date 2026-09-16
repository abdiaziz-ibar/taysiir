import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { formatMoney, formatDate } from "../utils/format";

const PaymentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [payment, setPayment] = useState(null);
  const receiptRef = useRef();
  const [deleting, setDeleting] = useState(false);

  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [allowOverpayment, setAllowOverpayment] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => {
    api.get(`/payments/${id}`).then((res) => setPayment(res.data));
  };

  useEffect(load, [id]);

  const startEdit = () => {
    setAmount(payment.amount);
    setPaymentDate(new Date(payment.paymentDate).toISOString().slice(0, 10));
    setPaymentMethod(payment.paymentMethod);
    setReferenceNumber(payment.referenceNumber || "");
    setNotes(payment.notes || "");
    setAllowOverpayment(false);
    setError("");
    setEditing(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.put(`/payments/${id}`, {
        amount: Number(amount),
        paymentDate,
        paymentMethod,
        referenceNumber,
        notes,
        allowOverpayment,
      });
      setEditing(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Khalad ayaa dhacay.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Ma hubtaa inaad tirtirto lacag-bixintan (${formatMoney(payment.amount)})? Balance-ka waalidku si toos ah ayuu u kordhi doonaa.`)) return;
    setDeleting(true);
    try {
      await api.delete(`/payments/${id}`);
      navigate("/payments");
    } catch (err) {
      setDeleting(false);
      alert(err.response?.data?.message || "Khalad ayaa dhacay.");
    }
  };

  const handlePrint = () => {
    const content = receiptRef.current.innerHTML;
    const win = window.open("", "_blank");
    win.document.write(`<html><head><title>Receipt ${payment.receiptNumber}</title>
      <style>body{font-family: 'IBM Plex Sans', sans-serif; padding: 32px; color:#1C2321;} h1{font-family: 'Lora', serif; font-size:20px;} table{width:100%; border-collapse:collapse; margin-top:12px;} td{padding:6px 0;} .label{color:#777;}</style>
      </head><body>${content}</body></html>`);
    win.document.close();
    win.focus();
    win.print();
  };

  if (!payment) return <p className="text-ink/50">Waa la soo shubayaa...</p>;

  const fee = payment.feeId;
  const beforePaid = fee ? Math.max(fee.totalPaid - payment.amount, 0) : null;

  return (
    <div className="max-w-2xl space-y-5">
      <Link to="/payments" className="text-sm text-link hover:underline">&larr; Ku Noqo Lacag Bixinta</Link>

      <div className="card" ref={receiptRef}>
        <h1 className="font-serif text-lg mb-1">SCHOOL FEE RECEIPT</h1>
        <p className="text-ink/50 text-sm mb-4">Receipt Number: {payment.receiptNumber}</p>
        <table className="w-full text-sm">
          <tbody>
            <tr><td className="label text-ink/50 py-1">Taariikh</td><td className="text-right">{formatDate(payment.paymentDate)}</td></tr>
            <tr><td className="label text-ink/50 py-1">Magaca Waalidka</td><td className="text-right">{payment.parentId?.fullName}</td></tr>
            <tr><td className="label text-ink/50 py-1">Sanad Dugsiyeed</td><td className="text-right">{payment.academicYearId?.name}</td></tr>
            {fee && (
              <>
                <tr><td className="label text-ink/50 py-1">Wadarta Lacagta</td><td className="text-right">{formatMoney(fee.totalAmount)}</td></tr>
                <tr><td className="label text-ink/50 py-1">Hore Loo Bixiyey</td><td className="text-right">{formatMoney(beforePaid)}</td></tr>
              </>
            )}
            <tr><td className="label text-ink/50 py-1 font-medium">Lacagta Hadda La Bixiyey</td><td className="text-right font-medium">{formatMoney(payment.amount)}</td></tr>
            {fee && <tr><td className="label text-ink/50 py-1">Lacagta Ku Dhiman</td><td className="text-right">{formatMoney(fee.balance)}</td></tr>}
            <tr><td className="label text-ink/50 py-1">Habka Lacagta</td><td className="text-right">{payment.paymentMethod}</td></tr>
            {payment.referenceNumber && <tr><td className="label text-ink/50 py-1">Reference</td><td className="text-right">{payment.referenceNumber}</td></tr>}
            <tr><td className="label text-ink/50 py-1">Waxaa Qaabilay</td><td className="text-right">{payment.createdBy?.fullName || "Admin"}</td></tr>
          </tbody>
        </table>
      </div>

      {!editing && (
        <div className="flex gap-3">
          <button onClick={handlePrint} className="btn-primary">Print Receipt</button>
          <button onClick={startEdit} className="btn-secondary">Wax Ka Beddel (Edit)</button>
          {user?.role === "admin" && (
            <button onClick={handleDelete} disabled={deleting} className="btn-danger">
              {deleting ? "Waa la tirtirayaa..." : "Tirtir"}
            </button>
          )}
        </div>
      )}

      {editing && (
        <form onSubmit={handleSave} className="card space-y-4">
          <h3 className="font-serif text-lg">Wax Ka Beddel Lacag Bixinta</h3>
          {error && <div className="bg-danger/10 text-danger text-sm rounded-md px-3 py-2">{error}</div>}

          <div>
            <label className="label-field">Lacagta</label>
            <input type="number" min="0.01" step="0.01" required className="input-field" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>

          <div>
            <label className="label-field">Taariikhda</label>
            <input type="date" required className="input-field" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
          </div>

          <div>
            <label className="label-field">Habka Lacagta (Payment Method)</label>
            <select className="input-field" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              <option>Cash</option>
              <option>Mobile Money</option>
              <option>Bank</option>
              <option>Other</option>
            </select>
          </div>

          <div>
            <label className="label-field">Reference Number (haddii loo baahdo)</label>
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

          <div className="flex gap-3">
            <button className="btn-primary" disabled={saving}>{saving ? "Waa la kaydinayaa..." : "Kaydi"}</button>
            <button type="button" className="btn-secondary" onClick={() => setEditing(false)}>Jooji (Cancel)</button>
          </div>
        </form>
      )}
    </div>
  );
};

export default PaymentDetail;
