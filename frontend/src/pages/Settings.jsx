import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

const Settings = () => {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (password !== confirm) {
      setError("Password-yadu ma isku mid aha.");
      return;
    }
    try {
      await api.post("/auth/change-password", { currentPassword, newPassword: password });
      setMessage("Password-ka waa la beddelay.");
      setCurrentPassword("");
      setPassword("");
      setConfirm("");
    } catch (err) {
      setError(err.response?.data?.message || "Khalad ayaa dhacay.");
    }
  };

  return (
    <div className="max-w-md space-y-5">
      <h2 className="text-xl font-serif">Dejinta (Settings)</h2>

      <div className="card space-y-1">
        <p className="text-sm text-ink/50">Magaca</p>
        <p>{user?.fullName}</p>
        <p className="text-sm text-ink/50 mt-2">Username</p>
        <p>{user?.username}</p>
        <p className="text-sm text-ink/50 mt-2">Role</p>
        <p className="capitalize">{user?.role}</p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <h3 className="font-serif">Beddel Password</h3>
        {message && <div className="bg-success/10 text-success text-sm rounded-md px-3 py-2">{message}</div>}
        {error && <div className="bg-danger/10 text-danger text-sm rounded-md px-3 py-2">{error}</div>}
        <div><label className="label-field">Password-ka Hadda Jira</label><input type="password" required className="input-field" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} /></div>
        <div><label className="label-field">Password Cusub</label><input type="password" required className="input-field" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        <div><label className="label-field">Xaqiiji Password</label><input type="password" required className="input-field" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></div>
        <button className="btn-primary">Kaydi</button>
      </form>
    </div>
  );
};

export default Settings;
