import { useCallback, useState } from "react";
import { View, Text, FlatList, StyleSheet, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import staffApi from "../../api/staffClient";
import { useStaff } from "../../context/StaffContext";
import { ScreenHeader, YearChips, Loading } from "../../components/StaffUI";
import FeeRow from "../../components/FeeRow";
import { formatMoney, COLORS } from "../../utils/format";

const StaffDebtsScreen = ({ navigation }) => {
  const { selectedYearId } = useStaff();
  const [data, setData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!selectedYearId) return;
    const res = await staffApi.get("/reports/debts", { params: { academicYearId: selectedYearId } });
    setData(res.data);
  }, [selectedYearId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Deymaha" onBack={navigation.goBack} />
      <YearChips />
      {data === null ? (
        <Loading />
      ) : (
        <FlatList
          data={data.debts}
          keyExtractor={(f) => f._id}
          contentContainerStyle={{ padding: 12, paddingBottom: 30 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                await load();
                setRefreshing(false);
              }}
            />
          }
          ListHeaderComponent={
            <View style={styles.total}>
              <Text style={styles.totalLabel}>Wadarta Deynta</Text>
              <Text style={styles.totalValue}>{formatMoney(data.totalDebt)}</Text>
            </View>
          }
          ListEmptyComponent={<Text style={styles.empty}>Mid deyn qaba lama helin. 🎉</Text>}
          renderItem={({ item }) => (
            <FeeRow fee={item} onPress={() => navigation.navigate("ParentDetail", { id: item.parentId?._id })} />
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.paper },
  total: { backgroundColor: COLORS.navy, borderRadius: 12, padding: 16, marginBottom: 12 },
  totalLabel: { color: "rgba(255,255,255,0.65)", fontSize: 12 },
  totalValue: { color: "#fff", fontSize: 26, fontWeight: "700", marginTop: 4 },
  empty: { textAlign: "center", color: "rgba(20,24,33,0.4)", paddingVertical: 30 },
});

export default StaffDebtsScreen;
