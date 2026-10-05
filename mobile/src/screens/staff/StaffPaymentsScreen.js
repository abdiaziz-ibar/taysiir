import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Switch,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import staffApi from "../../api/staffClient";
import { useStaff } from "../../context/StaffContext";
import { StaffHeader, YearChips, Chip, ListRow, EmptyState, Loading, Fab, SuccessText, AppHeader, IconButton, Avatar, SearchBar } from "../../components/StaffUI";
import Icon from "../../components/Icon";
import { formatMoney, formatDate, COLORS, SHADOW } from "../../utils/format";
import { t } from "../../i18n";

const METHODS = ["Cash", "Mobile Money", "Bank", "Other"];
const today = () => new Date().toISOString().slice(0, 10);

const StaffPaymentsScreen = ({ route, navigation }) => {
  const { selectedYearId, years } = useStaff();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [parent, setParent] = useState(null);
  const [formYearId, setFormYearId] = useState("");
  const [fee, setFee] = useState(null);
  const [feeLoaded, setFeeLoaded] = useState(false);
  const [newFeeAmount, setNewFeeAmount] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Cash");
  const [date, setDate] = useState(today());
  const [reference, setReference] = useState("");
  const [allowOver, setAllowOver] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");

  const [showPicker, setShowPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerList, setPickerList] = useState([]);

  const load = useCallback(async () => {
    if (!selectedYearId) return;
    const res = await staffApi.get("/payments", { params: { academicYearId: selectedYearId } });
    setPayments(res.data);
    setLoading(false);
  }, [selectedYearId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const unsub = navigation.addListener("focus", load);
    return unsub;
  }, [navigation, load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const openForm = useCallback(
    (preset) => {
      setParent(preset || null);
      setFormYearId(selectedYearId);
      setAmount("");
      setNewFeeAmount("");
      setReference("");
      setAllowOver(false);
      setDate(today());
      setError("");
      setSuccess("");
      setShowForm(true);
    },
    [selectedYearId]
  );

  useEffect(() => {
    const preset = route.params?.preset;
    if (preset && selectedYearId) {
      openForm(preset);
      navigation.setParams({ preset: undefined });
    }
  }, [route.params?.preset, selectedYearId, openForm, navigation]);

  useEffect(() => {
    setFee(null);
    setFeeLoaded(false);
    if (!parent || !formYearId) return;
    staffApi.get("/fees", { params: { parentId: parent._id, academicYearId: formYearId } }).then((res) => {
      setFee(res.data[0] || null);
      setFeeLoaded(true);
    });
  }, [parent, formYearId]);

  useEffect(() => {
    if (!showPicker) return;
    const t = setTimeout(() => {
      staffApi.get("/parents", { params: { search: pickerSearch || undefined } }).then((res) => setPickerList(res.data));
    }, 250);
    return () => clearTimeout(t);
  }, [showPicker, pickerSearch]);

  const handleSave = async () => {
    setError("");
    if (!parent) return setError(t("Fadlan dooro waalidka."));
    if (!(Number(amount) > 0)) return setError(t("Geli lacagta la bixiyey."));
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return setError(t("Taariikhda u qor sida YYYY-MM-DD."));
    if (!fee && !(Number(newFeeAmount) > 0)) return setError(t("Waalidkan Fee lama dhigin — geli Wadarta Fee."));

    setSaving(true);
    try {
      let feeId = fee?._id;
      if (!feeId) {
        const f = await staffApi.post("/fees", {
          parentId: parent._id,
          academicYearId: formYearId,
          totalAmount: Number(newFeeAmount),
        });
        feeId = f.data._id;
      }
      const res = await staffApi.post("/payments", {
        parentId: parent._id,
        academicYearId: formYearId,
        feeId,
        amount: Number(amount),
        paymentDate: date,
        paymentMethod: method,
        referenceNumber: reference,
        allowOverpayment: allowOver,
      });
      setShowForm(false);
      setSuccess(t("Lacag-bixinta waa la kaydiyay: {receipt}", { receipt: res.data.payment.receiptNumber }));
      load();
    } catch (err) {
      setError(t(err.response?.data?.message || "Khalad ayaa dhacay."));
    } finally {
      setSaving(false);
    }
  };

  const formYearName = years.find((y) => y._id === formYearId)?.name;

  return (
    <View style={styles.flex}>
      <StaffHeader title={t("Lacag Bixinta")} />
      <YearChips />
      {success ? (
        <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
          <SuccessText text={success} />
        </View>
      ) : null}

      {loading ? (
        <Loading />
      ) : (
        <FlatList
          data={payments}
          keyExtractor={(p) => p._id}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<EmptyState icon="card-outline" text={t("Weli lacag lama bixin sanadkan.")} />}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: p }) => (
            <ListRow
              left={
                <View style={styles.payIcon}>
                  <Icon name="arrow-down" size={18} color={COLORS.success} />
                </View>
              }
              title={p.parentId?.fullName}
              subtitle={`${p.receiptNumber} · ${formatDate(p.paymentDate)} · ${t(p.paymentMethod)}`}
              onPress={() => navigation.navigate("PaymentDetail", { id: p._id })}
            >
              <Text style={styles.amount}>{formatMoney(p.amount)}</Text>
            </ListRow>
          )}
        />
      )}

      <Fab onPress={() => openForm(null)} label={t("Lacag Bixin Cusub")} />

      <Modal visible={showForm} animationType="slide" onRequestClose={() => setShowForm(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <AppHeader title={t("Lacag Bixin Cusub")} actions={<IconButton name="close" onPress={() => setShowForm(false)} label="Close" />} />
          <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Text style={styles.label}>{t("1. Waalidka")}</Text>
            <TouchableOpacity style={styles.pickerBtn} onPress={() => { setPickerSearch(""); setShowPicker(true); }}>
              <Text style={parent ? styles.pickerText : styles.pickerPlaceholder}>
                {parent ? `${parent.fullName} — ${parent.phone}` : t("Dooro waalid...")}
              </Text>
            </TouchableOpacity>

            <Text style={styles.label}>{t("2. Sanad Dugsiyeedka")}</Text>
            <View style={styles.chipRow}>
              {years.map((y) => (
                <Chip key={y._id} label={y.name} active={formYearId === y._id} onPress={() => setFormYearId(y._id)} />
              ))}
            </View>

            {parent && feeLoaded && (
              <View style={styles.feeBox}>
                {fee ? (
                  <Text style={styles.feeText}>
                    {t("Fee")} {formatMoney(fee.totalAmount)} {t("· La bixiyey")} {formatMoney(fee.totalPaid)} {t("· Ku dhiman")}{" "}
                    <Text style={{ color: COLORS.danger, fontWeight: "700" }}>{formatMoney(fee.balance)}</Text>
                  </Text>
                ) : (
                  <>
                    <Text style={[styles.feeText, { color: COLORS.amber }]}>
                      {t("Waalidkan Fee lama dhigin sanadka")} {formYearName}{t(". Geli Wadarta Fee si loo sameeyo hal mar.")}
                    </Text>
                    <TextInput
                      style={[styles.input, { marginTop: 8 }]}
                      value={newFeeAmount}
                      onChangeText={setNewFeeAmount}
                      keyboardType="numeric"
                      placeholder={t("Wadarta Fee")}
                      placeholderTextColor={COLORS.faint}
                    />
                  </>
                )}
              </View>
            )}

            <Text style={styles.label}>{t("3. Lacagta La Bixiyey ($)")}</Text>
            <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="numeric" />

            <Text style={styles.label}>{t("4. Habka Lacagta")}</Text>
            <View style={styles.chipRow}>
              {METHODS.map((m) => (
                <Chip key={m} label={t(m)} active={method === m} onPress={() => setMethod(m)} />
              ))}
            </View>

            <Text style={styles.label}>{t("5. Taariikhda (YYYY-MM-DD)")}</Text>
            <TextInput style={styles.input} value={date} onChangeText={setDate} autoCapitalize="none" />

            <Text style={styles.label}>{t("Reference (haddii loo baahdo)")}</Text>
            <TextInput style={styles.input} value={reference} onChangeText={setReference} />

            <View style={styles.switchRow}>
              <Text style={styles.switchText}>{t("Ogolow overpayment")}</Text>
              <Switch value={allowOver} onValueChange={setAllowOver} trackColor={{ false: COLORS.line, true: COLORS.success }} thumbColor="#fff" />
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{t("Save")}</Text>}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>

        <Modal visible={showPicker} animationType="fade" onRequestClose={() => setShowPicker(false)}>
          <View style={{ flex: 1, backgroundColor: COLORS.paper }}>
            <AppHeader title={t("Dooro Waalid")} actions={<IconButton name="close" onPress={() => setShowPicker(false)} label="Close" />} />
            <SearchBar style={{ margin: 16 }} value={pickerSearch} onChangeText={setPickerSearch} placeholder={t("Raadi magaca ama phone...")} />
            <FlatList
              data={pickerList}
              keyExtractor={(p) => p._id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item: p }) => (
                <ListRow
                  style={{ marginHorizontal: 16 }}
                  left={<Avatar name={p.fullName} size={40} />}
                  title={p.fullName}
                  subtitle={`${p.parentId} · ${p.phone}`}
                  onPress={() => {
                    setParent({ _id: p._id, fullName: p.fullName, phone: p.phone });
                    setShowPicker(false);
                  }}
                />
              )}
            />
          </View>
        </Modal>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.paper },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  toolbar: { paddingHorizontal: 12 },
  addBtn: { backgroundColor: COLORS.brand, borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  addBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  success: { backgroundColor: "rgba(47,122,77,0.1)", color: COLORS.success, margin: 12, marginBottom: 0, padding: 10, borderRadius: 12, fontSize: 13 },
  empty: { textAlign: "center", color: COLORS.faint, paddingVertical: 30 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 14,
    marginBottom: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.line, ...SHADOW.card },
  name: { fontSize: 15, fontWeight: "600", color: COLORS.ink },
  sub: { fontSize: 12, color: COLORS.muted, marginTop: 3 },
  amount: { fontSize: 15, fontWeight: "800", color: COLORS.success },
  payIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: COLORS.successTint, alignItems: "center", justifyContent: "center" },
  modalHeader: {
    backgroundColor: COLORS.navyDark,
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  close: { color: "rgba(255,255,255,0.8)", fontSize: 14 },
  modalBody: { padding: 18, paddingBottom: 60 },
  error: { backgroundColor: "rgba(179,64,42,0.1)", color: COLORS.danger, padding: 10, borderRadius: 12, marginBottom: 10, fontSize: 13 },
  label: { fontSize: 13, color: COLORS.muted, marginBottom: 6, marginTop: 14 },
  input: {
    borderWidth: 1.2,
    borderColor: COLORS.line,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.ink,
    backgroundColor: COLORS.surface,
  },
  pickerBtn: { borderWidth: 1.2, borderColor: COLORS.line, borderRadius: 14, padding: 12, backgroundColor: COLORS.surface },
  pickerText: { fontSize: 15, color: COLORS.ink },
  pickerPlaceholder: { fontSize: 15, color: COLORS.faint },
  pickRow: { paddingHorizontal: 18, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.line, backgroundColor: COLORS.surface },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  feeBox: { backgroundColor: COLORS.paper, borderRadius: 14, padding: 12, marginTop: 12, borderWidth: 1.2, borderColor: COLORS.line },
  feeText: { fontSize: 13, color: COLORS.muted },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 16 },
  switchText: { fontSize: 13, color: COLORS.muted },
  saveBtn: { backgroundColor: COLORS.brand, borderRadius: 14, paddingVertical: 15, alignItems: "center", marginTop: 22 },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});

export default StaffPaymentsScreen;
