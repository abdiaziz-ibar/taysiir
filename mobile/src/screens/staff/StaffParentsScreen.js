import { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import staffApi from "../../api/staffClient";
import { useStaff } from "../../context/StaffContext";
import { StaffHeader, YearChips, Chip, Badge, feeStatusColor, feeStatusText } from "../../components/StaffUI";
import { formatMoney, COLORS } from "../../utils/format";

const emptyForm = { fullName: "", phone: "", address: "", email: "", totalAmount: "" };

const StaffParentsScreen = ({ navigation }) => {
  const { selectedYearId, years } = useStaff();
  const yearName = years.find((y) => y._id === selectedYearId)?.name;
  const [parents, setParents] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [idSort, setIdSort] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!selectedYearId) return;
    const res = await staffApi.get("/parents", {
      params: { search: search || undefined, status: status || undefined, academicYearId: selectedYearId },
    });
    setParents(res.data);
    setLoading(false);
  }, [selectedYearId, search, status]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    const unsub = navigation.addListener("focus", load);
    return unsub;
  }, [navigation, load]);

  const shown = useMemo(() => {
    if (!idSort) return parents;
    const n = (c) => parseInt((c || "").replace(/\D/g, ""), 10) || 0;
    return [...parents].sort((a, b) => (idSort === "asc" ? n(a.parentId) - n(b.parentId) : n(b.parentId) - n(a.parentId)));
  }, [parents, idSort]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleSave = async () => {
    setError("");
    if (!form.fullName.trim() || !form.phone.trim() || !form.address.trim()) {
      setError("Magaca, Phone iyo Address waa waajib.");
      return;
    }
    setSaving(true);
    try {
      const res = await staffApi.post("/parents", {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        email: form.email.trim(),
      });
      const fee = Number(form.totalAmount);
      if (selectedYearId && fee > 0) {
        await staffApi.post("/fees", { parentId: res.data._id, academicYearId: selectedYearId, totalAmount: fee });
      }
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Khalad ayaa dhacay.");
    } finally {
      setSaving(false);
    }
  };

  const renderItem = ({ item: p }) => (
    <TouchableOpacity style={styles.row} onPress={() => navigation.navigate("ParentDetail", { id: p._id })}>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{p.fullName}</Text>
        <Text style={styles.sub}>
          {p.parentId} · {p.phone}
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.balance}>{formatMoney(p.balance)}</Text>
        <Badge text={feeStatusText(p.feeStatus)} color={feeStatusColor(p.feeStatus)} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.flex}>
      <StaffHeader title="Waalidiinta" />
      <YearChips />

      <View style={styles.toolbar}>
        <TextInput
          style={styles.search}
          value={search}
          onChangeText={setSearch}
          placeholder="Raadi magaca ama phone..."
          placeholderTextColor="#9CA3AF"
        />
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(true)}>
          <Text style={styles.addBtnText}>+ Cusub</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.filters}>
        <Chip label="Dhammaan" active={status === ""} onPress={() => setStatus("")} />
        <Chip label="Unpaid" active={status === "unpaid"} onPress={() => setStatus("unpaid")} />
        <Chip label="Partial" active={status === "partial"} onPress={() => setStatus("partial")} />
        <Chip label="Paid" active={status === "paid"} onPress={() => setStatus("paid")} />
        <Chip
          label={`ID${idSort === "asc" ? " ↑" : idSort === "desc" ? " ↓" : ""}`}
          active={!!idSort}
          onPress={() => setIdSort((d) => (d === "asc" ? "desc" : "asc"))}
        />
      </View>
      <Text style={styles.hint}>Lacagta waa tii sanadka {yearName || "..."} kaliya.</Text>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.navy} size="large" />
        </View>
      ) : (
        <FlatList
          data={shown}
          keyExtractor={(p) => p._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 12, paddingBottom: 30 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<Text style={styles.empty}>Waalid lama helin.</Text>}
        />
      )}

      <Modal visible={showForm} animationType="slide" onRequestClose={() => setShowForm(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Waalid Cusub</Text>
            <TouchableOpacity onPress={() => setShowForm(false)}>
              <Text style={styles.close}>Jooji</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Text style={styles.label}>Magaca Waalidka *</Text>
            <TextInput style={styles.input} value={form.fullName} onChangeText={(v) => setForm({ ...form, fullName: v })} />
            <Text style={styles.label}>Phone *</Text>
            <TextInput
              style={styles.input}
              value={form.phone}
              onChangeText={(v) => setForm({ ...form, phone: v })}
              keyboardType="phone-pad"
            />
            <Text style={styles.label}>Address *</Text>
            <TextInput style={styles.input} value={form.address} onChangeText={(v) => setForm({ ...form, address: v })} />
            <Text style={styles.label}>Email (ikhtiyaari)</Text>
            <TextInput
              style={styles.input}
              value={form.email}
              onChangeText={(v) => setForm({ ...form, email: v })}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Text style={styles.label}>Wadarta Fee sanadka {yearName} (ikhtiyaari)</Text>
            <TextInput
              style={styles.input}
              value={form.totalAmount}
              onChangeText={(v) => setForm({ ...form, totalAmount: v })}
              keyboardType="numeric"
              placeholder="Tusaale: 100"
              placeholderTextColor="#9CA3AF"
            />
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Kaydi Waalidka</Text>}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.paper },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  toolbar: { flexDirection: "row", paddingHorizontal: 12, gap: 8 },
  search: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: COLORS.surface,
    fontSize: 14,
    color: COLORS.ink,
  },
  addBtn: { backgroundColor: COLORS.brand, borderRadius: 999, paddingHorizontal: 16, justifyContent: "center" },
  addBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  filters: { flexDirection: "row", paddingHorizontal: 12, paddingTop: 10 },
  hint: { fontSize: 11, color: "rgba(20,24,33,0.45)", paddingHorizontal: 14, paddingTop: 2 },
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
  right: { alignItems: "flex-end", gap: 4 },
  balance: { fontSize: 14, fontWeight: "700", color: COLORS.danger },
  empty: { textAlign: "center", color: "rgba(20,24,33,0.4)", paddingVertical: 30 },
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
  label: { fontSize: 13, color: "rgba(20,24,33,0.7)", marginBottom: 4, marginTop: 12 },
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
  saveBtn: { backgroundColor: COLORS.brand, borderRadius: 999, paddingVertical: 13, alignItems: "center", marginTop: 22 },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});

export default StaffParentsScreen;
