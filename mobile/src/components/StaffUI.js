import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useStaff } from "../context/StaffContext";
import { COLORS, formatMoney } from "../utils/format";

export const StaffHeader = ({ title }) => {
  const { staff, staffLogout } = useAuth();
  return (
    <View style={styles.header}>
      <View style={{ flex: 1 }}>
        <Text style={styles.headerTitle}>{title}</Text>
        <Text style={styles.headerSub} numberOfLines={1}>
          {staff?.fullName}
        </Text>
      </View>
      <TouchableOpacity style={styles.logoutBtn} onPress={staffLogout}>
        <Text style={styles.logoutText}>Ka Bax</Text>
      </TouchableOpacity>
    </View>
  );
};

export const YearChips = () => {
  const { years, selectedYearId, setSelectedYearId } = useStaff();
  return (
    <View style={styles.chipsWrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12 }}>
        {years.map((y) => (
          <TouchableOpacity
            key={y._id}
            style={[styles.chip, selectedYearId === y._id && styles.chipActive]}
            onPress={() => setSelectedYearId(y._id)}
          >
            <Text style={[styles.chipText, selectedYearId === y._id && styles.chipTextActive]}>
              {y.name}
              {y.isActive ? " •" : ""}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export const Chip = ({ label, active, onPress }) => (
  <TouchableOpacity style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
    <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
  </TouchableOpacity>
);

export const Badge = ({ text, color }) => (
  <View style={[styles.badge, { backgroundColor: `${color}1A` }]}>
    <Text style={[styles.badgeText, { color }]}>{text}</Text>
  </View>
);

export const ChipRow = ({ children }) => <View style={styles.chipRow}>{children}</View>;

export const ScreenHeader = ({ title, onBack, right }) => (
  <View style={styles.header}>
    <TouchableOpacity onPress={onBack} style={{ width: 60 }}>
      <Text style={styles.back}>‹ Dib</Text>
    </TouchableOpacity>
    <Text style={styles.screenTitle} numberOfLines={1}>
      {title}
    </Text>
    <View style={{ width: 60, alignItems: "flex-end" }}>{right}</View>
  </View>
);

export const ScreenModal = ({ visible, title, onClose, children }) => (
  <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: COLORS.paper }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.modalHeader}>
        <Text style={styles.headerTitle}>{title}</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.modalClose}>Jooji</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  </Modal>
);

export const Field = ({ label, style, ...props }) => (
  <View>
    {label ? <Text style={styles.label}>{label}</Text> : null}
    <TextInput style={[styles.input, style]} placeholderTextColor="#9CA3AF" {...props} />
  </View>
);

export const PrimaryButton = ({ title, onPress, loading, disabled, color }) => (
  <TouchableOpacity
    style={[styles.primaryBtn, color && { backgroundColor: color }, (disabled || loading) && { opacity: 0.6 }]}
    onPress={onPress}
    disabled={disabled || loading}
  >
    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>{title}</Text>}
  </TouchableOpacity>
);

export const ErrorText = ({ text }) =>
  text ? <Text style={styles.errorText}>{text}</Text> : null;

export const SuccessText = ({ text }) =>
  text ? <Text style={styles.successText}>{text}</Text> : null;

export const Card = ({ children, style }) => <View style={[styles.card, style]}>{children}</View>;

export const InfoRow = ({ label, value }) =>
  value ? (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  ) : null;

export const Loading = () => (
  <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
    <ActivityIndicator color={COLORS.navy} size="large" />
  </View>
);

export const MonthBars = ({ data, valueKey, color }) => {
  const max = Math.max(1, ...data.map((d) => d[valueKey] || 0));
  return (
    <View>
      {data.map((d) => (
        <View key={d.month} style={styles.barRow}>
          <Text style={styles.barMonth}>{d.month}</Text>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${((d[valueKey] || 0) / max) * 100}%`, backgroundColor: color || COLORS.navy }]} />
          </View>
          <Text style={styles.barValue}>{formatMoney(d[valueKey] || 0)}</Text>
        </View>
      ))}
    </View>
  );
};

export const feeStatusColor = (s) => (s === "paid" ? COLORS.success : s === "partial" ? COLORS.amber : COLORS.danger);
export const feeStatusText = (s) => (s === "paid" ? "Paid" : s === "partial" ? "Partial" : "Unpaid");

const styles = StyleSheet.create({
  header: {
    backgroundColor: COLORS.navyDark,
    paddingHorizontal: 18,
    paddingTop: 52,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  headerSub: { color: "rgba(255,255,255,0.55)", fontSize: 12, marginTop: 2 },
  logoutBtn: { borderWidth: 1, borderColor: "rgba(255,255,255,0.25)", borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 },
  logoutText: { color: "rgba(255,255,255,0.85)", fontSize: 13 },
  chipsWrap: { paddingVertical: 10, backgroundColor: COLORS.paper },
  chip: {
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.surface,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginRight: 8,
  },
  chipActive: { backgroundColor: COLORS.navy, borderColor: COLORS.navy },
  chipText: { fontSize: 12, color: COLORS.ink },
  chipTextActive: { color: "#fff" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", rowGap: 6 },
  screenTitle: { color: "#fff", fontSize: 17, fontWeight: "700", flex: 1, textAlign: "center" },
  back: { color: "rgba(255,255,255,0.85)", fontSize: 15 },
  modalHeader: {
    backgroundColor: COLORS.navyDark,
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalClose: { color: "rgba(255,255,255,0.8)", fontSize: 14 },
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
  primaryBtn: { backgroundColor: COLORS.brand, borderRadius: 999, paddingVertical: 13, alignItems: "center", marginTop: 20 },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  errorText: { backgroundColor: "rgba(179,64,42,0.1)", color: COLORS.danger, padding: 10, borderRadius: 8, marginBottom: 10, fontSize: 13 },
  successText: { backgroundColor: "rgba(47,122,77,0.1)", color: COLORS.success, padding: 10, borderRadius: 8, marginBottom: 10, fontSize: 13 },
  card: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: COLORS.line },
  infoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  infoLabel: { color: "rgba(20,24,33,0.5)", fontSize: 13 },
  infoValue: { color: COLORS.ink, fontSize: 13, fontWeight: "500", flex: 1, textAlign: "right", marginLeft: 12 },
  barRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  barMonth: { width: 74, fontSize: 11, color: "rgba(20,24,33,0.6)" },
  barTrack: { flex: 1, height: 14, backgroundColor: COLORS.line, borderRadius: 7, overflow: "hidden" },
  barFill: { height: 14, borderRadius: 7 },
  barValue: { width: 72, textAlign: "right", fontSize: 11, color: COLORS.ink },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  badgeText: { fontSize: 10, fontWeight: "700" },
});
