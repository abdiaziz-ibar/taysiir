import { Menu } from "lucide-react";
import LanguageSwitcher from "../i18n/LanguageSwitcher";
import { useAuth } from "../context/AuthContext";
import { useAcademicYear } from "../context/AcademicYearContext";
import { t } from "../i18n";

const Topbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const { years, selectedYearId, setSelectedYearId } = useAcademicYear();

  return (
    <header className="bg-surface border-b border-line px-3 md:px-6 h-16 flex items-center justify-between gap-2 print:hidden print:m-0 print:shadow-none">
      <div className="flex items-center gap-2 md:gap-3 min-w-0">
        <button onClick={onMenuClick} className="md:hidden text-ink/70 hover:text-ink shrink-0 p-1">
          <Menu size={20} />
        </button>
        <label className="text-sm text-ink/60 hidden sm:inline shrink-0">{t("Sanad Dugsiyeed:")}</label>
        <select
          className="input-field !w-auto py-1.5 text-sm min-w-0"
          value={selectedYearId || ""}
          onChange={(e) => setSelectedYearId(e.target.value)}
        >
          {years.map((y) => (
            <option key={y._id} value={y._id}>
              {y.name} {y.isActive ? t("(Firfircoon)") : ""}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2 md:gap-4 shrink-0">
        <LanguageSwitcher className="hidden sm:inline-flex" />
        <span className="text-sm text-ink/70 hidden sm:inline truncate max-w-[120px]">{user?.fullName}</span>
        <button
          onClick={logout}
          className="text-sm text-danger border border-line rounded px-3 py-1.5 hover:bg-paper transition-colors"
        >
          {t("Ka Bax")}
        </button>
      </div>
    </header>
  );
};

export default Topbar;
