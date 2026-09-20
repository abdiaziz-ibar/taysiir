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
import { StaffHeader, YearChips, Chip } from "../../components/StaffUI";
import { formatMoney, formatDate, COLORS } from "../../utils/format";

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
    if (!parent) return setError("Fadlan dooro waalidka.");
    if (!(Number(amount) > 0)) return setError("Geli lacagta la bixiyey.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return setError("Taariikhda u qor sida YYYY-MM-DD.");
    if (!fee && !(Number(newFeeAmount) > 0)) return setError("Waalidkan Fee lama dhigin — geli Wadarta Fee.");

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
      setSuccess(`Lacag-bixinta waa la kaydiyay: ${res.data.payment.receiptNumber}`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Khalad ayaa dhacay.");
    } finally {
      setSaving(false);
    }
  };

  const formYearName = years.find((y) => y._id === formYearId)?.name;

  return (
    <View style={styles.flex}>
      <StaffHeader title="Lacag Bixinta" />
      <YearChips />
      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.addBtn} onPress={() => openForm(null)}>
          <Text style={styles.addBtnText}>+ Lacag Bixin Cusub</Text>
        </TouchableOpacity>
      </View>
      {success ? <Text style={styles.success}>{success}</Text> : null}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.navy} size="large" />
        </View>
      ) : (
        <FlatList
          data={payments}
          keyExtractor={(p) => p._id}
          contentContainerStyle={{ padding: 12, paddingBottom: 30 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<Text style={styles.empty}>Weli lacag lama bixin sanadkan.</Text>}
          renderItem={({ item: p }) => (
            <TouchableOpacity style={styles.row} onPress={() => navigation.navigate("PaymentDetail", { id: p._id })}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{p.parentId?.fullName}</Text>
                <Text style={styles.sub}>
                  {p.receiptNumber} · {formatDate(p.paymentDate)} · {p.paymentMethod}
                </Text>
              </View>
              <Text style={styles.amount}>{formatMoney(p.amount)}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      <Modal visible={showForm} animationType="slide" onRequestClose={() => setShowForm(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Lacag Bixin Cusub</Text>
            <TouchableOpacity onPress={() => setShowForm(false)}>
              <Text style={styles.close}>Jooji</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Text style={styles.label}>1. Waalidka</Text>
            <TouchableOpacity style={styles.pickerBtn} onPress={() => { setPickerSearch(""); setShowPicker(true); }}>
              <Text style={parent ? styles.pickerText : styles.pickerPlaceholder}>
                {parent ? `${parent.fullName} — ${parent.phone}` : "Dooro waalid..."}
              </Text>
            </TouchableOpacity>

            <Text style={styles.label}>2. Sanad Dugsiyeedka</Text>
            <View style={styles.chipRow}>
              {years.map((y) => (
                <Chip key={y._id} label={y.name} active={formYearId === y._id} onPress={() => setFormYearId(y._id)} />
              ))}
            </View>

            {parent && feeLoaded && (
              <View style={styles.feeBox}>
                {fee ? (
                  <Text style={styles.feeText}>
                    Fee {formatMoney(fee.totalAmount)} · La bixiyey {formatMoney(fee.totalPaid)} · Ku dhiman{" "}
                    <Text style={{ color: COLORS.danger, fontWeight: "700" }}>{formatMoney(fee.balance)}</Text>
                  </Text>
                ) : (
                  <>
                    <Text style={[styles.feeText, { color: COLORS.amber }]}>
                      Waalidkan Fee lama dhigin sanadka {formYearName}. Geli Wadarta Fee si loo sameeyo hal mar.
                    </Text>
                    <TextInput
                      style={[styles.input, { marginTop: 8 }]}
                      value={newFeeAmount}
                      onChangeText={setNewFeeAmount}
                      keyboardType="numeric"
                      placeholder="Wadarta Fee"
                      placeholderTextColor="#9CA3AF"
                    />
                  </>
                )}
              </View>
            )}

            <Text style={styles.label}>3. Lacagta La Bixiyey ($)</Text>
            <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="numeric" />

            <Text style={styles.label}>4. Habka Lacagta</Text>
            <View style={styles.chipRow}>
              {METHODS.map((m) => (
                <Chip key={m} label={m} active={method === m} onPress={() => setMethod(m)} />
              ))}
            </View>

            <Text style={styles.label}>5. Taariikhda (YYYY-MM-DD)</Text>
            <TextInput style={styles.input} value={date} onChangeText={setDate} autoCapitalize="none" />

            <Text style={styles.label}>Reference (haddii loo baahdo)</Text>
            <TextInput style={styles.input} value={reference} onChangeText={setReference} />

            <View style={styles.switchRow}>
              <Text style={styles.switchText}>Ogolow overpayment</Text>
              <Switch value={allowOver} onValueChange={setAllowOver} />
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save</Text>}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>

        <Modal visible={showPicker} animationType="fade" onRequestClose={() => setShowPicker(false)}>
          <View style={{ flex: 1, backgroundColor: COLORS.paper }}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Dooro Waalid</Text>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Text style={styles.close}>Xir</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.input, { margin: 12 }]}
              value={pickerSearch}
              onChangeText={setPickerSearch}
              placeholder="Raadi magaca ama phone..."
              placeholderTextColor="#9CA3AF"
              autoFocus
            />
            <FlatList
              data={pickerList}
              keyExtractor={(p) => p._id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item: p }) => (
                <TouchableOpacity
                  style={styles.pickRow}
                  onPress={() => {
                    setParent({ _id: p._id, fullName: p.fullName, phone: p.phone });
                    setShowPicker(false);
                  }}
                >
                  <Text style={styles.name}>{p.fullName}</Text>
                  <Text style={styles.sub}>
                    {p.parentId} · {p.phone}
                  </Text>
                </TouchableOpacity>
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
  addBtn: { backgroundColor: COLORS.brand, borderRadius: 999, paddingVertical: 12, alignItems: "center" },
  addBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  success: { backgroundColor: "rgba(47,122,77,0.1)", color: COLORS.success, margin: 12, marginBottom: 0, padding: 10, borderRadius: 8, fontSize: 13 },
  empty: { textAlign: "center", color: "rgba(20,24,33,0.4)", paddingVertical: 30 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  name: { fontSize: 15, fontWeight: "600", color: COLORS.ink },
  sub: { fontSize: 12, color: "rgba(20,24,33,0.5)", marginTop: 3 },
  amount: { fontSize: 15, fontWeight: "700", color: COLORS.success },
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
  error: { backgroundColor: "rgba(179,64,42,0.1)", color: COLORS.danger, padding: 10, borderRadius: 8, marginBottom: 10, fontSize: 13 },
  label: { fontSize: 13, color: "rgba(20,24,33,0.7)", marginBottom: 6, marginTop: 14 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.ink,
    backgroundColor: COLORS.surface,
  },
  pickerBtn: { borderWidth: 1, borderColor: COLORS.line, borderRadius: 8, padding: 12, backgroundColor: COLORS.surface },
  pickerText: { fontSize: 15, color: COLORS.ink },
  pickerPlaceholder: { fontSize: 15, color: "#9CA3AF" },
  pickRow: { paddingHorizontal: 18, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.line, backgroundColor: COLORS.surface },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  feeBox: { backgroundColor: COLORS.paper, borderRadius: 8, padding: 12, marginTop: 12, borderWidth: 1, borderColor: COLORS.line },
  feeText: { fontSize: 13, color: "rgba(20,24,33,0.75)" },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 16 },
  switchText: { fontSize: 13, color: "rgba(20,24,33,0.7)" },
  saveBtn: { backgroundColor: COLORS.brand, borderRadius: 999, paddingVertical: 13, alignItems: "center", marginTop: 22 },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});

export default StaffPaymentsScreen;
