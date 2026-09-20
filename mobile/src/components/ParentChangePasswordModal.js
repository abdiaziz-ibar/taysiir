import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import api from "../api/client";
import { COLORS } from "../utils/format";

const empty = { current: "", next: "", confirm: "" };

const ParentChangePasswordModal = ({ visible, onClose }) => {
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  const close = () => {
    setForm(empty);
    setError("");
    setDone(false);
    onClose();
  };

  const submit = async () => {
    setError("");
    if (form.next !== form.confirm) return setError("Labada password ee cusub iskuma eka.");
    setSaving(true);
    try {
      await api.post("/parent-portal/change-password", { currentPassword: form.current, newPassword: form.next });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || "Khalad ayaa dhacay.");
    } finally {
      setSaving(false);
    }
  };

  const set = (key) => (v) => setForm({ ...form, [key]: v });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.center} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Text style={styles.title}>Beddel Password</Text>
            {done ? (
              <>
                <Text style={styles.success}>Password-ka waa la beddelay.</Text>
                <TouchableOpacity style={styles.primary} onPress={close}>
                  <Text style={styles.primaryText}>Xir</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {error ? <Text style={styles.error}>{error}</Text> : null}
                <Text style={styles.label}>Password-ka hadda jira</Text>
                <TextInput style={styles.input} value={form.current} onChangeText={set("current")} secureTextEntry autoCapitalize="none" />
                <Text style={styles.label}>Password cusub (ugu yaraan 6 xaraf)</Text>
                <TextInput style={styles.input} value={form.next} onChangeText={set("next")} secureTextEntry autoCapitalize="none" />
                <Text style={styles.label}>Xaqiiji password cusub</Text>
                <TextInput style={styles.input} value={form.confirm} onChangeText={set("confirm")} secureTextEntry autoCapitalize="none" />
                <View style={styles.actions}>
                  <TouchableOpacity style={styles.cancel} onPress={close} disabled={saving}>
                    <Text style={styles.cancelText}>Jooji</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.save, (saving || !form.current || !form.next || !form.confirm) && { opacity: 0.5 }]}
                    onPress={submit}
                    disabled={saving || !form.current || !form.next || !form.confirm}
                  >
                    {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveText}>Kaydi</Text>}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  center: { flexGrow: 1, justifyContent: "center", padding: 20 },
  card: { backgroundColor: COLORS.surface, borderRadius: 14, padding: 18 },
  title: { fontSize: 17, fontWeight: "700", color: COLORS.ink, marginBottom: 4 },
  label: { fontSize: 13, color: "rgba(20,24,33,0.7)", marginTop: 12, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: COLORS.line, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: COLORS.ink },
  error: { backgroundColor: "rgba(179,64,42,0.1)", color: COLORS.danger, padding: 8, borderRadius: 8, marginTop: 8, fontSize: 13 },
  success: { backgroundColor: "rgba(47,122,77,0.1)", color: COLORS.success, padding: 10, borderRadius: 8, marginTop: 10, fontSize: 13 },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 16 },
  cancel: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, borderWidth: 1, borderColor: COLORS.line },
  cancelText: { color: COLORS.ink, fontSize: 14 },
  save: { backgroundColor: COLORS.brand, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 999, minWidth: 90, alignItems: "center" },
  saveText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  primary: { backgroundColor: COLORS.brand, borderRadius: 999, paddingVertical: 12, alignItems: "center", marginTop: 14 },
  primaryText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});

export default ParentChangePasswordModal;
