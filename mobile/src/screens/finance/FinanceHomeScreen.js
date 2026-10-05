import { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import financeApi from "../../api/financeClient";
import { FinanceHeader } from "../../components/FinanceUI";
import { Loading, Card, SectionTitle, EmptyState } from "../../components/StaffUI";
import MonthNav from "../../components/MonthNav";
import Icon from "../../components/Icon";
import { formatMoney, formatDate } from "../../utils/format";
import { COLORS, RADIUS, SHADOW } from "../../utils/theme";
import { currentMonth } from "../../utils/finance";
import { t } from "../../i18n";

const Action = ({ icon, label, color, onPress }) => (
  <TouchableOpacity style={styles.action} onPress={onPress} activeOpacity={0.8}>
    <View style={[styles.actionIcon, { backgroundColor: `${color}1A` }]}>
      <Icon name={icon} size={22} color={color} />
    </View>
    <Text style={styles.actionLabel} numberOfLines={2}>
      {label}
    </Text>
  </TouchableOpacity>
);

// Overview of the month: what was paid out, what's still unpaid, shortcuts and recent entries.
const FinanceHomeScreen = ({ navigation }) => {
  const [month, setMonth] = useState(currentMonth());
  const [sal, setSal] = useState(null);
  const [exp, setExp] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [s, e] = await Promise.all([
      financeApi.get("/salaries/summary", { params: { period: month } }),
      financeApi.get("/expenses", { params: { month } }),
    ]);
    setSal(s.data);
    setExp(e.data);
  }, [month]);

  useEffect(() => {
    setSal(null);
    setExp(null);
    load();
  }, [load]);

  useEffect(() => navigation.addListener("focus", load), [navigation, load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const ready = sal && exp;
  const paid = sal?.totals.paid || 0;
  const due = sal?.totals.salary || 0;
  const pct = due > 0 ? Math.min(100, Math.round((paid / due) * 100)) : 0;
  const unpaid = sal ? sal.rows.filter((r) => r.payments.length === 0).length : 0;

  // Latest salary payments and expenses of the month, newest first.
  const recent = ready
    ? [
        ...sal.rows.flatMap((r) =>
          r.payments.map((p) => ({ id: p._id, icon: "cash", color: COLORS.navy, title: r.employee.fullName, sub: `${t("Mushaharka")} · ${formatDate(p.paymentDate)}`, amount: p.amount, date: p.paymentDate }))
        ),
        ...exp.expenses.map((x) => ({ id: x._id, icon: "receipt", color: COLORS.brand, title: x.description, sub: `${t(x.category)} · ${formatDate(x.expenseDate)}`, amount: x.amount, date: x.expenseDate })),
      ]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 6)
    : [];

  return (
    <View style={styles.flex}>
      <FinanceHeader title={t("Maaliyadda")} />
      {!ready ? (
        <Loading />
      ) : (
        <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} showsVerticalScrollIndicator={false}>
          <MonthNav period={month} onChange={setMonth} />

          <LinearGradient colors={[COLORS.navy, COLORS.navyLight]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
            <Text style={styles.heroLabel}>{t("Wadarta Baxday bishan")}</Text>
            <Text style={styles.heroAmount}>{formatMoney(paid + exp.total)}</Text>
            <View style={styles.miniRow}>
              <View style={styles.mini}>
                <Text style={styles.miniLabel}>{t("Mushaharka")}</Text>
                <Text style={styles.miniValue}>{formatMoney(paid)}</Text>
              </View>
              <View style={styles.mini}>
                <Text style={styles.miniLabel}>{t("Qarashaadka")}</Text>
                <Text style={styles.miniValue}>{formatMoney(exp.total)}</Text>
              </View>
            </View>
          </LinearGradient>

          <Card>
            <View style={styles.payHead}>
              <Text style={styles.payTitle}>{t("Mushaharka bishan")}</Text>
              <Text style={styles.payPct}>{pct}%</Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${pct}%` }]} />
            </View>
            <Text style={styles.paySub}>
              {formatMoney(paid)} / {formatMoney(due)}
            </Text>
            {unpaid > 0 ? (
              <TouchableOpacity style={styles.unpaid} onPress={() => navigation.navigate("Salaries")} activeOpacity={0.8}>
                <Icon name="alert-circle" size={18} color={COLORS.amber} />
                <Text style={styles.unpaidText}>{t("{count} shaqaale weli lama bixin", { count: unpaid })}</Text>
                <Icon name="chevron-forward" size={16} color={COLORS.amber} />
              </TouchableOpacity>
            ) : null}
          </Card>

          <View style={styles.actions}>
            <Action icon="cash" label={t("Bixi Mushaharka")} color={COLORS.navy} onPress={() => navigation.navigate("Salaries")} />
            <Action icon="receipt" label={t("Kharash Cusub")} color={COLORS.brand} onPress={() => navigation.navigate("Expenses", { add: true })} />
            <Action icon="person-add" label={t("Shaqaale Cusub")} color={COLORS.success} onPress={() => navigation.navigate("Employees")} />
          </View>

          <SectionTitle>{t("Dhaqdhaqaaqii u dambeeyay")}</SectionTitle>
          {recent.length === 0 ? (
            <Card>
              <EmptyState compact icon="time-outline" text={t("Bishan wax lama bixin.")} />
            </Card>
          ) : (
            <Card style={{ paddingVertical: 4 }}>
              {recent.map((r, i) => (
                <View key={r.id} style={[styles.recentRow, i > 0 && styles.recentBorder]}>
                  <View style={[styles.recentIcon, { backgroundColor: `${r.color}1A` }]}>
                    <Icon name={r.icon} size={16} color={r.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.recentTitle} numberOfLines={1}>
                      {r.title}
                    </Text>
                    <Text style={styles.recentSub}>{r.sub}</Text>
                  </View>
                  <Text style={styles.recentAmount}>{formatMoney(r.amount)}</Text>
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
  content: { padding: 16, paddingBottom: 30 },
  hero: { borderRadius: RADIUS.xl, padding: 20, marginTop: 14, marginBottom: 14, ...SHADOW.raised },
  heroLabel: { color: "rgba(255,255,255,0.72)", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.8 },
  heroAmount: { color: "#fff", fontSize: 36, fontWeight: "800", marginTop: 4, marginBottom: 16 },
  miniRow: { flexDirection: "row", gap: 10 },
  mini: { flex: 1, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: RADIUS.md, padding: 12 },
  miniLabel: { color: "rgba(255,255,255,0.7)", fontSize: 11 },
  miniValue: { color: "#fff", fontSize: 18, fontWeight: "800", marginTop: 3 },
  payHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  payTitle: { fontSize: 15, fontWeight: "800", color: COLORS.ink },
  payPct: { fontSize: 15, fontWeight: "800", color: COLORS.success },
  track: { height: 8, backgroundColor: COLORS.paper, borderRadius: 4, overflow: "hidden", marginTop: 12 },
  fill: { height: 8, backgroundColor: COLORS.success, borderRadius: 4 },
  paySub: { fontSize: 12, color: COLORS.muted, marginTop: 8 },
  unpaid: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: COLORS.amberTint, borderRadius: RADIUS.md, padding: 12, marginTop: 12 },
  unpaidText: { flex: 1, fontSize: 13, fontWeight: "700", color: COLORS.amber },
  actions: { flexDirection: "row", gap: 10, marginBottom: 6 },
  action: { flex: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 14, alignItems: "center", ...SHADOW.card },
  actionIcon: { width: 46, height: 46, borderRadius: 15, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  actionLabel: { fontSize: 12, fontWeight: "700", color: COLORS.ink, textAlign: "center" },
  recentRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  recentBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.line },
  recentIcon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  recentTitle: { fontSize: 14, fontWeight: "700", color: COLORS.ink },
  recentSub: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  recentAmount: { fontSize: 14, fontWeight: "800", color: COLORS.ink },
});

export default FinanceHomeScreen;
