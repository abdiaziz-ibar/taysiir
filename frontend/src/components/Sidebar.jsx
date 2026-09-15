import { NavLink } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Wallet,
  CreditCard,
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CalendarRange,
  Layers,
  FileWarning,
  GraduationCap,
  UserCog,
  Settings as SettingsIcon,
  ChevronDown,
  ChevronRight,
  X,
} from "lucide-react";

const linkBase =
  "flex items-center gap-3 px-4 py-2.5 rounded-md text-sm transition-colors";
const linkActive = "bg-navy text-white";
const linkInactive = "text-white/75 hover:bg-white/10 hover:text-white";

const NavItem = ({ to, icon: Icon, children, end, onClick }) => (
  <NavLink
    to={to}
    end={end}
    onClick={onClick}
    className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
  >
    {Icon && <Icon size={17} className="shrink-0" />}
    <span>{children}</span>
  </NavLink>
);

const Sidebar = ({ open, onClose }) => {
  const [reportsOpen, setReportsOpen] = useState(true);

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden print:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`w-64 bg-navy-dark flex flex-col shrink-0 print:hidden fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 md:relative md:translate-x-0 md:z-auto ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-5 py-6 border-b border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center text-white font-serif font-bold text-sm shrink-0 shadow-sm">
            TF
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-white font-serif text-lg leading-tight truncate">Taysir Foundation</h1>
            <p className="text-white/50 text-xs mt-0.5 truncate">Parent Fee &amp; Debt Management</p>
          </div>
          <button onClick={onClose} className="md:hidden text-white/60 hover:text-white shrink-0">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <NavItem to="/dashboard" end icon={LayoutDashboard} onClick={onClose}>Dashboard</NavItem>
          <NavItem to="/parents" icon={Users} onClick={onClose}>Waalidiinta</NavItem>
          <NavItem to="/fees" icon={Wallet} onClick={onClose}>Lacagaha School-ka</NavItem>
          <NavItem to="/payments" icon={CreditCard} onClick={onClose}>Lacag Bixinta</NavItem>
          <NavItem to="/debts" icon={AlertTriangle} onClick={onClose}>Deymaha</NavItem>

          <button
            onClick={() => setReportsOpen((o) => !o)}
            className={`${linkBase} ${linkInactive} w-full justify-between`}
          >
            <span className="flex items-center gap-3">
              <BarChart3 size={17} className="shrink-0" />
              Warbixinnada
            </span>
            {reportsOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          </button>
          {reportsOpen && (
            <div className="pl-4 space-y-1">
              <NavItem to="/reports/monthly" icon={CalendarDays} onClick={onClose}>Warbixin Bille</NavItem>
              <NavItem to="/reports/yearly" icon={CalendarRange} onClick={onClose}>Warbixin Sanad Dugsiyeed</NavItem>
              <NavItem to="/reports/all-years" icon={Layers} onClick={onClose}>Dhammaan Sannadaha</NavItem>
              <NavItem to="/reports/debts" icon={FileWarning} onClick={onClose}>Warbixinta Deymaha</NavItem>
            </div>
          )}

          <NavItem to="/academic-years" icon={GraduationCap} onClick={onClose}>Sanad Dugsiyeedka</NavItem>
          <NavItem to="/users" icon={UserCog} onClick={onClose}>Isticmaalayaasha</NavItem>
          <NavItem to="/settings" icon={SettingsIcon} onClick={onClose}>Dejinta</NavItem>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
