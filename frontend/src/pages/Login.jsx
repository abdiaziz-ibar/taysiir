import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const expired = searchParams.get("expired") === "1";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login-ku wuu fashilmay.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-dark px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-serif text-2xl text-white">Taysir Foundation</h1>
          <p className="text-white/50 text-sm mt-1">Parent Fee &amp; Debt Management</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-surface rounded-md p-6 space-y-4 shadow-xl">
          {expired && !error && (
            <div className="bg-amber/10 text-amber text-sm rounded-md px-3 py-2">
              Session-kaagii wuu dhacay shaqo la'aan awgeed. Fadlan markale is soo diiwaan geli.
            </div>
          )}
          {error && (
            <div className="bg-danger/10 text-danger text-sm rounded-md px-3 py-2">{error}</div>
          )}
          <div>
            <label className="label-field">Username</label>
            <input
              className="input-field"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div>
            <label className="label-field">Password</label>
            <input
              type="password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Waa la gelayaa..." : "Soo Gal (Login)"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
