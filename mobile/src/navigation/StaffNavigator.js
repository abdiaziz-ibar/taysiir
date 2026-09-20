import { Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StaffProvider } from "../context/StaffContext";
import StaffDashboardScreen from "../screens/staff/StaffDashboardScreen";
import StaffParentsScreen from "../screens/staff/StaffParentsScreen";
import StaffParentDetailScreen from "../screens/staff/StaffParentDetailScreen";
import StaffPaymentsScreen from "../screens/staff/StaffPaymentsScreen";
import StaffProofsScreen from "../screens/staff/StaffProofsScreen";
import { COLORS } from "../utils/format";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const tabIcon = (emoji) => ({ focused }) => <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.55 }}>{emoji}</Text>;

const Tabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: COLORS.navy,
      tabBarInactiveTintColor: "rgba(20,24,33,0.5)",
      tabBarLabelStyle: { fontSize: 11 },
    }}
  >
    <Tab.Screen name="Home" component={StaffDashboardScreen} options={{ title: "Dashboard", tabBarIcon: tabIcon("📊") }} />
    <Tab.Screen name="Parents" component={StaffParentsScreen} options={{ title: "Waalidiinta", tabBarIcon: tabIcon("👥") }} />
    <Tab.Screen name="Payments" component={StaffPaymentsScreen} options={{ title: "Lacag Bixin", tabBarIcon: tabIcon("💵") }} />
    <Tab.Screen name="Proofs" component={StaffProofsScreen} options={{ title: "Caddayn", tabBarIcon: tabIcon("🧾") }} />
  </Tab.Navigator>
);

const StaffNavigator = () => (
  <StaffProvider>
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={Tabs} />
      <Stack.Screen name="ParentDetail" component={StaffParentDetailScreen} />
    </Stack.Navigator>
  </StaffProvider>
);

export default StaffNavigator;
