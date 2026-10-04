import { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import staffApi from "../../api/staffClient";
import { ScreenHeader, Loading, Card, ScreenModal, Field, Chip, ChipRow, PrimaryButton, ErrorText } from "../../components/StaffUI";
import ConfirmPasswordModal from "../../components/ConfirmPasswordModal";
import MonthNav from "../../components/MonthNav";
import SalaryPanel from "../../components/SalaryPanel";
import EmployeesPanel from "../../components/EmployeesPanel";
import { COLORS, formatMoney, formatDate } from "../../utils/format";
import { EXPENSE_CATEGORIES, EMPLOYEE_TYPES, PAYMENT_METHODS, currentMonth, monthLabel, shiftMonth, todayISO, isValidDate } from "../../utils/finance";

// Not a stored expense category: choosing it switches to salary payments to
// teachers / staff (their own table), so everything the school pays out lives on this one screen.
const SALARY_KEY = "__salary__";
const SALARY_LABEL = "Mushaharka (Shaqaalaha)";

// Same rule as the server: a description is real text, not just a number.
const descriptionError = (text) => {
  const t = text.trim();
  if (t.length < 3) return "Sharaxaadda aad bay u gaaban tahay (ugu yaraan 3 xaraf).";
  if (!/\p{L}/u.test(t)) return "Sharaxaadda waa inay noqotaa qoraal (ereyo), ma aha lambar kaliya.";
  return "";
};

const emptyForm = () => ({ category: EXPENSE_CATEGORIES[0], description: "", amount: "", expenseDate: todayISO(), paymentMethod: "Cash", notes: "" });

// The "Mushaharka" branch of the new-expense form: pick Macalin or Shaqaale,
// then the person, then pay.
const SalaryEntry = ({ initialPeriod, onSaved, onNeedEmployees }) => {
  const [period, setPeriod] = useState(initialPeriod);
  const [empType, setEmpType] = useState("teacher");
  const [rows, setRows] = useState(null);
  const [employeeId, setEmployeeId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO());
  const [method, setMethod] = useState("Cash");
  const [notes, setNotes] = useState("");
  const [allow, setAllow] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setRows(null);
    setEmployeeId("");
    setAmount("");
    staffApi.get("/salaries/summary", { params: { period } }).then((res) => setRows(res.data.rows));
  }, [period]);

  const candidates = (rows || []).filter((r) => r.employee.type === empType && r.employee.status === "active");
  const selected = candidates.find((r) => r.employee._id === employeeId);

  const pick = (row) => {
    if (row.payments.length > 0) return; // already paid this month — edit that payment instead
    setEmployeeId(row.employee._id);
    setAmount(row.balance > 0 ? String(row.balance) : "");
  };

  const changeType = (t) => {
    setEmpType(t);
    setEmployeeId("");
    setAmount("");
  };

  const submit = async () => {
    if (!employeeId) return setError(`Fadlan dooro ${EMPLOYEE_TYPES[empType].toLowerCase()}.`);
    if (!(Number(amount) > 0)) return setError("Lacagta waa inay ka weyn tahay 0.");
    if (!isValidDate(date)) return setError("Taariikhda u qor sida YYYY-MM-DD.");
    setError("");
    setSaving(true);
    try {
      await staffApi.post("/salaries", { employeeId, period, amount: Number(amount), paymentDate: date, paymentMethod: method, notes, allowOverpayment: allow });
      onSaved(period);
    } catch (err) {
      setError(err.response?.data?.message || "Khalad ayaa dhacay.");
      setSaving(false);
    }
  };

  return (
    <>
      <ErrorText text={error} />
      <Text style={styles.label}>Dooro *</Text>
      <ChipRow>
        {Object.entries(EMPLOYEE_TYPES).map(([key, label]) => (
          <Chip key={key} label={label} active={empType === key} onPress={() => changeType(key)} />
        ))}
      </ChipRow>

      <Text style={styles.label}>Bisha mushaharka</Text>
      <View style={styles.periodRow}>
        <TouchableOpacity style={styles.stepBtn} onPress={() => setPeriod(shiftMonth(period, -1))}>
          <Text style={styles.stepText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.periodText}>{monthLabel(period)}</Text>
        <TouchableOpacity style={styles.stepBtn} onPress={() => setPeriod(shiftMonth(period, 1))}>
          <Text style={styles.stepText}>›</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>{EMPLOYEE_TYPES[empType]} *</Text>
      {rows === null ? (
        <Text style={styles.sub}>Waa la soo shubayaa...</Text>
      ) : candidates.length === 0 ? (
        <View>
          <Text style={styles.sub}>{EMPLOYEE_TYPES[empType]} Active ah ma jiro.</Text>
          <TouchableOpacity onPress={onNeedEmployees}>
            <Text style={styles.link}>Ku dar halkan</Text>
          </TouchableOpacity>
        </View>
      ) : (
        candidates.map((r) => (
          <TouchableOpacity
            key={r.employee._id}
            style={[styles.pick, employeeId === r.employee._id && styles.pickActive, r.payments.length > 0 && { opacity: 0.5 }]}
            onPress={() => pick(r)}
            disabled={r.payments.length > 0}
          >
            <Text style={[styles.pickName, employeeId === r.employee._id && { color: "#fff" }]}>
              {r.employee.fullName}
            </Text>
            <Text style={[styles.pickSub, employeeId === r.employee._id && { color: "rgba(255,255,255,0.8)" }]}>
              {r.payments.length > 0 ? "bishan horey la bixiyey — Edit ka samee" : `mushahar ${formatMoney(r.monthlySalary)}`}
            </Text>
          </TouchableOpacity>
        ))
      )}
      {selected && (
        <Text style={styles.sub}>Mushaharka bishii: {formatMoney(selected.monthlySalary)}</Text>
      )}

      <Field label="Lacagta ($) *" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
      <Field label="Taariikhda (YYYY-MM-DD)" value={date} onChangeText={setDate} autoCapitalize="none" />
      <Text style={styles.label}>Habka Lacag Bixinta</Text>
      <ChipRow>
        {PAYMENT_METHODS.map((m) => (
          <Chip key={m} label={m} active={method === m} onPress={() => setMethod(m)} />
        ))}
      </ChipRow>
      <Field label="Faallo (ikhtiyaari)" value={notes} onChangeText={setNotes} />
      <View style={{ marginTop: 12 }}>
        <ChipRow>
          <Chip label="Ogolow in ka badato mushaharka (bonus)" active={allow} onPress={() => setAllow(!allow)} />
        </ChipRow>
      </View>
      <Text style={[styles.sub, { marginTop: 10 }]}>Hal mar bishii ayaa la bixiyaa. Haddii aad rabto inaad wax ka beddesho, ka dooro Mushaharka oo Edit samee.</Text>
      <PrimaryButton title="Bixi Mushaharka" onPress={submit} loading={saving} />
    </>
  );
};

const StaffExpensesScreen = ({ navigation }) => {
  const [month, setMonth] = useState(currentMonth()); // "" = every month
  const [category, setCategory] = useState(""); // "" | SALARY_KEY | an expense category
  const [data, setData] = useState(null);
  const [salaryPaid, setSalaryPaid] = useState(null); // salaries paid for `month`, shown on the "all" view

  const [salaryTab, setSalaryTab] = useState("payroll"); // "payroll" | "employees"
  const [refreshKey, setRefreshKey] = useState(0);

  const [form, setForm] = useState(null); // null = closed; { _id } present = editing
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const isSalaryView = category === SALARY_KEY;

  // Salaries are per month, so the salary view always needs one.
  useEffect(() => {
    if (isSalaryView && !month) setMonth(currentMonth());
  }, [isSalaryView, month]);

  const load = useCallback(async () => {
    if (isSalaryView) return;
    const res = await staffApi.get("/expenses", { params: { month: month || undefined, category: category || undefined } });
    setData(res.data);
    if (category === "" && month) {
      const s = await staffApi.get("/salaries/summary", { params: { period: month } });
      setSalaryPaid(s.data.totals.paid);
    } else {
      setSalaryPaid(null);
    }
  }, [month, category, isSalaryView]);

  useEffect(() => {
    setData(null);
    load();
  }, [load]);

  useEffect(() => navigation.addListener("focus", load), [navigation, load]);

  const openNew = () => {
    setError("");
    setForm({ ...emptyForm(), category: isSalaryView ? SALARY_KEY : category || EXPENSE_CATEGORIES[0] });
  };

  const openEdit = (x) => {
    setError("");
    setForm({
      _id: x._id,
      category: x.category,
      description: x.description,
      amount: String(x.amount),
      expenseDate: x.expenseDate.slice(0, 10),
      paymentMethod: x.paymentMethod,
      notes: x.notes || "",
    });
  };

  const save = async () => {
    if (!form.description.trim()) return setError("Fadlan sharax kharashka.");
    const problem = descriptionError(form.description);
    if (problem) return setError(problem);
    if (!(Number(form.amount) > 0)) return setError("Lacagta waa inay ka weyn tahay 0.");
    if (!isValidDate(form.expenseDate)) return setError("Taariikhda u qor sida YYYY-MM-DD.");
    setError("");
    setSaving(true);
    try {
      const { _id, ...rest } = form;
      const payload = { ...rest, amount: Number(rest.amount) };
      if (_id) await staffApi.put(`/expenses/${_id}`, payload);
      else await staffApi.post("/expenses", payload);
      setForm(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Khalad ayaa dhacay.");
    } finally {
      setSaving(false);
    }
  };

  // After paying a salary from the form, jump to the salary view for that month so the payment is visible.
  const handleSalarySaved = (period) => {
    setForm(null);
    setMonth(period);
    setSalaryTab("payroll");
    setCategory(SALARY_KEY);
    setRefreshKey((k) => k + 1);
  };

  const goToEmployees = () => {
    setForm(null);
    setSalaryTab("employees");
    setCategory(SALARY_KEY);
  };

  const handleDelete = async () => {
    await staffApi.delete(`/expenses/${deleteTarget._id}`);
    setDeleteTarget(null);
    load();
  };

  const editing = !!form?._id;
  const isSalaryForm = form?.category === SALARY_KEY && !editing;
  // A category already stored but not in the preset list stays selectable while editing.
  const formCategories = form && form.category !== SALARY_KEY && !EXPENSE_CATEGORIES.includes(form.category) ? [form.category, ...EXPENSE_CATEGORIES] : EXPENSE_CATEGORIES;
  const showSalaryCard = category === "" && !!month && salaryPaid !== null;

  return (
    <View style={styles.flex}>
      <ScreenHeader
        title={isSalaryView ? "Mushaharka" : "Qarashaadka"}
        onBack={navigation.goBack}
        right={
          <TouchableOpacity onPress={openNew}>
            <Text style={styles.add}>+ Cusub</Text>
          </TouchableOpacity>
        }
      />

      {month ? <MonthNav period={month} onChange={setMonth} /> : <Text style={styles.allLabel}>Dhammaan bilaha</Text>}
      {!isSalaryView && (
        <View style={styles.monthToggle}>
          <Chip label={month ? "Tus dhammaan bilaha" : "Dooro bil"} active={!month} onPress={() => setMonth(month ? "" : currentMonth())} />
        </View>
      )}

      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 8 }}>
          <Chip label="Dhammaan" active={category === ""} onPress={() => setCategory("")} />
          <Chip label="Mushaharka" active={isSalaryView} onPress={() => setCategory(SALARY_KEY)} />
          {EXPENSE_CATEGORIES.map((c) => (
            <Chip key={c} label={c} active={category === c} onPress={() => setCategory(c)} />
          ))}
        </ScrollView>
      </View>

      {isSalaryView ? (
        <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <View style={{ marginBottom: 12 }}>
            <ChipRow>
              <Chip label="Mushaharka" active={salaryTab === "payroll"} onPress={() => setSalaryTab("payroll")} />
              <Chip label="Shaqaalaha (liiska)" active={salaryTab === "employees"} onPress={() => setSalaryTab("employees")} />
            </ChipRow>
          </View>
          {salaryTab === "payroll" ? month ? <SalaryPanel period={month} refreshKey={refreshKey} /> : null : <EmployeesPanel />}
        </ScrollView>
      ) : data === null ? (
        <Loading />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 40 }}>
          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>Wadarta Qarashaadka</Text>
            <Text style={styles.totalValue}>{formatMoney(data.total + (showSalaryCard ? salaryPaid : 0))}</Text>
            {showSalaryCard && (
              <TouchableOpacity onPress={() => setCategory(SALARY_KEY)}>
                <Text style={styles.totalSub}>
                  Qarashaadka kale {formatMoney(data.total)} · Mushaharka {formatMoney(salaryPaid)}  (fur →)
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {data.expenses.length === 0 && <Text style={styles.empty}>Kharash lama diiwaan gelin.</Text>}

          {data.expenses.map((x) => (
            <Card key={x._id}>
              <View style={styles.head}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{x.description}</Text>
                  <Text style={styles.sub}>
                    {x.category} · {formatDate(x.expenseDate)} · {x.paymentMethod}
                  </Text>
                  <Text style={styles.sub}>{x.voucherNumber}</Text>
                  {x.notes ? <Text style={styles.sub}>{x.notes}</Text> : null}
                </View>
                <Text style={styles.amount}>{formatMoney(x.amount)}</Text>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => openEdit(x)}>
                  <Text style={styles.link}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setDeleteTarget(x)}>
                  <Text style={styles.linkDanger}>Tirtir</Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))}
        </ScrollView>
      )}

      <ScreenModal visible={!!form} title={editing ? "Wax Ka Beddel Kharashka" : "Kharash Cusub"} onClose={() => setForm(null)}>
        {form && (
          <>
            <Text style={styles.label}>Nooca *</Text>
            <ChipRow>
              {!editing && <Chip label={SALARY_LABEL} active={form.category === SALARY_KEY} onPress={() => setForm({ ...form, category: SALARY_KEY })} />}
              {formCategories.map((c) => (
                <Chip key={c} label={c} active={form.category === c} onPress={() => setForm({ ...form, category: c })} />
              ))}
            </ChipRow>

            {isSalaryForm ? (
              <SalaryEntry initialPeriod={month || currentMonth()} onSaved={handleSalarySaved} onNeedEmployees={goToEmployees} />
            ) : (
              <>
                <ErrorText text={error} />
                {!editing && form.category !== "Kale" && (
                  <Text style={styles.sub}>Nooc kasta hal mar bishii ayaa la diiwaan gelin karaa. Haddii aad rabto inaad wax ka beddesho, liiska ka dooro oo Edit samee.</Text>
                )}
                <Field label="Sharaxaad *" value={form.description} onChangeText={(v) => setForm({ ...form, description: v })} placeholder="Tusaale: Biilka korontada" />
                <Field label="Lacagta ($) *" value={form.amount} onChangeText={(v) => setForm({ ...form, amount: v })} keyboardType="decimal-pad" />
                <Field label="Taariikhda (YYYY-MM-DD)" value={form.expenseDate} onChangeText={(v) => setForm({ ...form, expenseDate: v })} autoCapitalize="none" />
                <Text style={styles.label}>Habka Lacag Bixinta</Text>
                <ChipRow>
                  {PAYMENT_METHODS.map((m) => (
                    <Chip key={m} label={m} active={form.paymentMethod === m} onPress={() => setForm({ ...form, paymentMethod: m })} />
                  ))}
                </ChipRow>
                <Field label="Faallo (ikhtiyaari)" value={form.notes} onChangeText={(v) => setForm({ ...form, notes: v })} />
                <PrimaryButton title="Kaydi" onPress={save} loading={saving} />
              </>
            )}
          </>
        )}
      </ScreenModal>

      <ConfirmPasswordModal
        visible={!!deleteTarget}
        title="Tirtir Kharashka?"
        message={deleteTarget ? `Waxaad tirtirayaa ${deleteTarget.voucherNumber} (${deleteTarget.description} — ${formatMoney(deleteTarget.amount)}). Lama soo celin karo.` : ""}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.paper },
  add: { color: "#fff", fontSize: 13, fontWeight: "600" },
  allLabel: { textAlign: "center", fontSize: 16, fontWeight: "700", color: COLORS.ink, paddingVertical: 14 },
  monthToggle: { flexDirection: "row", justifyContent: "center", paddingBottom: 8 },
  totalBox: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: COLORS.line },
  totalLabel: { fontSize: 10, color: "rgba(20,24,33,0.5)", textTransform: "uppercase", letterSpacing: 0.5 },
  totalValue: { fontSize: 22, fontWeight: "700", color: COLORS.danger, marginTop: 4 },
  totalSub: { fontSize: 12, color: COLORS.navy, marginTop: 6 },
  empty: { textAlign: "center", color: "rgba(20,24,33,0.4)", paddingVertical: 30 },
  head: { flexDirection: "row", alignItems: "flex-start" },
  name: { fontSize: 15, fontWeight: "600", color: COLORS.ink },
  sub: { fontSize: 12, color: "rgba(20,24,33,0.5)", marginTop: 2 },
  amount: { fontSize: 15, fontWeight: "700", color: COLORS.ink, marginLeft: 10 },
  actions: { flexDirection: "row", gap: 18, marginTop: 10, borderTopWidth: 1, borderTopColor: COLORS.line, paddingTop: 10 },
  link: { color: COLORS.navy, fontSize: 13, fontWeight: "600" },
  linkDanger: { color: COLORS.danger, fontSize: 13, fontWeight: "600" },
  label: { fontSize: 13, color: "rgba(20,24,33,0.7)", marginBottom: 6, marginTop: 12 },
  periodRow: { flexDirection: "row", alignItems: "center" },
  stepBtn: { width: 40, height: 36, borderRadius: 999, borderWidth: 1, borderColor: COLORS.line, backgroundColor: COLORS.surface, alignItems: "center", justifyContent: "center" },
  stepText: { fontSize: 20, color: COLORS.ink, marginTop: -2 },
  periodText: { minWidth: 150, textAlign: "center", fontSize: 15, fontWeight: "700", color: COLORS.ink },
  pick: { borderWidth: 1, borderColor: COLORS.line, borderRadius: 10, backgroundColor: COLORS.surface, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 6 },
  pickActive: { backgroundColor: COLORS.navy, borderColor: COLORS.navy },
  pickName: { fontSize: 14, fontWeight: "600", color: COLORS.ink },
  pickSub: { fontSize: 12, color: "rgba(20,24,33,0.55)", marginTop: 2 },
});

export default StaffExpensesScreen;
