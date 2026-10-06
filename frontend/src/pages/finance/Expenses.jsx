import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Settings2, Download, TrendingDown, Repeat, CheckCircle2, AlertCircle } from "lucide-react";
import api, { verifyFinancePassword } from "../../api/financeAxios";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import StatCard from "../../components/StatCard";
import ExpenseReport from "../../components/finance/ExpenseReport";
import ExpenseChecklist from "../../components/finance/ExpenseChecklist";
import CategoriesModal from "../../components/finance/CategoriesModal";
import useCategories from "../../components/finance/useCategories";
import { formatMoney, formatDate } from "../../utils/format";
import { downloadExcel } from "../../utils/excel";
import { EXPENSE_CATEGORIES, PAYMENT_METHODS, currentMonth, shiftMonth, monthLabel, todayISO } from "../../utils/finance";
import { t } from "../../i18n";

// Same rule as the server: a description is real text, not just a number.
const descriptionError = (text) => {
  const v = text.trim();
  if (v.length < 3) return t("Sharaxaadda aad bay u gaaban tahay (ugu yaraan 3 xaraf).");
  if (!/\p{L}/u.test(v)) return t("Sharaxaadda waa inay noqotaa qoraal (ereyo), ma aha lambar kaliya.");
  return "";
};

const emptyForm = () => ({
  category: EXPENSE_CATEGORIES[0],
  description: "",
  amount: "",
  expenseDate: todayISO(),
  paymentMethod: "Cash",
  notes: "",
});

// A recurring row from the server has the id "rec:<templateId>:<YYYY-MM>".
const rowMonth = (x) => x._id.split(":")[2];

const Expenses = () => {
  const { all: allCategories, names: CATEGORIES, reload: reloadCategories } = useCategories();
  const [showCategories, setShowCategories] = useState(false);
  const [month, setMonth] = useState(currentMonth()); // "" = every month
  const [category, setCategory] = useState(""); // "" | an expense category
  const [tab, setTab] = useState("list"); // "list" | "report"
  const [search, setSearch] = useState("");
  const [data, setData] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editingRow, setEditingRow] = useState(null); // the row being edited (recurring rows edit "from this month on")

  const load = () => {
    api
      .get("/expenses", { params: { month: month || undefined, category: category || undefined, search: search || undefined } })
      .then((res) => setData(res.data));
  };

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [month, category, search]);

  // `preset` pre-selects a category (the "Bixi" button of the checklist); `last` pre-fills last time's details.
  const openNew = (preset, last) => {
    setEditingId(null);
    setEditingRow(null);
    const first = preset || category || CATEGORIES[0];
    // Paying from another month's view dates the expense in that month, not today.
    const expenseDate = !month || month === currentMonth() ? todayISO() : `${month}-01`;
    setForm({
      ...emptyForm(),
      category: first,
      expenseDate,
      ...(last ? { description: last.description, amount: String(last.amount), paymentMethod: last.paymentMethod } : {}),
    });
    setError("");
    setShowForm(true);
  };

  const openEdit = (x) => {
    setEditingId(x._id);
    setForm({
      category: x.category,
      description: x.description,
      amount: String(x.amount),
      expenseDate: x.expenseDate.slice(0, 10),
      paymentMethod: x.paymentMethod,
      notes: x.notes || "",
      recurring: !!x.recurring,
    });
    setEditingRow(x);
    setError("");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setEditingRow(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const problem = descriptionError(form.description);
    if (problem) return setError(problem);
    setSaving(true);
    try {
      const payload = { ...form, amount: Number(form.amount) };
      if (editingRow?.recurring) {
        // Changes this month and every later one; earlier months keep what they had.
        await api.put(`/expenses/recurring/${editingRow.recurringId}`, { ...payload, month: rowMonth(editingRow) });
      } else if (editingId) await api.put(`/expenses/${editingId}`, payload);
      else await api.post("/expenses", payload);
      closeForm();
      load();
    } catch (err) {
      setError(t(err.response?.data?.message || "Khalad ayaa dhacay."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleteTarget.recurring) await api.delete(`/expenses/recurring/${deleteTarget.recurringId}`, { params: { month: rowMonth(deleteTarget) } });
    else await api.delete(`/expenses/${deleteTarget._id}`);
    setDeleteTarget(null);
    load();
  };

  const exportExcel = () => {
    const headers = ["Voucher", "Taariikh", "Nooca", "Sharaxaad", "Habka", "Faallo", "Lacag"];
    const rows = data.expenses.map((x) => [
      x.voucherNumber || (x.recurring ? t("Bil kasta") : ""),
      formatDate(x.expenseDate),
      x.category,
      x.description,
      x.paymentMethod,
      x.notes || "",
      x.amount,
    ]);
    downloadExcel(`qarashaadka-${month || "dhammaan"}.xlsx`, headers, rows);
  };

  // Categories already used in the data but not in the preset list (kept selectable when editing).
  const expenseCategoryOptions = CATEGORIES.includes(form.category) ? CATEGORIES : [form.category, ...CATEGORIES];

  // The month's regular costs as a pay checklist — only on the unfiltered month view.
  const showChecklist = !!month && !category && !search;

  // Regular (non-"Kale") categories paid this month, for the stat cards.
  const REGULAR = (data?.known || []).map((k) => k.category);
  const paidRegular = data ? REGULAR.filter((c) => data.expenses.some((x) => x.category.toLowerCase() === c.toLowerCase())).length : 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold tracking-tight">
          {t("Qarashaadka")} {tab === "list" ? (month ? `— ${monthLabel(month)}` : t("— Dhammaan")) : ""}
        </h2>
        {tab === "list" && (
          <button className="btn-primary" onClick={showForm ? closeForm : () => openNew()}>
            {showForm ? t("Jooji") : t("+ Kharash Cusub")}
          </button>
        )}
      </div>

      <div className="flex gap-2">
        {[["list", "Qarashaadka"], ["report", "Warbixin"]].map(([key, label]) => (
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

      {tab === "report" ? (
        <ExpenseReport />
      ) : (
        <>
      {showForm && (
        <div className="card space-y-4">
          <h3 className="font-serif text-lg">{editingId ? t("Wax Ka Beddel Kharashka") : t("Kharash Cusub")}</h3>

          <div>
            <label className="label-field">{t("Nooca *")}</label>
            <select
              className="input-field md:max-w-sm"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {expenseCategoryOptions.map((c) => (
                <option key={c} value={c}>{t(c)}</option>
              ))}
            </select>
          </div>

          {(
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {error && <div className="md:col-span-2 bg-danger/10 text-danger text-sm rounded-md px-3 py-2">{error}</div>}
              {editingRow?.recurring && (
                <p className="md:col-span-2 text-xs bg-navy/5 text-navy rounded-md px-3 py-2">
                  {t("Kharashkan waa bil kasta. Isbeddelku wuxuu khuseeyaa {month} iyo bilaha xiga; bilihii hore isma beddelayaan.", { month: monthLabel(rowMonth(editingRow)) })}
                </p>
              )}
              {!editingId && form.category !== "Kale" && (
                <p className="md:col-span-2 text-xs text-ink/50">
                  {t("Nooc kasta hal mar bishii ayaa la diiwaan gelin karaa. Haddii aad rabto inaad wax ka beddesho, liiska ka dooro oo Edit samee.")}
                </p>
              )}
              <div>
                <label className="label-field">{t("Lacagta ($) *")}</label>
                <input required type="number" min="0.01" step="0.01" className="input-field" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
              {!editingRow?.recurring && (
                <div>
                  <label className="label-field">{t("Taariikhda")}</label>
                  <input type="date" required className="input-field" value={form.expenseDate} onChange={(e) => setForm({ ...form, expenseDate: e.target.value })} />
                </div>
              )}
              <div className="md:col-span-2">
                <label className="label-field">{t("Sharaxaad *")}</label>
                <input required className="input-field" placeholder={t("Tusaale: Biilka korontada bisha Sebtembar")} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <label className="label-field">{t("Habka Lacag Bixinta")}</label>
                <select className="input-field" value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>{t(m)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label-field">{t("Faallo (ikhtiyaari)")}</label>
                <input className="input-field" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <button className="btn-primary" disabled={saving}>{saving ? t("Waa la kaydinayaa...") : t("Kaydi")}</button>
              </div>
            </form>
          )}
        </div>
      )}

      <div className="card flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <button className="btn-secondary !px-3 !py-2" disabled={!month} onClick={() => setMonth(shiftMonth(month, -1))} aria-label={t("Bishii hore")}>
            <ChevronLeft size={16} className="rtl:rotate-180" />
          </button>
          <input type="month" className="input-field !w-auto" value={month} onChange={(e) => setMonth(e.target.value)} />
          <button className="btn-secondary !px-3 !py-2" disabled={!month} onClick={() => setMonth(shiftMonth(month, 1))} aria-label={t("Bisha xigta")}>
            <ChevronRight size={16} className="rtl:rotate-180" />
          </button>
          <button className="btn-secondary text-sm" onClick={() => setMonth(month ? "" : currentMonth())}>
            {month ? t("Dhammaan bilaha") : t("Bishan")}
          </button>
        </div>
        <select className="input-field md:max-w-[230px]" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">{t("Dhammaan noocyada")}</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{t(c)}</option>
          ))}
        </select>
        {(
          <>
            <input className="input-field md:max-w-[200px]" placeholder={t("Raadi sharaxaad...")} value={search} onChange={(e) => setSearch(e.target.value)} />
            <button className="btn-secondary text-sm inline-flex items-center gap-1.5 md:ms-auto" onClick={() => setShowCategories(true)}>
              <Settings2 size={15} /> {t("Maamul Noocyada")}
            </button>
            <button className="btn-secondary text-sm inline-flex items-center gap-1.5" onClick={exportExcel} disabled={!data || data.expenses.length === 0}>
              <Download size={15} /> Excel
            </button>
          </>
        )}
      </div>

      {!data ? (
        <p className="text-ink/50">{t("Waa la soo shubayaa...")}</p>
      ) : (
        <>
          {month && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard tone="blue" label={t("Wadarta Qarashaadka")} value={formatMoney(data.total)} icon={TrendingDown} />
              <StatCard tone="teal" label={t("Noocyada La Bixiyey")} value={`${paidRegular} / ${REGULAR.length}`} icon={CheckCircle2} />
              <StatCard tone="pink" label={t("Lama Bixin")} value={String(REGULAR.length - paidRegular)} icon={AlertCircle} />
            </div>
          )}
          {showChecklist && <ExpenseChecklist expenses={data.expenses} known={data.known || []} options={CATEGORIES} onPay={openNew} onEdit={openEdit} onDelete={setDeleteTarget} />}
          {!showChecklist && <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {!month && <StatCard
              label={t("Wadarta Qarashaadka")}
              value={formatMoney(data.total)}
              accent="text-danger"
              icon={TrendingDown}
              iconBg="bg-danger/10"
              iconColor="text-danger"
            />}
            <div className={`card ${month ? "md:col-span-3" : "md:col-span-2"}`}>
              <p className="text-xs uppercase tracking-wide text-ink/50 mb-2">{t("Qarashaadka Kale")}</p>
              {data.byCategory.length === 0 ? (
                <p className="text-sm text-ink/40">-</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {data.byCategory.map((c) => (
                    <span key={c.category} className="badge bg-navy/10 text-navy !text-sm !px-3 !py-1">
                      {t(c.category)}: {formatMoney(c.total)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>}

          <div className="card overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>{t("Voucher")}</th>
                  <th>{t("Taariikh")}</th>
                  <th>{t("Nooca")}</th>
                  <th>{t("Sharaxaad")}</th>
                  <th>{t("Habka")}</th>
                  <th className="text-end">{t("Lacag")}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.expenses.map((x) => (
                  <tr key={x._id} className={x.projected ? "opacity-70" : ""}>
                    <td className="text-ink/60">
                      {x.voucherNumber || (
                        <span className="badge bg-navy/10 text-navy inline-flex items-center gap-1"><Repeat size={11} /> {t("Bil kasta")}</span>
                      )}
                    </td>
                    <td>{formatDate(x.expenseDate)}</td>
                    <td>{t(x.category)}</td>
                    <td>
                      {x.description}
                      {x.notes && <span className="block text-xs text-ink/50">{x.notes}</span>}
                    </td>
                    <td>{t(x.paymentMethod)}</td>
                    <td className="text-end font-medium">{formatMoney(x.amount)}</td>
                    <td className="text-end whitespace-nowrap">
                      <button onClick={() => openEdit(x)} className="text-sm text-link hover:underline me-3">{t("Edit")}</button>
                      <button onClick={() => setDeleteTarget(x)} className="text-sm text-danger hover:underline">{t("Tirtir")}</button>
                    </td>
                  </tr>
                ))}
                {data.expenses.length === 0 && (
                  <tr><td colSpan={7} className="text-center text-ink/40 py-6">{t("Kharash lama diiwaan gelin.")}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
        </>
      )}

      <CategoriesModal
        open={showCategories}
        categories={allCategories}
        onClose={() => setShowCategories(false)}
        onChanged={async () => {
          await reloadCategories();
          load();
        }}
      />

      <ConfirmDeleteModal
        open={!!deleteTarget}
        title={t("Tirtir Kharashka?")}
        message={deleteTarget?.recurring
          ? t("Kharashkan bil kasta ah ({description} — {amount}) wuu joogsanayaa {month} iyo wixii ka dambeeya. Bilihii hore waa sidooda.", { description: deleteTarget.description, amount: formatMoney(deleteTarget.amount), month: monthLabel(rowMonth(deleteTarget)) })
          : deleteTarget ? t("Waxaad tirtirayaa {voucher} ({description} — {amount}). Lama soo celin karo.", { voucher: deleteTarget.voucherNumber, description: deleteTarget.description, amount: formatMoney(deleteTarget.amount) }) : ""}
        verify={verifyFinancePassword}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default Expenses;
