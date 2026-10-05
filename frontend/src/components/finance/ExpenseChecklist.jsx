import { useState } from "react";
import { Repeat } from "lucide-react";
import { formatMoney, statusLabel, statusBadgeClass } from "../../utils/format";
import { t } from "../../i18n";

// The month's regular costs (electricity, water, rent...) as a checklist, like the payroll sheet.
// Every category used in this or an earlier month is listed again each month: "Bixi" to pay it
// (last time's details are pre-filled), "Edit" once it is. "Kale" can be paid any number of times.
// A new category is added from the row at the bottom and joins the list once it is paid.
const ExpenseChecklist = ({ expenses, known, options, onPay, onEdit, onDelete }) => {
  const [newCategory, setNewCategory] = useState("");
  const of = (category) => expenses.filter((x) => x.category.toLowerCase() === category.toLowerCase());
  const order = (c) => {
    const i = options.findIndex((x) => x.toLowerCase() === c.toLowerCase());
    return i === -1 ? 999 : i;
  };
  const names = [...new Set([...known.map((k) => k.category), ...expenses.filter((x) => x.category !== "Kale").map((x) => x.category)])]
    .filter((c) => c.toLowerCase() !== "kale")
    .sort((a, b) => order(a) - order(b));
  const categories = [...names, "Kale"];
  const addable = options.filter((c) => c !== "Kale" && !names.some((n) => n.toLowerCase() === c.toLowerCase()));
  const lastOf = (c) => known.find((k) => k.category.toLowerCase() === c.toLowerCase());

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
            const last = lastOf(c);
            return (
              <tr key={c}>
                <td className="font-medium">{t(c)}</td>
                <td className="text-ink/60">
                  {!paid ? (
                    // Not paid yet: show last time's details as a hint (not counted anywhere); "Bixi" pre-fills them.
                    last && !repeatable ? <span className="italic text-ink/40" title={t("Bishii hore")}>{last.description}</span> : "-"
                  ) : repeatable ? t("{count} kharash", { count: rows.length }) : first.description}
                  {paid && !repeatable && first.recurring && (
                    <span className="badge bg-navy/10 text-navy inline-flex items-center gap-1 ms-2"><Repeat size={11} /> {t("Bil kasta")}</span>
                  )}
                </td>
                <td className="text-end">
                  {paid ? formatMoney(total) : last && !repeatable ? <span className="italic text-ink/40" title={t("Bishii hore")}>{formatMoney(last.amount)}</span> : "-"}
                </td>
                <td>
                  {repeatable && !paid ? (
                    <span className="text-ink/40">-</span>
                  ) : (
                    <span className={statusBadgeClass(paid ? "paid" : "unpaid")}>{statusLabel(paid ? "paid" : "unpaid")}</span>
                  )}
                </td>
                <td className="text-end whitespace-nowrap">
                  {!paid && <button className="btn-primary !px-4 !py-1.5 text-sm" onClick={() => onPay(c, last)}>{t("Bixi")}</button>}
                  {paid && (!repeatable || rows.length === 1) && (
                    <>
                      <button className="btn-secondary !px-4 !py-1.5 text-sm" onClick={() => onEdit(first)}>{t("Edit")}</button>
                      <button className="text-sm text-danger hover:underline ms-3" onClick={() => onDelete(first)}>{t("Tirtir")}</button>
                    </>
                  )}
                  {paid && repeatable && (
                    <button className="btn-secondary !px-3 !py-1.5 text-sm ms-2" onClick={() => onPay(c)}>{t("+ Ku dar mid kale")}</button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {addable.length > 0 && (
        <div className="mt-4 pt-4 border-t border-line flex flex-wrap items-center gap-2">
          <span className="text-sm text-ink/60">{t("Ku dar nooc cusub:")}</span>
          <select className="input-field !w-auto" value={newCategory} onChange={(e) => setNewCategory(e.target.value)}>
            <option value="">{t("Dooro nooca...")}</option>
            {addable.map((c) => (
              <option key={c} value={c}>{t(c)}</option>
            ))}
          </select>
          <button className="btn-primary !px-4 !py-1.5 text-sm" disabled={!newCategory} onClick={() => { onPay(newCategory); setNewCategory(""); }}>
            {t("Bixi")}
          </button>
        </div>
      )}
    </div>
  );
};

export default ExpenseChecklist;
