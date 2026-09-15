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
} from "lucide-react";

const linkBase =
  "flex items-center gap-3 px-4 py-2.5 rounded-md text-sm transition-colors";
const linkActive = "bg-navy text-white";
const linkInactive = "text-white/75 hover:bg-white/10 hover:text-white";

const NavItem = ({ to, icon: Icon, children, end }) => (
  <NavLink
    to={to}
    end={end}
    className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
  >
    {Icon && <Icon size={17} className="shrink-0" />}
    <span>{children}</span>
  </NavLink>
);

const Sidebar = () => {
  const [reportsOpen, setReportsOpen] = useState(true);

  return (
    <aside className="w-64 bg-navy-dark min-h-screen flex flex-col shrink-0 print:hidden">
      <div className="px-5 py-6 border-b border-white/10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center text-white font-serif font-bold text-sm shrink-0 shadow-sm">
          TF
        </div>
        <div className="min-w-0">
          <h1 className="text-white font-serif text-lg leading-tight truncate">Taysir Foundation</h1>
          <p className="text-white/50 text-xs mt-0.5 truncate">Parent Fee &amp; Debt Management</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <NavItem to="/dashboard" end icon={LayoutDashboard}>Dashboard</NavItem>
        <NavItem to="/parents" icon={Users}>Waalidiinta</NavItem>
        <NavItem to="/fees" icon={Wallet}>Lacagaha School-ka</NavItem>
        <NavItem to="/payments" icon={CreditCard}>Lacag Bixinta</NavItem>
        <NavItem to="/debts" icon={AlertTriangle}>Deymaha</NavItem>

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
            <NavItem to="/reports/monthly" icon={CalendarDays}>Warbixin Bille</NavItem>
            <NavItem to="/reports/yearly" icon={CalendarRange}>Warbixin Sanad Dugsiyeed</NavItem>
            <NavItem to="/reports/all-years" icon={Layers}>Dhammaan Sannadaha</NavItem>
            <NavItem to="/reports/debts" icon={FileWarning}>Warbixinta Deymaha</NavItem>
          </div>
        )}

        <NavItem to="/academic-years" icon={GraduationCap}>Sanad Dugsiyeedka</NavItem>
        <NavItem to="/users" icon={UserCog}>Isticmaalayaasha</NavItem>
        <NavItem to="/settings" icon={SettingsIcon}>Dejinta</NavItem>
      </nav>
    </aside>
  );
};

export default Sidebar;
