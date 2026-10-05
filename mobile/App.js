import { StatusBar } from "expo-status-bar";
import { Component } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import LanguageProvider from "./src/i18n/LanguageProvider";
import LoginScreen from "./src/screens/LoginScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import StaffNavigator from "./src/navigation/StaffNavigator";
import FinanceNavigator from "./src/navigation/FinanceNavigator";
import { COLORS } from "./src/utils/format";

const Stack = createNativeStackNavigator();

// If something throws while the app starts, show what it was instead of a blank screen.
class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.navyDark, justifyContent: "center", padding: 24 }}>
        <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 10 }}>Khalad ayaa dhacay</Text>
        <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 13 }}>{String(this.state.error?.message || this.state.error)}</Text>
      </View>
    );
  }
}

const RootNavigator = () => {
  const { parent, staff, finance, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.paper }}>
        <ActivityIndicator size="large" color={COLORS.navy} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {parent ? (
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
      ) : staff ? (
        <Stack.Screen name="Staff" component={StaffNavigator} />
      ) : finance ? (
        <Stack.Screen name="Finance" component={FinanceNavigator} />
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
      <LanguageProvider>
        <AuthProvider>
          <NavigationContainer>
            <StatusBar style="light" />
            <RootNavigator />
          </NavigationContainer>
        </AuthProvider>
      </LanguageProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
