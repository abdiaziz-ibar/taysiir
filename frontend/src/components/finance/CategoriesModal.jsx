import { useState } from "react";
import { X, Pencil, Trash2, RotateCcw } from "lucide-react";
import api, { verifyFinancePassword } from "../../api/financeAxios";
import ConfirmDeleteModal from "../ConfirmDeleteModal";
import { t } from "../../i18n";

// Add, rename and remove the expense types. Renaming changes the type on every past expense too;
// a type that has history is only hidden (so old months keep their entries), an unused one is deleted.
const CategoriesModal = ({ open, categories, onClose, onChanged }) => {
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  if (!open) return null;

  const run = async (fn) => {
    setError("");
    setBusy(true);
    try {
      await fn();
      await onChanged();
    } catch (err) {
      setError(t(err.response?.data?.message || "Khalad ayaa dhacay."));
    } finally {
      setBusy(false);
    }
  };

  const add = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    run(async () => {
      await api.post("/expense-categories", { name: newName });
      setNewName("");
    });
  };

  const rename = (c) =>
    run(async () => {
      await api.put(`/expense-categories/${c._id}`, { name: editName });
      setEditingId(null);
    });

  const restore = (c) => run(() => api.put(`/expense-categories/${c._id}`, { isActive: true }));

  const remove = async () => {
    await api.delete(`/expense-categories/${deleteTarget._id}`);
    setDeleteTarget(null);
    await onChanged();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="card max-w-lg w-full max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-serif text-lg">{t("Maamul Noocyada Qarashaadka")}</h3>
          <button onClick={onClose} className="text-ink/50 hover:text-ink"><X size={18} /></button>
        </div>

        {error && <div className="bg-danger/10 text-danger text-sm rounded-md px-3 py-2 mb-3">{error}</div>}

        <form onSubmit={add} className="flex gap-2 mb-4">
          <input className="input-field" placeholder={t("Magaca nooca cusub...")} value={newName} onChange={(e) => setNewName(e.target.value)} />
          <button className="btn-primary text-sm whitespace-nowrap" disabled={busy || !newName.trim()}>{t("Ku dar")}</button>
        </form>

        <div className="overflow-y-auto divide-y divide-line -mx-1 px-1">
          {(categories || []).map((c) => (
            <div key={c._id} className={`flex items-center gap-2 py-2 ${c.isActive ? "" : "opacity-50"}`}>
              {editingId === c._id ? (
                <>
                  <input className="input-field !py-1.5" autoFocus value={editName} onChange={(e) => setEditName(e.target.value)} />
                  <button className="btn-primary !px-3 !py-1.5 text-sm" disabled={busy || !editName.trim()} onClick={() => rename(c)}>{t("Kaydi")}</button>
                  <button className="btn-secondary !px-3 !py-1.5 text-sm" onClick={() => setEditingId(null)}>{t("Jooji")}</button>
                </>
              ) : (
                <>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">{t(c.name)}</span>
                    <span className="text-xs text-ink/50 ms-2">
                      {c.builtIn ? t("Aasaasi") : c.isActive ? (c.used > 0 ? t("{count} kharash", { count: c.used }) : "") : t("La qariyey")}
                    </span>
                  </div>
                  {!c.builtIn && c.isActive && (
                    <>
                      <button className="text-link hover:underline text-sm inline-flex items-center gap-1" onClick={() => { setEditingId(c._id); setEditName(c.name); setError(""); }}>
                        <Pencil size={13} /> {t("Edit")}
                      </button>
                      <button className="text-danger hover:underline text-sm inline-flex items-center gap-1" onClick={() => setDeleteTarget(c)}>
                        <Trash2 size={13} /> {t("Tirtir")}
                      </button>
                    </>
                  )}
                  {!c.builtIn && !c.isActive && (
                    <button className="text-link hover:underline text-sm inline-flex items-center gap-1" onClick={() => restore(c)}>
                      <RotateCcw size={13} /> {t("Soo celi")}
                    </button>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-ink/50 mt-3">
          {t("Magaca marka la beddelo, kharashyadii hore ee nooca isticmaalay sidoo kale way isbeddelayaan. Nooc leh kharash hore marka la tirtiro waa la qariyaa (kharashyada hore way hadhayaan).")}
        </p>
      </div>

      <div onClick={(e) => e.stopPropagation()}>
        <ConfirmDeleteModal
          open={!!deleteTarget}
          title={t("Tirtir Nooca?")}
          message={deleteTarget ? (deleteTarget.used > 0 ? t("\"{name}\" wuxuu ka baxayaa liiska (waa la qarinayaa); {count} kharash oo hore ayaa hadhaya.", { name: deleteTarget.name, count: deleteTarget.used }) : t("\"{name}\" waa la tirtirayaa.", { name: deleteTarget.name })) : ""}
          verify={verifyFinancePassword}
          onConfirm={remove}
          onClose={() => setDeleteTarget(null)}
        />
      </div>
    </div>
  );
};

export default CategoriesModal;
