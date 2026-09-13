import { useAuth } from "../context/AuthContext";
import { useAcademicYear } from "../context/AcademicYearContext";

const Topbar = () => {
  const { user, logout } = useAuth();
  const { years, selectedYearId, setSelectedYearId } = useAcademicYear();

  return (
    <header className="bg-surface border border-line rounded-full shadow-sm mx-4 mt-4 px-6 py-3 flex items-center justify-between print:hidden print:m-0 print:rounded-none print:border-0 print:shadow-none">
      <div className="flex items-center gap-3">
        <label className="text-sm text-ink/60">Sanad Dugsiyeed:</label>
        <select
          className="input-field !w-auto !rounded-full py-1.5 text-sm"
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
      <div className="flex items-center gap-4">
        <span className="text-sm text-ink/70">{user?.fullName}</span>
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
