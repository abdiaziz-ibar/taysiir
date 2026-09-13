import { NavLink } from "react-router-dom";
import { useState } from "react";

const linkBase =
  "flex items-center gap-3 px-4 py-2.5 rounded-md text-sm transition-colors";
const linkActive = "bg-navy text-white";
const linkInactive = "text-white/75 hover:bg-white/10 hover:text-white";

const NavItem = ({ to, children, end }) => (
  <NavLink
    to={to}
    end={end}
    className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
  >
    {children}
  </NavLink>
);

const Sidebar = () => {
  const [reportsOpen, setReportsOpen] = useState(true);

  return (
    <aside className="w-64 bg-navy-dark min-h-screen flex flex-col shrink-0">
      <div className="px-5 py-6 border-b border-white/10">
        <h1 className="text-white font-serif text-lg leading-tight">
          Maamulka Lacagta
        </h1>
        <p className="text-white/50 text-xs mt-0.5">Waalidiinta &amp; Deynta</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <NavItem to="/dashboard" end>Dashboard</NavItem>
        <NavItem to="/parents">Waalidiinta</NavItem>
        <NavItem to="/fees">Lacagaha School-ka</NavItem>
        <NavItem to="/payments">Lacag Bixinta</NavItem>
        <NavItem to="/debts">Deymaha</NavItem>

        <button
          onClick={() => setReportsOpen((o) => !o)}
          className={`${linkBase} ${linkInactive} w-full justify-between`}
        >
          <span>Warbixinnada</span>
          <span className="text-xs">{reportsOpen ? "▾" : "▸"}</span>
        </button>
        {reportsOpen && (
          <div className="pl-4 space-y-1">
            <NavItem to="/reports/monthly">Warbixin Bille</NavItem>
            <NavItem to="/reports/yearly">Warbixin Sanad Dugsiyeed</NavItem>
            <NavItem to="/reports/debts">Warbixinta Deymaha</NavItem>
          </div>
        )}

        <NavItem to="/academic-years">Sanad Dugsiyeedka</NavItem>
        <NavItem to="/users">Isticmaalayaasha</NavItem>
        <NavItem to="/settings">Dejinta</NavItem>
      </nav>
    </aside>
  );
};

export default Sidebar;
