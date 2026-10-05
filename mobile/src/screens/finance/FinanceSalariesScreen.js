import { useState } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { FinanceHeader } from "../../components/FinanceUI";
import { ScreenModal, Fab } from "../../components/StaffUI";
import MonthNav from "../../components/MonthNav";
import SalaryPanel from "../../components/SalaryPanel";
import SalaryEntry from "../../components/SalaryEntry";
import { COLORS } from "../../utils/theme";
import { currentMonth } from "../../utils/finance";
import { t } from "../../i18n";

// Payroll: pick a month, switch Macalimiin / Shaqaale, pay or edit each person.
const FinanceSalariesScreen = ({ navigation }) => {
  const [month, setMonth] = useState(currentMonth());
  const [refreshKey, setRefreshKey] = useState(0);
  const [showEntry, setShowEntry] = useState(false);

  return (
    <View style={styles.flex}>
      <FinanceHeader title={t("Mushaharka")} actions={[{ icon: "people", label: t("Shaqaalaha"), onPress: () => navigation.navigate("Employees") }]} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <MonthNav period={month} onChange={setMonth} />
        <View style={{ height: 14 }} />
        <SalaryPanel period={month} refreshKey={refreshKey} />
      </ScrollView>

      <Fab onPress={() => setShowEntry(true)} label={t("Bixi Mushaharka")} />

      <ScreenModal visible={showEntry} title={t("Bixi Mushaharka")} onClose={() => setShowEntry(false)}>
        {showEntry && (
          <SalaryEntry
            initialPeriod={month}
            onSaved={(period) => {
              setShowEntry(false);
              setMonth(period);
              setRefreshKey((k) => k + 1);
            }}
            onNeedEmployees={() => {
              setShowEntry(false);
              navigation.navigate("Employees");
            }}
          />
        )}
      </ScreenModal>
    </View>
  );
};

const styles = StyleSheet.create({ flex: { flex: 1, backgroundColor: COLORS.paper } });

export default FinanceSalariesScreen;
