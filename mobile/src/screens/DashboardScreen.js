import { useCallback, useState } from "react";
import { View, Text, ScrollView, StyleSheet, RefreshControl } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { formatMoney, formatDate, statusLabel } from "../utils/format";
import { COLORS, RADIUS, SHADOW } from "../utils/theme";
import PaymentProofsSection from "../components/PaymentProofsSection";
import ParentChangePasswordModal from "../components/ParentChangePasswordModal";
import LanguageButton from "../i18n/LanguageButton";
import Icon from "../components/Icon";
import { AppHeader, IconButton, Card, SectionTitle, EmptyState, Badge, Loading, feeStatusColor } from "../components/StaffUI";
import { t } from "../i18n";

const DashboardScreen = () => {
  const { parent, logout } = useAuth();
  const [data, setData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

  const header = (
    <AppHeader
      title={t("Xisaabta Waalidka")}
      subtitle="Taysir Foundation"
      actions={
        <>
          <LanguageButton light />
          <IconButton name="key-outline" onPress={() => setShowPassword(true)} label="Password" />
          <IconButton name="log-out-outline" onPress={logout} label="Log out" />
        </>
      }
    />
  );

  if (!data) {
    return (
      <View style={styles.flex}>
        {header}
        <Loading />
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
      {header}

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient colors={[COLORS.navy, COLORS.navyLight]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <Text style={styles.heroGreeting}>{t("Salaan,")}</Text>
          <Text style={styles.heroName} numberOfLines={1}>
            {parent?.fullName}
          </Text>

          <Text style={styles.heroLabel}>{t("Ku Dhiman")}</Text>
          <Text style={styles.heroAmount}>{formatMoney(totalBalance)}</Text>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${paidPct}%` }]} />
          </View>
          <Text style={styles.heroPct}>
            {paidPct}
            {t("% ee lacagta guud ayaa la bixiyey")}
          </Text>

          <View style={styles.miniRow}>
            <View style={styles.mini}>
              <Text style={styles.miniLabel}>{t("Wadarta Lacagta")}</Text>
              <Text style={styles.miniValue}>{formatMoney(totalFee)}</Text>
            </View>
            <View style={styles.mini}>
              <Text style={styles.miniLabel}>{t("La Bixiyey")}</Text>
              <Text style={[styles.miniValue, { color: "#86EFAC" }]}>{formatMoney(totalPaid)}</Text>
            </View>
          </View>
        </LinearGradient>

        <SectionTitle>{t("Sanad Dugsiyeedka")}</SectionTitle>
        {fees.length === 0 ? (
          <Card>
            <EmptyState compact icon="school-outline" text={t("Weli Fee lama dhigin.")} />
          </Card>
        ) : (
          fees.map((f) => {
            const pct = f.totalAmount > 0 ? Math.min(100, Math.round((f.totalPaid / f.totalAmount) * 100)) : 0;
            return (
              <Card key={f._id}>
                <View style={styles.feeHead}>
                  <View style={styles.feeIcon}>
                    <Icon name="school" size={18} color={COLORS.navy} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.feeYear}>{f.academicYearId?.name}</Text>
                    <Text style={styles.feeSub}>{formatMoney(f.totalAmount)}</Text>
                  </View>
                  <Badge text={statusLabel(f.status)} color={feeStatusColor(f.status)} />
                </View>
                <View style={styles.feeTrack}>
                  <View style={[styles.feeFill, { width: `${pct}%` }]} />
                </View>
                <View style={styles.feeNumbers}>
                  <View>
                    <Text style={styles.numLabel}>{t("La Bixiyey")}</Text>
                    <Text style={[styles.num, { color: COLORS.success }]}>{formatMoney(f.totalPaid)}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.numLabel}>{t("Ku Dhiman")}</Text>
                    <Text style={[styles.num, { color: COLORS.danger }]}>{formatMoney(f.balance)}</Text>
                  </View>
                </View>
              </Card>
            );
          })
        )}

        <SectionTitle>{t("Taariikhda Lacag Bixinta")}</SectionTitle>
        {payments.length === 0 ? (
          <Card>
            <EmptyState compact icon="receipt-outline" text={t("Weli lacag lama bixin.")} />
          </Card>
        ) : (
          <Card style={{ paddingVertical: 4 }}>
            {payments.map((p, i) => (
              <View key={p._id} style={[styles.payRow, i > 0 && styles.payRowBorder]}>
                <View style={styles.payIcon}>
                  <Icon name="arrow-down" size={16} color={COLORS.success} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.payTitle}>{p.receiptNumber}</Text>
                  <Text style={styles.paySub}>
                    {formatDate(p.paymentDate)} · {t(p.paymentMethod)}
                  </Text>
                </View>
                <Text style={styles.payAmount}>{formatMoney(p.amount)}</Text>
              </View>
            ))}
          </Card>
        )}

        <PaymentProofsSection payments={payments} />
      </ScrollView>

      <ParentChangePasswordModal visible={showPassword} onClose={() => setShowPassword(false)} />
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.paper },
  content: { padding: 16, paddingBottom: 48 },
  hero: { borderRadius: RADIUS.xl, padding: 20, marginBottom: 8, ...SHADOW.raised },
  heroGreeting: { color: "rgba(255,255,255,0.7)", fontSize: 13 },
  heroName: { color: "#fff", fontSize: 22, fontWeight: "800", marginBottom: 18 },
  heroLabel: { color: "rgba(255,255,255,0.7)", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.8 },
  heroAmount: { color: "#fff", fontSize: 38, fontWeight: "800", marginTop: 2, marginBottom: 14 },
  progressTrack: { height: 8, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 4, overflow: "hidden" },
  progressFill: { height: 8, backgroundColor: "#4ADE80", borderRadius: 4 },
  heroPct: { color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 8 },
  miniRow: { flexDirection: "row", gap: 10, marginTop: 16 },
  mini: { flex: 1, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: RADIUS.md, padding: 12 },
  miniLabel: { color: "rgba(255,255,255,0.7)", fontSize: 11 },
  miniValue: { color: "#fff", fontSize: 18, fontWeight: "800", marginTop: 3 },
  feeHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  feeIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: COLORS.navyTint, alignItems: "center", justifyContent: "center" },
  feeYear: { fontSize: 16, fontWeight: "800", color: COLORS.ink },
  feeSub: { fontSize: 12, color: COLORS.muted, marginTop: 1 },
  feeTrack: { height: 7, backgroundColor: COLORS.paper, borderRadius: 4, overflow: "hidden", marginTop: 14 },
  feeFill: { height: 7, backgroundColor: COLORS.success, borderRadius: 4 },
  feeNumbers: { flexDirection: "row", justifyContent: "space-between", marginTop: 12 },
  numLabel: { fontSize: 11, color: COLORS.muted },
  num: { fontSize: 16, fontWeight: "800", marginTop: 2 },
  payRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 12 },
  payRowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.line },
  payIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: COLORS.successTint, alignItems: "center", justifyContent: "center" },
  payTitle: { fontSize: 14, fontWeight: "700", color: COLORS.ink },
  paySub: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  payAmount: { fontSize: 15, fontWeight: "800", color: COLORS.success },
});

export default DashboardScreen;
