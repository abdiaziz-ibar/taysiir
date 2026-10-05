import { useCallback, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import financeApi, { verifyFinancePassword } from "../api/financeClient";
import { Loading, Card, Badge, ScreenModal, Field, Chip, ChipRow, PrimaryButton, ErrorText } from "./StaffUI";
import ConfirmPasswordModal from "./ConfirmPasswordModal";
import { COLORS, formatMoney } from "../utils/format";
import { EMPLOYEE_TYPES } from "../utils/finance";
import { t } from "../i18n";

const emptyForm = { fullName: "", type: "teacher", position: "", phone: "", monthlySalary: "", notes: "", status: "active" };

// Teachers / staff register, shown inside the Qarashaadka screen (Mushaharka → Shaqaalaha).
const EmployeesPanel = () => {
  const [employees, setEmployees] = useState(null);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [form, setForm] = useState(null); // null = closed; { _id } present = editing
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await financeApi.get("/employees", { params: { search: search || undefined, type: type || undefined } });
    setEmployees(res.data);
  }, [search, type]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const openNew = () => {
    setError("");
    setForm({ ...emptyForm });
  };

  const openEdit = (e) => {
    setError("");
    setForm({
      _id: e._id,
      fullName: e.fullName,
      type: e.type,
      position: e.position || "",
      phone: e.phone || "",
      monthlySalary: String(e.monthlySalary),
      notes: e.notes || "",
      status: e.status,
    });
  };

  const save = async () => {
    if (!form.fullName.trim()) return setError(t("Magaca waa waajib."));
    if (form.monthlySalary === "" || Number(form.monthlySalary) < 0 || Number.isNaN(Number(form.monthlySalary))) {
      return setError(t("Mushaharka bishii waa inuu noqdaa tiro sax ah."));
    }
    setError("");
    setSaving(true);
    try {
      const { _id, ...rest } = form;
      const payload = { ...rest, monthlySalary: Number(rest.monthlySalary) };
      if (_id) await financeApi.put(`/employees/${_id}`, payload);
      else await financeApi.post("/employees", payload);
      setForm(null);
      load();
    } catch (err) {
      setError(t(err.response?.data?.message || "Khalad ayaa dhacay."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    await financeApi.delete(`/employees/${deleteTarget._id}`);
    setDeleteTarget(null);
    load();
  };

  const payroll = (employees || []).filter((e) => e.status === "active").reduce((s, e) => s + e.monthlySalary, 0);

  return (
    <View>
      <Field value={search} onChangeText={setSearch} placeholder={t("Raadi magac, phone ama shaqo...")} />
      <View style={{ marginTop: 8 }}>
        <ChipRow>
          <Chip label={t("Dhammaan")} active={type === ""} onPress={() => setType("")} />
          <Chip label={t("Macalimiin")} active={type === "teacher"} onPress={() => setType("teacher")} />
          <Chip label={t("Shaqaale")} active={type === "staff"} onPress={() => setType("staff")} />
        </ChipRow>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.hint}>
          {employees ? employees.length : 0} {t("diiwaan · Mushaharka bishii (Active):")} {formatMoney(payroll)}
        </Text>
        <TouchableOpacity onPress={openNew}>
          <Text style={styles.addLink}>{t("+ Shaqaale Cusub")}</Text>
        </TouchableOpacity>
      </View>

      {employees === null ? (
        <View style={{ height: 120 }}>
          <Loading />
        </View>
      ) : (
        <View style={{ marginTop: 8 }}>
          {employees.length === 0 && <Text style={styles.empty}>{t("Weli shaqaale lama diiwaan gelin.")}</Text>}
          {employees.map((e) => (
            <Card key={e._id}>
              <View style={styles.head}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{e.fullName}</Text>
                  <Text style={styles.sub}>
                    {e.employeeId} · {EMPLOYEE_TYPES[e.type]}
                    {e.position ? ` · ${e.position}` : ""}
                  </Text>
                  {e.phone ? <Text style={styles.sub}>{e.phone}</Text> : null}
                </View>
                <View style={{ alignItems: "flex-end", gap: 4 }}>
                  <Text style={styles.salary}>{formatMoney(e.monthlySalary)}</Text>
                  <Badge text={e.status === "active" ? t("Active") : t("Inactive")} color={e.status === "active" ? COLORS.success : COLORS.danger} />
                </View>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => openEdit(e)}>
                  <Text style={styles.link}>{t("Edit")}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setDeleteTarget(e)}>
                  <Text style={styles.linkDanger}>{t("Tirtir")}</Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))}
        </View>
      )}

      <ScreenModal visible={!!form} title={form?._id ? t("Wax Ka Beddel Shaqaalaha") : t("Shaqaale Cusub")} onClose={() => setForm(null)}>
        <ErrorText text={error} />
        {form && (
          <>
            <Field label={t("Magaca *")} value={form.fullName} onChangeText={(v) => setForm({ ...form, fullName: v })} />
            <Text style={styles.label}>{t("Nooca *")}</Text>
            <ChipRow>
              <Chip label={t("Macalin")} active={form.type === "teacher"} onPress={() => setForm({ ...form, type: "teacher" })} />
              <Chip label={t("Shaqaale")} active={form.type === "staff"} onPress={() => setForm({ ...form, type: "staff" })} />
            </ChipRow>
            <Field label={t("Shaqada / Maaddada (ikhtiyaari)")} value={form.position} onChangeText={(v) => setForm({ ...form, position: v })} />
            <Field label={t("Phone (ikhtiyaari)")} value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} keyboardType="phone-pad" />
            <Field label={t("Mushaharka Bishii ($) *")} value={form.monthlySalary} onChangeText={(v) => setForm({ ...form, monthlySalary: v })} keyboardType="decimal-pad" />
            {form._id && (
              <>
                <Text style={styles.label}>{t("Xaalad")}</Text>
                <ChipRow>
                  <Chip label={t("Active")} active={form.status === "active"} onPress={() => setForm({ ...form, status: "active" })} />
                  <Chip label={t("Inactive")} active={form.status === "inactive"} onPress={() => setForm({ ...form, status: "inactive" })} />
                </ChipRow>
              </>
            )}
            <Field label={t("Faallo (ikhtiyaari)")} value={form.notes} onChangeText={(v) => setForm({ ...form, notes: v })} />
            <PrimaryButton title={t("Kaydi")} onPress={save} loading={saving} />
          </>
        )}
      </ScreenModal>

      <ConfirmPasswordModal
        visible={!!deleteTarget}
        title={t("Tirtir Shaqaalaha?")}
        message={
          deleteTarget
            ? t("Waxaad tirtirayaa {name} ({id}). Haddii uu leeyahay mushahar hore loo bixiyey, lama tirtiri karo — ka dhig Inactive.", { name: deleteTarget.fullName, id: deleteTarget.employeeId })
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
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 },
  hint: { fontSize: 11, color: COLORS.muted, flex: 1, marginRight: 8 },
  addLink: { color: COLORS.brand, fontSize: 13, fontWeight: "700" },
  empty: { textAlign: "center", color: COLORS.faint, paddingVertical: 30 },
  head: { flexDirection: "row", alignItems: "flex-start" },
  name: { fontSize: 15, fontWeight: "600", color: COLORS.ink },
  sub: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  salary: { fontSize: 15, fontWeight: "700", color: COLORS.ink },
  actions: { flexDirection: "row", gap: 18, marginTop: 10, borderTopWidth: 1, borderTopColor: COLORS.line, paddingTop: 10 },
  link: { color: COLORS.navy, fontSize: 13, fontWeight: "600" },
  linkDanger: { color: COLORS.danger, fontSize: 13, fontWeight: "600" },
  label: { fontSize: 13, color: COLORS.muted, marginBottom: 6, marginTop: 12 },
});

export default EmployeesPanel;
