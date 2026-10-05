import { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, FlatList, ScrollView, StyleSheet, RefreshControl } from "react-native";
import staffApi from "../../api/staffClient";
import { useStaff } from "../../context/StaffContext";
import {
  StaffHeader,
  YearChips,
  Chip,
  Badge,
  feeStatusColor,
  feeStatusText,
  SearchBar,
  ListRow,
  Avatar,
  EmptyState,
  Loading,
  Fab,
  ScreenModal,
  Field,
  PrimaryButton,
  ErrorText,
} from "../../components/StaffUI";
import { formatMoney } from "../../utils/format";
import { COLORS } from "../../utils/theme";
import { t } from "../../i18n";

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
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
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
      setError(t("Magaca, Phone iyo Address waa waajib."));
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
      setError(t(err.response?.data?.message || "Khalad ayaa dhacay."));
    } finally {
      setSaving(false);
    }
  };

  const renderItem = ({ item: p }) => (
    <ListRow
      left={<Avatar name={p.fullName} />}
      title={p.fullName}
      subtitle={`${p.parentId} · ${p.phone}`}
      onPress={() => navigation.navigate("ParentDetail", { id: p._id })}
    >
      <View style={styles.right}>
        <Text style={[styles.balance, p.balance <= 0 && { color: COLORS.success }]}>{formatMoney(p.balance)}</Text>
        <Badge text={feeStatusText(p.feeStatus)} color={feeStatusColor(p.feeStatus)} />
      </View>
    </ListRow>
  );

  return (
    <View style={styles.flex}>
      <StaffHeader title={t("Waalidiinta")} />
      <YearChips />

      <View style={styles.toolbar}>
        <SearchBar value={search} onChangeText={setSearch} placeholder={t("Raadi magaca ama phone...")} />
      </View>
      <View style={styles.filters}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Chip label={t("Dhammaan")} active={status === ""} onPress={() => setStatus("")} />
        <Chip label={t("Unpaid")} active={status === "unpaid"} onPress={() => setStatus("unpaid")} />
        <Chip label={t("Partial")} active={status === "partial"} onPress={() => setStatus("partial")} />
        <Chip label={t("Paid")} active={status === "paid"} onPress={() => setStatus("paid")} />
        <Chip
          label={`ID${idSort === "asc" ? " ↑" : idSort === "desc" ? " ↓" : ""}`}
          active={!!idSort}
          onPress={() => setIdSort((d) => (d === "asc" ? "desc" : "asc"))}
        />
        </ScrollView>
      </View>
      <Text style={styles.hint}>
        {t("Lacagta waa tii sanadka")} {yearName || "..."} {t("kaliya.")}
      </Text>

      {loading ? (
        <Loading />
      ) : (
        <FlatList
          data={shown}
          keyExtractor={(p) => p._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<EmptyState icon="people-outline" text={t("Waalid lama helin.")} />}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Fab onPress={() => setShowForm(true)} label={t("Waalid Cusub")} />

      <ScreenModal visible={showForm} title={t("Waalid Cusub")} onClose={() => setShowForm(false)}>
        <ErrorText text={error} />
        <Field label={t("Magaca Waalidka *")} value={form.fullName} onChangeText={(v) => setForm({ ...form, fullName: v })} />
        <Field label={t("Phone *")} value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} keyboardType="phone-pad" />
        <Field label={t("Address *")} value={form.address} onChangeText={(v) => setForm({ ...form, address: v })} />
        <Field label={t("Email (ikhtiyaari)")} value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} autoCapitalize="none" keyboardType="email-address" />
        <Field
          label={`${t("Wadarta Fee sanadka")} ${yearName || ""} ${t("(ikhtiyaari)")}`}
          value={form.totalAmount}
          onChangeText={(v) => setForm({ ...form, totalAmount: v })}
          keyboardType="numeric"
          placeholder={t("Tusaale: 100")}
        />
        <PrimaryButton title={t("Kaydi Waalidka")} onPress={handleSave} loading={saving} />
      </ScreenModal>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.paper },
  toolbar: { flexDirection: "row", paddingHorizontal: 16, paddingTop: 8 },
  filters: { paddingHorizontal: 16, paddingTop: 12 },
  hint: { fontSize: 11.5, color: COLORS.muted, paddingHorizontal: 18, paddingBottom: 4 },
  right: { alignItems: "flex-end", gap: 5 },
  balance: { fontSize: 15, fontWeight: "800", color: COLORS.danger },
});

export default StaffParentsScreen;
