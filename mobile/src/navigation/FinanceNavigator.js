import { Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import FinanceExpensesScreen from "../screens/finance/FinanceExpensesScreen";
import FinanceReportScreen from "../screens/finance/FinanceReportScreen";
import FinanceAccountScreen from "../screens/finance/FinanceAccountScreen";
import { COLORS } from "../utils/format";

const Tab = createBottomTabNavigator();

const tabIcon = (emoji) => ({ focused }) => <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.55 }}>{emoji}</Text>;

// The finance section's own app shell: independent of the fees (staff) navigator.
const FinanceNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: COLORS.navy,
      tabBarInactiveTintColor: "rgba(20,24,33,0.5)",
      tabBarLabelStyle: { fontSize: 11 },
    }}
  >
    <Tab.Screen name="Expenses" component={FinanceExpensesScreen} options={{ title: "Qarashaadka", tabBarIcon: tabIcon("🧾") }} />
    <Tab.Screen name="Report" component={FinanceReportScreen} options={{ title: "Warbixin", tabBarIcon: tabIcon("📈") }} />
    <Tab.Screen name="Account" component={FinanceAccountScreen} options={{ title: "Xisaabta", tabBarIcon: tabIcon("👤") }} />
  </Tab.Navigator>
);

export default FinanceNavigator;
