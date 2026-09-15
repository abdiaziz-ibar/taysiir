import { Menu } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useAcademicYear } from "../context/AcademicYearContext";

const Topbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const { years, selectedYearId, setSelectedYearId } = useAcademicYear();

  return (
    <header className="bg-surface border border-line rounded-full shadow-sm mx-2 mt-2 md:mx-4 md:mt-4 px-3 md:px-6 py-2 md:py-3 flex items-center justify-between gap-2 print:hidden print:m-0 print:rounded-none print:border-0 print:shadow-none">
      <div className="flex items-center gap-2 md:gap-3 min-w-0">
        <button onClick={onMenuClick} className="md:hidden text-ink/70 hover:text-ink shrink-0 p-1">
          <Menu size={20} />
        </button>
        <label className="text-sm text-ink/60 hidden sm:inline shrink-0">Sanad Dugsiyeed:</label>
        <select
          className="input-field !w-auto !rounded-full py-1.5 text-sm min-w-0"
          value={selectedYearId || ""}
          onChange={(e) => setSelectedYearId(e.target.value)}
        >
          {years.map((y) => (
            <option key={y._id} value={y._id}>
              {y.name} {y.isActive ? "(Firfircoon)" : ""}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2 md:gap-4 shrink-0">
        <span className="text-sm text-ink/70 hidden sm:inline truncate max-w-[120px]">{user?.fullName}</span>
        <button
          onClick={logout}
          className="text-sm text-danger border border-line rounded-full px-3 py-1.5 hover:bg-paper transition-colors"
        >
          Ka Bax
        </button>
      </div>
    </header>
  );
};

export default Topbar;
