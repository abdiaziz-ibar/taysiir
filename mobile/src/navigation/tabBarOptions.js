import { Platform } from "react-native";
import { COLORS, SHADOW } from "../utils/theme";

// Shared look of the bottom tab bars (staff and finance).
export const tabBarOptions = (insets) => ({
  headerShown: false,
  tabBarActiveTintColor: COLORS.navy,
  tabBarInactiveTintColor: COLORS.faint,
  tabBarLabelStyle: { fontSize: 10.5, fontWeight: "700", marginBottom: 2 },
  tabBarItemStyle: { paddingHorizontal: 0 },
  tabBarAllowFontScaling: false,
  tabBarStyle: {
    height: 66 + (Platform.OS === "web" ? 0 : insets.bottom),
    paddingTop: 6,
    paddingBottom: 6 + (Platform.OS === "web" ? 0 : insets.bottom),
    backgroundColor: COLORS.surface,
    borderTopWidth: 0,
    ...SHADOW.top,
  },
});
