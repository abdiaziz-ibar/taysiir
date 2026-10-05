import { View, ScrollView, StyleSheet } from "react-native";
import { FinanceHeader } from "../../components/FinanceUI";
import EmployeesPanel from "../../components/EmployeesPanel";
import { COLORS } from "../../utils/theme";
import { t } from "../../i18n";

// The register of teachers and staff (add, edit, set inactive).
const FinanceEmployeesScreen = ({ navigation }) => (
  <View style={styles.flex}>
    <FinanceHeader title={t("Shaqaalaha")} onBack={navigation.goBack} />
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <EmployeesPanel />
    </ScrollView>
  </View>
);

const styles = StyleSheet.create({ flex: { flex: 1, backgroundColor: COLORS.paper } });

export default FinanceEmployeesScreen;
