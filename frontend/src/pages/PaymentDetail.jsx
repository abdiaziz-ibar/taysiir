import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { formatMoney, formatDate } from "../utils/format";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import { t } from "../i18n";

const PaymentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [payment, setPayment] = useState(null);
  const receiptRef = useRef();
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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
      setError(t(err.response?.data?.message || "Khalad ayaa dhacay."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/payments/${id}`);
      navigate("/payments");
    } catch (err) {
      setDeleting(false);
      setShowDeleteModal(false);
      alert(t(err.response?.data?.message || "Khalad ayaa dhacay."));
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

  if (!payment) return <p className="text-ink/50">{t("Waa la soo shubayaa...")}</p>;

  const fee = payment.feeId;
  const beforePaid = fee ? Math.max(fee.totalPaid - payment.amount, 0) : null;

  return (
    <div className="max-w-2xl space-y-5">
      <Link to="/payments" className="text-sm text-link hover:underline">{t("← Ku Noqo Lacag Bixinta")}</Link>

      <div className="card" ref={receiptRef}>
        <h1 className="font-serif text-lg mb-1">{t("SCHOOL FEE RECEIPT")}</h1>
        <p className="text-ink/50 text-sm mb-4">{t("Receipt Number:")} {payment.receiptNumber}</p>
        <table className="w-full text-sm">
          <tbody>
            <tr><td className="label text-ink/50 py-1">{t("Taariikh")}</td><td className="text-end">{formatDate(payment.paymentDate)}</td></tr>
            <tr><td className="label text-ink/50 py-1">{t("Magaca Waalidka")}</td><td className="text-end">{payment.parentId?.fullName}</td></tr>
            <tr><td className="label text-ink/50 py-1">{t("Sanad Dugsiyeed")}</td><td className="text-end">{payment.academicYearId?.name}</td></tr>
            {fee && (
              <>
                <tr><td className="label text-ink/50 py-1">{t("Wadarta Lacagta")}</td><td className="text-end">{formatMoney(fee.totalAmount)}</td></tr>
                <tr><td className="label text-ink/50 py-1">{t("Hore Loo Bixiyey")}</td><td className="text-end">{formatMoney(beforePaid)}</td></tr>
              </>
            )}
            <tr><td className="label text-ink/50 py-1 font-medium">{t("Lacagta Hadda La Bixiyey")}</td><td className="text-end font-medium">{formatMoney(payment.amount)}</td></tr>
            {fee && <tr><td className="label text-ink/50 py-1">{t("Lacagta Ku Dhiman")}</td><td className="text-end">{formatMoney(fee.balance)}</td></tr>}
            <tr><td className="label text-ink/50 py-1">{t("Habka Lacagta")}</td><td className="text-end">{t(payment.paymentMethod)}</td></tr>
            {payment.referenceNumber && <tr><td className="label text-ink/50 py-1">{t("Reference")}</td><td className="text-end">{payment.referenceNumber}</td></tr>}
            <tr><td className="label text-ink/50 py-1">{t("Waxaa Qaabilay")}</td><td className="text-end">{payment.createdBy?.fullName || t("Admin")}</td></tr>
          </tbody>
        </table>
      </div>

      {!editing && (
        <div className="flex gap-3">
          <button onClick={handlePrint} className="btn-primary">{t("Print Receipt")}</button>
          <button onClick={startEdit} className="btn-secondary">{t("Wax Ka Beddel (Edit)")}</button>
          {user?.role === "admin" && (
            <button onClick={() => setShowDeleteModal(true)} disabled={deleting} className="btn-danger">
              {deleting ? t("Waa la tirtirayaa...") : t("Tirtir")}
            </button>
          )}
        </div>
      )}

      {editing && (
        <form onSubmit={handleSave} className="card space-y-4">
          <h3 className="font-serif text-lg">{t("Wax Ka Beddel Lacag Bixinta")}</h3>
          {error && <div className="bg-danger/10 text-danger text-sm rounded-md px-3 py-2">{error}</div>}

          <div>
            <label className="label-field">{t("Lacagta")}</label>
            <input type="number" min="0.01" step="0.01" required className="input-field" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>

          <div>
            <label className="label-field">{t("Taariikhda")}</label>
            <input type="date" required className="input-field" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
          </div>

          <div>
            <label className="label-field">{t("Habka Lacagta (Payment Method)")}</label>
            <select className="input-field" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              <option value="Cash">{t("Cash")}</option>
              <option value="Mobile Money">{t("Mobile Money")}</option>
              <option value="Bank">{t("Bank")}</option>
              <option value="Other">{t("Other")}</option>
            </select>
          </div>

          <div>
            <label className="label-field">{t("Reference Number (haddii loo baahdo)")}</label>
            <input className="input-field" value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} />
          </div>

          <div>
            <label className="label-field">{t("Notes")}</label>
            <textarea className="input-field" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <label className="flex items-center gap-2 text-sm text-ink/70">
            <input type="checkbox" checked={allowOverpayment} onChange={(e) => setAllowOverpayment(e.target.checked)} />
            {t("Ogolow overpayment (lacag ka badan Ku Dhiman-ka)")}
          </label>

          <div className="flex gap-3">
            <button className="btn-primary" disabled={saving}>{saving ? t("Waa la kaydinayaa...") : t("Kaydi")}</button>
            <button type="button" className="btn-secondary" onClick={() => setEditing(false)}>{t("Jooji (Cancel)")}</button>
          </div>
        </form>
      )}

      <ConfirmDeleteModal
        open={showDeleteModal}
        title={t("Tirtir Lacag Bixinta?")}
        message={t("Waxaad tirtirayaa lacag-bixintan ({amount}). Balance-ka waalidku si toos ah ayuu u kordhi doonaa — lama soo celin karo.", { amount: formatMoney(payment.amount) })}
        onConfirm={handleDelete}
        onClose={() => setShowDeleteModal(false)}
      />
    </div>
  );
};

export default PaymentDetail;
