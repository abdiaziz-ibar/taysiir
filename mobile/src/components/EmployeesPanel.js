import { useCallback, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import financeApi, { verifyFinancePassword } from "../api/financeClient";
import { Loading, Card, Badge, ScreenModal, Field, Chip, ChipRow, PrimaryButton, ErrorText } from "./StaffUI";
import ConfirmPasswordModal from "./ConfirmPasswordModal";
import { COLORS, formatMoney } from "../utils/format";
import { EMPLOYEE_TYPES } from "../utils/finance";

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
    if (!form.fullName.trim()) return setError("Magaca waa waajib.");
    if (form.monthlySalary === "" || Number(form.monthlySalary) < 0 || Number.isNaN(Number(form.monthlySalary))) {
      return setError("Mushaharka bishii waa inuu noqdaa tiro sax ah.");
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
      setError(err.response?.data?.message || "Khalad ayaa dhacay.");
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
      <Field value={search} onChangeText={setSearch} placeholder="Raadi magac, phone ama shaqo..." />
      <View style={{ marginTop: 8 }}>
        <ChipRow>
          <Chip label="Dhammaan" active={type === ""} onPress={() => setType("")} />
          <Chip label="Macalimiin" active={type === "teacher"} onPress={() => setType("teacher")} />
          <Chip label="Shaqaale" active={type === "staff"} onPress={() => setType("staff")} />
        </ChipRow>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.hint}>
          {employees ? employees.length : 0} diiwaan · Mushaharka bishii (Active): {formatMoney(payroll)}
        </Text>
        <TouchableOpacity onPress={openNew}>
          <Text style={styles.addLink}>+ Shaqaale Cusub</Text>
        </TouchableOpacity>
      </View>

      {employees === null ? (
        <View style={{ height: 120 }}>
          <Loading />
        </View>
      ) : (
        <View style={{ marginTop: 8 }}>
          {employees.length === 0 && <Text style={styles.empty}>Weli shaqaale lama diiwaan gelin.</Text>}
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
                  <Badge text={e.status === "active" ? "Active" : "Inactive"} color={e.status === "active" ? COLORS.success : COLORS.danger} />
                </View>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => openEdit(e)}>
                  <Text style={styles.link}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setDeleteTarget(e)}>
                  <Text style={styles.linkDanger}>Tirtir</Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))}
        </View>
      )}

      <ScreenModal visible={!!form} title={form?._id ? "Wax Ka Beddel Shaqaalaha" : "Shaqaale Cusub"} onClose={() => setForm(null)}>
        <ErrorText text={error} />
        {form && (
          <>
            <Field label="Magaca *" value={form.fullName} onChangeText={(v) => setForm({ ...form, fullName: v })} />
            <Text style={styles.label}>Nooca *</Text>
            <ChipRow>
              <Chip label="Macalin" active={form.type === "teacher"} onPress={() => setForm({ ...form, type: "teacher" })} />
              <Chip label="Shaqaale" active={form.type === "staff"} onPress={() => setForm({ ...form, type: "staff" })} />
            </ChipRow>
            <Field label="Shaqada / Maaddada (ikhtiyaari)" value={form.position} onChangeText={(v) => setForm({ ...form, position: v })} />
            <Field label="Phone (ikhtiyaari)" value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} keyboardType="phone-pad" />
            <Field label="Mushaharka Bishii ($) *" value={form.monthlySalary} onChangeText={(v) => setForm({ ...form, monthlySalary: v })} keyboardType="decimal-pad" />
            {form._id && (
              <>
                <Text style={styles.label}>Xaalad</Text>
                <ChipRow>
                  <Chip label="Active" active={form.status === "active"} onPress={() => setForm({ ...form, status: "active" })} />
                  <Chip label="Inactive" active={form.status === "inactive"} onPress={() => setForm({ ...form, status: "inactive" })} />
                </ChipRow>
              </>
            )}
            <Field label="Faallo (ikhtiyaari)" value={form.notes} onChangeText={(v) => setForm({ ...form, notes: v })} />
            <PrimaryButton title="Kaydi" onPress={save} loading={saving} />
          </>
        )}
      </ScreenModal>

      <ConfirmPasswordModal
        visible={!!deleteTarget}
        title="Tirtir Shaqaalaha?"
        message={
          deleteTarget
            ? `Waxaad tirtirayaa ${deleteTarget.fullName} (${deleteTarget.employeeId}). Haddii uu leeyahay mushahar hore loo bixiyey, lama tirtiri karo — ka dhig Inactive.`
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
  hint: { fontSize: 11, color: "rgba(20,24,33,0.45)", flex: 1, marginRight: 8 },
  addLink: { color: COLORS.brand, fontSize: 13, fontWeight: "700" },
  empty: { textAlign: "center", color: "rgba(20,24,33,0.4)", paddingVertical: 30 },
  head: { flexDirection: "row", alignItems: "flex-start" },
  name: { fontSize: 15, fontWeight: "600", color: COLORS.ink },
  sub: { fontSize: 12, color: "rgba(20,24,33,0.5)", marginTop: 2 },
  salary: { fontSize: 15, fontWeight: "700", color: COLORS.ink },
  actions: { flexDirection: "row", gap: 18, marginTop: 10, borderTopWidth: 1, borderTopColor: COLORS.line, paddingTop: 10 },
  link: { color: COLORS.navy, fontSize: 13, fontWeight: "600" },
  linkDanger: { color: COLORS.danger, fontSize: 13, fontWeight: "600" },
  label: { fontSize: 13, color: "rgba(20,24,33,0.7)", marginBottom: 6, marginTop: 12 },
});

export default EmployeesPanel;
