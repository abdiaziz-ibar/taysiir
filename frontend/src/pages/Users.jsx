import { useEffect, useState } from "react";
import api from "../api/axios";

const emptyForm = { fullName: "", username: "", email: "", password: "", role: "staff" };

const Users = () => {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

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

  const handleDelete = async (id) => {
    if (!confirm("Ma hubtaa inaad tirtirto isticmaalahan?")) return;
    await api.delete(`/users/${id}`);
    load();
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

      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead><tr><th>Magaca</th><th>Username</th><th>Role</th><th>Xaalad</th><th></th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                <td>{u.fullName}</td>
                <td>{u.username}</td>
                <td className="capitalize">{u.role}</td>
                <td className="capitalize">{u.status}</td>
                <td className="text-right"><button onClick={() => handleDelete(u._id)} className="text-sm text-danger hover:underline">Tirtir</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Users;
