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
import { t } from "../../i18n";

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
        <ScreenHeader title={t("Receipt")} onBack={navigation.goBack} />
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
    if (!(Number(amount) > 0)) return setError(t("Geli lacagta."));
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return setError(t("Taariikhda u qor sida YYYY-MM-DD."));
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
      setError(t(err.response?.data?.message || "Khalad ayaa dhacay."));
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
          <Text style={styles.heading}>{t("SCHOOL FEE RECEIPT")}</Text>
          <InfoRow label={t("Taariikh")} value={formatDate(payment.paymentDate)} />
          <InfoRow label={t("Magaca Waalidka")} value={payment.parentId?.fullName} />
          <InfoRow label={t("Sanad Dugsiyeed")} value={payment.academicYearId?.name} />
          {fee && <InfoRow label={t("Wadarta Lacagta")} value={formatMoney(fee.totalAmount)} />}
          {fee && <InfoRow label={t("Hore Loo Bixiyey")} value={formatMoney(beforePaid)} />}
          <InfoRow label={t("Lacagta Hadda La Bixiyey")} value={formatMoney(payment.amount)} />
          {fee && <InfoRow label={t("Lacagta Ku Dhiman")} value={formatMoney(fee.balance)} />}
          <InfoRow label={t("Habka Lacagta")} value={t(payment.paymentMethod)} />
          <InfoRow label={t("Reference")} value={payment.referenceNumber} />
          <InfoRow label={t("Notes")} value={payment.notes} />
          <InfoRow label={t("Waxaa Qaabilay")} value={payment.createdBy?.fullName || t("Admin")} />
        </Card>

        <TouchableOpacity style={styles.editBtn} onPress={startEdit}>
          <Text style={styles.editBtnText}>{t("Wax Ka Beddel (Edit)")}</Text>
        </TouchableOpacity>
        {isAdmin && (
          <TouchableOpacity style={styles.deleteBtn} onPress={() => setDeleting(true)}>
            <Text style={styles.deleteBtnText}>{t("Tirtir")}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <ScreenModal visible={editing} title={t("Wax Ka Beddel Lacag Bixinta")} onClose={() => setEditing(false)}>
        <ErrorText text={error} />
        <Field label={t("Lacagta")} value={amount} onChangeText={setAmount} keyboardType="numeric" />
        <Field label={t("Taariikhda (YYYY-MM-DD)")} value={date} onChangeText={setDate} autoCapitalize="none" />
        <Text style={styles.label}>{t("Habka Lacagta")}</Text>
        <ChipRow>
          {METHODS.map((m) => (
            <Chip key={m} label={t(m)} active={method === m} onPress={() => setMethod(m)} />
          ))}
        </ChipRow>
        <Field label={t("Reference")} value={reference} onChangeText={setReference} />
        <Field label={t("Notes")} value={notes} onChangeText={setNotes} multiline />
        <View style={styles.switchRow}>
          <Text style={styles.switchText}>{t("Ogolow overpayment")}</Text>
          <Switch value={allowOver} onValueChange={setAllowOver} trackColor={{ false: COLORS.line, true: COLORS.success }} thumbColor="#fff" />
        </View>
        <PrimaryButton title={t("Kaydi")} onPress={handleSave} loading={saving} />
      </ScreenModal>

      <ConfirmPasswordModal
        visible={deleting}
        title={t("Tirtir Lacag Bixinta?")}
        message={t("Waxaad tirtirayaa lacag-bixintan ({amount}). Balance-ka waalidku si toos ah ayuu u kordhi doonaa — lama soo celin karo.", { amount: formatMoney(payment.amount) })}
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
  label: { fontSize: 13, color: COLORS.muted, marginBottom: 6, marginTop: 12 },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 16 },
  switchText: { fontSize: 13, color: COLORS.muted },
});

export default StaffPaymentDetailScreen;
