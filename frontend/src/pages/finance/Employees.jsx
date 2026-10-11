import { useEffect, useState } from "react";
import api, { verifyFinancePassword } from "../../api/financeAxios";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import { formatMoney } from "../../utils/format";
import { EMPLOYEE_TYPES } from "../../utils/finance";
import { t } from "../../i18n";

const emptyForm = { fullName: "", type: "teacher", position: "", phone: "", monthlySalary: "", notes: "", status: "active", startMonth: "", endMonth: "" };

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
      startMonth: e.startMonth || "",
      endMonth: e.endMonth || "",
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
      setError(t(err.response?.data?.message || "Khalad ayaa dhacay."));
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
          <h2 className="text-2xl font-bold tracking-tight">{t("Shaqaalaha & Macalimiinta")}</h2>
          <p className="text-sm text-ink/50 mt-0.5">
            {employees.length} {t("diiwaan · Mushaharka bishii (Active):")} <span className="text-ink">{formatMoney(payroll)}</span>
          </p>
        </div>
        <button className="btn-primary" onClick={showForm ? closeForm : openNew}>
          {showForm ? t("Jooji") : t("+ Shaqaale Cusub")}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card grid grid-cols-1 md:grid-cols-2 gap-4">
          <h3 className="md:col-span-2 font-serif text-lg">{editingId ? t("Wax Ka Beddel Shaqaalaha") : t("Shaqaale Cusub")}</h3>
          {error && <div className="md:col-span-2 bg-danger/10 text-danger text-sm rounded-md px-3 py-2">{error}</div>}
          <div>
            <label className="label-field">{t("Magaca *")}</label>
            <input required className="input-field" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </div>
          <div>
            <label className="label-field">{t("Nooca *")}</label>
            <select className="input-field" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {Object.entries(EMPLOYEE_TYPES).map(([k, label]) => (
                <option key={k} value={k}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-field">{t("Shaqada / Maaddada (ikhtiyaari)")}</label>
            <input className="input-field" placeholder={t("Tusaale: Macallinka Xisaabta, Waardiye")} value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
          </div>
          <div>
            <label className="label-field">{t("Phone (ikhtiyaari)")}</label>
            <input className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="label-field">{t("Mushaharka Bishii ($) *")}</label>
            <input required type="number" min="0" step="0.01" className="input-field" value={form.monthlySalary} onChange={(e) => setForm({ ...form, monthlySalary: e.target.value })} />
          </div>
          {editingId && (
            <div>
              <label className="label-field">{t("Xaalad")}</label>
              <select className="input-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="active">{t("Active")}</option>
                <option value="inactive">{t("Inactive (shaqada ka tagay)")}</option>
              </select>
            </div>
          )}
          <div>
            <label className="label-field">{t("Bisha uu bilaabay (ikhtiyaari)")}</label>
            <input type="month" className="input-field" value={form.startMonth} onChange={(e) => setForm({ ...form, startMonth: e.target.value })} />
            <p className="text-xs text-ink/50 mt-1">{t("Bilaha ka horreeya ma ku muuqdo mushaharka. Madhan = bilowga.")}</p>
          </div>
          <div>
            <label className="label-field">{t("Bisha ugu dambeysay ee uu shaqeeyay (ikhtiyaari)")}</label>
            <input type="month" className="input-field" value={form.endMonth} onChange={(e) => setForm({ ...form, endMonth: e.target.value })} />
            <p className="text-xs text-ink/50 mt-1">{t("Bisha ka dambeysa ma ku muuqdo mushaharka; bisha laftiisa waa ku jirtaa. Madhan = wali wuu shaqeeyaa.")}</p>
          </div>
          <div className="md:col-span-2">
            <label className="label-field">{t("Faallo (ikhtiyaari)")}</label>
            <input className="input-field" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <button className="btn-primary" disabled={saving}>{saving ? t("Waa la kaydinayaa...") : t("Kaydi")}</button>
          </div>
        </form>
      )}

      <div className="card flex flex-wrap gap-3">
        <input className="input-field md:max-w-xs" placeholder={t("Raadi magac, phone ama shaqo...")} value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="input-field md:max-w-[230px]" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">{t("Dhammaan noocyada")}</option>
          {Object.entries(EMPLOYEE_TYPES).map(([k, label]) => (
            <option key={k} value={k}>{label}</option>
          ))}
        </select>
        <select className="input-field md:max-w-[230px]" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">{t("Dhammaan xaaladaha")}</option>
          <option value="active">{t("Active")}</option>
          <option value="inactive">{t("Inactive")}</option>
        </select>
      </div>

      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th>ID</th>
              <th>{t("Magaca")}</th>
              <th>{t("Nooca")}</th>
              <th>{t("Shaqada")}</th>
              <th>{t("Phone")}</th>
              <th className="text-end">{t("Mushahar / Bil")}</th>
              <th>{t("Xaalad")}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {employees.map((e) => (
              <tr key={e._id}>
                <td className="text-ink/60">{e.employeeId}</td>
                <td className="font-medium">
                  {e.fullName}
                  {(e.startMonth || e.endMonth) && (
                    <span className="block text-xs text-ink/50 font-normal">
                      {e.startMonth ? `${t("Laga bilaabo")} ${e.startMonth}` : ""}
                      {e.startMonth && e.endMonth ? " · " : ""}
                      {e.endMonth ? `${t("Ilaa")} ${e.endMonth}` : ""}
                    </span>
                  )}
                </td>
                <td><span className={e.type === "teacher" ? "badge bg-navy/10 text-navy" : "badge bg-amber/10 text-amber"}>{EMPLOYEE_TYPES[e.type]}</span></td>
                <td>{e.position || "-"}</td>
                <td>{e.phone || "-"}</td>
                <td className="text-end">{formatMoney(e.monthlySalary)}</td>
                <td><span className={e.status === "active" ? "badge badge-paid" : "badge badge-unpaid"}>{e.status === "active" ? t("Active") : t("Inactive")}</span></td>
                <td className="text-end whitespace-nowrap">
                  <button onClick={() => openEdit(e)} className="text-sm text-link hover:underline me-3">{t("Edit")}</button>
                  <button onClick={() => setDeleteTarget(e)} className="text-sm text-danger hover:underline">{t("Tirtir")}</button>
                </td>
              </tr>
            ))}
            {employees.length === 0 && (
              <tr><td colSpan={8} className="text-center text-ink/40 py-6">{t("Weli shaqaale lama diiwaan gelin.")}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDeleteModal
        open={!!deleteTarget}
        title={t("Tirtir Shaqaalaha?")}
        message={deleteTarget ? t("Waxaad tirtirayaa {name} ({id}). Haddii uu leeyahay mushahar hore loo bixiyey, lama tirtiri karo — ka dhig Inactive.", { name: deleteTarget.fullName, id: deleteTarget.employeeId }) : ""}
        verify={verifyFinancePassword}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default Employees;
