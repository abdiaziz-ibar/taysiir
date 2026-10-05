import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Wallet, Users, BarChart3, BellRing, User, Lock, Eye, EyeOff, Phone } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import parentApi from "../api/parentAxios";
import financeApi from "../api/financeAxios";
import LanguageSwitcher from "../i18n/LanguageSwitcher";
import { t } from "../i18n";

const FEATURES = [
  { icon: Wallet, label: "Fee Management" },
  { icon: Users, label: "Parent Records" },
  { icon: BarChart3, label: "Live Reports" },
  { icon: BellRing, label: "Debt Alerts" },
];

const Logo = ({ light }) => (
  <div className="flex items-center gap-2.5">
    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center text-white font-serif font-bold text-sm shrink-0 shadow-sm">
      TF
    </div>
    <span className={`font-serif text-lg ${light ? "text-white" : "text-ink"}`}>Taysir Foundation</span>
  </div>
);

// Username + password login, shared by System Users and the finance section;
// each supplies its own login call and where to go afterwards.
const UsernameLoginForm = ({ doLogin, redirectTo, rememberKey }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotNote, setForgotNote] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(rememberKey);
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
      await doLogin(username, password);
      if (rememberMe) localStorage.setItem(rememberKey, username);
      else localStorage.removeItem(rememberKey);
      navigate(redirectTo);
    } catch (err) {
      setError(t(err.response?.data?.message || "Login-ku wuu fashilmay."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="bg-danger/10 text-danger text-sm rounded-md px-3 py-2">{error}</div>}
      {forgotNote && (
        <div className="bg-navy/5 text-ink/70 text-sm rounded-md px-3 py-2">
          {t("Fadlan la xiriir Admin-ka si password-kaaga loo beddelo.")}
        </div>
      )}

      <div>
        <label className="label-field">{t("Username")}</label>
        <div className="relative">
          <User size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-ink/35" />
          <input
            className="input-field ps-9"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={t("Geli username-kaaga")}
            autoFocus
            required
          />
        </div>
      </div>

      <div>
        <label className="label-field">{t("Password")}</label>
        <div className="relative">
          <Lock size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-ink/35" />
          <input
            type={showPassword ? "text" : "password"}
            className="input-field ps-9 pe-9"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("Geli password-kaaga")}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute end-3 top-1/2 -translate-y-1/2 text-ink/35 hover:text-ink/60"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2 text-ink/70">
          <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
          {t("I xasuuso (Remember Me)")}
        </label>
        <button type="button" onClick={() => setForgotNote((v) => !v)} className="text-link hover:underline">
          {t("Password ma illowday?")}
        </button>
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? t("Waa la gelayaa...") : t("Soo Gal (Log In)")}
      </button>
    </form>
  );
};

const StaffLoginForm = () => {
  const { login } = useAuth();
  return <UsernameLoginForm doLogin={login} redirectTo="/dashboard" rememberKey="rememberedUsername" />;
};

const financeLogin = async (username, password) => {
  const res = await financeApi.post("/finance-auth/login", { username, password });
  localStorage.setItem("financeToken", res.data.token);
  localStorage.setItem("finance", JSON.stringify(res.data.user));
};

const FinanceLoginForm = () => (
  <UsernameLoginForm doLogin={financeLogin} redirectTo="/finance" rememberKey="rememberedFinanceUsername" />
);

const ParentLoginForm = () => {
  const navigate = useNavigate();
  const [parentMode, setParentMode] = useState("login");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (parentMode === "register" && password !== confirmPassword) {
      setError(t("Labada password iskuma eka."));
      return;
    }

    setLoading(true);
    try {
      const endpoint = parentMode === "register" ? "/parent-portal/register" : "/parent-portal/login";
      const res = await parentApi.post(endpoint, { phone, password });
      localStorage.setItem("parentToken", res.data.token);
      localStorage.setItem("parent", JSON.stringify(res.data.parent));
      navigate("/portal/dashboard");
    } catch (err) {
      setError(t(err.response?.data?.message || "Khalad ayaa dhacay."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 text-sm">
        <button
          type="button"
          onClick={() => { setParentMode("login"); setError(""); }}
          className={`flex-1 py-1.5 rounded-full transition-colors ${parentMode === "login" ? "bg-navy text-white" : "text-ink/60 hover:bg-paper"}`}
        >
          {t("Soo Gal")}
        </button>
        <button
          type="button"
          onClick={() => { setParentMode("register"); setError(""); }}
          className={`flex-1 py-1.5 rounded-full transition-colors ${parentMode === "register" ? "bg-navy text-white" : "text-ink/60 hover:bg-paper"}`}
        >
          {t("Marka Koowaad")}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="bg-danger/10 text-danger text-sm rounded-md px-3 py-2">{error}</div>}
        {parentMode === "register" && (
          <div className="bg-navy/5 text-ink/70 text-sm rounded-md px-3 py-2">
            {t("Waxaad dhigaysaa password aad isticmaali doonto marar dambe. Lambarkaagu waa inuu horey ugu jiraa nidaamka (maamulka dugsigu waa uu diiwaan geliyay).")}
          </div>
        )}

        <div>
          <label className="label-field">{t("Lambarka Telefoonka")}</label>
          <div className="relative">
            <Phone size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-ink/35" />
            <input
              className="input-field ps-9"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t("Lambarka aad dugsiga ku siisay")}
              autoFocus
              required
            />
          </div>
        </div>

        <div>
          <label className="label-field">{parentMode === "register" ? t("Samee Password") : t("Password")}</label>
          <div className="relative">
            <Lock size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-ink/35" />
            <input
              type={showPassword ? "text" : "password"}
              className="input-field ps-9 pe-9"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("Geli password-kaaga")}
              minLength={6}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-ink/35 hover:text-ink/60"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {parentMode === "register" && (
          <div>
            <label className="label-field">{t("Xaqiiji Password")}</label>
            <div className="relative">
              <Lock size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-ink/35" />
              <input
                type={showPassword ? "text" : "password"}
                className="input-field ps-9"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t("Mar labaad geli password-ka")}
                minLength={6}
                required
              />
            </div>
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? t("Waa la gelayaa...") : parentMode === "register" ? t("Samee Xisaab") : t("Soo Gal")}
        </button>
      </form>
    </div>
  );
};

const Login = () => {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState(["parent", "finance"].includes(searchParams.get("as")) ? searchParams.get("as") : "staff");
  const expired = searchParams.get("expired") === "1";

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-paper">
      <div className="hidden md:flex flex-col justify-between bg-gradient-to-br from-navy via-navy-light to-navy-dark p-12 lg:p-16 text-white relative overflow-hidden">
        <div className="absolute -top-24 -end-24 w-72 h-72 rounded-full bg-white/5" />
        <div className="absolute bottom-0 start-0 w-96 h-96 rounded-full bg-white/5 -mb-32 -ms-32" />

        <div className="relative">
          <Logo light />

          <span className="inline-block mt-10 px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs font-medium tracking-wide">
            {t("SCHOOL FEE MANAGEMENT SYSTEM")}
          </span>

          <h1 className="font-serif text-4xl lg:text-5xl font-bold leading-tight mt-5">
            {t("Manage, track,")}
            <br />
            {t("and collect with ease.")}
          </h1>

          <div className="grid grid-cols-2 gap-4 mt-10 max-w-md">
            {FEATURES.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <Icon size={17} />
                </span>
                <span className="text-sm text-white/85">{t(label)}</span>
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
          <div className="flex justify-end mb-4">
            <LanguageSwitcher />
          </div>
          <div className="flex flex-col items-center gap-4 mb-6 pb-6 border-b border-line md:hidden">
            <Logo />
          </div>
          <div className="hidden md:flex justify-center mb-6 pb-6 border-b border-line">
            <Logo />
          </div>

          <div className="flex gap-2 bg-paper rounded-full p-1 mb-6">
            <button
              type="button"
              onClick={() => setMode("staff")}
              className={`flex-1 py-2 rounded-full text-sm font-medium transition-colors ${mode === "staff" ? "bg-surface shadow-sm text-ink" : "text-ink/50 hover:text-ink"}`}
            >
              {t("System Users")}
            </button>
            <button
              type="button"
              onClick={() => setMode("parent")}
              className={`flex-1 py-2 rounded-full text-sm font-medium transition-colors ${mode === "parent" ? "bg-surface shadow-sm text-ink" : "text-ink/50 hover:text-ink"}`}
            >
              {t("Parents")}
            </button>
            <button
              type="button"
              onClick={() => setMode("finance")}
              className={`flex-1 py-2 rounded-full text-sm font-medium transition-colors ${mode === "finance" ? "bg-surface shadow-sm text-ink" : "text-ink/50 hover:text-ink"}`}
            >
              {t("Maaliyadda")}
            </button>
          </div>

          {expired && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
              {t("Waqti aad wax ku samayn wayday awgeed, session-kaagii wuu dhacay. Fadlan mar kale soo gal.")}
            </div>
          )}

          <h2 className="font-serif text-2xl">{t("Ku Soo Dhawoow")}</h2>
          <p className="text-sm text-ink/50 mt-1 mb-6">
            {mode === "staff"
              ? t("Gal xisaabtaada si aad u sii wadato.")
              : mode === "finance"
                ? t("Gal xisaabta Maaliyadda (mushaharka iyo qarashaadka).")
                : t("Gal xisaabta waalidnimo si aad u aragto lacagtaada.")}
          </p>

          {mode === "staff" ? <StaffLoginForm /> : mode === "finance" ? <FinanceLoginForm /> : <ParentLoginForm />}

          <p className="text-center text-xs text-ink/40 mt-8">
            © {new Date().getFullYear()} Taysir Foundation
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
