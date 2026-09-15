import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import parentApi from "../../api/parentAxios";

const ParentPortalLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await parentApi.post("/parent-portal/request-otp", { email });
      navigate("/portal/verify", { state: { email } });
    } catch (err) {
      setError(err.response?.data?.message || "Khalad ayaa dhacay.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-dark px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-serif text-2xl text-white">Taysir Foundation</h1>
          <p className="text-white/50 text-sm mt-1">Xisaabta Waalidka — Soo Gal</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-surface rounded-md p-6 space-y-4 shadow-xl">
          {error && <div className="bg-danger/10 text-danger text-sm rounded-md px-3 py-2">{error}</div>}
          <div>
            <label className="label-field">Email</label>
            <input
              type="email"
              className="input-field"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Waa la diraayaa..." : "Dir OTP"}
          </button>
          <p className="text-center text-sm text-ink/60">
            Aan is-diiwaan gelin weli?{" "}
            <Link to="/portal/register" className="text-link hover:underline">Is-diiwaan Geli</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default ParentPortalLogin;
