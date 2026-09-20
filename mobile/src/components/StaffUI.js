import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useAuth } from "../context/AuthContext";
import { useStaff } from "../context/StaffContext";
import { COLORS } from "../utils/format";

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
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  badgeText: { fontSize: 10, fontWeight: "700" },
});
