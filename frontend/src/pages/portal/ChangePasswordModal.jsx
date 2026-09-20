import { useState } from "react";
import { KeyRound } from "lucide-react";
import parentApi from "../../api/parentAxios";

const emptyForm = { currentPassword: "", newPassword: "", confirmPassword: "" };

const ChangePasswordModal = ({ open, onClose }) => {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const handleClose = () => {
    setForm(emptyForm);
    setError("");
    setDone(false);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.newPassword !== form.confirmPassword) {
      setError("Labada password ee cusub iskuma eka.");
      return;
    }
    setSaving(true);
    try {
      await parentApi.post("/parent-portal/change-password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || "Khalad ayaa dhacay.");
    } finally {
      setSaving(false);
    }
  };

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50" onClick={handleClose}>
      <div className="card max-w-sm w-full space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-full bg-navy/10 flex items-center justify-center shrink-0">
            <KeyRound size={20} className="text-navy" />
          </span>
          <h3 className="font-serif text-lg">Beddel Password</h3>
        </div>

        {done ? (
          <div className="space-y-4">
            <div className="bg-success/10 text-success text-sm rounded-md px-3 py-2">Password-ka waa la beddelay.</div>
            <button className="btn-primary w-full" onClick={handleClose}>Xir</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            {error && <div className="bg-danger/10 text-danger text-sm rounded-md px-3 py-2">{error}</div>}
            <div>
              <label className="label-field">Password-ka hadda jira</label>
              <input type="password" autoFocus required className="input-field" value={form.currentPassword} onChange={set("currentPassword")} />
            </div>
            <div>
              <label className="label-field">Password cusub (ugu yaraan 6 xaraf)</label>
              <input type="password" required minLength={6} className="input-field" value={form.newPassword} onChange={set("newPassword")} />
            </div>
            <div>
              <label className="label-field">Xaqiiji password cusub</label>
              <input type="password" required minLength={6} className="input-field" value={form.confirmPassword} onChange={set("confirmPassword")} />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" className="btn-secondary text-sm" onClick={handleClose} disabled={saving}>Jooji</button>
              <button type="submit" className="btn-primary text-sm" disabled={saving}>
                {saving ? "Waa la kaydinayaa..." : "Kaydi"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ChangePasswordModal;
