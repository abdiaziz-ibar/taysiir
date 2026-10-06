import { useState } from "react";
import SalaryPanel from "../../components/finance/SalaryPanel";
import SalaryReport from "../../components/finance/SalaryReport";
import MonthBar from "../../components/finance/MonthBar";
import Employees from "./Employees";
import { currentMonth, monthLabel } from "../../utils/finance";
import { t } from "../../i18n";

const TABS = [
  ["payroll", "Mushaharka Bisha"],
  ["employees", "Shaqaalaha (liiska)"],
  ["report", "Warbixin"],
];

// Salaries of teachers and staff — its own section: the monthly payroll (pay / edit), the list of
// people, and the salary report.
const Salaries = () => {
  const [tab, setTab] = useState("payroll");
  const [month, setMonth] = useState(currentMonth());

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold tracking-tight">
          {t("Mushaharka")}{tab === "payroll" ? ` — ${monthLabel(month)}` : ""}
        </h2>
        {tab === "payroll" && <MonthBar month={month} onChange={setMonth} />}
      </div>

      <div className="flex gap-2 flex-wrap">
        {TABS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`px-4 py-1.5 rounded-full text-sm border ${tab === key ? "bg-navy text-white border-navy" : "bg-surface text-ink border-line hover:bg-paper"}`}
          >
            {t(label)}
          </button>
        ))}
      </div>

      {tab === "payroll" && <SalaryPanel period={month} />}
      {tab === "employees" && <Employees />}
      {tab === "report" && <SalaryReport />}
    </div>
  );
};

export default Salaries;
