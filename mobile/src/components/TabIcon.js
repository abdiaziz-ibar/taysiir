import { View, StyleSheet } from "react-native";
import Icon from "./Icon";
import { COLORS } from "../utils/theme";

// Bottom-tab icon: filled glyph on a soft pill when focused, outline otherwise.
const TabIcon = ({ name, focused, color }) => (
  <View style={[styles.pill, focused && styles.pillActive]}>
    <Icon name={focused ? name : `${name}-outline`} size={22} color={focused ? COLORS.navy : color} />
  </View>
);

const styles = StyleSheet.create({
  pill: { width: 54, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  pillActive: { backgroundColor: COLORS.navyTint },
});

export default TabIcon;
