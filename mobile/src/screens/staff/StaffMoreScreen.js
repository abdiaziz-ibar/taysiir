import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { StaffHeader } from "../../components/StaffUI";
import { COLORS } from "../../utils/format";

const GROUPS = [
  {
    title: "Maamulka",
    items: [
      { icon: "💰", label: "Lacagaha School-ka", route: "Fees" },
      { icon: "⚠️", label: "Deymaha", route: "Debts" },
    ],
  },
  {
    title: "Warbixinnada",
    items: [
      { icon: "📅", label: "Warbixin Bille", route: "MonthlyReport" },
      { icon: "🗓️", label: "Warbixin Sanad Dugsiyeed", route: "YearlyReport" },
      { icon: "📚", label: "Dhammaan Sannadaha", route: "AllYearsReport" },
      { icon: "👪", label: "Wadarta Waalidiinta", route: "ParentsSummary" },
    ],
  },
  {
    title: "Nidaamka",
    items: [
      { icon: "🎓", label: "Sanad Dugsiyeedka", route: "AcademicYears" },
      { icon: "👤", label: "Isticmaalayaasha", route: "Users", adminOnly: true },
      { icon: "⚙️", label: "Dejinta", route: "Settings" },
    ],
  },
];

const StaffMoreScreen = ({ navigation }) => {
  const { staff } = useAuth();
  const isAdmin = staff?.role === "admin";

  return (
    <View style={styles.flex}>
      <StaffHeader title="Dheeri" />
      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 40 }}>
        {GROUPS.map((g) => (
          <View key={g.title} style={{ marginBottom: 14 }}>
            <Text style={styles.group}>{g.title}</Text>
            <View style={styles.card}>
              {g.items
                .filter((i) => !i.adminOnly || isAdmin)
                .map((i, idx) => (
                  <TouchableOpacity
                    key={i.route}
                    style={[styles.row, idx > 0 && styles.rowBorder]}
                    onPress={() => navigation.navigate(i.route)}
                  >
                    <Text style={styles.icon}>{i.icon}</Text>
                    <Text style={styles.label}>{i.label}</Text>
                    <Text style={styles.chev}>›</Text>
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
  group: { fontSize: 12, color: "rgba(20,24,33,0.5)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6, marginLeft: 4 },
  card: { backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, borderColor: COLORS.line, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 14 },
  rowBorder: { borderTopWidth: 1, borderTopColor: COLORS.line },
  icon: { fontSize: 18, width: 30 },
  label: { flex: 1, fontSize: 15, color: COLORS.ink },
  chev: { fontSize: 20, color: "rgba(20,24,33,0.3)" },
});

export default StaffMoreScreen;
