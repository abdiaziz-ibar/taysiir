import { useCallback, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { formatMoney, formatDate, statusLabel, COLORS } from "../utils/format";
import PaymentProofsSection from "../components/PaymentProofsSection";

const StatCard = ({ label, value, accent }) => (
  <View style={styles.statCard}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={[styles.statValue, accent && { color: accent }]}>{value}</Text>
  </View>
);

const DashboardScreen = () => {
  const { parent, logout } = useAuth();
  const [data, setData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const res = await api.get("/parent-portal/me");
    setData(res.data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (!data) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color={COLORS.navy} size="large" />
      </View>
    );
  }

  const { fees, payments } = data;
  const totalFee = fees.reduce((s, f) => s + f.totalAmount, 0);
  const totalPaid = fees.reduce((s, f) => s + f.totalPaid, 0);
  const totalBalance = fees.reduce((s, f) => s + f.balance, 0);
  const paidPct = totalFee > 0 ? Math.min(100, Math.round((totalPaid / totalFee) * 100)) : 0;

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>TF</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>Taysir Foundation</Text>
            <Text style={styles.headerSubtitle}>Xisaabta Waalidka</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Ka Bax</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.hero}>
          <Text style={styles.heroGreeting}>Salaan,</Text>
          <Text style={styles.heroName}>{parent?.fullName}</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${paidPct}%` }]} />
          </View>
          <Text style={styles.heroPct}>{paidPct}% ee lacagta guud ayaa la bixiyey</Text>
        </View>

        <View style={styles.statsRow}>
          <StatCard label="Wadarta Lacagta" value={formatMoney(totalFee)} />
          <StatCard label="La Bixiyey" value={formatMoney(totalPaid)} accent={COLORS.success} />
        </View>
        <StatCard label="Ku Dhiman" value={formatMoney(totalBalance)} accent={COLORS.danger} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sanad Dugsiyeedka</Text>
          {fees.length === 0 && <Text style={styles.emptyText}>Weli Fee lama dhigin.</Text>}
          {fees.map((f) => (
            <View key={f._id} style={styles.row}>
              <View style={styles.rowMain}>
                <Text style={styles.rowTitle}>{f.academicYearId?.name}</Text>
                <Text style={styles.rowSub}>
                  {formatMoney(f.totalAmount)} · {statusLabel(f.status)}
                </Text>
              </View>
              <View style={styles.rowRight}>
                <Text style={styles.rowSuccess}>{formatMoney(f.totalPaid)}</Text>
                <Text style={styles.rowDanger}>{formatMoney(f.balance)}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Taariikhda Lacag Bixinta</Text>
          {payments.length === 0 && <Text style={styles.emptyText}>Weli lacag lama bixin.</Text>}
          {payments.map((p) => (
            <View key={p._id} style={styles.row}>
              <View style={styles.rowMain}>
                <Text style={styles.rowTitle}>{p.receiptNumber}</Text>
                <Text style={styles.rowSub}>
                  {formatDate(p.paymentDate)} · {p.paymentMethod}
                </Text>
              </View>
              <Text style={styles.rowAmount}>{formatMoney(p.amount)}</Text>
            </View>
          ))}
        </View>

        <PaymentProofsSection payments={payments} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.paper },
  loadingScreen: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.paper },
  header: {
    backgroundColor: COLORS.navyDark,
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  logoBadge: { width: 38, height: 38, borderRadius: 10, backgroundColor: "#0ea5e9", alignItems: "center", justifyContent: "center", marginRight: 10 },
  logoText: { color: "#fff", fontWeight: "700" },
  headerTitle: { color: "#fff", fontSize: 16, fontWeight: "700" },
  headerSubtitle: { color: "rgba(255,255,255,0.5)", fontSize: 11 },
  logoutBtn: { borderWidth: 1, borderColor: "rgba(255,255,255,0.2)", borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 },
  logoutText: { color: "rgba(255,255,255,0.8)", fontSize: 13 },
  content: { padding: 16, paddingBottom: 48 },
  hero: { backgroundColor: COLORS.navy, borderRadius: 14, padding: 18, marginBottom: 14 },
  heroGreeting: { color: "rgba(255,255,255,0.6)", fontSize: 13 },
  heroName: { color: "#fff", fontSize: 22, fontWeight: "700", marginBottom: 12 },
  progressTrack: { height: 8, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 999, overflow: "hidden" },
  progressFill: { height: 8, backgroundColor: "#fff", borderRadius: 999 },
  heroPct: { color: "rgba(255,255,255,0.7)", fontSize: 11, marginTop: 8 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  statCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: COLORS.line },
  statLabel: { fontSize: 10, color: "rgba(20,24,33,0.5)", textTransform: "uppercase", marginBottom: 6, letterSpacing: 0.5 },
  statValue: { fontSize: 20, fontWeight: "700", color: COLORS.ink },
  section: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 14, marginTop: 4, marginBottom: 14, borderWidth: 1, borderColor: COLORS.line },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: COLORS.ink, marginBottom: 10 },
  emptyText: { color: "rgba(20,24,33,0.4)", fontSize: 13, textAlign: "center", paddingVertical: 12 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderTopWidth: 1, borderTopColor: COLORS.line },
  rowMain: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: "600", color: COLORS.ink },
  rowSub: { fontSize: 12, color: "rgba(20,24,33,0.5)", marginTop: 2 },
  rowRight: { alignItems: "flex-end" },
  rowSuccess: { color: COLORS.success, fontSize: 13, fontWeight: "600" },
  rowDanger: { color: COLORS.danger, fontSize: 12, marginTop: 2 },
  rowAmount: { color: COLORS.ink, fontSize: 14, fontWeight: "600" },
});

export default DashboardScreen;
