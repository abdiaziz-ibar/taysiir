import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import api from "../api/axios";
import { useAcademicYear } from "../context/AcademicYearContext";
import { formatMoney, formatDate, statusLabel, statusBadgeClass } from "../utils/format";

const ParentDetail = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { years } = useAcademicYear();
  const [parent, setParent] = useState(null);
  const [payments, setPayments] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [showFeeForm, setShowFeeForm] = useState(false);
  const [feeAmount, setFeeAmount] = useState("");
  const [feeYear, setFeeYear] = useState("");
  const [error, setError] = useState("");

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [editError, setEditError] = useState("");
  const [saving, setSaving] = useState(false);

  const [feeEditingId, setFeeEditingId] = useState(null);
  const [feeEditAmount, setFeeEditAmount] = useState("");
  const [feeEditPaid, setFeeEditPaid] = useState("");
  const [feeEditError, setFeeEditError] = useState("");

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

  const startFeeEdit = (f) => {
    setFeeEditingId(f._id);
    setFeeEditAmount(f.totalAmount);
    setFeeEditPaid(f.totalPaid);
    setFeeEditError("");
  };

  const handleFeeEditSave = async (feeId) => {
    setFeeEditError("");
    try {
      await api.put(`/fees/${feeId}`, { totalAmount: Number(feeEditAmount), totalPaid: Number(feeEditPaid) });
      setFeeEditingId(null);
      load();
    } catch (err) {
      setFeeEditError(err.response?.data?.message || "Khalad ayaa dhacay.");
    }
  };

  const startEdit = () => {
    setEditForm({
      fullName: parent.fullName,
      phone: parent.phone,
      alternativePhone: parent.alternativePhone || "",
      address: parent.address || "",
      email: parent.email || "",
      notes: parent.notes || "",
    });
    setEditError("");
    setEditing(true);
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    setEditError("");
    setSaving(true);
    try {
      await api.put(`/parents/${id}`, editForm);
      setEditing(false);
      load();
    } catch (err) {
      setEditError(err.response?.data?.message || "Khalad ayaa dhacay.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (parent && searchParams.get("edit") === "1" && !editing) {
      startEdit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parent]);

  if (!parent) return <p className="text-ink/50">Waa la soo shubayaa...</p>;

  const feesForYear = selectedYear ? parent.fees.filter((f) => f.academicYearId?._id === selectedYear) : parent.fees;
  const currentFee = feesForYear[0];

  return (
    <div className="space-y-6">
      <Link to="/parents" className="text-sm text-link hover:underline">&larr; Ku Noqo Waalidiinta</Link>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card md:col-span-1">
          <div className="flex items-center justify-between mb-3 gap-2">
            <h3 className="font-serif text-lg">Xogta Waalidka</h3>
            {!editing && (
              <div className="flex gap-2 shrink-0">
                <button className="btn-secondary text-sm" onClick={startEdit}>Wax Ka Beddel (Edit)</button>
              </div>
            )}
          </div>

          {!editing ? (
            <>
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
            </>
          ) : (
            <form onSubmit={handleEditSave} className="space-y-3">
              {editError && <div className="bg-danger/10 text-danger text-sm rounded-md px-3 py-2">{editError}</div>}
              <div>
                <label className="label-field">Magaca Waalidka</label>
                <input className="input-field" required value={editForm.fullName} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} />
              </div>
              <div>
                <label className="label-field">Phone Number</label>
                <input className="input-field" required value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
              </div>
              <div>
                <label className="label-field">Alternative Phone</label>
                <input className="input-field" value={editForm.alternativePhone} onChange={(e) => setEditForm({ ...editForm, alternativePhone: e.target.value })} />
              </div>
              <div>
                <label className="label-field">Address</label>
                <input className="input-field" required value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />
              </div>
              <div>
                <label className="label-field">Email (ikhtiyaari)</label>
                <input className="input-field" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
              </div>
              <div>
                <label className="label-field">Notes</label>
                <textarea className="input-field" rows={2} value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} />
              </div>
              <div className="flex gap-3">
                <button className="btn-primary" disabled={saving}>{saving ? "Waa la kaydinayaa..." : "Kaydi"}</button>
                <button type="button" className="btn-secondary" onClick={() => setEditing(false)}>Jooji (Cancel)</button>
              </div>
            </form>
          )}
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

          {feeEditError && <div className="bg-danger/10 text-danger text-sm rounded-md px-3 py-2 mb-3">{feeEditError}</div>}

          <table className="table-base">
            <thead>
              <tr>
                <th>Academic Year</th>
                <th className="text-right">Total Fee</th>
                <th className="text-right">Paid</th>
                <th className="text-right">Balance</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {parent.fees.map((f) => (
                <tr key={f._id}>
                  <td>{f.academicYearId?.name}</td>
                  <td className="text-right">
                    {feeEditingId === f._id ? (
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="input-field !w-28 ml-auto text-right"
                        value={feeEditAmount}
                        onChange={(e) => setFeeEditAmount(e.target.value)}
                      />
                    ) : (
                      formatMoney(f.totalAmount)
                    )}
                  </td>
                  <td className="text-right">
                    {feeEditingId === f._id ? (
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="input-field !w-28 ml-auto text-right"
                        value={feeEditPaid}
                        onChange={(e) => setFeeEditPaid(e.target.value)}
                      />
                    ) : (
                      formatMoney(f.totalPaid)
                    )}
                  </td>
                  <td className="text-right">{formatMoney(f.balance)}</td>
                  <td><span className={statusBadgeClass(f.status)}>{statusLabel(f.status)}</span></td>
                  <td className="text-right whitespace-nowrap">
                    {feeEditingId === f._id ? (
                      <>
                        <button onClick={() => handleFeeEditSave(f._id)} className="text-sm text-success hover:underline mr-3">Kaydi</button>
                        <button onClick={() => setFeeEditingId(null)} className="text-sm text-ink/60 hover:underline">Jooji</button>
                      </>
                    ) : (
                      <button onClick={() => startFeeEdit(f)} className="text-sm text-link hover:underline">Edit</button>
                    )}
                  </td>
                </tr>
              ))}
              {parent.fees.length === 0 && (
                <tr><td colSpan={6} className="text-center text-ink/40 py-4">Weli Fee lama dhigin.</td></tr>
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
