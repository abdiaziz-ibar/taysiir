import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StaffProvider } from "../context/StaffContext";
import TabIcon from "../components/TabIcon";
import { tabBarOptions } from "./tabBarOptions";
import StaffDashboardScreen from "../screens/staff/StaffDashboardScreen";
import StaffParentsScreen from "../screens/staff/StaffParentsScreen";
import StaffParentDetailScreen from "../screens/staff/StaffParentDetailScreen";
import StaffPaymentsScreen from "../screens/staff/StaffPaymentsScreen";
import StaffProofsScreen from "../screens/staff/StaffProofsScreen";
import StaffMoreScreen from "../screens/staff/StaffMoreScreen";
import StaffPaymentDetailScreen from "../screens/staff/StaffPaymentDetailScreen";
import StaffFeesScreen from "../screens/staff/StaffFeesScreen";
import StaffDebtsScreen from "../screens/staff/StaffDebtsScreen";
import StaffMonthlyReportScreen from "../screens/staff/StaffMonthlyReportScreen";
import StaffYearlyReportScreen from "../screens/staff/StaffYearlyReportScreen";
import StaffAllYearsReportScreen from "../screens/staff/StaffAllYearsReportScreen";
import StaffParentsSummaryScreen from "../screens/staff/StaffParentsSummaryScreen";
import StaffAcademicYearsScreen from "../screens/staff/StaffAcademicYearsScreen";
import StaffUsersScreen from "../screens/staff/StaffUsersScreen";
import StaffSettingsScreen from "../screens/staff/StaffSettingsScreen";
import { t } from "../i18n";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const icon = (name) => ({ focused, color }) => <TabIcon name={name} focused={focused} color={color} />;

const Tabs = () => {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator screenOptions={tabBarOptions(insets)}>
      <Tab.Screen name="Home" component={StaffDashboardScreen} options={{ title: t("Dashboard"), tabBarIcon: icon("grid") }} />
      <Tab.Screen name="Parents" component={StaffParentsScreen} options={{ title: t("Waalidiinta"), tabBarIcon: icon("people") }} />
      <Tab.Screen name="Payments" component={StaffPaymentsScreen} options={{ title: t("Lacag Bixin"), tabBarIcon: icon("card") }} />
      <Tab.Screen name="Proofs" component={StaffProofsScreen} options={{ title: t("Caddayn"), tabBarIcon: icon("receipt") }} />
      <Tab.Screen name="More" component={StaffMoreScreen} options={{ title: t("Dheeri"), tabBarIcon: icon("ellipsis-horizontal-circle") }} />
    </Tab.Navigator>
  );
};

const StaffNavigator = () => (
  <StaffProvider>
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={Tabs} />
      <Stack.Screen name="ParentDetail" component={StaffParentDetailScreen} />
      <Stack.Screen name="PaymentDetail" component={StaffPaymentDetailScreen} />
      <Stack.Screen name="Fees" component={StaffFeesScreen} />
      <Stack.Screen name="Debts" component={StaffDebtsScreen} />
      <Stack.Screen name="MonthlyReport" component={StaffMonthlyReportScreen} />
      <Stack.Screen name="YearlyReport" component={StaffYearlyReportScreen} />
      <Stack.Screen name="AllYearsReport" component={StaffAllYearsReportScreen} />
      <Stack.Screen name="ParentsSummary" component={StaffParentsSummaryScreen} />
      <Stack.Screen name="AcademicYears" component={StaffAcademicYearsScreen} />
      <Stack.Screen name="Users" component={StaffUsersScreen} />
      <Stack.Screen name="Settings" component={StaffSettingsScreen} />
    </Stack.Navigator>
  </StaffProvider>
);

export default StaffNavigator;
