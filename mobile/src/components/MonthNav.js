import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS } from "../utils/format";
import { shiftMonth, monthLabel } from "../utils/finance";

// ‹ October 2026 › — steps one month at a time (a native month picker would need an extra dependency).
const MonthNav = ({ period, onChange }) => (
  <View style={styles.row}>
    <TouchableOpacity style={styles.btn} onPress={() => onChange(shiftMonth(period, -1))}>
      <Text style={styles.arrow}>‹</Text>
    </TouchableOpacity>
    <Text style={styles.label}>{monthLabel(period)}</Text>
    <TouchableOpacity style={styles.btn} onPress={() => onChange(shiftMonth(period, 1))}>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 10 },
  btn: { width: 40, height: 36, borderRadius: 999, borderWidth: 1, borderColor: COLORS.line, backgroundColor: COLORS.surface, alignItems: "center", justifyContent: "center" },
  arrow: { fontSize: 20, color: COLORS.ink, marginTop: -2 },
  label: { minWidth: 160, textAlign: "center", fontSize: 16, fontWeight: "700", color: COLORS.ink },
});

export default MonthNav;
