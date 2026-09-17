import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Wallet, Users, BarChart3, BellRing, User, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const FEATURES = [
  { icon: Wallet, label: "Maareynta Lacagaha" },
  { icon: Users, label: "Diiwaanka Waalidiinta" },
  { icon: BarChart3, label: "Warbixino Live ah" },
  { icon: BellRing, label: "Ogeysiis Deymo" },
];

const Logo = ({ light }) => (
  <div className="flex items-center gap-2.5">
    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center text-white font-serif font-bold text-sm shrink-0 shadow-sm">
      TF
    </div>
    <span className={`font-serif text-lg ${light ? "text-white" : "text-ink"}`}>Taysir Foundation</span>
  </div>
);

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotNote, setForgotNote] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("rememberedUsername");
    if (saved) {
      setUsername(saved);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      if (rememberMe) localStorage.setItem("rememberedUsername", username);
      else localStorage.removeItem("rememberedUsername");
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login-ku wuu fashilmay.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-paper">
      <div className="hidden md:flex flex-col justify-between bg-gradient-to-br from-navy via-navy-light to-navy-dark p-12 lg:p-16 text-white relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/5" />
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-white/5 -mb-32 -ml-32" />

        <div className="relative">
          <Logo light />

          <span className="inline-block mt-10 px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs font-medium tracking-wide">
            NIDAAMKA MAAREYNTA LACAGAHA DUGSIGA
          </span>

          <h1 className="font-serif text-4xl lg:text-5xl font-bold leading-tight mt-5">
            Maamul, raadraac,
            <br />
            oo si fudud u bixi.
          </h1>

          <div className="grid grid-cols-2 gap-4 mt-10 max-w-md">
            {FEATURES.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <Icon size={17} />
                </span>
                <span className="text-sm text-white/85">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative bg-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-white/70" />
            <span className="flex-1 h-1 rounded-full bg-white/20" />
            <span className="w-2 h-2 rounded-full bg-white/30" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-white/10 rounded-lg p-3 space-y-2">
                <div className="h-2 rounded bg-white/25 w-3/4" />
                <div className="h-2 rounded bg-white/15 w-full" />
                <div className="h-2 rounded bg-white/15 w-2/3" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center gap-4 mb-6 pb-6 border-b border-line md:hidden">
            <Logo />
          </div>
          <div className="hidden md:flex justify-center mb-6 pb-6 border-b border-line">
            <Logo />
          </div>

          <h2 className="font-serif text-2xl">Ku Soo Dhawoow</h2>
          <p className="text-sm text-ink/50 mt-1 mb-6">Gal xisaabtaada si aad u sii wadato.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="bg-danger/10 text-danger text-sm rounded-md px-3 py-2">{error}</div>}
            {forgotNote && (
              <div className="bg-navy/5 text-ink/70 text-sm rounded-md px-3 py-2">
                Fadlan la xiriir Admin-ka si password-kaaga loo beddelo.
              </div>
            )}

            <div>
              <label className="label-field">Username</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/35" />
                <input
                  className="input-field pl-9"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Geli username-kaaga"
                  autoFocus
                  required
                />
              </div>
            </div>

            <div>
              <label className="label-field">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/35" />
                <input
                  type={showPassword ? "text" : "password"}
                  className="input-field pl-9 pr-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Geli password-kaaga"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/35 hover:text-ink/60"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-ink/70">
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                I xasuuso (Remember Me)
              </label>
              <button type="button" onClick={() => setForgotNote((v) => !v)} className="text-link hover:underline">
                Password ma illowday?
              </button>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Waa la gelayaa..." : "Soo Gal (Log In)"}
            </button>
          </form>

          <p className="text-center text-xs text-ink/40 mt-8">
            © {new Date().getFullYear()} Taysir Foundation
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
