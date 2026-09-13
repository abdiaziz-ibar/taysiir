import { useAuth } from "../context/AuthContext";
import { useAcademicYear } from "../context/AcademicYearContext";

const Topbar = () => {
  const { user, logout } = useAuth();
  const { years, selectedYearId, setSelectedYearId } = useAcademicYear();

  return (
    <header className="bg-surface border-b border-line px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <label className="text-sm text-ink/60">Sanad Dugsiyeed:</label>
        <select
          className="input-field !w-auto py-1.5 text-sm"
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
        <button onClick={logout} className="text-sm text-danger hover:underline">
          Ka Bax
        </button>
      </div>
    </header>
  );
};

export default Topbar;
