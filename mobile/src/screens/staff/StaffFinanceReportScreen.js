import { useCallback, useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import staffApi from "../../api/staffClient";
import { useStaff } from "../../context/StaffContext";
import { ScreenHeader, YearChips, Loading, Card } from "../../components/StaffUI";
import { formatMoney, COLORS } from "../../utils/format";
import { formatSigned } from "../../utils/finance";

const Stat = ({ label, value, color }) => (
  <View style={styles.stat}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={[styles.statValue, color && { color }]}>{value}</Text>
  </View>
);

const StaffFinanceReportScreen = ({ navigation }) => {
  const { selectedYearId } = useStaff();
  const [data, setData] = useState(null);

  useFocusEffect(
    useCallback(() => {
      if (!selectedYearId) return;
      setData(null);
      staffApi.get("/finance/summary", { params: { academicYearId: selectedYearId } }).then((res) => setData(res.data));
    }, [selectedYearId])
  );

  const net = data?.totals.net ?? 0;
  const netColor = net >= 0 ? COLORS.success : COLORS.danger;

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Warbixinta Maaliyadda" onBack={navigation.goBack} />
      <YearChips />
      {data === null ? (
        <Loading />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 40 }}>
          <Text style={styles.year}>{data.academicYear}</Text>
          <Text style={styles.note}>Dakhli = lacagaha waalidiinta ee sanadkan. Mushaharka & qarashaadka = marka la bixiyey (Sebtembar → Ogosto).</Text>

          <View style={styles.grid}>
            <Stat label="Dakhli (Fees)" value={formatMoney(data.totals.income)} color={COLORS.success} />
            <Stat label="Mushaharka" value={formatMoney(data.totals.salaries)} />
            <Stat label="Qarashaadka" value={formatMoney(data.totals.expenses)} color={COLORS.danger} />
            <Stat label={net >= 0 ? "Faa'iido" : "Khasaare"} value={formatSigned(net)} color={netColor} />
          </View>

          <Card>
            <Text style={styles.title}>Bil Kasta</Text>
            {data.months.map((m) => (
              <View key={m.month} style={styles.monthRow}>
                <Text style={styles.monthName}>{m.month}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.monthLine}>
                    Dakhli {formatMoney(m.income)} · Mushahar {formatMoney(m.salaries)} · Kharash {formatMoney(m.expenses)}
                  </Text>
                </View>
                <Text style={[styles.monthNet, { color: m.net >= 0 ? COLORS.success : COLORS.danger }]}>{formatSigned(m.net)}</Text>
              </View>
            ))}
          </Card>

          {data.expensesByCategory.length > 0 && (
            <Card>
              <Text style={styles.title}>Qarashaadka Noocyadooda</Text>
              {data.expensesByCategory.map((c) => (
                <View key={c.category} style={styles.catRow}>
                  <Text style={styles.catName}>{c.category}</Text>
                  <Text style={styles.catValue}>{formatMoney(c.total)}</Text>
                </View>
              ))}
            </Card>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.paper },
  year: { fontSize: 20, fontWeight: "700", color: COLORS.ink },
  note: { fontSize: 11, color: "rgba(20,24,33,0.5)", marginTop: 2, marginBottom: 10 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  stat: { width: "48.5%", backgroundColor: COLORS.surface, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: COLORS.line },
  statLabel: { fontSize: 10, color: "rgba(20,24,33,0.5)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
  statValue: { fontSize: 19, fontWeight: "700", color: COLORS.ink },
  title: { fontSize: 15, fontWeight: "700", color: COLORS.ink, marginBottom: 10 },
  monthRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderTopWidth: 1, borderTopColor: COLORS.line },
  monthName: { width: 74, fontSize: 12, fontWeight: "600", color: COLORS.ink },
  monthLine: { fontSize: 11, color: "rgba(20,24,33,0.6)" },
  monthNet: { width: 76, textAlign: "right", fontSize: 12, fontWeight: "700" },
  catRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  catName: { fontSize: 13, color: COLORS.ink },
  catValue: { fontSize: 13, fontWeight: "600", color: COLORS.ink },
});

export default StaffFinanceReportScreen;
