import { useCallback, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import staffApi from "../../api/staffClient";
import { Badge, feeStatusColor, feeStatusText } from "../../components/StaffUI";
import { formatMoney, formatDate, COLORS } from "../../utils/format";

const InfoRow = ({ label, value }) =>
  value ? (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  ) : null;

const StaffParentDetailScreen = ({ route, navigation }) => {
  const { id } = route.params;
  const [parent, setParent] = useState(null);
  const [payments, setPayments] = useState([]);

  const load = useCallback(async () => {
    const [p, pay] = await Promise.all([
      staffApi.get(`/parents/${id}`),
      staffApi.get("/payments", { params: { parentId: id } }),
    ]);
    setParent(p.data);
    setPayments(pay.data);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (!parent) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.navy} size="large" />
      </View>
    );
  }

  const totalDebt = parent.fees.reduce((s, f) => s + f.balance, 0);

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹ Dib</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {parent.fullName}
        </Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <InfoRow label="Parent ID" value={parent.parentId} />
          <InfoRow label="Phone" value={parent.phone} />
          <InfoRow label="Phone kale" value={parent.alternativePhone} />
          <InfoRow label="Address" value={parent.address} />
          <InfoRow label="Email" value={parent.email} />
          <InfoRow label="Notes" value={parent.notes} />
        </View>

        <View style={styles.debtCard}>
          <Text style={styles.debtLabel}>Wadarta Ku Dhiman (dhammaan sannadaha)</Text>
          <Text style={styles.debtValue}>{formatMoney(totalDebt)}</Text>
        </View>

        <TouchableOpacity
          style={styles.payBtn}
          onPress={() =>
            navigation.navigate("Tabs", {
              screen: "Payments",
              params: { preset: { _id: parent._id, fullName: parent.fullName, phone: parent.phone } },
            })
          }
        >
          <Text style={styles.payBtnText}>+ Ku Dar Lacag Bixin</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Sanad Dugsiyeedka</Text>
          {parent.fees.length === 0 && <Text style={styles.empty}>Weli Fee lama dhigin.</Text>}
          {parent.fees.map((f) => (
            <View key={f._id} style={styles.feeRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.feeYear}>{f.academicYearId?.name}</Text>
                <Text style={styles.feeSub}>
                  Fee {formatMoney(f.totalAmount)} · La bixiyey {formatMoney(f.totalPaid)}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end", gap: 4 }}>
                <Text style={styles.feeBalance}>{formatMoney(f.balance)}</Text>
                <Badge text={feeStatusText(f.status)} color={feeStatusColor(f.status)} />
              </View>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Taariikhda Lacag Bixinta</Text>
          {payments.length === 0 && <Text style={styles.empty}>Weli lacag lama bixin.</Text>}
          {payments.map((p) => (
            <View key={p._id} style={styles.feeRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.feeYear}>{p.receiptNumber}</Text>
                <Text style={styles.feeSub}>
                  {formatDate(p.paymentDate)} · {p.academicYearId?.name} · {p.paymentMethod}
                </Text>
              </View>
              <Text style={styles.paid}>{formatMoney(p.amount)}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.paper },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    backgroundColor: COLORS.navyDark,
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  back: { color: "rgba(255,255,255,0.85)", fontSize: 15, width: 50 },
  headerTitle: { color: "#fff", fontSize: 17, fontWeight: "700", flex: 1, textAlign: "center" },
  content: { padding: 14, paddingBottom: 40 },
  card: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: COLORS.line },
  infoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  infoLabel: { color: "rgba(20,24,33,0.5)", fontSize: 13 },
  infoValue: { color: COLORS.ink, fontSize: 13, fontWeight: "500", flex: 1, textAlign: "right", marginLeft: 12 },
  debtCard: { backgroundColor: COLORS.navy, borderRadius: 12, padding: 16, marginBottom: 12 },
  debtLabel: { color: "rgba(255,255,255,0.65)", fontSize: 12 },
  debtValue: { color: "#fff", fontSize: 26, fontWeight: "700", marginTop: 4 },
  payBtn: { backgroundColor: COLORS.brand, borderRadius: 999, paddingVertical: 12, alignItems: "center", marginBottom: 12 },
  payBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: COLORS.ink, marginBottom: 8 },
  empty: { color: "rgba(20,24,33,0.4)", fontSize: 13, textAlign: "center", paddingVertical: 10 },
  feeRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderTopWidth: 1, borderTopColor: COLORS.line },
  feeYear: { fontSize: 14, fontWeight: "600", color: COLORS.ink },
  feeSub: { fontSize: 12, color: "rgba(20,24,33,0.5)", marginTop: 2 },
  feeBalance: { fontSize: 14, fontWeight: "700", color: COLORS.danger },
  paid: { fontSize: 14, fontWeight: "700", color: COLORS.success },
});

export default StaffParentDetailScreen;
