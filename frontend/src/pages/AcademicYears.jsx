import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useAcademicYear } from "../context/AcademicYearContext";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import { t } from "../i18n";

const AcademicYears = () => {
  const { user } = useAuth();
  const { refreshYears } = useAcademicYear();
  const [years, setYears] = useState([]);
  const [startYear, setStartYear] = useState("");
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editError, setEditError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = async () => {
    const res = await api.get("/academic-years");
    setYears(res.data);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/academic-years", { startYear: Number(startYear) });
      setStartYear("");
      load();
      refreshYears();
    } catch (err) {
      setError(t(err.response?.data?.message || "Khalad ayaa dhacay."));
    }
  };

  const handleActivate = async (id) => {
    await api.put(`/academic-years/${id}/activate`);
    load();
    refreshYears();
  };

  const handleDeactivate = async (id) => {
    await api.put(`/academic-years/${id}/deactivate`);
    load();
    refreshYears();
  };

  const startEdit = (y) => {
    setEditingId(y._id);
    setEditForm({ name: y.name, startMonth: y.startMonth, endMonth: y.endMonth });
    setEditError("");
  };

  const handleEditSave = async (id) => {
    setEditError("");
    try {
      await api.put(`/academic-years/${id}`, editForm);
      setEditingId(null);
      load();
      refreshYears();
    } catch (err) {
      setEditError(t(err.response?.data?.message || "Khalad ayaa dhacay."));
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/academic-years/${deleteTarget._id}`);
      setDeleteTarget(null);
      load();
      refreshYears();
    } catch (err) {
      alert(t(err.response?.data?.message || "Khalad ayaa dhacay."));
    }
  };

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold tracking-tight">{t("Sanad Dugsiyeedka (Academic Years)")}</h2>

      <form onSubmit={handleCreate} className="card flex items-end gap-3">
        {error && <div className="bg-danger/10 text-danger text-sm rounded-md px-3 py-2">{error}</div>}
        <div>
          <label className="label-field">{t("Sanadka Bilowga (e.g. 2026)")}</label>
          <input type="number" min="2000" max="2100" required className="input-field" value={startYear} onChange={(e) => setStartYear(e.target.value)} />
        </div>
        <button className="btn-primary">{t("+ Samee Sanad Dugsiyeed")}</button>
      </form>

      {editError && <div className="bg-danger/10 text-danger text-sm rounded-md px-3 py-2">{editError}</div>}

      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr><th>{t("Sanad")}</th><th>{t("Bilowga")}</th><th>{t("Dhammaadka")}</th><th>{t("Xaalad")}</th><th></th></tr>
          </thead>
          <tbody>
            {years.map((y) => (
              <tr key={y._id}>
                {editingId === y._id ? (
                  <>
                    <td><input className="input-field" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></td>
                    <td><input className="input-field" value={editForm.startMonth} onChange={(e) => setEditForm({ ...editForm, startMonth: e.target.value })} /></td>
                    <td><input className="input-field" value={editForm.endMonth} onChange={(e) => setEditForm({ ...editForm, endMonth: e.target.value })} /></td>
                    <td>{y.isActive ? <span className="badge badge-paid">{t("Firfircoon")}</span> : <span className="text-ink/40">{t("Aan firfircoon")}</span>}</td>
                    <td className="text-end whitespace-nowrap">
                      <button onClick={() => handleEditSave(y._id)} className="text-sm text-success hover:underline me-3">{t("Kaydi")}</button>
                      <button onClick={() => setEditingId(null)} className="text-sm text-ink/60 hover:underline">{t("Jooji")}</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{y.name}</td>
                    <td>{t(y.startMonth)}</td>
                    <td>{t(y.endMonth)}</td>
                    <td>{y.isActive ? <span className="badge badge-paid">{t("Firfircoon")}</span> : <span className="text-ink/40">{t("Aan firfircoon")}</span>}</td>
                    <td className="text-end whitespace-nowrap">
                      <button onClick={() => startEdit(y)} className="text-sm text-link hover:underline me-3">{t("Edit")}</button>
                      {y.isActive ? (
                        <button onClick={() => handleDeactivate(y._id)} className="text-sm text-danger hover:underline me-3">{t("Deactivate")}</button>
                      ) : (
                        <button onClick={() => handleActivate(y._id)} className="text-sm text-link hover:underline me-3">{t("Activate")}</button>
                      )}
                      {user?.role === "admin" && (
                        <button onClick={() => setDeleteTarget(y)} className="text-sm text-danger hover:underline">{t("Tirtir")}</button>
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
        title={t("Tirtir Sanad Dugsiyeedka?")}
        message={deleteTarget ? t("Waxaad tirtirayaa {name}. Tan waxay sidoo kale tirtiraysaa dhammaan Fee-yada iyo Lacag-bixinnada sanadkan la xidhiidha oo dhan — lama soo celin karo.", { name: deleteTarget.name }) : ""}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default AcademicYears;
