import { useCallback, useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import staffApi from "../../api/staffClient";
import { ScreenHeader, Loading, Card, Badge } from "../../components/StaffUI";
import { formatMoney, COLORS } from "../../utils/format";

const Line = ({ label, value, color }) => (
  <View style={styles.line}>
    <Text style={styles.lineLabel}>{label}</Text>
    <Text style={[styles.lineValue, color && { color }]}>{value}</Text>
  </View>
);

const StaffAllYearsReportScreen = ({ navigation }) => {
  const [data, setData] = useState(null);

  useFocusEffect(
    useCallback(() => {
      staffApi.get("/reports/all-years").then((res) => setData(res.data));
    }, [])
  );

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Dhammaan Sannadaha" onBack={navigation.goBack} />
      {data === null ? (
        <Loading />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 40 }}>
          <View style={styles.total}>
            <Text style={styles.totalLabel}>Wadarta Guud</Text>
            <Text style={styles.totalValue}>{formatMoney(data.totals.totalFees)}</Text>
            <Text style={styles.totalSub}>
              La bixiyey {formatMoney(data.totals.totalPaid)} · Ku dhiman {formatMoney(data.totals.totalDebt)}
            </Text>
          </View>
          {data.years.map((y) => (
            <Card key={y.academicYearId}>
              <View style={styles.head}>
                <Text style={styles.yearName}>{y.academicYear}</Text>
                {y.isActive && <Badge text="Firfircoon" color={COLORS.success} />}
              </View>
              <Line label="Waalidiinta" value={y.totalParents} />
              <Line label="Wadarta Fee" value={formatMoney(y.totalFees)} />
              <Line label="La Bixiyey" value={formatMoney(y.totalPaid)} color={COLORS.success} />
              <Line label="Ku Dhiman" value={formatMoney(y.totalDebt)} color={COLORS.danger} />
              <Line label="Collection Rate" value={`${y.collectionRate}%`} />
            </Card>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.paper },
  total: { backgroundColor: COLORS.navy, borderRadius: 12, padding: 16, marginBottom: 12 },
  totalLabel: { color: "rgba(255,255,255,0.65)", fontSize: 12 },
  totalValue: { color: "#fff", fontSize: 26, fontWeight: "700", marginTop: 4 },
  totalSub: { color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 4 },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  yearName: { fontSize: 16, fontWeight: "700", color: COLORS.ink },
  line: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 5 },
  lineLabel: { fontSize: 13, color: "rgba(20,24,33,0.55)" },
  lineValue: { fontSize: 13, fontWeight: "600", color: COLORS.ink },
});

export default StaffAllYearsReportScreen;
