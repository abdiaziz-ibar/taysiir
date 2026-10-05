import { useCallback, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import financeApi, { verifyFinancePassword } from "../api/financeClient";
import { Loading, Card, Badge, ScreenModal, Field, Chip, ChipRow, Segmented, PrimaryButton, ErrorText, Avatar, EmptyState, feeStatusColor, feeStatusText } from "./StaffUI";
import ConfirmPasswordModal from "./ConfirmPasswordModal";
import Icon from "./Icon";
import { COLORS, RADIUS, SHADOW, formatMoney, formatDate } from "../utils/format";
import { EMPLOYEE_TYPES, PAYMENT_METHODS, monthLabel, todayISO, isValidDate } from "../utils/finance";
import { t } from "../i18n";

// Payroll for one month: a summary, a Macalin/Shaqaale switch, and one card per person.
// The month comes from the screen that hosts it.
const SalaryPanel = ({ period, refreshKey }) => {
  const [data, setData] = useState(null);
  const [type, setType] = useState(""); // "" = Macalin + Shaqaale

  const [pay, setPay] = useState(null); // { row, payment?, amount, date, method, notes, allow }
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
  const pct = totals.salary > 0 ? Math.min(100, Math.round((totals.paid / totals.salary) * 100)) : 0;

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
      <Segmented
        value={type}
        onChange={setType}
        options={[
          { value: "", label: t("Dhammaan") },
          { value: "teacher", label: t("Macalimiin") },
          { value: "staff", label: t("Shaqaale") },
        ]}
      />

      {data === null ? (
        <View style={{ height: 140 }}>
          <Loading />
        </View>
      ) : (
        <View style={{ marginTop: 14 }}>
          <View style={styles.summary}>
            <View style={styles.summaryTop}>
              <View style={styles.sumCol}>
                <Text style={styles.sumLabel}>{t("Mushahar")}</Text>
                <Text style={styles.sumValue}>{formatMoney(totals.salary)}</Text>
              </View>
              <View style={styles.sumCol}>
                <Text style={styles.sumLabel}>{t("La Bixiyey")}</Text>
                <Text style={[styles.sumValue, { color: COLORS.success }]}>{formatMoney(totals.paid)}</Text>
              </View>
              <View style={styles.sumCol}>
                <Text style={styles.sumLabel}>{t("Ku Dhiman")}</Text>
                <Text style={[styles.sumValue, { color: COLORS.danger }]}>{formatMoney(totals.balance)}</Text>
              </View>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${pct}%` }]} />
            </View>
          </View>

          {rows.length === 0 ? (
            <EmptyState icon="people-outline" text={t("Shaqaale Active ah ma jiro.")} />
          ) : (
            rows.map((r) => {
              const paidRow = r.payments.length > 0;
              const p = r.payments[0];
              return (
                <Card key={r.employee._id}>
                  <View style={styles.head}>
                    <Avatar name={r.employee.fullName} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.name} numberOfLines={1}>
                        {r.employee.fullName}
                      </Text>
                      <Text style={styles.sub} numberOfLines={1}>
                        {EMPLOYEE_TYPES[r.employee.type]}
                        {r.employee.position ? ` · ${r.employee.position}` : ""}
                      </Text>
                    </View>
                    <Badge text={feeStatusText(r.status)} color={feeStatusColor(r.status)} />
                  </View>

                  <View style={styles.amountRow}>
                    <Text style={styles.amountMain}>
                      {formatMoney(r.totalPaid)} <Text style={styles.amountOf}>/ {formatMoney(r.monthlySalary)}</Text>
                    </Text>
                    {r.balance > 0 ? <Text style={styles.amountLeft}>{formatMoney(r.balance)} {t("Ku Dhiman")}</Text> : null}
                  </View>

                  {paidRow ? (
                    <Text style={styles.meta}>
                      {p.voucherNumber} · {formatDate(p.paymentDate)} · {t(p.paymentMethod)}
                    </Text>
                  ) : null}

                  <View style={styles.actions}>
                    {!paidRow ? (
                      <TouchableOpacity style={styles.primary} onPress={() => openPay(r)} activeOpacity={0.85}>
                        <Icon name="cash-outline" size={17} color="#fff" />
                        <Text style={styles.primaryText}>{t("Bixi Mushahar")}</Text>
                      </TouchableOpacity>
                    ) : (
                      <>
                        <TouchableOpacity style={styles.outline} onPress={() => openPay(r, p)} activeOpacity={0.85}>
                          <Icon name="create-outline" size={17} color={COLORS.navy} />
                          <Text style={styles.outlineText}>{t("Edit")}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.danger} onPress={() => setDeleteTarget({ ...p, employee: r.employee })} activeOpacity={0.85}>
                          <Icon name="trash-outline" size={17} color={COLORS.danger} />
                          <Text style={styles.dangerText}>{t("Tirtir")}</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </Card>
              );
            })
          )}
        </View>
      )}

      <ScreenModal visible={!!pay} title={pay?.payment ? t("Wax Ka Beddel Mushaharka") : t("Bixi Mushaharka")} onClose={() => setPay(null)}>
        <ErrorText text={error} />
        {pay && (
          <>
            <Text style={styles.modalName}>{pay.row.employee.fullName}</Text>
            <Text style={styles.sub}>
              {monthLabel(period)} {t("· Mushahar")} {formatMoney(pay.row.monthlySalary)}
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
  summary: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 16, marginBottom: 14, ...SHADOW.card },
  summaryTop: { flexDirection: "row" },
  sumCol: { flex: 1 },
  sumLabel: { fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 0.5 },
  sumValue: { fontSize: 18, fontWeight: "800", color: COLORS.ink, marginTop: 3 },
  track: { height: 7, backgroundColor: COLORS.paper, borderRadius: 4, overflow: "hidden", marginTop: 14 },
  fill: { height: 7, backgroundColor: COLORS.success, borderRadius: 4 },
  head: { flexDirection: "row", alignItems: "center", gap: 12 },
  name: { fontSize: 15, fontWeight: "800", color: COLORS.ink },
  sub: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  amountRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginTop: 14 },
  amountMain: { fontSize: 20, fontWeight: "800", color: COLORS.ink },
  amountOf: { fontSize: 13, fontWeight: "600", color: COLORS.muted },
  amountLeft: { fontSize: 12.5, fontWeight: "700", color: COLORS.danger },
  meta: { fontSize: 11.5, color: COLORS.muted, marginTop: 8 },
  actions: { flexDirection: "row", gap: 10, marginTop: 14 },
  primary: { flex: 1, flexDirection: "row", gap: 7, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.brand, borderRadius: RADIUS.md, height: 44 },
  primaryText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  outline: { flex: 1, flexDirection: "row", gap: 7, alignItems: "center", justifyContent: "center", borderWidth: 1.2, borderColor: COLORS.navy, borderRadius: RADIUS.md, height: 44 },
  outlineText: { color: COLORS.navy, fontWeight: "800", fontSize: 14 },
  danger: { flex: 1, flexDirection: "row", gap: 7, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.dangerTint, borderRadius: RADIUS.md, height: 44 },
  dangerText: { color: COLORS.danger, fontWeight: "800", fontSize: 14 },
  modalName: { fontSize: 18, fontWeight: "800", color: COLORS.ink },
  label: { fontSize: 12.5, color: COLORS.muted, fontWeight: "600", marginBottom: 6, marginTop: 14 },
});

export default SalaryPanel;
