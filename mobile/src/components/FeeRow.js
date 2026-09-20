import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Badge, feeStatusColor, feeStatusText } from "./StaffUI";
import { formatMoney, COLORS } from "../utils/format";

const FeeRow = ({ fee, onPress }) => (
  <TouchableOpacity style={styles.row} onPress={onPress}>
    <View style={{ flex: 1 }}>
      <Text style={styles.name}>{fee.parentId?.fullName}</Text>
      <Text style={styles.sub}>{fee.parentId?.phone}</Text>
      <Text style={styles.sub}>
        Fee {formatMoney(fee.totalAmount)} · La bixiyey {formatMoney(fee.totalPaid)}
      </Text>
    </View>
    <View style={styles.right}>
      <Text style={styles.balance}>{formatMoney(fee.balance)}</Text>
      <Badge text={feeStatusText(fee.status)} color={feeStatusColor(fee.status)} />
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  name: { fontSize: 15, fontWeight: "600", color: COLORS.ink },
  sub: { fontSize: 12, color: "rgba(20,24,33,0.5)", marginTop: 3 },
  right: { alignItems: "flex-end", gap: 4 },
  balance: { fontSize: 14, fontWeight: "700", color: COLORS.danger },
});

export default FeeRow;
