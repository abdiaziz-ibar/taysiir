import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import api from "../api/axios";

// Step-up confirmation for irreversible deletes: the admin currently
// logged in must re-type their own password before the delete proceeds.
const ConfirmDeleteModal = ({ open, title, message, onConfirm, onClose }) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  if (!open) return null;

  const reset = () => {
    setPassword("");
    setError("");
    setChecking(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setChecking(true);
    try {
      await api.post("/auth/verify-password", { password });
      reset();
      await onConfirm();
    } catch (err) {
      setChecking(false);
      setError(err.response?.data?.message || "Password-ku waa khalad.");
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50" onClick={handleClose}>
      <div className="card max-w-sm w-full space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3">
          <span className="w-10 h-10 rounded-full bg-danger/10 flex items-center justify-center shrink-0">
            <AlertTriangle size={20} className="text-danger" />
          </span>
          <div>
            <h3 className="font-serif text-lg">{title}</h3>
            <p className="text-sm text-ink/60 mt-1">{message}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {error && <div className="bg-danger/10 text-danger text-sm rounded-md px-3 py-2">{error}</div>}
          <div>
            <label className="label-field">Geli Password-kaaga si aad u xaqiijiso</label>
            <input
              type="password"
              autoFocus
              required
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="btn-secondary text-sm" onClick={handleClose} disabled={checking}>
              Jooji
            </button>
            <button type="submit" className="btn-danger text-sm" disabled={checking}>
              {checking ? "Waa la xaqiijinayaa..." : "Haa, Tirtir"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;
