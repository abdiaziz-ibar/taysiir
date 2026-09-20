import { useState } from "react";
import { View, ScrollView, Text, StyleSheet } from "react-native";
import staffApi from "../../api/staffClient";
import { useAuth } from "../../context/AuthContext";
import { ScreenHeader, Card, InfoRow, Field, PrimaryButton, ErrorText, SuccessText } from "../../components/StaffUI";
import { COLORS } from "../../utils/format";

const StaffSettingsScreen = ({ navigation }) => {
  const { staff } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setError("");
    setMessage("");
    if (next !== confirm) return setError("Password-yadu ma isku mid aha.");
    setSaving(true);
    try {
      await staffApi.post("/auth/change-password", { currentPassword: current, newPassword: next });
      setMessage("Password-ka waa la beddelay.");
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (err) {
      setError(err.response?.data?.message || "Khalad ayaa dhacay.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Dejinta" onBack={navigation.goBack} />
      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <Card>
          <InfoRow label="Magaca" value={staff?.fullName} />
          <InfoRow label="Username" value={staff?.username} />
          <InfoRow label="Role" value={staff?.role} />
        </Card>
        <Card>
          <Text style={styles.title}>Beddel Password</Text>
          <ErrorText text={error} />
          <SuccessText text={message} />
          <Field label="Password-ka Hadda Jira" value={current} onChangeText={setCurrent} secureTextEntry autoCapitalize="none" />
          <Field label="Password Cusub (ugu yaraan 6 xaraf)" value={next} onChangeText={setNext} secureTextEntry autoCapitalize="none" />
          <Field label="Xaqiiji Password" value={confirm} onChangeText={setConfirm} secureTextEntry autoCapitalize="none" />
          <PrimaryButton title="Kaydi" onPress={handleSave} loading={saving} disabled={!current || !next || !confirm} />
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.paper },
  title: { fontSize: 16, fontWeight: "700", color: COLORS.ink, marginBottom: 6 },
});

export default StaffSettingsScreen;
