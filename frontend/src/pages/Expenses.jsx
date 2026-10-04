import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Download, TrendingDown, Banknote } from "lucide-react";
import api from "../api/axios";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import StatCard from "../components/StatCard";
import SalaryPanel from "../components/SalaryPanel";
import Employees from "./Employees";
import { formatMoney, formatDate } from "../utils/format";
import { downloadExcel } from "../utils/excel";
import { EXPENSE_CATEGORIES, EMPLOYEE_TYPES, PAYMENT_METHODS, currentMonth, shiftMonth, monthLabel, todayISO } from "../utils/finance";

// Not a stored expense category: choosing it switches to salary payments to
// teachers / staff (their own table), so everything the school pays out lives on this one page.
const SALARY_KEY = "__salary__";
const SALARY_LABEL = "Mushaharka (Shaqaalaha)";

// Same rule as the server: a description is real text, not just a number.
const descriptionError = (text) => {
  const t = text.trim();
  if (t.length < 3) return "Sharaxaadda aad bay u gaaban tahay (ugu yaraan 3 xaraf).";
  if (!/\p{L}/u.test(t)) return "Sharaxaadda waa inay noqotaa qoraal (ereyo), ma aha lambar kaliya.";
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

  const changeType = (t) => {
    setEmpType(t);
    setEmployeeId("");
    setAmount("");
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!employeeId) return setError(`Fadlan dooro ${EMPLOYEE_TYPES[empType].toLowerCase()}.`);
    setSaving(true);
    try {
      await api.post("/salaries", { employeeId, period, amount: Number(amount), paymentDate, paymentMethod, notes, allowOverpayment });
      onSaved(period);
    } catch (err) {
      setError(err.response?.data?.message || "Khalad ayaa dhacay.");
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {error && <div className="md:col-span-2 bg-danger/10 text-danger text-sm rounded-md px-3 py-2">{error}</div>}

      <div className="md:col-span-2">
        <label className="label-field">Dooro *</label>
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
        <label className="label-field">Bisha mushaharka *</label>
        <input type="month" required className="input-field" value={period} onChange={(e) => e.target.value && setPeriod(e.target.value)} />
      </div>
      <div>
        <label className="label-field">{EMPLOYEE_TYPES[empType]} *</label>
        <select className="input-field" value={employeeId} onChange={(e) => pickEmployee(e.target.value)} disabled={!rows}>
          <option value="">{rows ? `Dooro ${EMPLOYEE_TYPES[empType].toLowerCase()}...` : "Waa la soo shubayaa..."}</option>
          {candidates.map((r) => (
            <option key={r.employee._id} value={r.employee._id} disabled={r.payments.length > 0}>
              {r.employee.employeeId} — {r.employee.fullName}{" "}
              {r.payments.length > 0 ? "(bishan horey la bixiyey — Edit ka samee)" : `(mushahar ${formatMoney(r.monthlySalary)})`}
            </option>
          ))}
        </select>
        {rows && candidates.length === 0 && (
          <p className="text-xs text-ink/50 mt-1">
            {EMPLOYEE_TYPES[empType]} Active ah ma jiro.{" "}
            <button type="button" className="text-link hover:underline" onClick={onNeedEmployees}>
              Ku dar halkan
            </button>
          </p>
        )}
      </div>

      {selected && (
        <p className="md:col-span-2 text-xs text-ink/50 -mt-2">
          Mushaharka bishii: {formatMoney(selected.monthlySalary)}
        </p>
      )}

      <div>
        <label className="label-field">Lacagta ($) *</label>
        <input required type="number" min="0.01" step="0.01" className="input-field" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </div>
      <div>
        <label className="label-field">Taariikhda</label>
        <input type="date" required className="input-field" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
      </div>
      <div>
        <label className="label-field">Habka Lacag Bixinta</label>
        <select className="input-field" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
          {PAYMENT_METHODS.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label-field">Faallo (ikhtiyaari)</label>
        <input className="input-field" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <p className="md:col-span-2 text-xs text-ink/50 -mt-1">Hal mar bishii ayaa la bixiyaa. Haddii aad rabto inaad wax ka beddesho, ka dooro Mushaharka oo Edit samee.</p>
      <label className="md:col-span-2 flex items-center gap-2 text-sm text-ink/70">
        <input type="checkbox" checked={allowOverpayment} onChange={(e) => setAllowOverpayment(e.target.checked)} />
        Ogolow in ka badato mushaharka (tusaale bonus)
      </label>
      <div className="md:col-span-2">
        <button className="btn-primary" disabled={saving}>{saving ? "Waa la kaydinayaa..." : "Bixi Mushaharka"}</button>
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
    setForm({ ...emptyForm(), category: isSalaryView ? SALARY_KEY : category || EXPENSE_CATEGORIES[0] });
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
    });
    setError("");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const problem = descriptionError(form.description);
    if (problem) return setError(problem);
    setSaving(true);
    try {
      const payload = { ...form, amount: Number(form.amount) };
      if (editingId) await api.put(`/expenses/${editingId}`, payload);
      else await api.post("/expenses", payload);
      closeForm();
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Khalad ayaa dhacay.");
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
    await api.delete(`/expenses/${deleteTarget._id}`);
    setDeleteTarget(null);
    load();
  };

  const exportExcel = () => {
    const headers = ["Voucher", "Taariikh", "Nooca", "Sharaxaad", "Habka", "Faallo", "Lacag"];
    const rows = data.expenses.map((x) => [
      x.voucherNumber,
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

  const showSalaryCard = category === "" && month && salaryPaid !== null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-serif">
          {isSalaryView ? "Mushaharka" : "Qarashaadka"} {month ? `— ${monthLabel(month)}` : "— Dhammaan"}
        </h2>
        <button className="btn-primary" onClick={showForm ? closeForm : openNew}>
          {showForm ? "Jooji" : "+ Kharash Cusub"}
        </button>
      </div>

      {showForm && (
        <div className="card space-y-4">
          <h3 className="font-serif text-lg">{editingId ? "Wax Ka Beddel Kharashka" : "Kharash Cusub"}</h3>

          <div>
            <label className="label-field">Nooca *</label>
            <select
              className="input-field md:max-w-sm"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {!editingId && <option value={SALARY_KEY}>{SALARY_LABEL}</option>}
              {expenseCategoryOptions.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>

          {form.category === SALARY_KEY && !editingId ? (
            <SalaryEntryForm initialPeriod={month || currentMonth()} onSaved={handleSalarySaved} onNeedEmployees={goToEmployees} />
          ) : (
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {error && <div className="md:col-span-2 bg-danger/10 text-danger text-sm rounded-md px-3 py-2">{error}</div>}
              {!editingId && form.category !== "Kale" && (
                <p className="md:col-span-2 text-xs text-ink/50">
                  Nooc kasta hal mar bishii ayaa la diiwaan gelin karaa. Haddii aad rabto inaad wax ka beddesho, liiska ka dooro oo Edit samee.
                </p>
              )}
              <div>
                <label className="label-field">Lacagta ($) *</label>
                <input required type="number" min="0.01" step="0.01" className="input-field" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div>
                <label className="label-field">Taariikhda</label>
                <input type="date" required className="input-field" value={form.expenseDate} onChange={(e) => setForm({ ...form, expenseDate: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <label className="label-field">Sharaxaad *</label>
                <input required className="input-field" placeholder="Tusaale: Biilka korontada bisha Sebtembar" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <label className="label-field">Habka Lacag Bixinta</label>
                <select className="input-field" value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label-field">Faallo (ikhtiyaari)</label>
                <input className="input-field" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <button className="btn-primary" disabled={saving}>{saving ? "Waa la kaydinayaa..." : "Kaydi"}</button>
              </div>
            </form>
          )}
        </div>
      )}

      <div className="card flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <button className="btn-secondary !px-3 !py-2" disabled={!month} onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Bishii hore">
            <ChevronLeft size={16} />
          </button>
          <input type="month" className="input-field !w-auto" value={month} onChange={(e) => setMonth(e.target.value)} />
          <button className="btn-secondary !px-3 !py-2" disabled={!month} onClick={() => setMonth(shiftMonth(month, 1))} aria-label="Bisha xigta">
            <ChevronRight size={16} />
          </button>
          {!isSalaryView && (
            <button className="btn-secondary text-sm" onClick={() => setMonth(month ? "" : currentMonth())}>
              {month ? "Dhammaan bilaha" : "Bishan"}
            </button>
          )}
        </div>
        <select className="input-field md:max-w-[230px]" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Dhammaan noocyada</option>
          <option value={SALARY_KEY}>{SALARY_LABEL}</option>
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        {!isSalaryView && (
          <>
            <input className="input-field md:max-w-[200px]" placeholder="Raadi sharaxaad..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <button className="btn-secondary text-sm inline-flex items-center gap-1.5 md:ml-auto" onClick={exportExcel} disabled={!data || data.expenses.length === 0}>
              <Download size={15} /> Excel
            </button>
          </>
        )}
      </div>

      {isSalaryView ? (
        <>
          <div className="flex gap-2">
            {[["payroll", `Mushaharka ${month ? monthLabel(month) : ""}`], ["employees", "Shaqaalaha (liiska)"]].map(([key, label]) => (
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
        <p className="text-ink/50">Waa la soo shubayaa...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              label="Wadarta Qarashaadka"
              value={formatMoney(data.total + (showSalaryCard ? salaryPaid : 0))}
              accent="text-danger"
              icon={TrendingDown}
              iconBg="bg-danger/10"
              iconColor="text-danger"
            />
            {showSalaryCard && (
              <button type="button" className="text-left" onClick={() => setCategory(SALARY_KEY)} title="Fur mushaharka">
                <StatCard label="Mushaharka La Bixiyey (fur →)" value={formatMoney(salaryPaid)} icon={Banknote} />
              </button>
            )}
            <div className={`card ${showSalaryCard ? "" : "md:col-span-2"}`}>
              <p className="text-xs uppercase tracking-wide text-ink/50 mb-2">Qarashaadka Kale</p>
              {data.byCategory.length === 0 ? (
                <p className="text-sm text-ink/40">-</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {data.byCategory.map((c) => (
                    <span key={c.category} className="badge bg-navy/10 text-navy !text-sm !px-3 !py-1">
                      {c.category}: {formatMoney(c.total)}
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
                  <th>Voucher</th>
                  <th>Taariikh</th>
                  <th>Nooca</th>
                  <th>Sharaxaad</th>
                  <th>Habka</th>
                  <th className="text-right">Lacag</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.expenses.map((x) => (
                  <tr key={x._id}>
                    <td className="text-ink/60">{x.voucherNumber}</td>
                    <td>{formatDate(x.expenseDate)}</td>
                    <td>{x.category}</td>
                    <td>
                      {x.description}
                      {x.notes && <span className="block text-xs text-ink/50">{x.notes}</span>}
                    </td>
                    <td>{x.paymentMethod}</td>
                    <td className="text-right font-medium">{formatMoney(x.amount)}</td>
                    <td className="text-right whitespace-nowrap">
                      <button onClick={() => openEdit(x)} className="text-sm text-link hover:underline mr-3">Edit</button>
                      <button onClick={() => setDeleteTarget(x)} className="text-sm text-danger hover:underline">Tirtir</button>
                    </td>
                  </tr>
                ))}
                {data.expenses.length === 0 && (
                  <tr><td colSpan={7} className="text-center text-ink/40 py-6">Kharash lama diiwaan gelin.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      <ConfirmDeleteModal
        open={!!deleteTarget}
        title="Tirtir Kharashka?"
        message={deleteTarget ? `Waxaad tirtirayaa ${deleteTarget.voucherNumber} (${deleteTarget.description} — ${formatMoney(deleteTarget.amount)}). Lama soo celin karo.` : ""}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default Expenses;
