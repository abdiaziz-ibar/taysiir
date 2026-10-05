import { Repeat } from "lucide-react";
import { formatMoney, statusLabel, statusBadgeClass } from "../../utils/format";
import { EXPENSE_CATEGORIES } from "../../utils/finance";
import { t } from "../../i18n";

// The month's regular costs (electricity, water, rent...) as a checklist, like the payroll
// sheet: each category shows whether it has been paid this month, with a "Bixi" button to
// pay it and "Edit" once it is. "Kale" can be paid any number of times.
const ExpenseChecklist = ({ expenses, onPay, onEdit }) => {
  const of = (category) => expenses.filter((x) => x.category.toLowerCase() === category.toLowerCase());
  const known = EXPENSE_CATEGORIES.map((c) => c.toLowerCase());
  const extra = [...new Set(expenses.map((x) => x.category))].filter((c) => !known.includes(c.toLowerCase()));
  const categories = [...EXPENSE_CATEGORIES.filter((c) => c !== "Kale"), ...extra, "Kale"];

  return (
    <div className="card overflow-x-auto">
      <h3 className="font-serif text-lg mb-3">{t("Qarashaadka Bishan")}</h3>
      <table className="table-base">
        <thead>
          <tr>
            <th>{t("Nooca")}</th>
            <th>{t("Sharaxaad")}</th>
            <th className="text-end">{t("Lacag")}</th>
            <th>{t("Xaalad")}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {categories.map((c) => {
            const rows = of(c);
            const repeatable = c === "Kale";
            const paid = rows.length > 0;
            const total = rows.reduce((s, x) => s + x.amount, 0);
            const first = rows[0];
            return (
              <tr key={c}>
                <td className="font-medium">{t(c)}</td>
                <td className="text-ink/60">
                  {!paid ? "-" : repeatable ? t("{count} kharash", { count: rows.length }) : first.description}
                  {paid && !repeatable && first.recurring && (
                    <span className="badge bg-navy/10 text-navy inline-flex items-center gap-1 ms-2"><Repeat size={11} /> {t("Bil kasta")}</span>
                  )}
                </td>
                <td className="text-end">{paid ? formatMoney(total) : "-"}</td>
                <td>
                  {repeatable && !paid ? (
                    <span className="text-ink/40">-</span>
                  ) : (
                    <span className={statusBadgeClass(paid ? "paid" : "unpaid")}>{statusLabel(paid ? "paid" : "unpaid")}</span>
                  )}
                </td>
                <td className="text-end whitespace-nowrap">
                  {paid && !repeatable && (
                    <button className="btn-secondary !px-4 !py-1.5 text-sm" onClick={() => onEdit(first)}>{t("Edit")}</button>
                  )}
                  {(!paid || repeatable) && (
                    <button className="btn-primary !px-4 !py-1.5 text-sm ms-2" onClick={() => onPay(c)}>{t("Bixi")}</button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ExpenseChecklist;
