import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useAuth } from "../context/AuthContext";
import LanguageButton from "../i18n/LanguageButton";
import { COLORS } from "../utils/format";
import { t } from "../i18n";

// Header for the finance section's screens (no back button — they're tabs).
export const FinanceHeader = ({ title, action }) => {
  const { finance } = useAuth();
  return (
    <View style={styles.header}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.sub} numberOfLines={1}>
          {t("Maaliyadda ·")} {finance?.fullName}
        </Text>
      </View>
      <View style={{ marginEnd: action ? 12 : 0 }}>
        <LanguageButton light />
      </View>
      {action ? (
        <TouchableOpacity onPress={action.onPress}>
          <Text style={styles.action}>{action.label}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  header: { backgroundColor: COLORS.navyDark, paddingHorizontal: 18, paddingTop: 52, paddingBottom: 16, flexDirection: "row", alignItems: "center" },
  title: { color: "#fff", fontSize: 18, fontWeight: "700" },
  sub: { color: "rgba(255,255,255,0.55)", fontSize: 12, marginTop: 2 },
  action: { color: "#fff", fontSize: 14, fontWeight: "700" },
});
