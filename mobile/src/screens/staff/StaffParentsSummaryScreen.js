import { useCallback, useMemo, useState } from "react";
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import staffApi from "../../api/staffClient";
import { ScreenHeader, Loading, Chip, Badge, feeStatusColor, feeStatusText } from "../../components/StaffUI";
import { formatMoney, COLORS } from "../../utils/format";

const idNum = (code) => parseInt((code || "").replace(/\D/g, ""), 10) || 0;
const GETTERS = {
  id: (p) => idNum(p.parentCode),
  totalFees: (p) => p.totalFees,
  totalPaid: (p) => p.totalPaid,
  totalDebt: (p) => p.totalDebt,
};
const SORTS = [
  ["id", "ID"],
  ["totalFees", "Fee"],
  ["totalPaid", "La Bixiyey"],
  ["totalDebt", "Ku Dhiman"],
];

const StaffParentsSummaryScreen = ({ navigation }) => {
  const [data, setData] = useState(null);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [openId, setOpenId] = useState(null);

  useFocusEffect(
    useCallback(() => {
      staffApi.get("/reports/parents-summary").then((res) => setData(res.data));
    }, [])
  );

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const rows = useMemo(() => {
    if (!data) return [];
    const q = search.toLowerCase();
    const filtered = data.parents.filter(
      (p) => !q || p.fullName.toLowerCase().includes(q) || p.phone.includes(q) || p.parentCode.toLowerCase().includes(q)
    );
    if (!sortKey) return filtered;
    const get = GETTERS[sortKey];
    return [...filtered].sort((a, b) => (sortDir === "asc" ? get(a) - get(b) : get(b) - get(a)));
  }, [data, search, sortKey, sortDir]);

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Wadarta Waalidiinta" onBack={navigation.goBack} />
      {data === null ? (
        <Loading />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(p) => p.parentId}
          contentContainerStyle={{ padding: 12, paddingBottom: 40 }}
          ListHeaderComponent={
            <View>
              <View style={styles.total}>
                <Text style={styles.totalLabel}>Wadarta Guud (dhammaan sannadaha)</Text>
                <Text style={styles.totalValue}>{formatMoney(data.totals.totalFees)}</Text>
                <Text style={styles.totalSub}>
                  La bixiyey {formatMoney(data.totals.totalPaid)} · Ku dhiman {formatMoney(data.totals.totalDebt)}
                </Text>
              </View>
              <TextInput
                style={styles.search}
                value={search}
                onChangeText={setSearch}
                placeholder="Raadi magaca, phone ama ID..."
                placeholderTextColor="#9CA3AF"
              />
              <View style={styles.sorts}>
                {SORTS.map(([key, label]) => (
                  <Chip
                    key={key}
                    label={`${label}${sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : ""}`}
                    active={sortKey === key}
                    onPress={() => toggleSort(key)}
                  />
                ))}
              </View>
            </View>
          }
          ListEmptyComponent={<Text style={styles.empty}>Waalid lama helin.</Text>}
          renderItem={({ item: p }) => {
            const open = openId === p.parentId;
            return (
              <View style={styles.item}>
                <TouchableOpacity style={styles.itemHead} onPress={() => setOpenId(open ? null : p.parentId)}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{p.fullName}</Text>
                    <Text style={styles.sub}>
                      {p.parentCode} · {p.phone} · {p.yearsCount} sanad
                    </Text>
                    <Text style={styles.sub}>
                      Fee {formatMoney(p.totalFees)} · La bixiyey {formatMoney(p.totalPaid)}
                    </Text>
                  </View>
                  <Text style={styles.debt}>{formatMoney(p.totalDebt)}</Text>
                </TouchableOpacity>
                {open && (
                  <View style={styles.years}>
                    {p.years.length === 0 && <Text style={styles.sub}>Fee lama dhigin.</Text>}
                    {p.years.map((y) => (
                      <View key={y.academicYearId} style={styles.yearRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.yearName}>{y.academicYear}</Text>
                          <Text style={styles.sub}>
                            Fee {formatMoney(y.totalAmount)} · La bixiyey {formatMoney(y.totalPaid)}
                          </Text>
                        </View>
                        <View style={{ alignItems: "flex-end", gap: 4 }}>
                          <Text style={styles.yearDebt}>{formatMoney(y.balance)}</Text>
                          <Badge text={feeStatusText(y.status)} color={feeStatusColor(y.status)} />
                        </View>
                      </View>
                    ))}
                    <TouchableOpacity onPress={() => navigation.navigate("ParentDetail", { id: p.parentId })}>
                      <Text style={styles.link}>Fur faahfaahinta waalidka ›</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.paper },
  total: { backgroundColor: COLORS.navy, borderRadius: 12, padding: 16, marginBottom: 10 },
  totalLabel: { color: "rgba(255,255,255,0.65)", fontSize: 12 },
  totalValue: { color: "#fff", fontSize: 26, fontWeight: "700", marginTop: 4 },
  totalSub: { color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 4 },
  search: { borderWidth: 1, borderColor: COLORS.line, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: COLORS.surface, fontSize: 14, color: COLORS.ink },
  sorts: { flexDirection: "row", flexWrap: "wrap", rowGap: 6, marginVertical: 10 },
  empty: { textAlign: "center", color: "rgba(20,24,33,0.4)", paddingVertical: 30 },
  item: { backgroundColor: COLORS.surface, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: COLORS.line, overflow: "hidden" },
  itemHead: { flexDirection: "row", alignItems: "center", padding: 14 },
  name: { fontSize: 15, fontWeight: "600", color: COLORS.ink },
  sub: { fontSize: 12, color: "rgba(20,24,33,0.5)", marginTop: 3 },
  debt: { fontSize: 14, fontWeight: "700", color: COLORS.danger },
  years: { borderTopWidth: 1, borderTopColor: COLORS.line, padding: 12, backgroundColor: COLORS.paper },
  yearRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8 },
  yearName: { fontSize: 14, fontWeight: "600", color: COLORS.ink },
  yearDebt: { fontSize: 13, fontWeight: "700", color: COLORS.danger },
  link: { color: COLORS.navy, fontSize: 13, marginTop: 8, fontWeight: "600" },
});

export default StaffParentsSummaryScreen;
