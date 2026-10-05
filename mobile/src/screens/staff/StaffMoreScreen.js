import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { StaffHeader, Avatar } from "../../components/StaffUI";
import Icon from "../../components/Icon";
import { COLORS, RADIUS, SHADOW } from "../../utils/theme";
import { t } from "../../i18n";

const GROUPS = [
  {
    title: "Maamulka",
    items: [
      { icon: "wallet", color: COLORS.navy, label: "Lacagaha School-ka", route: "Fees" },
      { icon: "alert-circle", color: COLORS.danger, label: "Deymaha", route: "Debts" },
    ],
  },
  {
    title: "Warbixinnada",
    items: [
      { icon: "calendar", color: "#0E7490", label: "Warbixin Bille", route: "MonthlyReport" },
      { icon: "calendar-number", color: "#7C3AED", label: "Warbixin Sanad Dugsiyeed", route: "YearlyReport" },
      { icon: "layers", color: COLORS.success, label: "Dhammaan Sannadaha", route: "AllYearsReport" },
      { icon: "people-circle", color: COLORS.amber, label: "Wadarta Waalidiinta", route: "ParentsSummary" },
    ],
  },
  {
    title: "Nidaamka",
    items: [
      { icon: "school", color: COLORS.navy, label: "Sanad Dugsiyeedka", route: "AcademicYears" },
      { icon: "person-circle", color: COLORS.brand, label: "Isticmaalayaasha", route: "Users", adminOnly: true },
      { icon: "settings", color: COLORS.muted, label: "Dejinta", route: "Settings" },
    ],
  },
];

const StaffMoreScreen = ({ navigation }) => {
  const { staff } = useAuth();
  const isAdmin = staff?.role === "admin";

  return (
    <View style={styles.flex}>
      <StaffHeader title={t("Dheeri")} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={styles.profile}>
          <Avatar name={staff?.fullName} size={52} />
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName} numberOfLines={1}>
              {staff?.fullName}
            </Text>
            <Text style={styles.profileRole}>{t(isAdmin ? "Admin" : "Staff")}</Text>
          </View>
        </View>

        {GROUPS.map((g) => (
          <View key={g.title} style={{ marginBottom: 6 }}>
            <Text style={styles.group}>{t(g.title)}</Text>
            <View style={styles.card}>
              {g.items
                .filter((i) => !i.adminOnly || isAdmin)
                .map((i, idx) => (
                  <TouchableOpacity key={i.route} style={[styles.row, idx > 0 && styles.rowBorder]} onPress={() => navigation.navigate(i.route)} activeOpacity={0.7}>
                    <View style={[styles.iconBox, { backgroundColor: `${i.color}1A` }]}>
                      <Icon name={i.icon} size={19} color={i.color} />
                    </View>
                    <Text style={styles.label}>{t(i.label)}</Text>
                    <Icon name="chevron-forward" size={18} color={COLORS.faint} />
                  </TouchableOpacity>
                ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.paper },
  profile: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 16, marginBottom: 18, ...SHADOW.card },
  profileName: { fontSize: 17, fontWeight: "800", color: COLORS.ink },
  profileRole: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  group: { fontSize: 12, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: "700", marginBottom: 8, marginTop: 10, marginStart: 4 },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, overflow: "hidden", ...SHADOW.card },
  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 13, gap: 12 },
  rowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.line },
  iconBox: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  label: { flex: 1, fontSize: 15, fontWeight: "600", color: COLORS.ink },
});

export default StaffMoreScreen;
