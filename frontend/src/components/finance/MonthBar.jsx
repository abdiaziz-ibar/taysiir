import { ChevronLeft, ChevronRight } from "lucide-react";
import { shiftMonth } from "../../utils/finance";
import { t } from "../../i18n";

// Previous / month picker / next.
const MonthBar = ({ month, onChange }) => (
  <div className="flex items-center gap-2">
    <button className="btn-secondary !px-3 !py-2" onClick={() => onChange(shiftMonth(month, -1))} aria-label={t("Bishii hore")}>
      <ChevronLeft size={16} className="rtl:rotate-180" />
    </button>
    <input type="month" className="input-field !w-auto" value={month} onChange={(e) => e.target.value && onChange(e.target.value)} />
    <button className="btn-secondary !px-3 !py-2" onClick={() => onChange(shiftMonth(month, 1))} aria-label={t("Bisha xigta")}>
      <ChevronRight size={16} className="rtl:rotate-180" />
    </button>
  </div>
);

export default MonthBar;
