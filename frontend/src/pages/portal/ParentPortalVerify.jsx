import { useState } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import parentApi from "../../api/parentAxios";

const ParentPortalVerify = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState("");

  if (!email) return <Navigate to="/portal/login" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await parentApi.post("/parent-portal/verify-otp", { email, otp });
      localStorage.setItem("parentToken", res.data.token);
      localStorage.setItem("parent", JSON.stringify(res.data.parent));
      navigate("/portal/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Khalad ayaa dhacay.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setMessage("");
    setResending(true);
    try {
      await parentApi.post("/parent-portal/request-otp", { email });
      setMessage("OTP cusub waa loo diray.");
    } catch (err) {
      setError(err.response?.data?.message || "Khalad ayaa dhacay.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-dark px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-serif text-2xl text-white">Taysir Foundation</h1>
          <p className="text-white/50 text-sm mt-1">Geli koodhka (OTP) loo diray {email}</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-surface rounded-md p-6 space-y-4 shadow-xl">
          {error && <div className="bg-danger/10 text-danger text-sm rounded-md px-3 py-2">{error}</div>}
          {message && <div className="bg-success/10 text-success text-sm rounded-md px-3 py-2">{message}</div>}
          <div>
            <label className="label-field">Koodhka OTP</label>
            <input
              className="input-field text-center text-2xl tracking-[0.5em]"
              required
              maxLength={6}
              inputMode="numeric"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              autoFocus
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Waa la xaqiijinayaa..." : "Xaqiiji"}
          </button>
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="w-full text-sm text-link hover:underline text-center"
          >
            {resending ? "Waa la diraayaa..." : "Dib u dir OTP"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ParentPortalVerify;
