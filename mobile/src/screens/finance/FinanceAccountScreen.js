import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useAuth } from "../../context/AuthContext";
import financeApi from "../../api/financeClient";
import { FinanceHeader } from "../../components/FinanceUI";
import { Card, InfoRow } from "../../components/StaffUI";
import ParentChangePasswordModal from "../../components/ParentChangePasswordModal";
import { COLORS } from "../../utils/format";

const FinanceAccountScreen = () => {
  const { finance, financeLogout } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.flex}>
      <FinanceHeader title="Xisaabta" />
      <View style={{ padding: 14 }}>
        <Card>
          <InfoRow label="Magaca" value={finance?.fullName} />
          <InfoRow label="Username" value={finance?.username} />
          <InfoRow label="Qaybta" value="Maaliyadda" />
        </Card>
        <TouchableOpacity style={styles.btn} onPress={() => setShowPassword(true)}>
          <Text style={styles.btnText}>Beddel Password</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.logout]} onPress={financeLogout}>
          <Text style={[styles.btnText, { color: COLORS.danger }]}>Ka Bax</Text>
        </TouchableOpacity>
      </View>
      <ParentChangePasswordModal
        visible={showPassword}
        onClose={() => setShowPassword(false)}
        client={financeApi}
        path="/finance-auth/change-password"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.paper },
  btn: { borderWidth: 1, borderColor: COLORS.line, backgroundColor: COLORS.surface, borderRadius: 999, paddingVertical: 13, alignItems: "center", marginTop: 12 },
  logout: { borderColor: "rgba(179,64,42,0.4)" },
  btnText: { fontSize: 15, fontWeight: "700", color: COLORS.ink },
});

export default FinanceAccountScreen;
