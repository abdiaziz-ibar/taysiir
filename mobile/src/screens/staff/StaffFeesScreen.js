import { useCallback, useState } from "react";
import { View, Text, TextInput, FlatList, StyleSheet, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import staffApi from "../../api/staffClient";
import { useStaff } from "../../context/StaffContext";
import { ScreenHeader, YearChips, Loading } from "../../components/StaffUI";
import FeeRow from "../../components/FeeRow";
import { COLORS, SHADOW } from "../../utils/format";
import { t } from "../../i18n";

const StaffFeesScreen = ({ navigation }) => {
  const { selectedYearId } = useStaff();
  const [fees, setFees] = useState(null);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!selectedYearId) return;
    const res = await staffApi.get("/fees", { params: { academicYearId: selectedYearId } });
    setFees(res.data);
  }, [selectedYearId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const shown = (fees || []).filter(
    (f) =>
      !search ||
      f.parentId?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      f.parentId?.phone?.includes(search)
  );

  return (
    <View style={styles.flex}>
      <ScreenHeader title={t("Lacagaha School-ka")} onBack={navigation.goBack} />
      <YearChips />
      <TextInput
        style={styles.search}
        value={search}
        onChangeText={setSearch}
        placeholder={t("Raadi magaca ama phone...")}
        placeholderTextColor={COLORS.faint}
      />
      {fees === null ? (
        <Loading />
      ) : (
        <FlatList
          data={shown}
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
          ListEmptyComponent={<Text style={styles.empty}>{t("Fee lama helin sanad dugsiyeedkan.")}</Text>}
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
  search: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.line,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: COLORS.surface,
    fontSize: 14,
    color: COLORS.ink,
    marginHorizontal: 12, ...SHADOW.card },
  empty: { textAlign: "center", color: COLORS.faint, paddingVertical: 30 },
});

export default StaffFeesScreen;
