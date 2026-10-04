import { useEffect, useState } from "react";
import api from "../api/axios";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import { formatMoney } from "../utils/format";
import { EMPLOYEE_TYPES } from "../utils/finance";

const emptyForm = { fullName: "", type: "teacher", position: "", phone: "", monthlySalary: "", notes: "", status: "active" };

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = () =>
    api
      .get("/employees", { params: { search: search || undefined, type: type || undefined, status: status || undefined } })
      .then((res) => setEmployees(res.data));

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [search, type, status]);

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setShowForm(true);
  };

  const openEdit = (e) => {
    setEditingId(e._id);
    setForm({
      fullName: e.fullName,
      type: e.type,
      position: e.position || "",
      phone: e.phone || "",
      monthlySalary: String(e.monthlySalary),
      notes: e.notes || "",
      status: e.status,
    });
    setError("");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = { ...form, monthlySalary: Number(form.monthlySalary) };
      if (editingId) await api.put(`/employees/${editingId}`, payload);
      else await api.post("/employees", payload);
      closeForm();
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Khalad ayaa dhacay.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    await api.delete(`/employees/${deleteTarget._id}`);
    setDeleteTarget(null);
    load();
  };

  const payroll = employees.filter((e) => e.status === "active").reduce((s, e) => s + e.monthlySalary, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-serif">Shaqaalaha &amp; Macalimiinta</h2>
          <p className="text-sm text-ink/50 mt-0.5">
            {employees.length} diiwaan · Mushaharka bishii (Active): <span className="text-ink">{formatMoney(payroll)}</span>
          </p>
        </div>
        <button className="btn-primary" onClick={showForm ? closeForm : openNew}>
          {showForm ? "Jooji" : "+ Shaqaale Cusub"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card grid grid-cols-1 md:grid-cols-2 gap-4">
          <h3 className="md:col-span-2 font-serif text-lg">{editingId ? "Wax Ka Beddel Shaqaalaha" : "Shaqaale Cusub"}</h3>
          {error && <div className="md:col-span-2 bg-danger/10 text-danger text-sm rounded-md px-3 py-2">{error}</div>}
          <div>
            <label className="label-field">Magaca *</label>
            <input required className="input-field" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </div>
          <div>
            <label className="label-field">Nooca *</label>
            <select className="input-field" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {Object.entries(EMPLOYEE_TYPES).map(([k, label]) => (
                <option key={k} value={k}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-field">Shaqada / Maaddada (ikhtiyaari)</label>
            <input className="input-field" placeholder="Tusaale: Macallinka Xisaabta, Waardiye" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
          </div>
          <div>
            <label className="label-field">Phone (ikhtiyaari)</label>
            <input className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="label-field">Mushaharka Bishii ($) *</label>
            <input required type="number" min="0" step="0.01" className="input-field" value={form.monthlySalary} onChange={(e) => setForm({ ...form, monthlySalary: e.target.value })} />
          </div>
          {editingId && (
            <div>
              <label className="label-field">Xaalad</label>
              <select className="input-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="active">Active</option>
                <option value="inactive">Inactive (shaqada ka tagay)</option>
              </select>
            </div>
          )}
          <div className="md:col-span-2">
            <label className="label-field">Faallo (ikhtiyaari)</label>
            <input className="input-field" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <button className="btn-primary" disabled={saving}>{saving ? "Waa la kaydinayaa..." : "Kaydi"}</button>
          </div>
        </form>
      )}

      <div className="card flex flex-wrap gap-3">
        <input className="input-field md:max-w-xs" placeholder="Raadi magac, phone ama shaqo..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="input-field md:max-w-[230px]" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">Dhammaan noocyada</option>
          {Object.entries(EMPLOYEE_TYPES).map(([k, label]) => (
            <option key={k} value={k}>{label}</option>
          ))}
        </select>
        <select className="input-field md:max-w-[230px]" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Dhammaan xaaladaha</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th>ID</th>
              <th>Magaca</th>
              <th>Nooca</th>
              <th>Shaqada</th>
              <th>Phone</th>
              <th className="text-right">Mushahar / Bil</th>
              <th>Xaalad</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {employees.map((e) => (
              <tr key={e._id}>
                <td className="text-ink/60">{e.employeeId}</td>
                <td className="font-medium">{e.fullName}</td>
                <td><span className={e.type === "teacher" ? "badge bg-navy/10 text-navy" : "badge bg-amber/10 text-amber"}>{EMPLOYEE_TYPES[e.type]}</span></td>
                <td>{e.position || "-"}</td>
                <td>{e.phone || "-"}</td>
                <td className="text-right">{formatMoney(e.monthlySalary)}</td>
                <td><span className={e.status === "active" ? "badge badge-paid" : "badge badge-unpaid"}>{e.status === "active" ? "Active" : "Inactive"}</span></td>
                <td className="text-right whitespace-nowrap">
                  <button onClick={() => openEdit(e)} className="text-sm text-link hover:underline mr-3">Edit</button>
                  <button onClick={() => setDeleteTarget(e)} className="text-sm text-danger hover:underline">Tirtir</button>
                </td>
              </tr>
            ))}
            {employees.length === 0 && (
              <tr><td colSpan={8} className="text-center text-ink/40 py-6">Weli shaqaale lama diiwaan gelin.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDeleteModal
        open={!!deleteTarget}
        title="Tirtir Shaqaalaha?"
        message={deleteTarget ? `Waxaad tirtirayaa ${deleteTarget.fullName} (${deleteTarget.employeeId}). Haddii uu leeyahay mushahar hore loo bixiyey, lama tirtiri karo — ka dhig Inactive.` : ""}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default Employees;
