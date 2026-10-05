import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS, RADIUS, SHADOW } from "../utils/theme";
import { shiftMonth, monthLabel } from "../utils/finance";
import Icon from "./Icon";
import { t } from "../i18n";

// ‹ October 2026 › in one white bar. `onAll` adds an "all months" switch on the end side.
const MonthNav = ({ period, onChange, allActive, onAll }) => (
  <View style={styles.bar}>
    <TouchableOpacity style={styles.btn} onPress={() => onChange(shiftMonth(period, -1))} disabled={allActive}>
      <Icon name="chevron-back" size={18} color={allActive ? COLORS.faint : COLORS.navy} />
    </TouchableOpacity>
    <Text style={styles.label}>{allActive ? t("Dhammaan bilaha") : monthLabel(period)}</Text>
    {onAll ? (
      <TouchableOpacity style={[styles.all, allActive && styles.allActive]} onPress={onAll} accessibilityLabel={t("Dhammaan bilaha")}>
        <Icon name={allActive ? "calendar" : "calendar-outline"} size={18} color={allActive ? "#fff" : COLORS.muted} />
      </TouchableOpacity>
    ) : null}
    <TouchableOpacity style={styles.btn} onPress={() => onChange(shiftMonth(period, 1))} disabled={allActive}>
      <Icon name="chevron-forward" size={18} color={allActive ? COLORS.faint : COLORS.navy} />
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  bar: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 6, ...SHADOW.card },
  btn: { width: 40, height: 40, borderRadius: 14, backgroundColor: COLORS.navyTint, alignItems: "center", justifyContent: "center" },
  label: { flex: 1, textAlign: "center", fontSize: 16, fontWeight: "800", color: COLORS.ink },
  all: { width: 40, height: 40, borderRadius: 14, borderWidth: 1, borderColor: COLORS.line, alignItems: "center", justifyContent: "center", marginEnd: 6 },
  allActive: { backgroundColor: COLORS.navy, borderColor: COLORS.navy },
  allText: { fontSize: 12, fontWeight: "700", color: COLORS.muted },
  allTextActive: { color: "#fff" },
});

export default MonthNav;
