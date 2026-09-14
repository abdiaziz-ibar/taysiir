import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAcademicYear } from "../context/AcademicYearContext";
import { formatMoney, statusLabel, statusBadgeClass } from "../utils/format";

const emptyForm = { fullName: "", phone: "", alternativePhone: "", address: "", email: "", notes: "" };

const Parents = () => {
  const { selectedYearId } = useAcademicYear();
  const [parents, setParents] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const res = await api.get("/parents", {
      params: { search, status, sort, academicYearId: selectedYearId },
    });
    setParents(res.data);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYearId, search, status, sort]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.post("/parents", form);
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Khalad ayaa dhacay.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-serif">Waalidiinta</h2>
        <button className="btn-primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Jooji" : "+ Waalid Cusub"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card grid grid-cols-1 md:grid-cols-2 gap-4">
          {error && <div className="md:col-span-2 bg-danger/10 text-danger text-sm rounded-md px-3 py-2">{error}</div>}
          <div>
            <label className="label-field">Magaca Waalidka</label>
            <input className="input-field" required value={form.fullName} placeholder="Enter full name" onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </div>
          <div>
            <label className="label-field">Phone Number</label>
            <input className="input-field" required value={form.phone} placeholder="Enter phone number" onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="label-field">Alternative Phone</label>
            <input className="input-field" value={form.alternativePhone} placeholder="Enter alternative phone number" onChange={(e) => setForm({ ...form, alternativePhone: e.target.value })} />
          </div>
          <div>
            <label className="label-field">Address</label>
            <input className="input-field" value={form.address} placeholder="Enter address" onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div>
            <label className="label-field">Email (ikhtiyaari)</label>
            <input className="input-field" value={form.email} placeholder="Enter email" onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <label className="label-field">Notes</label>
            <textarea className="input-field" rows={2} value={form.notes} placeholder="Enter notes" onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <button className="btn-primary" disabled={saving}>{saving ? "Waa la kaydinayaa..." : "Kaydi Waalidka"}</button>
          </div>
        </form>
      )}

      <div className="flex flex-wrap gap-3">
        <input
          className="input-field max-w-xs"
          placeholder="Raadi magaca ama phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="input-field !w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Dhammaan Status</option>
          <option value="paid">Paid</option>
          <option value="partial">Partial</option>
          <option value="unpaid">Unpaid</option>
        </select>
        <select className="input-field !w-auto" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="">Kala Sooc</option>
          <option value="name">Magaca</option>
          <option value="balance_desc">Deynta ugu badan</option>
          <option value="balance_asc">Deynta ugu yar</option>
          <option value="date">Taariikhda</option>
        </select>
      </div>

      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th>ID</th>
              <th>Magaca Waalidka</th>
              <th>Phone</th>
              <th className="text-right">Total Fee</th>
              <th className="text-right">La Bixiyey</th>
              <th className="text-right">Ku Dhiman</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {parents.map((p) => (
              <tr key={p._id}>
                <td>{p.parentId}</td>
                <td>
                  <Link to={`/parents/${p._id}`} className="text-link hover:underline font-medium">
                    {p.fullName}
                  </Link>
                </td>
                <td>{p.phone}</td>
                <td className="text-right">{formatMoney(p.totalFee)}</td>
                <td className="text-right">{formatMoney(p.totalPaid)}</td>
                <td className="text-right">{formatMoney(p.balance)}</td>
                <td><span className={statusBadgeClass(p.feeStatus)}>{statusLabel(p.feeStatus)}</span></td>
                <td className="text-right">
                  <Link to={`/parents/${p._id}?edit=1`} className="text-sm text-link hover:underline">Edit</Link>
                </td>
              </tr>
            ))}
            {parents.length === 0 && (
              <tr><td colSpan={8} className="text-center text-ink/40 py-6">Waalid lama helin.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Parents;
