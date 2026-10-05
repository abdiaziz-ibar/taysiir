import { View, Text } from "react-native";
import { Badge, ListRow, Avatar, feeStatusColor, feeStatusText } from "./StaffUI";
import { formatMoney, COLORS } from "../utils/format";
import { t } from "../i18n";

const FeeRow = ({ fee, onPress }) => (
  <ListRow
    left={<Avatar name={fee.parentId?.fullName} />}
    title={fee.parentId?.fullName}
    subtitle={`${fee.parentId?.phone || ""}`}
    onPress={onPress}
  >
    <View style={{ alignItems: "flex-end", gap: 5 }}>
      <Text style={{ fontSize: 15, fontWeight: "800", color: fee.balance > 0 ? COLORS.danger : COLORS.success }}>{formatMoney(fee.balance)}</Text>
      <Badge text={feeStatusText(fee.status)} color={feeStatusColor(fee.status)} />
      <Text style={{ fontSize: 11, color: COLORS.muted }}>
        {t("Fee")} {formatMoney(fee.totalAmount)} {t("· La bixiyey")} {formatMoney(fee.totalPaid)}
      </Text>
    </View>
  </ListRow>
);

export default FeeRow;
