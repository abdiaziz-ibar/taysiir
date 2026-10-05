import { useCallback, useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import financeApi from "../../api/financeClient";
import { Loading, Card, Chip } from "../../components/StaffUI";
import { FinanceHeader } from "../../components/FinanceUI";
import { formatMoney, COLORS, SHADOW } from "../../utils/format";
import { t } from "../../i18n";

// School years run September → August, so a date before September belongs to the year that began last calendar year.
const currentStartYear = () => {
  const now = new Date();
  return now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
};

const Stat = ({ label, value, color }) => (
  <View style={styles.stat}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={[styles.statValue, color && { color }]}>{value}</Text>
  </View>
);

const FinanceReportScreen = () => {
  const [startYear, setStartYear] = useState(currentStartYear());
  const [data, setData] = useState(null);

  // The year picker: next school year back to four years ago.
  const years = Array.from({ length: 6 }, (_, i) => currentStartYear() + 1 - i);

  useFocusEffect(
    useCallback(() => {
      setData(null);
      financeApi.get("/finance/summary", { params: { startYear } }).then((res) => setData(res.data));
    }, [startYear])
  );

  return (
    <View style={styles.flex}>
      <FinanceHeader title={t("Warbixinta")} />
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 10 }}>
          {years.map((y) => (
            <Chip key={y} label={`${y}-${y + 1}`} active={startYear === y} onPress={() => setStartYear(y)} />
          ))}
        </ScrollView>
      </View>

      {data === null ? (
        <Loading />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 40 }}>
          <Text style={styles.year}>{data.schoolYear}</Text>
          <Text style={styles.note}>{t("Mushaharka iyo qarashaadka marka la bixiyey (Sebtembar → Ogosto).")}</Text>

          <View style={styles.grid}>
            <Stat label={t("Mushaharka")} value={formatMoney(data.totals.salaries)} />
            <Stat label={t("Qarashaadka")} value={formatMoney(data.totals.expenses)} color={COLORS.danger} />
            <Stat label={t("Wadarta Baxday")} value={formatMoney(data.totals.total)} color={COLORS.danger} />
          </View>

          <Card>
            <Text style={styles.title}>{t("Bil Kasta")}</Text>
            {data.months.map((m) => (
              <View key={m.month} style={styles.monthRow}>
                <Text style={styles.monthName}>{t(m.month)}</Text>
                <Text style={styles.monthLine}>
                  {t("Mushahar")} {formatMoney(m.salaries)} {t("· Kharash")} {formatMoney(m.expenses)}
                </Text>
                <Text style={styles.monthTotal}>{formatMoney(m.total)}</Text>
              </View>
            ))}
          </Card>

          {data.expensesByCategory.length > 0 && (
            <Card>
              <Text style={styles.title}>{t("Qarashaadka Noocyadooda")}</Text>
              {data.expensesByCategory.map((c) => (
                <View key={c.category} style={styles.catRow}>
                  <Text style={styles.catName}>{t(c.category)}</Text>
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
  note: { fontSize: 11, color: COLORS.muted, marginTop: 2, marginBottom: 10 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  stat: { width: "48.5%", backgroundColor: COLORS.surface, borderRadius: 18, padding: 14, marginBottom: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: COLORS.line, ...SHADOW.card },
  statLabel: { fontSize: 10, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
  statValue: { fontSize: 19, fontWeight: "700", color: COLORS.ink },
  title: { fontSize: 15, fontWeight: "700", color: COLORS.ink, marginBottom: 10 },
  monthRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderTopWidth: 1, borderTopColor: COLORS.line },
  monthName: { width: 74, fontSize: 12, fontWeight: "600", color: COLORS.ink },
  monthLine: { flex: 1, fontSize: 11, color: COLORS.muted },
  monthTotal: { width: 70, textAlign: "right", fontSize: 12, fontWeight: "700", color: COLORS.ink },
  catRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  catName: { fontSize: 13, color: COLORS.ink },
  catValue: { fontSize: 13, fontWeight: "600", color: COLORS.ink },
});

export default FinanceReportScreen;
