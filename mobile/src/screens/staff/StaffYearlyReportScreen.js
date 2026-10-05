import { useCallback, useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import staffApi from "../../api/staffClient";
import { useStaff } from "../../context/StaffContext";
import { ScreenHeader, YearChips, Loading, Card, MonthBars } from "../../components/StaffUI";
import { formatMoney, COLORS, SHADOW } from "../../utils/format";
import { t } from "../../i18n";

const Stat = ({ label, value, color }) => (
  <View style={styles.stat}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={[styles.statValue, color && { color }]}>{value}</Text>
  </View>
);

const StaffYearlyReportScreen = ({ navigation }) => {
  const { selectedYearId } = useStaff();
  const [data, setData] = useState(null);

  useFocusEffect(
    useCallback(() => {
      if (!selectedYearId) return;
      staffApi.get("/reports/yearly", { params: { academicYearId: selectedYearId } }).then((res) => setData(res.data));
    }, [selectedYearId])
  );

  return (
    <View style={styles.flex}>
      <ScreenHeader title={t("Warbixin Sanad Dugsiyeed")} onBack={navigation.goBack} />
      <YearChips />
      {data === null ? (
        <Loading />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 40 }}>
          <Text style={styles.year}>{data.academicYear}</Text>
          <View style={styles.grid}>
            <Stat label={t("Waalidiinta")} value={data.totalParents} />
            <Stat label={t("Wadarta Fees")} value={formatMoney(data.totalFees)} />
            <Stat label={t("La Bixiyey")} value={formatMoney(data.totalPaid)} color={COLORS.success} />
            <Stat label={t("Deynta")} value={formatMoney(data.totalDebt)} color={COLORS.danger} />
            <Stat label={t("Collection Rate")} value={`${data.collectionRate}%`} color={COLORS.amber} />
          </View>
          <Card>
            <Text style={styles.title}>{t("La Bixiyey (bil kasta)")}</Text>
            <MonthBars data={data.monthly} valueKey="paid" color={COLORS.navy} />
          </Card>
          <Card>
            <Text style={styles.title}>{t("Ku Dhiman (bil kasta)")}</Text>
            <MonthBars data={data.monthly} valueKey="balance" color={COLORS.amber} />
          </Card>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.paper },
  year: { fontSize: 20, fontWeight: "700", color: COLORS.ink, marginBottom: 10 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  stat: { width: "48.5%", backgroundColor: COLORS.surface, borderRadius: 18, padding: 14, marginBottom: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: COLORS.line, ...SHADOW.card },
  statLabel: { fontSize: 10, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
  statValue: { fontSize: 19, fontWeight: "700", color: COLORS.ink },
  title: { fontSize: 15, fontWeight: "700", color: COLORS.ink, marginBottom: 12 },
});

export default StaffYearlyReportScreen;
