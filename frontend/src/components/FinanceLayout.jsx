import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Menu, X, ReceiptText, PiggyBank, KeyRound } from "lucide-react";
import financeApi from "../api/financeAxios";
import ChangePasswordModal from "../pages/portal/ChangePasswordModal";

const linkBase = "flex items-center gap-3 px-4 py-2.5 rounded-md text-sm transition-colors";

const NavItem = ({ to, icon: Icon, children, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) => `${linkBase} ${isActive ? "bg-navy text-white" : "text-white/75 hover:bg-white/10 hover:text-white"}`}
  >
    <Icon size={17} className="shrink-0" />
    <span>{children}</span>
  </NavLink>
);

// The finance section's own shell: separate from the fees system's Layout, with only
// finance pages, and no school-year selector (it has nothing to do with fees).
const FinanceLayout = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const finance = (() => {
    try {
      return JSON.parse(localStorage.getItem("finance") || "null");
    } catch {
      return null;
    }
  })();

  const logout = () => {
    localStorage.removeItem("financeToken");
    localStorage.removeItem("finance");
    navigate("/login?as=finance", { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-paper">
      {open && <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setOpen(false)} />}

      <aside
        className={`w-64 bg-gradient-to-b from-navy via-navy-light to-navy-dark flex flex-col shrink-0 fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 md:relative md:translate-x-0 md:z-auto overflow-hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="relative px-5 py-6 border-b border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center text-white font-serif font-bold text-sm shrink-0 shadow-sm">
            TF
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-white font-serif text-lg leading-tight truncate">Taysir Foundation</h1>
            <p className="text-white/50 text-xs mt-0.5 truncate">Maaliyadda</p>
          </div>
          <button onClick={() => setOpen(false)} className="md:hidden text-white/60 hover:text-white shrink-0">
            <X size={20} />
          </button>
        </div>
        <nav className="relative flex-1 px-3 py-4 space-y-1">
          <NavItem to="/finance/expenses" icon={ReceiptText} onClick={() => setOpen(false)}>Qarashaadka &amp; Mushaharka</NavItem>
          <NavItem to="/finance/report" icon={PiggyBank} onClick={() => setOpen(false)}>Warbixinta Maaliyadda</NavItem>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-surface border border-line rounded-full shadow-sm mx-2 mt-2 md:mx-4 md:mt-4 px-3 md:px-6 py-2 md:py-3 flex items-center justify-between gap-2">
          <button onClick={() => setOpen(true)} className="md:hidden text-ink/70 hover:text-ink shrink-0 p-1">
            <Menu size={20} />
          </button>
          <span className="text-sm text-ink/60 hidden md:inline">Qaybta Maaliyadda</span>
          <div className="flex items-center gap-2 md:gap-3 ml-auto shrink-0">
            <span className="text-sm text-ink/70 hidden sm:inline truncate max-w-[140px]">{finance?.fullName}</span>
            <button
              onClick={() => setShowPassword(true)}
              className="text-sm text-ink/70 border border-line rounded-full px-3 py-1.5 hover:bg-paper transition-colors inline-flex items-center gap-1.5"
            >
              <KeyRound size={14} /> Password
            </button>
            <button onClick={logout} className="text-sm text-danger border border-line rounded-full px-3 py-1.5 hover:bg-paper transition-colors">
              Ka Bax
            </button>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      <ChangePasswordModal open={showPassword} onClose={() => setShowPassword(false)} api={financeApi} path="/finance-auth/change-password" />
    </div>
  );
};

export default FinanceLayout;
