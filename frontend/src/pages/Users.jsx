import { useEffect, useState } from "react";
import api from "../api/axios";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";

const emptyForm = { fullName: "", username: "", email: "", password: "", role: "staff" };

const Users = () => {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editError, setEditError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = async () => {
    const res = await api.get("/users");
    setUsers(res.data);
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/users", form);
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Khalad ayaa dhacay.");
    }
  };

  const handleDelete = async () => {
    await api.delete(`/users/${deleteTarget._id}`);
    setDeleteTarget(null);
    load();
  };

  const startEdit = (u) => {
    setEditingId(u._id);
    setEditForm({ fullName: u.fullName, email: u.email || "", role: u.role, status: u.status, password: "" });
    setEditError("");
  };

  const handleEditSave = async (id) => {
    setEditError("");
    try {
      const { password, ...rest } = editForm;
      const payload = password ? { ...rest, password } : rest;
      await api.put(`/users/${id}`, payload);
      setEditingId(null);
      load();
    } catch (err) {
      setEditError(err.response?.data?.message || "Khalad ayaa dhacay.");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-serif">Isticmaalayaasha</h2>
        <button className="btn-primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Jooji" : "+ Isticmaale Cusub"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card grid grid-cols-1 md:grid-cols-2 gap-4">
          {error && <div className="md:col-span-2 bg-danger/10 text-danger text-sm rounded-md px-3 py-2">{error}</div>}
          <div><label className="label-field">Magaca</label><input required className="input-field" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></div>
          <div><label className="label-field">Username</label><input required className="input-field" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></div>
          <div><label className="label-field">Email (ikhtiyaari)</label><input className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><label className="label-field">Password</label><input type="password" required className="input-field" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
          <div>
            <label className="label-field">Role</label>
            <select className="input-field" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="md:col-span-2"><button className="btn-primary">Kaydi Isticmaalaha</button></div>
        </form>
      )}

      {editError && <div className="bg-danger/10 text-danger text-sm rounded-md px-3 py-2">{editError}</div>}

      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead><tr><th>Magaca</th><th>Username</th><th>Role</th><th>Xaalad</th><th></th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                {editingId === u._id ? (
                  <>
                    <td><input className="input-field" value={editForm.fullName} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} /></td>
                    <td>{u.username}</td>
                    <td>
                      <select className="input-field" value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}>
                        <option value="staff">Staff</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
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
                    <td className="capitalize">{u.role}</td>
                    <td className="capitalize">{u.status}</td>
                    <td className="text-right whitespace-nowrap">
                      <button onClick={() => startEdit(u)} className="text-sm text-link hover:underline mr-3">Edit</button>
                      {u.username !== "admin" && (
                        <button onClick={() => setDeleteTarget(u)} className="text-sm text-danger hover:underline">Tirtir</button>
                      )}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDeleteModal
        open={!!deleteTarget}
        title="Tirtir Isticmaalaha?"
        message={deleteTarget ? `Waxaad tirtirayaa ${deleteTarget.fullName} (${deleteTarget.username}). Ma awoodo mar dambe inuu soo galo system-ka — lama soo celin karo.` : ""}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default Users;
