import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import financeApi from "../api/financeClient";
import { Field, Chip, ChipRow, Segmented, PrimaryButton, ErrorText, Avatar } from "./StaffUI";
import MonthNav from "./MonthNav";
import Icon from "./Icon";
import { COLORS, RADIUS } from "../utils/theme";
import { formatMoney } from "../utils/format";
import { EMPLOYEE_TYPES, PAYMENT_METHODS, todayISO, isValidDate } from "../utils/finance";
import { t } from "../i18n";

// "Bixi Mushahar" form: choose Macalin or Shaqaale, then the person, then pay.
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
    financeApi.get("/salaries/summary", { params: { period } }).then((res) => setRows(res.data.rows));
  }, [period]);

  const candidates = (rows || []).filter((r) => r.employee.type === empType && r.employee.status === "active");
  const selected = candidates.find((r) => r.employee._id === employeeId);

  const pick = (row) => {
    if (row.payments.length > 0) return; // already paid this month — edit that payment instead
    setEmployeeId(row.employee._id);
    setAmount(row.balance > 0 ? String(row.balance) : "");
  };

  const changeType = (type) => {
    setEmpType(type);
    setEmployeeId("");
    setAmount("");
  };

  const submit = async () => {
    if (!employeeId) return setError(t("Fadlan dooro {type}.", { type: EMPLOYEE_TYPES[empType] }));
    if (!(Number(amount) > 0)) return setError(t("Lacagta waa inay ka weyn tahay 0."));
    if (!isValidDate(date)) return setError(t("Taariikhda u qor sida YYYY-MM-DD."));
    setError("");
    setSaving(true);
    try {
      await financeApi.post("/salaries", { employeeId, period, amount: Number(amount), paymentDate: date, paymentMethod: method, notes, allowOverpayment: allow });
      onSaved(period);
    } catch (err) {
      setError(t(err.response?.data?.message || "Khalad ayaa dhacay."));
      setSaving(false);
    }
  };

  return (
    <>
      <ErrorText text={error} />

      <Text style={styles.step}>{t("1. Dooro")}</Text>
      <Segmented
        value={empType}
        onChange={changeType}
        options={Object.entries(EMPLOYEE_TYPES).map(([value, label]) => ({ value, label }))}
      />

      <Text style={styles.step}>{t("2. Bisha mushaharka")}</Text>
      <MonthNav period={period} onChange={setPeriod} />

      <Text style={styles.step}>
        {t("3.")} {EMPLOYEE_TYPES[empType]}
      </Text>
      {rows === null ? (
        <Text style={styles.sub}>{t("Waa la soo shubayaa...")}</Text>
      ) : candidates.length === 0 ? (
        <View style={styles.none}>
          <Text style={styles.sub}>
            {EMPLOYEE_TYPES[empType]} {t("Active ah ma jiro.")}
          </Text>
          <TouchableOpacity onPress={onNeedEmployees}>
            <Text style={styles.link}>{t("Ku dar halkan")}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        candidates.map((r) => {
          const paid = r.payments.length > 0;
          const active = employeeId === r.employee._id;
          return (
            <TouchableOpacity key={r.employee._id} style={[styles.pick, active && styles.pickActive, paid && { opacity: 0.55 }]} onPress={() => pick(r)} disabled={paid} activeOpacity={0.8}>
              <Avatar name={r.employee.fullName} size={38} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.pickName, active && { color: COLORS.navy }]}>{r.employee.fullName}</Text>
                <Text style={styles.pickSub}>
                  {paid ? t("bishan horey la bixiyey — Edit ka samee") : t("mushahar {amount}", { amount: formatMoney(r.monthlySalary) })}
                </Text>
              </View>
              {active ? <Icon name="checkmark-circle" size={22} color={COLORS.navy} /> : paid ? <Icon name="lock-closed" size={16} color={COLORS.faint} /> : null}
            </TouchableOpacity>
          );
        })
      )}
      {selected ? <Text style={styles.sub}>{t("Mushaharka bishii:")} {formatMoney(selected.monthlySalary)}</Text> : null}

      <Field label={t("Lacagta ($) *")} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
      <Field label={t("Taariikhda (YYYY-MM-DD)")} value={date} onChangeText={setDate} autoCapitalize="none" />
      <Text style={styles.label}>{t("Habka Lacag Bixinta")}</Text>
      <ChipRow>
        {PAYMENT_METHODS.map((m) => (
          <Chip key={m} label={t(m)} active={method === m} onPress={() => setMethod(m)} />
        ))}
      </ChipRow>
      <Field label={t("Faallo (ikhtiyaari)")} value={notes} onChangeText={setNotes} />
      <View style={{ marginTop: 12 }}>
        <ChipRow>
          <Chip label={t("Ogolow in ka badato mushaharka (bonus)")} active={allow} onPress={() => setAllow(!allow)} />
        </ChipRow>
      </View>
      <Text style={[styles.sub, { marginTop: 10 }]}>{t("Hal mar bishii ayaa la bixiyaa. Haddii aad rabto inaad wax ka beddesho, ka dooro Mushaharka oo Edit samee.")}</Text>
      <PrimaryButton title={t("Bixi Mushaharka")} onPress={submit} loading={saving} />
    </>
  );
};

const styles = StyleSheet.create({
  step: { fontSize: 13, fontWeight: "800", color: COLORS.navy, marginTop: 18, marginBottom: 8 },
  label: { fontSize: 12.5, color: COLORS.muted, fontWeight: "600", marginBottom: 6, marginTop: 14 },
  sub: { fontSize: 12, color: COLORS.muted, marginTop: 6 },
  link: { color: COLORS.brand, fontSize: 13, fontWeight: "700", marginTop: 6 },
  none: { backgroundColor: COLORS.paper, borderRadius: RADIUS.md, padding: 14 },
  pick: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: 12, marginBottom: 8, borderWidth: 1.2, borderColor: COLORS.line },
  pickActive: { borderColor: COLORS.navy, backgroundColor: COLORS.navyTint },
  pickName: { fontSize: 14, fontWeight: "700", color: COLORS.ink },
  pickSub: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
});

export default SalaryEntry;
