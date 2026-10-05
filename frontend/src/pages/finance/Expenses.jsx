import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Download, TrendingDown, Banknote, Repeat } from "lucide-react";
import api, { verifyFinancePassword } from "../../api/financeAxios";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import StatCard from "../../components/StatCard";
import SalaryPanel from "../../components/finance/SalaryPanel";
import Employees from "./Employees";
import { formatMoney, formatDate } from "../../utils/format";
import { downloadExcel } from "../../utils/excel";
import { EXPENSE_CATEGORIES, EMPLOYEE_TYPES, PAYMENT_METHODS, currentMonth, shiftMonth, monthLabel, todayISO } from "../../utils/finance";
import { t } from "../../i18n";

// Not a stored expense category: choosing it switches to salary payments to
// teachers / staff (their own table), so everything the school pays out lives on this one page.
const SALARY_KEY = "__salary__";
const SALARY_LABEL = "Mushaharka (Shaqaalaha)";

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
  recurring: true, // new regular costs repeat every month by default
});

// A recurring row from the server has the id "rec:<templateId>:<YYYY-MM>".
const rowMonth = (x) => x._id.split(":")[2];

// The "Mushaharka" branch of the new-expense form: pick Macalin or Shaqaale,
// then the person, then pay.
const SalaryEntryForm = ({ initialPeriod, onSaved, onNeedEmployees }) => {
  const [period, setPeriod] = useState(initialPeriod);
  const [empType, setEmpType] = useState("teacher");
  const [rows, setRows] = useState(null);
  const [employeeId, setEmployeeId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(todayISO());
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [notes, setNotes] = useState("");
  const [allowOverpayment, setAllowOverpayment] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setRows(null);
    setEmployeeId("");
    setAmount("");
    api.get("/salaries/summary", { params: { period } }).then((res) => setRows(res.data.rows));
  }, [period]);

  const candidates = (rows || []).filter((r) => r.employee.type === empType && r.employee.status === "active");
  const selected = candidates.find((r) => r.employee._id === employeeId);

  const pickEmployee = (id) => {
    setEmployeeId(id);
    const row = candidates.find((r) => r.employee._id === id);
    setAmount(row && row.balance > 0 ? String(row.balance) : "");
  };

  const changeType = (type) => {
    setEmpType(type);
    setEmployeeId("");
    setAmount("");
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!employeeId) return setError(t("Fadlan dooro {type}.", { type: EMPLOYEE_TYPES[empType] }));
    setSaving(true);
    try {
      await api.post("/salaries", { employeeId, period, amount: Number(amount), paymentDate, paymentMethod, notes, allowOverpayment });
      onSaved(period);
    } catch (err) {
      setError(t(err.response?.data?.message || "Khalad ayaa dhacay."));
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {error && <div className="md:col-span-2 bg-danger/10 text-danger text-sm rounded-md px-3 py-2">{error}</div>}

      <div className="md:col-span-2">
        <label className="label-field">{t("Dooro *")}</label>
        <div className="flex gap-2">
          {Object.entries(EMPLOYEE_TYPES).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => changeType(key)}
              className={`px-5 py-2 rounded-full text-sm border ${empType === key ? "bg-navy text-white border-navy" : "bg-surface text-ink border-line hover:bg-paper"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label-field">{t("Bisha mushaharka *")}</label>
        <input type="month" required className="input-field" value={period} onChange={(e) => e.target.value && setPeriod(e.target.value)} />
      </div>
      <div>
        <label className="label-field">{EMPLOYEE_TYPES[empType]} *</label>
        <select className="input-field" value={employeeId} onChange={(e) => pickEmployee(e.target.value)} disabled={!rows}>
          <option value="">{rows ? t("Dooro {type}...", { type: EMPLOYEE_TYPES[empType] }) : t("Waa la soo shubayaa...")}</option>
          {candidates.map((r) => (
            <option key={r.employee._id} value={r.employee._id} disabled={r.payments.length > 0}>
              {r.employee.employeeId} — {r.employee.fullName}{" "}
              {r.payments.length > 0 ? t("(bishan horey la bixiyey — Edit ka samee)") : t("(mushahar {amount})", { amount: formatMoney(r.monthlySalary) })}
            </option>
          ))}
        </select>
        {rows && candidates.length === 0 && (
          <p className="text-xs text-ink/50 mt-1">
            {EMPLOYEE_TYPES[empType]} {t("Active ah ma jiro.")}{" "}
            <button type="button" className="text-link hover:underline" onClick={onNeedEmployees}>
              {t("Ku dar halkan")}
            </button>
          </p>
        )}
      </div>

      {selected && (
        <p className="md:col-span-2 text-xs text-ink/50 -mt-2">
          {t("Mushaharka bishii:")} {formatMoney(selected.monthlySalary)}
        </p>
      )}

      <div>
        <label className="label-field">{t("Lacagta ($) *")}</label>
        <input required type="number" min="0.01" step="0.01" className="input-field" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </div>
      <div>
        <label className="label-field">{t("Taariikhda")}</label>
        <input type="date" required className="input-field" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
      </div>
      <div>
        <label className="label-field">{t("Habka Lacag Bixinta")}</label>
        <select className="input-field" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
          {PAYMENT_METHODS.map((m) => (
            <option key={m} value={m}>{t(m)}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label-field">{t("Faallo (ikhtiyaari)")}</label>
        <input className="input-field" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <p className="md:col-span-2 text-xs text-ink/50 -mt-1">{t("Hal mar bishii ayaa la bixiyaa. Haddii aad rabto inaad wax ka beddesho, ka dooro Mushaharka oo Edit samee.")}</p>
      <label className="md:col-span-2 flex items-center gap-2 text-sm text-ink/70">
        <input type="checkbox" checked={allowOverpayment} onChange={(e) => setAllowOverpayment(e.target.checked)} />
        {t("Ogolow in ka badato mushaharka (tusaale bonus)")}
      </label>
      <div className="md:col-span-2">
        <button className="btn-primary" disabled={saving}>{saving ? t("Waa la kaydinayaa...") : t("Bixi Mushaharka")}</button>
      </div>
    </form>
  );
};

const Expenses = () => {
  const [month, setMonth] = useState(currentMonth()); // "" = every month
  const [category, setCategory] = useState(""); // "" | SALARY_KEY | an expense category
  const [search, setSearch] = useState("");
  const [data, setData] = useState(null);
  const [salaryPaid, setSalaryPaid] = useState(null); // salaries paid for `month`, shown on the "all" view

  const [salaryTab, setSalaryTab] = useState("payroll"); // "payroll" | "employees"
  const [refreshKey, setRefreshKey] = useState(0);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editingRow, setEditingRow] = useState(null); // the row being edited (recurring rows edit "from this month on")

  const isSalaryView = category === SALARY_KEY;

  // Salaries are per month, so the salary view always needs one.
  useEffect(() => {
    if (isSalaryView && !month) setMonth(currentMonth());
  }, [isSalaryView, month]);

  const load = () => {
    if (isSalaryView) return;
    api
      .get("/expenses", { params: { month: month || undefined, category: category || undefined, search: search || undefined } })
      .then((res) => setData(res.data));
    if (category === "" && month) {
      api.get("/salaries/summary", { params: { period: month } }).then((res) => setSalaryPaid(res.data.totals.paid));
    } else {
      setSalaryPaid(null);
    }
  };

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [month, category, search]);

  const openNew = () => {
    setEditingId(null);
    setEditingRow(null);
    const first = isSalaryView ? SALARY_KEY : category || EXPENSE_CATEGORIES[0];
    setForm({ ...emptyForm(), category: first, recurring: first !== "Kale" });
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

  // After paying a salary from the form, jump to the salary view for that month so the payment is visible.
  const handleSalarySaved = (period) => {
    closeForm();
    setMonth(period);
    setSalaryTab("payroll");
    setCategory(SALARY_KEY);
    setRefreshKey((k) => k + 1);
  };

  const goToEmployees = () => {
    closeForm();
    setSalaryTab("employees");
    setCategory(SALARY_KEY);
  };

  const handleDelete = async () => {
    if (deleteTarget.recurring) await api.delete(`/expenses/recurring/${deleteTarget.recurringId}`, { params: { month: rowMonth(deleteTarget) } });
    else await api.delete(`/expenses/${deleteTarget._id}`);
    setDeleteTarget(null);
    load();
  };

  // One click: every regular cost of this month becomes a monthly one from here on.
  const repeatThisMonth = async () => {
    if (!window.confirm(t("Dhammaan kharashyada bishan (marka laga reebo \"Kale\") ka dhig kuwo bil kasta ah, oo bilaha soo socda isla muuqda?"))) return;
    try {
      await api.post("/expenses/recurring/from-month", { month });
      load();
    } catch (err) {
      window.alert(t(err.response?.data?.message || "Khalad ayaa dhacay."));
    }
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
  const expenseCategoryOptions = EXPENSE_CATEGORIES.includes(form.category) || form.category === SALARY_KEY
    ? EXPENSE_CATEGORIES
    : [form.category, ...EXPENSE_CATEGORIES];

  const canRepeatMonth = !!month && !!data && data.expenses.some((x) => !x.recurring && x.category !== "Kale");

  const showSalaryCard = category === "" && month && salaryPaid !== null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-serif">
          {isSalaryView ? t("Mushaharka") : t("Qarashaadka")} {month ? `— ${monthLabel(month)}` : t("— Dhammaan")}
        </h2>
        <button className="btn-primary" onClick={showForm ? closeForm : openNew}>
          {showForm ? t("Jooji") : t("+ Kharash Cusub")}
        </button>
      </div>

      {showForm && (
        <div className="card space-y-4">
          <h3 className="font-serif text-lg">{editingId ? t("Wax Ka Beddel Kharashka") : t("Kharash Cusub")}</h3>

          <div>
            <label className="label-field">{t("Nooca *")}</label>
            <select
              className="input-field md:max-w-sm"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value, ...(editingId ? {} : { recurring: e.target.value !== "Kale" }) })}
            >
              {!editingId && <option value={SALARY_KEY}>{t(SALARY_LABEL)}</option>}
              {expenseCategoryOptions.map((c) => (
                <option key={c} value={c}>{t(c)}</option>
              ))}
            </select>
          </div>

          {form.category === SALARY_KEY && !editingId ? (
            <SalaryEntryForm initialPeriod={month || currentMonth()} onSaved={handleSalarySaved} onNeedEmployees={goToEmployees} />
          ) : (
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
              {form.category !== "Kale" && !editingRow?.recurring && (
                <label className="md:col-span-2 flex items-start gap-2 text-sm text-ink/80 bg-navy/5 rounded-md px-3 py-2">
                  <input type="checkbox" className="mt-1" checked={form.recurring} onChange={(e) => setForm({ ...form, recurring: e.target.checked })} />
                  <span>
                    <b>{t("Bil kasta (hal mar geli)")}</b>
                    <span className="block text-xs text-ink/60">
                      {t("Bisha dooratay iyo bilaha xiga isla kharashkan ayaa si toos ah u muuqan doona. Bilihii hore waxba kuma darmaan.")}
                    </span>
                  </span>
                </label>
              )}
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
          {!isSalaryView && (
            <button className="btn-secondary text-sm" onClick={() => setMonth(month ? "" : currentMonth())}>
              {month ? t("Dhammaan bilaha") : t("Bishan")}
            </button>
          )}
        </div>
        <select className="input-field md:max-w-[230px]" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">{t("Dhammaan noocyada")}</option>
          <option value={SALARY_KEY}>{t(SALARY_LABEL)}</option>
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c} value={c}>{t(c)}</option>
          ))}
        </select>
        {!isSalaryView && (
          <>
            <input className="input-field md:max-w-[200px]" placeholder={t("Raadi sharaxaad...")} value={search} onChange={(e) => setSearch(e.target.value)} />
            {canRepeatMonth && (
              <button className="btn-secondary text-sm inline-flex items-center gap-1.5 md:ms-auto" onClick={repeatThisMonth}>
                <Repeat size={15} /> {t("Ka dhig bil kasta")}
              </button>
            )}
            <button className={`btn-secondary text-sm inline-flex items-center gap-1.5 ${canRepeatMonth ? "" : "md:ms-auto"}`} onClick={exportExcel} disabled={!data || data.expenses.length === 0}>
              <Download size={15} /> Excel
            </button>
          </>
        )}
      </div>

      {isSalaryView ? (
        <>
          <div className="flex gap-2">
            {[["payroll", t("Mushaharka") + (month ? " " + monthLabel(month) : "")], ["employees", t("Shaqaalaha (liiska)")]].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setSalaryTab(key)}
                className={`px-4 py-1.5 rounded-full text-sm border ${salaryTab === key ? "bg-navy text-white border-navy" : "bg-surface text-ink border-line hover:bg-paper"}`}
              >
                {label}
              </button>
            ))}
          </div>
          {salaryTab === "payroll" ? (
            month && <SalaryPanel period={month} refreshKey={refreshKey} />
          ) : (
            <Employees />
          )}
        </>
      ) : !data ? (
        <p className="text-ink/50">{t("Waa la soo shubayaa...")}</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              label={t("Wadarta Qarashaadka")}
              value={formatMoney(data.total + (showSalaryCard ? salaryPaid : 0))}
              accent="text-danger"
              icon={TrendingDown}
              iconBg="bg-danger/10"
              iconColor="text-danger"
            />
            {showSalaryCard && (
              <button type="button" className="text-start" onClick={() => setCategory(SALARY_KEY)} title={t("Fur mushaharka")}>
                <StatCard label={t("Mushaharka La Bixiyey (fur →)")} value={formatMoney(salaryPaid)} icon={Banknote} />
              </button>
            )}
            <div className={`card ${showSalaryCard ? "" : "md:col-span-2"}`}>
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
          </div>

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
