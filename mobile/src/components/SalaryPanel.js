import { useCallback, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import financeApi, { verifyFinancePassword } from "../api/financeClient";
import { Loading, Card, Badge, ScreenModal, Field, Chip, ChipRow, PrimaryButton, ErrorText, feeStatusColor, feeStatusText } from "./StaffUI";
import ConfirmPasswordModal from "./ConfirmPasswordModal";
import { COLORS, formatMoney, formatDate } from "../utils/format";
import { EMPLOYEE_TYPES, PAYMENT_METHODS, monthLabel, todayISO, isValidDate } from "../utils/finance";
import { t } from "../i18n";

const Stat = ({ label, value, color }) => (
  <View style={styles.stat}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={[styles.statValue, color && { color }]}>{value}</Text>
  </View>
);

// Payroll for one month, shown inside the Qarashaadka screen when the
// "Mushaharka" category is chosen. The month comes from the screen.
const SalaryPanel = ({ period, refreshKey }) => {
  const [data, setData] = useState(null);
  const [type, setType] = useState(""); // "" = Macalin + Shaqaale

  const [pay, setPay] = useState(null); // { row, amount, date, method, notes, allow }
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = useCallback(async () => {
    const res = await financeApi.get("/salaries/summary", { params: { period } });
    setData(res.data);
  }, [period]);

  useEffect(() => {
    setData(null);
    load();
  }, [load, refreshKey]);

  const rows = (data?.rows || []).filter((r) => !type || r.employee.type === type);
  const totals = {
    salary: rows.reduce((s, r) => s + r.monthlySalary, 0),
    paid: rows.reduce((s, r) => s + r.totalPaid, 0),
    balance: rows.reduce((s, r) => s + r.balance, 0),
  };

  // One payment per employee per month: "Bixi" records it, "Edit" changes the one already recorded.
  const openPay = (row, payment) => {
    setError("");
    setPay(
      payment
        ? { row, payment, amount: String(payment.amount), date: payment.paymentDate.slice(0, 10), method: payment.paymentMethod, notes: payment.notes || "", allow: false }
        : { row, amount: row.balance > 0 ? String(row.balance) : "", date: todayISO(), method: "Cash", notes: "", allow: false }
    );
  };

  const submitPay = async () => {
    const amount = Number(pay.amount);
    if (!(amount > 0)) return setError(t("Lacagta waa inay ka weyn tahay 0."));
    if (!isValidDate(pay.date)) return setError(t("Taariikhda u qor sida YYYY-MM-DD."));
    setError("");
    setSaving(true);
    try {
      const body = { amount, paymentDate: pay.date, paymentMethod: pay.method, notes: pay.notes, allowOverpayment: pay.allow };
      if (pay.payment) await financeApi.put(`/salaries/${pay.payment._id}`, body);
      else await financeApi.post("/salaries", { ...body, employeeId: pay.row.employee._id, period });
      setPay(null);
      load();
    } catch (err) {
      setError(t(err.response?.data?.message || "Khalad ayaa dhacay."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    await financeApi.delete(`/salaries/${deleteTarget._id}`);
    setDeleteTarget(null);
    load();
  };

  return (
    <View>
      <ChipRow>
        <Chip label={t("Dhammaan")} active={type === ""} onPress={() => setType("")} />
        <Chip label={t("Macalimiin")} active={type === "teacher"} onPress={() => setType("teacher")} />
        <Chip label={t("Shaqaale")} active={type === "staff"} onPress={() => setType("staff")} />
      </ChipRow>

      {data === null ? (
        <View style={{ height: 120 }}>
          <Loading />
        </View>
      ) : (
        <View style={{ marginTop: 12 }}>
          <View style={styles.statsRow}>
            <Stat label={t("Mushahar")} value={formatMoney(totals.salary)} />
            <Stat label={t("La Bixiyey")} value={formatMoney(totals.paid)} color={COLORS.success} />
            <Stat label={t("Ku Dhiman")} value={formatMoney(totals.balance)} color={COLORS.danger} />
          </View>

          {rows.length === 0 && <Text style={styles.empty}>{t("Shaqaale Active ah ma jiro. Ku dar tab-ka \"Shaqaalaha\".")}</Text>}

          {rows.map((r) => (
            <Card key={r.employee._id}>
              <View style={styles.head}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{r.employee.fullName}</Text>
                  <Text style={styles.sub}>
                    {r.employee.employeeId} · {EMPLOYEE_TYPES[r.employee.type]}
                    {r.employee.position ? ` · ${r.employee.position}` : ""}
                  </Text>
                </View>
                <Badge text={feeStatusText(r.status)} color={feeStatusColor(r.status)} />
              </View>

              <View style={styles.amounts}>
                <View style={styles.amountCol}>
                  <Text style={styles.amountLabel}>{t("Mushahar")}</Text>
                  <Text style={styles.amountValue}>{formatMoney(r.monthlySalary)}</Text>
                </View>
                <View style={styles.amountCol}>
                  <Text style={styles.amountLabel}>{t("La Bixiyey")}</Text>
                  <Text style={[styles.amountValue, { color: COLORS.success }]}>{formatMoney(r.totalPaid)}</Text>
                </View>
                <View style={styles.amountCol}>
                  <Text style={styles.amountLabel}>{t("Ku Dhiman")}</Text>
                  <Text style={[styles.amountValue, { color: COLORS.danger }]}>{formatMoney(r.balance)}</Text>
                </View>
              </View>

              {r.payments.map((p) => (
                <View key={p._id} style={styles.payRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.payText}>
                      {p.voucherNumber} · {formatDate(p.paymentDate)} · {t(p.paymentMethod)}
                    </Text>
                    {p.notes ? <Text style={styles.sub}>{p.notes}</Text> : null}
                  </View>
                  <Text style={styles.payAmount}>{formatMoney(p.amount)}</Text>
                  <TouchableOpacity onPress={() => openPay(r, p)} style={{ marginLeft: 12 }}>
                    <Text style={styles.link}>{t("Edit")}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setDeleteTarget({ ...p, employee: r.employee })} style={{ marginLeft: 12 }}>
                    <Text style={styles.linkDanger}>{t("Tirtir")}</Text>
                  </TouchableOpacity>
                </View>
              ))}

              {r.payments.length === 0 && (
                <TouchableOpacity style={styles.payBtn} onPress={() => openPay(r)}>
                  <Text style={styles.payBtnText}>{t("Bixi Mushahar")}</Text>
                </TouchableOpacity>
              )}
            </Card>
          ))}
        </View>
      )}

      <ScreenModal visible={!!pay} title={pay?.payment ? t("Wax Ka Beddel Mushaharka") : t("Bixi Mushaharka")} onClose={() => setPay(null)}>
        <ErrorText text={error} />
        {pay && (
          <>
            <Text style={styles.modalName}>{pay.row.employee.fullName}</Text>
            <Text style={styles.sub}>
              {monthLabel(period)} {t("· Mushahar")} {formatMoney(pay.row.monthlySalary)} {t("· Ku dhiman")} {formatMoney(pay.row.balance)}
            </Text>
            <Field label={t("Lacagta ($) *")} value={pay.amount} onChangeText={(v) => setPay({ ...pay, amount: v })} keyboardType="decimal-pad" />
            <Field label={t("Taariikhda (YYYY-MM-DD)")} value={pay.date} onChangeText={(v) => setPay({ ...pay, date: v })} autoCapitalize="none" />
            <Text style={styles.label}>{t("Habka")}</Text>
            <ChipRow>
              {PAYMENT_METHODS.map((m) => (
                <Chip key={m} label={t(m)} active={pay.method === m} onPress={() => setPay({ ...pay, method: m })} />
              ))}
            </ChipRow>
            <Field label={t("Faallo (ikhtiyaari)")} value={pay.notes} onChangeText={(v) => setPay({ ...pay, notes: v })} />
            <View style={{ marginTop: 12 }}>
              <ChipRow>
                <Chip label={t("Ogolow in ka badato mushaharka (bonus)")} active={pay.allow} onPress={() => setPay({ ...pay, allow: !pay.allow })} />
              </ChipRow>
            </View>
            <PrimaryButton title={pay.payment ? t("Kaydi") : t("Bixi")} onPress={submitPay} loading={saving} />
          </>
        )}
      </ScreenModal>

      <ConfirmPasswordModal
        visible={!!deleteTarget}
        title={t("Tirtir Mushaharka La Bixiyey?")}
        message={
          deleteTarget
            ? t("Waxaad tirtirayaa {voucher} ({amount} — {name}). Ku dhimanka shaqaalahan ayaa dib u kordhi doona.", { voucher: deleteTarget.voucherNumber, amount: formatMoney(deleteTarget.amount), name: deleteTarget.employee.fullName })
            : ""
        }
        verify={verifyFinancePassword}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  stat: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: COLORS.line },
  statLabel: { fontSize: 10, color: "rgba(20,24,33,0.5)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: "700", color: COLORS.ink },
  empty: { textAlign: "center", color: "rgba(20,24,33,0.4)", paddingVertical: 30 },
  head: { flexDirection: "row", alignItems: "center" },
  name: { fontSize: 15, fontWeight: "600", color: COLORS.ink },
  sub: { fontSize: 12, color: "rgba(20,24,33,0.5)", marginTop: 2 },
  amounts: { flexDirection: "row", marginTop: 12 },
  amountCol: { flex: 1 },
  amountLabel: { fontSize: 10, color: "rgba(20,24,33,0.5)", textTransform: "uppercase" },
  amountValue: { fontSize: 15, fontWeight: "700", color: COLORS.ink, marginTop: 2 },
  payRow: { flexDirection: "row", alignItems: "center", marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.line },
  payText: { fontSize: 12, color: COLORS.ink },
  payAmount: { fontSize: 13, fontWeight: "700", color: COLORS.ink },
  link: { color: COLORS.navy, fontSize: 12, fontWeight: "600" },
  linkDanger: { color: COLORS.danger, fontSize: 12, fontWeight: "600" },
  payBtn: { backgroundColor: COLORS.brand, borderRadius: 999, paddingVertical: 10, alignItems: "center", marginTop: 12 },
  payBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  modalName: { fontSize: 17, fontWeight: "700", color: COLORS.ink },
  label: { fontSize: 13, color: "rgba(20,24,33,0.7)", marginBottom: 6, marginTop: 12 },
});

export default SalaryPanel;
