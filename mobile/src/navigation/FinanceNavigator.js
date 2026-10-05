import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FinanceHomeScreen from "../screens/finance/FinanceHomeScreen";
import FinanceSalariesScreen from "../screens/finance/FinanceSalariesScreen";
import FinanceExpensesScreen from "../screens/finance/FinanceExpensesScreen";
import FinanceReportScreen from "../screens/finance/FinanceReportScreen";
import FinanceAccountScreen from "../screens/finance/FinanceAccountScreen";
import FinanceEmployeesScreen from "../screens/finance/FinanceEmployeesScreen";
import TabIcon from "../components/TabIcon";
import { tabBarOptions } from "./tabBarOptions";
import { t } from "../i18n";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const icon = (name) => ({ focused, color }) => <TabIcon name={name} focused={focused} color={color} />;

const Tabs = () => {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator screenOptions={tabBarOptions(insets)}>
      <Tab.Screen name="Home" component={FinanceHomeScreen} options={{ title: t("Guud"), tabBarIcon: icon("home") }} />
      <Tab.Screen name="Salaries" component={FinanceSalariesScreen} options={{ title: t("Mushaharka"), tabBarLabel: t("Mushahar"), tabBarIcon: icon("wallet") }} />
      <Tab.Screen name="Expenses" component={FinanceExpensesScreen} options={{ title: t("Qarashaadka"), tabBarLabel: t("Kharash"), tabBarIcon: icon("receipt") }} />
      <Tab.Screen name="Report" component={FinanceReportScreen} options={{ title: t("Warbixin"), tabBarIcon: icon("stats-chart") }} />
      <Tab.Screen name="Account" component={FinanceAccountScreen} options={{ title: t("Xisaabta"), tabBarIcon: icon("person-circle") }} />
    </Tab.Navigator>
  );
};

// The finance section's own app shell: independent of the fees (staff) navigator.
const FinanceNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Tabs" component={Tabs} />
    <Stack.Screen name="Employees" component={FinanceEmployeesScreen} />
  </Stack.Navigator>
);

export default FinanceNavigator;
