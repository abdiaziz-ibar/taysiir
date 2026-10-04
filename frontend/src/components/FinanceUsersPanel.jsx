import { useEffect, useState } from "react";
import api from "../api/axios";
import ConfirmDeleteModal from "./ConfirmDeleteModal";

const emptyForm = { fullName: "", username: "", password: "" };

// System-admin side of the finance section: who can log in to "Maaliyadda".
// These accounts only open the finance section (payroll + expenses); they can't
// see fees, parents or payments, and the admin can't see finance data with them.
const FinanceUsersPanel = () => {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editError, setEditError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = () => api.get("/finance-users").then((res) => setUsers(res.data));
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.post("/finance-users", form);
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Khalad ayaa dhacay.");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (u) => {
    setEditingId(u._id);
    setEditForm({ fullName: u.fullName, status: u.status, password: "" });
    setEditError("");
  };

  const handleEditSave = async (id) => {
    setEditError("");
    try {
      const { password, ...rest } = editForm;
      await api.put(`/finance-users/${id}`, password ? { ...rest, password } : rest);
      setEditingId(null);
      load();
    } catch (err) {
      setEditError(err.response?.data?.message || "Khalad ayaa dhacay.");
    }
  };

  const handleDelete = async () => {
    await api.delete(`/finance-users/${deleteTarget._id}`);
    setDeleteTarget(null);
    load();
  };

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-serif text-lg">Akoonnada Maaliyadda</h3>
          <p className="text-sm text-ink/50 mt-0.5">
            Waxay galaan qaybta Maaliyadda (mushaharka &amp; qarashaadka) oo kaliya — lacagaha waalidiinta ma arkaan.
          </p>
        </div>
        <button className="btn-secondary text-sm" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Jooji" : "+ Akoon Cusub"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {error && <div className="md:col-span-3 bg-danger/10 text-danger text-sm rounded-md px-3 py-2">{error}</div>}
          <div>
            <label className="label-field">Magaca</label>
            <input required className="input-field" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </div>
          <div>
            <label className="label-field">Username</label>
            <input required className="input-field" autoCapitalize="none" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          </div>
          <div>
            <label className="label-field">Password (ugu yaraan 6 xaraf)</label>
            <input required type="password" minLength={6} className="input-field" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <div className="md:col-span-3">
            <button className="btn-primary" disabled={saving}>{saving ? "Waa la kaydinayaa..." : "Kaydi Akoonka"}</button>
          </div>
        </form>
      )}

      {editError && <div className="bg-danger/10 text-danger text-sm rounded-md px-3 py-2">{editError}</div>}

      <div className="overflow-x-auto">
        <table className="table-base">
          <thead><tr><th>Magaca</th><th>Username</th><th>Xaalad</th><th></th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                {editingId === u._id ? (
                  <>
                    <td>
                      <input className="input-field" value={editForm.fullName} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} />
                      <input
                        type="password"
                        className="input-field mt-2"
                        placeholder="Password cusub (ka tag madhan haddii aadan beddelayn)"
                        value={editForm.password}
                        onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                      />
                    </td>
                    <td>{u.username}</td>
                    <td>
                      <select className="input-field" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </td>
                    <td className="text-right whitespace-nowrap">
                      <button onClick={() => handleEditSave(u._id)} className="text-sm text-success hover:underline mr-3">Kaydi</button>
                      <button onClick={() => setEditingId(null)} className="text-sm text-ink/60 hover:underline">Jooji</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{u.fullName}</td>
                    <td>{u.username}</td>
                    <td><span className={u.status === "active" ? "badge badge-paid" : "badge badge-unpaid"}>{u.status === "active" ? "Active" : "Inactive"}</span></td>
                    <td className="text-right whitespace-nowrap">
                      <button onClick={() => startEdit(u)} className="text-sm text-link hover:underline mr-3">Edit</button>
                      <button onClick={() => setDeleteTarget(u)} className="text-sm text-danger hover:underline">Tirtir</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={4} className="text-center text-ink/40 py-6">Weli akoon Maaliyadda ah lama abuurin.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDeleteModal
        open={!!deleteTarget}
        title="Tirtir Akoonka Maaliyadda?"
        message={deleteTarget ? `Waxaad tirtirayaa ${deleteTarget.fullName} (${deleteTarget.username}). Ma awoodo mar dambe inuu soo galo qaybta Maaliyadda. Diiwaannadiisii hore way hadhayaan.` : ""}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default FinanceUsersPanel;
