import { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, RefreshControl } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import staffApi from "../../api/staffClient";
import { useAuth } from "../../context/AuthContext";
import { useStaff } from "../../context/StaffContext";
import { StaffHeader, YearChips, Card, MonthBars, StatTile, SectionTitle, Loading } from "../../components/StaffUI";
import { formatMoney } from "../../utils/format";
import { COLORS, RADIUS, SHADOW } from "../../utils/theme";
import { t } from "../../i18n";

const StaffDashboardScreen = () => {
  const { staff } = useAuth();
  const { selectedYearId } = useStaff();
  const [data, setData] = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!selectedYearId) return;
    const res = await staffApi.get("/reports/dashboard", { params: { academicYearId: selectedYearId } });
    setData(res.data);
    const m = await staffApi.get("/reports/monthly", { params: { academicYearId: selectedYearId } });
    setMonthly(m.data);
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
      <StaffHeader title={t("Dashboard")} />
      <YearChips />
      {!data ? (
        <Loading />
      ) : (
        <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} showsVerticalScrollIndicator={false}>
          <LinearGradient colors={[COLORS.navy, COLORS.navyLight]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
            <View style={styles.heroTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroSmall}>{t("Ku Soo Dhawoow,")}</Text>
                <Text style={styles.heroName} numberOfLines={1}>
                  {staff?.fullName?.split(" ")[0] || "Admin"}
                </Text>
              </View>
              <View style={styles.rateBadge}>
                <Text style={styles.rateValue}>{rate}%</Text>
              </View>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${Math.min(rate, 100)}%` }]} />
            </View>
            <View style={styles.heroBottom}>
              <Text style={styles.heroSmall}>{t("Collection Rate:")}</Text>
              <Text style={styles.heroSmall}>
                {formatMoney(data.totalPaid)} / {formatMoney(data.totalFees)}
              </Text>
            </View>
          </LinearGradient>

          <View style={styles.grid}>
            <StatTile icon="people" label={t("Waalidiinta")} value={data.totalParents} color={COLORS.navy} />
            <StatTile icon="wallet" label={t("Wadarta Fee")} value={formatMoney(data.totalFees)} color={COLORS.navy} />
            <StatTile icon="checkmark-circle" label={t("La Bixiyey")} value={formatMoney(data.totalPaid)} color={COLORS.success} />
            <StatTile icon="alert-circle" label={t("Deynta")} value={formatMoney(data.totalDebt)} color={COLORS.danger} />
          </View>

          <Card>
            <View style={styles.statusRow}>
              {[
                [t("Paid"), data.paidCount, COLORS.success],
                [t("Partial"), data.partialCount, COLORS.amber],
                [t("Unpaid"), data.unpaidCount, COLORS.danger],
              ].map(([label, count, color], i) => (
                <View key={label} style={[styles.statusCol, i > 0 && styles.statusDivider]}>
                  <Text style={[styles.statusCount, { color }]}>{count}</Text>
                  <Text style={styles.statusLabel}>{label}</Text>
                </View>
              ))}
            </View>
          </Card>

          <SectionTitle>{t("Lacagta La Bixiyey Bishii Kasta")}</SectionTitle>
          <Card>
            <MonthBars data={monthly} valueKey="totalPaid" color={COLORS.navy} />
          </Card>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.paper },
  content: { padding: 16, paddingBottom: 30 },
  hero: { borderRadius: RADIUS.xl, padding: 20, marginBottom: 16, ...SHADOW.raised },
  heroTop: { flexDirection: "row", alignItems: "center", marginBottom: 18 },
  heroSmall: { color: "rgba(255,255,255,0.72)", fontSize: 13 },
  heroName: { color: "#fff", fontSize: 28, fontWeight: "800", marginTop: 2 },
  rateBadge: { width: 64, height: 64, borderRadius: 32, backgroundColor: "rgba(255,255,255,0.14)", alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: "rgba(255,255,255,0.35)" },
  rateValue: { color: "#fff", fontSize: 18, fontWeight: "800" },
  track: { height: 8, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 4, overflow: "hidden" },
  fill: { height: 8, backgroundColor: "#4ADE80", borderRadius: 4 },
  heroBottom: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  statusRow: { flexDirection: "row" },
  statusCol: { flex: 1, alignItems: "center", paddingVertical: 4 },
  statusDivider: { borderStartWidth: StyleSheet.hairlineWidth, borderStartColor: COLORS.line },
  statusCount: { fontSize: 24, fontWeight: "800" },
  statusLabel: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
});

export default StaffDashboardScreen;
