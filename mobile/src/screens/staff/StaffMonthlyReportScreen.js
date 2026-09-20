import { useCallback, useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import staffApi from "../../api/staffClient";
import { useStaff } from "../../context/StaffContext";
import { ScreenHeader, YearChips, Loading, Card, MonthBars } from "../../components/StaffUI";
import { formatMoney, COLORS } from "../../utils/format";

const StaffMonthlyReportScreen = ({ navigation }) => {
  const { selectedYearId } = useStaff();
  const [data, setData] = useState(null);

  useFocusEffect(
    useCallback(() => {
      if (!selectedYearId) return;
      staffApi.get("/reports/monthly", { params: { academicYearId: selectedYearId } }).then((res) => setData(res.data));
    }, [selectedYearId])
  );

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Warbixinta Bilaha" onBack={navigation.goBack} />
      <YearChips />
      {data === null ? (
        <Loading />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 40 }}>
          <Card>
            <Text style={styles.title}>Lacagta La Bixiyey Bishii Kasta</Text>
            <MonthBars data={data} valueKey="totalPaid" />
          </Card>
          <Card>
            {data.map((m) => (
              <View key={m.month} style={styles.row}>
                <Text style={styles.month}>{m.month}</Text>
                <Text style={styles.count}>{m.paymentsCount} lacag-bixin</Text>
                <Text style={styles.amount}>{formatMoney(m.totalPaid)}</Text>
              </View>
            ))}
          </Card>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.paper },
  title: { fontSize: 15, fontWeight: "700", color: COLORS.ink, marginBottom: 12 },
  row: { flexDirection: "row", paddingVertical: 9, borderTopWidth: 1, borderTopColor: COLORS.line, alignItems: "center" },
  month: { flex: 1, fontSize: 14, color: COLORS.ink },
  count: { fontSize: 12, color: "rgba(20,24,33,0.5)", marginRight: 12 },
  amount: { fontSize: 14, fontWeight: "600", color: COLORS.success },
});

export default StaffMonthlyReportScreen;
