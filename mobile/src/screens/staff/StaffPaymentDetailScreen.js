import { useCallback, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Switch, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import staffApi from "../../api/staffClient";
import { useAuth } from "../../context/AuthContext";
import {
  ScreenHeader,
  Loading,
  Card,
  InfoRow,
  ScreenModal,
  Field,
  Chip,
  ChipRow,
  PrimaryButton,
  ErrorText,
} from "../../components/StaffUI";
import ConfirmPasswordModal from "../../components/ConfirmPasswordModal";
import { formatMoney, formatDate, COLORS } from "../../utils/format";

const METHODS = ["Cash", "Mobile Money", "Bank", "Other"];

const StaffPaymentDetailScreen = ({ route, navigation }) => {
  const { id } = route.params;
  const { staff } = useAuth();
  const isAdmin = staff?.role === "admin";
  const [payment, setPayment] = useState(null);

  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [method, setMethod] = useState("Cash");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [allowOver, setAllowOver] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    const res = await staffApi.get(`/payments/${id}`);
    setPayment(res.data);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (!payment) {
    return (
      <View style={styles.flex}>
        <ScreenHeader title="Receipt" onBack={navigation.goBack} />
        <Loading />
      </View>
    );
  }

  const fee = payment.feeId;
  const beforePaid = fee ? Math.max(fee.totalPaid - payment.amount, 0) : null;

  const startEdit = () => {
    setAmount(String(payment.amount));
    setDate(new Date(payment.paymentDate).toISOString().slice(0, 10));
    setMethod(payment.paymentMethod);
    setReference(payment.referenceNumber || "");
    setNotes(payment.notes || "");
    setAllowOver(false);
    setError("");
    setEditing(true);
  };

  const handleSave = async () => {
    setError("");
    if (!(Number(amount) > 0)) return setError("Geli lacagta.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return setError("Taariikhda u qor sida YYYY-MM-DD.");
    setSaving(true);
    try {
      await staffApi.put(`/payments/${id}`, {
        amount: Number(amount),
        paymentDate: date,
        paymentMethod: method,
        referenceNumber: reference,
        notes,
        allowOverpayment: allowOver,
      });
      setEditing(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Khalad ayaa dhacay.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    await staffApi.delete(`/payments/${id}`);
    setDeleting(false);
    navigation.goBack();
  };

  return (
    <View style={styles.flex}>
      <ScreenHeader title={payment.receiptNumber} onBack={navigation.goBack} />
      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 40 }}>
        <Card>
          <Text style={styles.heading}>SCHOOL FEE RECEIPT</Text>
          <InfoRow label="Taariikh" value={formatDate(payment.paymentDate)} />
          <InfoRow label="Magaca Waalidka" value={payment.parentId?.fullName} />
          <InfoRow label="Sanad Dugsiyeed" value={payment.academicYearId?.name} />
          {fee && <InfoRow label="Wadarta Lacagta" value={formatMoney(fee.totalAmount)} />}
          {fee && <InfoRow label="Hore Loo Bixiyey" value={formatMoney(beforePaid)} />}
          <InfoRow label="Lacagta Hadda La Bixiyey" value={formatMoney(payment.amount)} />
          {fee && <InfoRow label="Lacagta Ku Dhiman" value={formatMoney(fee.balance)} />}
          <InfoRow label="Habka Lacagta" value={payment.paymentMethod} />
          <InfoRow label="Reference" value={payment.referenceNumber} />
          <InfoRow label="Notes" value={payment.notes} />
          <InfoRow label="Waxaa Qaabilay" value={payment.createdBy?.fullName || "Admin"} />
        </Card>

        <TouchableOpacity style={styles.editBtn} onPress={startEdit}>
          <Text style={styles.editBtnText}>Wax Ka Beddel (Edit)</Text>
        </TouchableOpacity>
        {isAdmin && (
          <TouchableOpacity style={styles.deleteBtn} onPress={() => setDeleting(true)}>
            <Text style={styles.deleteBtnText}>Tirtir</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <ScreenModal visible={editing} title="Wax Ka Beddel Lacag Bixinta" onClose={() => setEditing(false)}>
        <ErrorText text={error} />
        <Field label="Lacagta" value={amount} onChangeText={setAmount} keyboardType="numeric" />
        <Field label="Taariikhda (YYYY-MM-DD)" value={date} onChangeText={setDate} autoCapitalize="none" />
        <Text style={styles.label}>Habka Lacagta</Text>
        <ChipRow>
          {METHODS.map((m) => (
            <Chip key={m} label={m} active={method === m} onPress={() => setMethod(m)} />
          ))}
        </ChipRow>
        <Field label="Reference" value={reference} onChangeText={setReference} />
        <Field label="Notes" value={notes} onChangeText={setNotes} multiline />
        <View style={styles.switchRow}>
          <Text style={styles.switchText}>Ogolow overpayment</Text>
          <Switch value={allowOver} onValueChange={setAllowOver} />
        </View>
        <PrimaryButton title="Kaydi" onPress={handleSave} loading={saving} />
      </ScreenModal>

      <ConfirmPasswordModal
        visible={deleting}
        title="Tirtir Lacag Bixinta?"
        message={`Waxaad tirtirayaa lacag-bixintan (${formatMoney(payment.amount)}). Balance-ka waalidku si toos ah ayuu u kordhi doonaa — lama soo celin karo.`}
        onConfirm={handleDelete}
        onClose={() => setDeleting(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.paper },
  heading: { fontSize: 16, fontWeight: "700", color: COLORS.ink, marginBottom: 6 },
  editBtn: { borderWidth: 1, borderColor: COLORS.line, backgroundColor: COLORS.surface, borderRadius: 999, paddingVertical: 12, alignItems: "center", marginBottom: 10 },
  editBtnText: { color: COLORS.ink, fontWeight: "600", fontSize: 14 },
  deleteBtn: { backgroundColor: COLORS.danger, borderRadius: 999, paddingVertical: 12, alignItems: "center" },
  deleteBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  label: { fontSize: 13, color: "rgba(20,24,33,0.7)", marginBottom: 6, marginTop: 12 },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 16 },
  switchText: { fontSize: 13, color: "rgba(20,24,33,0.7)" },
});

export default StaffPaymentDetailScreen;
