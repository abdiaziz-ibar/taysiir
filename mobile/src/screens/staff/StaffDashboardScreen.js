import { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, RefreshControl, ActivityIndicator } from "react-native";
import staffApi from "../../api/staffClient";
import { useAuth } from "../../context/AuthContext";
import { useStaff } from "../../context/StaffContext";
import { StaffHeader, YearChips } from "../../components/StaffUI";
import { formatMoney, COLORS } from "../../utils/format";

const Stat = ({ label, value, color }) => (
  <View style={styles.stat}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={[styles.statValue, color && { color }]}>{value}</Text>
  </View>
);

const StaffDashboardScreen = () => {
  const { staff } = useAuth();
  const { selectedYearId } = useStaff();
  const [data, setData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!selectedYearId) return;
    const res = await staffApi.get("/reports/dashboard", { params: { academicYearId: selectedYearId } });
    setData(res.data);
  }, [selectedYearId]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const rate = data && data.totalFees > 0 ? Math.round((data.totalPaid / data.totalFees) * 100) : 0;

  return (
    <View style={styles.flex}>
      <StaffHeader title="Dashboard" />
      <YearChips />
      {!data ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.navy} size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View style={styles.hero}>
            <Text style={styles.heroSmall}>Ku Soo Dhawoow,</Text>
            <Text style={styles.heroName}>{staff?.fullName?.split(" ")[0] || "Admin"}</Text>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${Math.min(rate, 100)}%` }]} />
            </View>
            <Text style={styles.heroSmall}>Collection Rate: {rate}%</Text>
          </View>

          <View style={styles.grid}>
            <Stat label="Waalidiinta" value={data.totalParents} />
            <Stat label="Wadarta Fee" value={formatMoney(data.totalFees)} />
            <Stat label="La Bixiyey" value={formatMoney(data.totalPaid)} color={COLORS.success} />
            <Stat label="Deynta" value={formatMoney(data.totalDebt)} color={COLORS.danger} />
            <Stat label="Paid" value={data.paidCount} color={COLORS.success} />
            <Stat label="Partial" value={data.partialCount} color={COLORS.amber} />
            <Stat label="Unpaid" value={data.unpaidCount} color={COLORS.danger} />
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.paper },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { padding: 14, paddingBottom: 40 },
  hero: { backgroundColor: COLORS.navy, borderRadius: 14, padding: 18, marginBottom: 14 },
  heroSmall: { color: "rgba(255,255,255,0.65)", fontSize: 12 },
  heroName: { color: "#fff", fontSize: 24, fontWeight: "700", marginBottom: 12 },
  track: { height: 8, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 999, overflow: "hidden", marginBottom: 8 },
  fill: { height: 8, backgroundColor: "#fff", borderRadius: 999 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  stat: {
    width: "48.5%",
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  statLabel: { fontSize: 10, color: "rgba(20,24,33,0.5)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
  statValue: { fontSize: 20, fontWeight: "700", color: COLORS.ink },
});

export default StaffDashboardScreen;
