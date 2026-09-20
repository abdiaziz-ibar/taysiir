import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { COLORS } from "../utils/format";

const LoginScreen = () => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (!phone.trim() || !password) {
      setError("Phone iyo Password waa waajib.");
      return;
    }
    if (mode === "register" && password !== confirmPassword) {
      setError("Labada password iskuma eka.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "register") await register(phone.trim(), password);
      else await login(phone.trim(), password);
    } catch (err) {
      setError(err.response?.data?.message || "Khalad ayaa dhacay.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.logoBadge}>
          <Text style={styles.logoText}>TF</Text>
        </View>
        <Text style={styles.title}>Taysir Foundation</Text>
        <Text style={styles.subtitle}>Xisaabta Waalidka</Text>

        <View style={styles.card}>
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tab, mode === "login" && styles.tabActive]}
              onPress={() => {
                setMode("login");
                setError("");
              }}
            >
              <Text style={[styles.tabText, mode === "login" && styles.tabTextActive]}>Soo Gal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, mode === "register" && styles.tabActive]}
              onPress={() => {
                setMode("register");
                setError("");
              }}
            >
              <Text style={[styles.tabText, mode === "register" && styles.tabTextActive]}>Marka Koowaad</Text>
            </TouchableOpacity>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {mode === "register" && (
            <Text style={styles.note}>
              Waxaad dhigaysaa password aad isticmaali doonto marar dambe. Lambarkaagu waa inuu horey ugu jiraa
              nidaamka.
            </Text>
          )}

          <Text style={styles.label}>Lambarka Telefoonka</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="Lambarka aad dugsiga ku siisay"
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
            autoCapitalize="none"
          />

          <Text style={styles.label}>{mode === "register" ? "Samee Password" : "Password"}</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Geli password-kaaga"
            placeholderTextColor="#9CA3AF"
            secureTextEntry
          />

          {mode === "register" && (
            <>
              <Text style={styles.label}>Xaqiiji Password</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Mar labaad geli password-ka"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
              />
            </>
          )}

          <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{mode === "register" ? "Samee Xisaab" : "Soo Gal"}</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.navyDark },
  container: { flexGrow: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  logoBadge: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: "#0ea5e9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  logoText: { color: "#fff", fontWeight: "700", fontSize: 20 },
  title: { color: "#fff", fontSize: 22, fontWeight: "700", marginBottom: 2 },
  subtitle: { color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 24 },
  card: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 20, width: "100%", maxWidth: 380 },
  tabRow: { flexDirection: "row", backgroundColor: COLORS.paper, borderRadius: 999, padding: 4, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 999, alignItems: "center" },
  tabActive: { backgroundColor: COLORS.navy },
  tabText: { color: "rgba(20,24,33,0.5)", fontSize: 13, fontWeight: "500" },
  tabTextActive: { color: "#fff" },
  error: { backgroundColor: "rgba(179,64,42,0.1)", color: COLORS.danger, padding: 10, borderRadius: 8, marginBottom: 12, fontSize: 13 },
  note: { backgroundColor: "rgba(31,58,95,0.05)", color: "rgba(20,24,33,0.7)", padding: 10, borderRadius: 8, marginBottom: 12, fontSize: 12 },
  label: { fontSize: 13, color: "rgba(20,24,33,0.7)", marginBottom: 4, marginTop: 10 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.ink,
    backgroundColor: COLORS.surface,
  },
  button: {
    backgroundColor: COLORS.brand,
    borderRadius: 999,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});

export default LoginScreen;
