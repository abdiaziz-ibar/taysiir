import { useCallback, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import staffApi from "../../api/staffClient";
import { useAuth } from "../../context/AuthContext";
import { useStaff } from "../../context/StaffContext";
import {
  ScreenHeader,
  Loading,
  Card,
  InfoRow,
  Badge,
  feeStatusColor,
  feeStatusText,
  ScreenModal,
  Field,
  Chip,
  ChipRow,
  PrimaryButton,
  ErrorText,
} from "../../components/StaffUI";
import ConfirmPasswordModal from "../../components/ConfirmPasswordModal";
import { formatMoney, formatDate, COLORS } from "../../utils/format";

const StaffParentDetailScreen = ({ route, navigation }) => {
  const { id } = route.params;
  const { staff } = useAuth();
  const { years, selectedYearId } = useStaff();
  const isAdmin = staff?.role === "admin";

  const [parent, setParent] = useState(null);
  const [payments, setPayments] = useState([]);

  const [editForm, setEditForm] = useState(null);
  const [feeForm, setFeeForm] = useState(null); // { yearId, amount }
  const [feeEdit, setFeeEdit] = useState(null); // { fee, total, paid }
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: "year", fee } | { type: "all" }
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [p, pay] = await Promise.all([
      staffApi.get(`/parents/${id}`),
      staffApi.get("/payments", { params: { parentId: id } }),
    ]);
    setParent(p.data);
    setPayments(pay.data);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (!parent) {
    return (
      <View style={styles.flex}>
        <ScreenHeader title="Waalid" onBack={navigation.goBack} />
        <Loading />
      </View>
    );
  }

  const totalDebt = parent.fees.reduce((s, f) => s + f.balance, 0);

  const run = async (fn, close) => {
    setError("");
    setSaving(true);
    try {
      await fn();
      close();
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Khalad ayaa dhacay.");
    } finally {
      setSaving(false);
    }
  };

  const saveParent = () => {
    if (!editForm.fullName.trim() || !editForm.phone.trim() || !editForm.address.trim()) {
      return setError("Magaca, Phone iyo Address waa waajib.");
    }
    run(
      () =>
        staffApi.put(`/parents/${id}`, {
          fullName: editForm.fullName.trim(),
          phone: editForm.phone.trim(),
          alternativePhone: editForm.alternativePhone,
          address: editForm.address.trim(),
          email: editForm.email.trim(),
          notes: editForm.notes,
        }),
      () => setEditForm(null)
    );
  };

  const saveNewFee = () => {
    if (!feeForm.yearId || !(Number(feeForm.amount) >= 0) || feeForm.amount === "") {
      return setError("Dooro sanad oo geli Total Fee.");
    }
    run(
      () => staffApi.post("/fees", { parentId: id, academicYearId: feeForm.yearId, totalAmount: Number(feeForm.amount) }),
      () => setFeeForm(null)
    );
  };

  const saveFeeEdit = () => {
    run(
      () => staffApi.put(`/fees/${feeEdit.fee._id}`, { totalAmount: Number(feeEdit.total), totalPaid: Number(feeEdit.paid) }),
      () => setFeeEdit(null)
    );
  };

  const handleDelete = async () => {
    if (deleteTarget.type === "year") {
      await staffApi.delete(`/parents/${id}`, { params: { academicYearId: deleteTarget.fee.academicYearId._id } });
      setDeleteTarget(null);
      load();
    } else {
      await staffApi.delete(`/parents/${id}`);
      setDeleteTarget(null);
      navigation.goBack();
    }
  };

  return (
    <View style={styles.flex}>
      <ScreenHeader title={parent.fullName} onBack={navigation.goBack} />

      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <InfoRow label="Parent ID" value={parent.parentId} />
          <InfoRow label="Phone" value={parent.phone} />
          <InfoRow label="Phone kale" value={parent.alternativePhone} />
          <InfoRow label="Address" value={parent.address} />
          <InfoRow label="Email" value={parent.email} />
          <InfoRow label="Notes" value={parent.notes} />
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.outlineBtn}
              onPress={() => {
                setError("");
                setEditForm({
                  fullName: parent.fullName,
                  phone: parent.phone,
                  alternativePhone: parent.alternativePhone || "",
                  address: parent.address || "",
                  email: parent.email || "",
                  notes: parent.notes || "",
                });
              }}
            >
              <Text style={styles.outlineText}>Wax Ka Beddel (Edit)</Text>
            </TouchableOpacity>
            {isAdmin && (
              <TouchableOpacity style={styles.dangerBtn} onPress={() => setDeleteTarget({ type: "all" })}>
                <Text style={styles.dangerText}>Tirtir</Text>
              </TouchableOpacity>
            )}
          </View>
        </Card>

        <View style={styles.debtCard}>
          <Text style={styles.debtLabel}>Wadarta Ku Dhiman (dhammaan sannadaha)</Text>
          <Text style={styles.debtValue}>{formatMoney(totalDebt)}</Text>
        </View>

        <TouchableOpacity
          style={styles.payBtn}
          onPress={() =>
            navigation.navigate("Tabs", {
              screen: "Payments",
              params: { preset: { _id: parent._id, fullName: parent.fullName, phone: parent.phone } },
            })
          }
        >
          <Text style={styles.payBtnText}>+ Ku Dar Lacag Bixin</Text>
        </TouchableOpacity>

        <Card>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Sanad Dugsiyeedka</Text>
            <TouchableOpacity
              onPress={() => {
                setError("");
                setFeeForm({ yearId: selectedYearId, amount: "" });
              }}
            >
              <Text style={styles.link}>+ Fee Sanad Cusub</Text>
            </TouchableOpacity>
          </View>
          {parent.fees.length === 0 && <Text style={styles.empty}>Weli Fee lama dhigin.</Text>}
          {parent.fees.map((f) => (
            <View key={f._id} style={styles.feeRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.feeYear}>{f.academicYearId?.name}</Text>
                <Text style={styles.feeSub}>
                  Fee {formatMoney(f.totalAmount)} · La bixiyey {formatMoney(f.totalPaid)}
                </Text>
                <View style={styles.feeActions}>
                  <TouchableOpacity
                    onPress={() => {
                      setError("");
                      setFeeEdit({ fee: f, total: String(f.totalAmount), paid: String(f.totalPaid) });
                    }}
                  >
                    <Text style={styles.link}>Edit</Text>
                  </TouchableOpacity>
                  {isAdmin && (
                    <TouchableOpacity onPress={() => setDeleteTarget({ type: "year", fee: f })}>
                      <Text style={styles.linkDanger}>Tirtir</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              <View style={{ alignItems: "flex-end", gap: 4 }}>
                <Text style={styles.feeBalance}>{formatMoney(f.balance)}</Text>
                <Badge text={feeStatusText(f.status)} color={feeStatusColor(f.status)} />
              </View>
            </View>
          ))}
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Taariikhda Lacag Bixinta</Text>
          {payments.length === 0 && <Text style={styles.empty}>Weli lacag lama bixin.</Text>}
          {payments.map((p) => (
            <TouchableOpacity key={p._id} style={styles.feeRow} onPress={() => navigation.navigate("PaymentDetail", { id: p._id })}>
              <View style={{ flex: 1 }}>
                <Text style={styles.feeYear}>{p.receiptNumber}</Text>
                <Text style={styles.feeSub}>
                  {formatDate(p.paymentDate)} · {p.academicYearId?.name} · {p.paymentMethod}
                </Text>
              </View>
              <Text style={styles.paid}>{formatMoney(p.amount)}</Text>
            </TouchableOpacity>
          ))}
        </Card>
      </ScrollView>

      <ScreenModal visible={!!editForm} title="Wax Ka Beddel Waalidka" onClose={() => setEditForm(null)}>
        <ErrorText text={error} />
        {editForm && (
          <>
            <Field label="Magaca Waalidka *" value={editForm.fullName} onChangeText={(v) => setEditForm({ ...editForm, fullName: v })} />
            <Field label="Phone *" value={editForm.phone} onChangeText={(v) => setEditForm({ ...editForm, phone: v })} keyboardType="phone-pad" />
            <Field label="Alternative Phone" value={editForm.alternativePhone} onChangeText={(v) => setEditForm({ ...editForm, alternativePhone: v })} keyboardType="phone-pad" />
            <Field label="Address *" value={editForm.address} onChangeText={(v) => setEditForm({ ...editForm, address: v })} />
            <Field label="Email (ikhtiyaari)" value={editForm.email} onChangeText={(v) => setEditForm({ ...editForm, email: v })} autoCapitalize="none" keyboardType="email-address" />
            <Field label="Notes" value={editForm.notes} onChangeText={(v) => setEditForm({ ...editForm, notes: v })} multiline />
            <PrimaryButton title="Kaydi" onPress={saveParent} loading={saving} />
          </>
        )}
      </ScreenModal>

      <ScreenModal visible={!!feeForm} title="Fee Sanad Cusub" onClose={() => setFeeForm(null)}>
        <ErrorText text={error} />
        {feeForm && (
          <>
            <Text style={styles.label}>Sanad Dugsiyeed</Text>
            <ChipRow>
              {years.map((y) => (
                <Chip key={y._id} label={y.name} active={feeForm.yearId === y._id} onPress={() => setFeeForm({ ...feeForm, yearId: y._id })} />
              ))}
            </ChipRow>
            <Field label="Total Fee ($)" value={feeForm.amount} onChangeText={(v) => setFeeForm({ ...feeForm, amount: v })} keyboardType="numeric" />
            <PrimaryButton title="Kaydi" onPress={saveNewFee} loading={saving} />
          </>
        )}
      </ScreenModal>

      <ScreenModal visible={!!feeEdit} title={`Edit Fee ${feeEdit?.fee.academicYearId?.name || ""}`} onClose={() => setFeeEdit(null)}>
        <ErrorText text={error} />
        {feeEdit && (
          <>
            <Field label="Total Fee ($)" value={feeEdit.total} onChangeText={(v) => setFeeEdit({ ...feeEdit, total: v })} keyboardType="numeric" />
            <Field label="La Bixiyey ($)" value={feeEdit.paid} onChangeText={(v) => setFeeEdit({ ...feeEdit, paid: v })} keyboardType="numeric" />
            <PrimaryButton title="Kaydi" onPress={saveFeeEdit} loading={saving} />
          </>
        )}
      </ScreenModal>

      <ConfirmPasswordModal
        visible={!!deleteTarget}
        title={deleteTarget?.type === "year" ? "Tirtir Sanad Dugsiyeedka?" : "Tirtir Waalidka?"}
        message={
          deleteTarget?.type === "year"
            ? `Waxaad ka tirtirayaa sanadka ${deleteTarget.fee.academicYearId?.name} Fee-giisa iyo lacag-bixinnadiisa kaliya. ${parent.fullName} iyo sannadaha kale way hadhayaan.`
            : `Waxaad tirtirayaa ${parent.fullName} oo dhan, iyo dhammaan Fee-yadiisa iyo Lacag-bixinnadiisa sannad kasta — lama soo celin karo.`
        }
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.paper },
  content: { padding: 14, paddingBottom: 40 },
  actions: { flexDirection: "row", gap: 10, marginTop: 10 },
  outlineBtn: { flex: 1, borderWidth: 1, borderColor: COLORS.line, borderRadius: 999, paddingVertical: 10, alignItems: "center" },
  outlineText: { color: COLORS.ink, fontSize: 13, fontWeight: "600" },
  dangerBtn: { backgroundColor: COLORS.danger, borderRadius: 999, paddingVertical: 10, paddingHorizontal: 22, alignItems: "center" },
  dangerText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  debtCard: { backgroundColor: COLORS.navy, borderRadius: 12, padding: 16, marginBottom: 12 },
  debtLabel: { color: "rgba(255,255,255,0.65)", fontSize: 12 },
  debtValue: { color: "#fff", fontSize: 26, fontWeight: "700", marginTop: 4 },
  payBtn: { backgroundColor: COLORS.brand, borderRadius: 999, paddingVertical: 12, alignItems: "center", marginBottom: 12 },
  payBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: COLORS.ink, marginBottom: 8 },
  link: { color: COLORS.navy, fontSize: 13, fontWeight: "600" },
  linkDanger: { color: COLORS.danger, fontSize: 13, fontWeight: "600" },
  empty: { color: "rgba(20,24,33,0.4)", fontSize: 13, textAlign: "center", paddingVertical: 10 },
  feeRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderTopWidth: 1, borderTopColor: COLORS.line },
  feeYear: { fontSize: 14, fontWeight: "600", color: COLORS.ink },
  feeSub: { fontSize: 12, color: "rgba(20,24,33,0.5)", marginTop: 2 },
  feeActions: { flexDirection: "row", gap: 16, marginTop: 6 },
  feeBalance: { fontSize: 14, fontWeight: "700", color: COLORS.danger },
  paid: { fontSize: 14, fontWeight: "700", color: COLORS.success },
  label: { fontSize: 13, color: "rgba(20,24,33,0.7)", marginBottom: 6, marginTop: 12 },
});

export default StaffParentDetailScreen;
