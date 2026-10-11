import { useCallback, useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import financeApi from "../../api/financeClient";
import { Loading, Card, Chip, StatTile, SectionTitle, EmptyState } from "../../components/StaffUI";
import { FinanceHeader } from "../../components/FinanceUI";
import { formatMoney } from "../../utils/format";
import { COLORS, RADIUS } from "../../utils/theme";
import { currentStartYear } from "../../utils/finance";
import { t } from "../../i18n";

// One line of a month card: a group name and its due / paid / unpaid figures. `est` marks estimates ("~").
const Line = ({ label, due, paid, unpaid, est, strong }) => (
  <View style={styles.line}>
    <Text style={[styles.lineLabel, strong && styles.strong]} numberOfLines={1}>
      {label}
    </Text>
    <Text style={[styles.cell, strong && styles.strong]}>
      {est && unpaid > 0 ? "~" : ""}
      {formatMoney(due)}
    </Text>
    <Text style={[styles.cell, { color: COLORS.success }, strong && styles.strong]}>{formatMoney(paid)}</Text>
    <Text style={[styles.cell, { color: unpaid > 0 ? COLORS.danger : COLORS.faint }, strong && styles.strong]}>
      {est && unpaid > 0 ? "~" : ""}
      {formatMoney(unpaid)}
    </Text>
  </View>
);

// The grand total of a school year: salaries + other expenses, month by month — due, paid and unpaid.
const FinanceReportScreen = () => {
  const [startYear, setStartYear] = useState(currentStartYear());
  const [data, setData] = useState(null);

  // The year picker: next school year back to four years ago.
  const years = Array.from({ length: 6 }, (_, i) => currentStartYear() + 1 - i);

  useFocusEffect(
    useCallback(() => {
      setData(null);
      financeApi.get("/finance/year", { params: { startYear } }).then((res) => setData(res.data));
    }, [startYear])
  );

  const months = data ? data.months.filter((m) => !m.idle && !(m.future && m.paid === 0)) : [];

  return (
    <View style={styles.flex}>
      <FinanceHeader title={t("Wadarta Guud")} />
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
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          <View style={styles.grid}>
            <StatTile icon="wallet" label={t("Wadarta La Bixiyey")} value={formatMoney(data.totals.paid)} color="#7C3AED" note={t("Mushaharka + qarashaadka")} />
            <StatTile icon="people" label={t("Mushaharka La Bixiyey")} value={formatMoney(data.totals.salaryPaid)} color={COLORS.success} />
            <StatTile icon="receipt" label={t("Qarashaadka La Bixiyey")} value={formatMoney(data.totals.expenses)} color={COLORS.navy} />
            <StatTile icon="alert-circle" label={t("Mushaharka Lama Bixin")} value={formatMoney(data.totals.salaryRemaining)} color={COLORS.danger} note={t("Qarashaad lama bixin: {count} nooc", { count: data.totals.expenseUnpaidCount })} />
          </View>

          <SectionTitle>{t("Bil Kasta")}</SectionTitle>
          {months.length === 0 ? (
            <Card>
              <EmptyState compact icon="calendar-outline" text={t("Weli lacag lama bixin sanadkan.")} />
            </Card>
          ) : (
            months.map((m) => (
              <Card key={m.period}>
                <View style={styles.monthHead}>
                  <Text style={styles.monthName}>{t(m.month)}</Text>
                  <Text style={styles.monthTotal}>{formatMoney(m.paid + m.unpaid)}</Text>
                </View>
                <View style={styles.line}>
                  <Text style={styles.lineLabel} />
                  <Text style={styles.head}>{t("La Rabay")}</Text>
                  <Text style={styles.head}>{t("La Bixiyey")}</Text>
                  <Text style={styles.head}>{t("Lama Bixin")}</Text>
                </View>
                <Line label={t("Mushaharka")} due={m.salaryDue} paid={m.salaryPaid} unpaid={m.salaryRemaining} />
                <Line label={t("Qarashaadka")} due={m.expenseDue} paid={m.expenses} unpaid={m.expenseUnpaid.estimate} est />
                <View style={styles.divider} />
                <Line label={t("Wadarta")} due={m.due} paid={m.paid} unpaid={m.unpaid} est strong />
              </Card>
            ))
          )}
          <Text style={styles.note}>{t("Qarashaadka la rabay iyo lama bixin (~) waa qiyaas: nooc kasta oo bishaas aan la bixin wuxuu qiimo u qaadanayaa lacagtii ugu dambeysay ee nooca la bixiyey. Isku Dar = La Bixiyey + Lama Bixin.")}</Text>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.paper },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  monthHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  monthName: { fontSize: 16, fontWeight: "800", color: COLORS.ink },
  monthTotal: { fontSize: 16, fontWeight: "800", color: COLORS.navy },
  line: { flexDirection: "row", alignItems: "center", paddingVertical: 5 },
  lineLabel: { width: 84, fontSize: 12.5, color: COLORS.muted },
  head: { flex: 1, textAlign: "right", fontSize: 10.5, color: COLORS.faint, fontWeight: "600" },
  cell: { flex: 1, textAlign: "right", fontSize: 12.5, color: COLORS.ink },
  strong: { fontWeight: "800", color: COLORS.ink },
  divider: { height: 1, backgroundColor: COLORS.line, marginVertical: 4 },
  note: { fontSize: 11.5, color: COLORS.muted, marginTop: 6, lineHeight: 17 },
});

export default FinanceReportScreen;
