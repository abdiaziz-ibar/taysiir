import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, ActivityIndicator } from "react-native";
import staffApi from "../api/staffClient";
import { COLORS } from "../utils/format";

// Step-up confirmation for irreversible actions: the logged-in admin
// re-types their own password before onConfirm runs (same as the web).
const ConfirmPasswordModal = ({ visible, title, message, onConfirm, onClose, children, disabled }) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const close = () => {
    setPassword("");
    setError("");
    onClose();
  };

  const submit = async () => {
    if (!password) return;
    setError("");
    setBusy(true);
    try {
      await staffApi.post("/auth/verify-password", { password });
      setPassword("");
      await onConfirm();
    } catch (err) {
      setError(err.response?.data?.message || "Khalad ayaa dhacay.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          {children}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Text style={styles.label}>Geli Password-kaaga si aad u xaqiijiso</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancel} onPress={close} disabled={busy}>
              <Text style={styles.cancelText}>Jooji</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirm, (busy || disabled || !password) && { opacity: 0.5 }]}
              onPress={submit}
              disabled={busy || disabled || !password}
            >
              {busy ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.confirmText}>Haa, Tirtir</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 },
  card: { backgroundColor: COLORS.surface, borderRadius: 14, padding: 18 },
  title: { fontSize: 17, fontWeight: "700", color: COLORS.ink },
  message: { fontSize: 13, color: "rgba(20,24,33,0.65)", marginTop: 6, marginBottom: 6 },
  label: { fontSize: 13, color: "rgba(20,24,33,0.7)", marginTop: 12, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: COLORS.line, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: COLORS.ink },
  error: { backgroundColor: "rgba(179,64,42,0.1)", color: COLORS.danger, padding: 8, borderRadius: 8, marginTop: 8, fontSize: 13 },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 16 },
  cancel: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, borderWidth: 1, borderColor: COLORS.line },
  cancelText: { color: COLORS.ink, fontSize: 14 },
  confirm: { backgroundColor: COLORS.danger, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999, minWidth: 100, alignItems: "center" },
  confirmText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});

export default ConfirmPasswordModal;
