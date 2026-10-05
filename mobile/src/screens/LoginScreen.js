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
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { COLORS, RADIUS, SHADOW } from "../utils/theme";
import LanguageButton from "../i18n/LanguageButton";
import Icon from "../components/Icon";
import { ErrorText } from "../components/StaffUI";
import { t } from "../i18n";

// Input with a leading icon and (for passwords) a show/hide toggle.
const InputRow = ({ icon, secure, ...props }) => {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(!!secure);
  return (
    <View style={[styles.inputRow, focused && styles.inputRowFocused]}>
      <Icon name={icon} size={18} color={focused ? COLORS.navy : COLORS.faint} />
      <TextInput
        style={styles.input}
        placeholderTextColor={COLORS.faint}
        secureTextEntry={hidden}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
      />
      {secure ? (
        <TouchableOpacity onPress={() => setHidden((h) => !h)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Icon name={hidden ? "eye-outline" : "eye-off-outline"} size={18} color={COLORS.faint} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const ROLES = [
  { key: "staff", label: "System Users", icon: "shield-checkmark" },
  { key: "parent", label: "Parents", icon: "people" },
  { key: "finance", label: "Maaliyadda", icon: "wallet" },
];

const SUBTITLE = {
  staff: "Gal xisaabtaada si aad u sii wadato.",
  parent: "Gal xisaabta waalidnimo si aad u aragto lacagtaada.",
  finance: "Gal xisaabta Maaliyadda (mushaharka iyo qarashaadka).",
};

const LoginScreen = () => {
  const { login, register, staffLogin, financeLogin } = useAuth();
  const insets = useSafeAreaInsets();
  const [role, setRole] = useState("staff");
  const [username, setUsername] = useState("");
  const [mode, setMode] = useState("login");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const switchRole = (key) => {
    setRole(key);
    setError("");
    setPassword("");
  };

  const handleSubmit = async () => {
    setError("");
    if (role === "staff" || role === "finance") {
      if (!username.trim() || !password) {
        setError(t("Username iyo Password waa waajib."));
        return;
      }
      setLoading(true);
      try {
        await (role === "finance" ? financeLogin : staffLogin)(username.trim().toLowerCase(), password);
      } catch (err) {
        setError(t(err.response?.data?.message || "Login-ku wuu fashilmay."));
      } finally {
        setLoading(false);
      }
      return;
    }
    if (!phone.trim() || !password) {
      setError(t("Phone iyo Password waa waajib."));
      return;
    }
    if (mode === "register" && password !== confirmPassword) {
      setError(t("Labada password iskuma eka."));
      return;
    }
    setLoading(true);
    try {
      if (mode === "register") await register(phone.trim(), password);
      else await login(phone.trim(), password);
    } catch (err) {
      setError(t(err.response?.data?.message || "Khalad ayaa dhacay."));
    } finally {
      setLoading(false);
    }
  };

  const isParent = role === "parent";

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[COLORS.navyDark, COLORS.navy]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.hero, { paddingTop: insets.top + 24 }]}>
          <View style={styles.decoA} pointerEvents="none" />
          <View style={styles.decoB} pointerEvents="none" />
          <View style={styles.langWrap}>
            <LanguageButton light />
          </View>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>TF</Text>
          </View>
          <Text style={styles.title}>Taysir Foundation</Text>
          <Text style={styles.subtitle}>Parent Fee &amp; Debt Management</Text>
        </LinearGradient>

        <View style={styles.card}>
          <View style={styles.segment}>
            {ROLES.map((r) => {
              const active = role === r.key;
              return (
                <TouchableOpacity key={r.key} style={[styles.segItem, active && styles.segItemActive]} onPress={() => switchRole(r.key)} activeOpacity={0.8}>
                  <Icon name={active ? r.icon : `${r.icon}-outline`} size={17} color={active ? COLORS.navy : COLORS.faint} />
                  <Text style={[styles.segText, active && styles.segTextActive]} numberOfLines={1}>
                    {t(r.label)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.welcome}>{t("Ku Soo Dhawoow")}</Text>
          <Text style={styles.welcomeSub}>{t(SUBTITLE[role])}</Text>

          {isParent ? (
            <View style={styles.modeRow}>
              {[
                ["login", "Soo Gal"],
                ["register", "Marka Koowaad"],
              ].map(([key, label]) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.modeTab, mode === key && styles.modeTabActive]}
                  onPress={() => {
                    setMode(key);
                    setError("");
                  }}
                >
                  <Text style={[styles.modeText, mode === key && styles.modeTextActive]}>{t(label)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          <View style={{ marginTop: isParent ? 6 : 14 }}>
            <ErrorText text={error} />
          </View>

          {isParent ? (
            <>
              {mode === "register" ? (
                <Text style={styles.note}>
                  {t("Waxaad dhigaysaa password aad isticmaali doonto marar dambe. Lambarkaagu waa inuu horey ugu jiraa nidaamka.")}
                </Text>
              ) : null}
              <Text style={styles.label}>{t("Lambarka Telefoonka")}</Text>
              <InputRow icon="call-outline" value={phone} onChangeText={setPhone} placeholder={t("Lambarka aad dugsiga ku siisay")} keyboardType="phone-pad" autoCapitalize="none" />
              <Text style={styles.label}>{mode === "register" ? t("Samee Password") : t("Password")}</Text>
              <InputRow icon="lock-closed-outline" secure value={password} onChangeText={setPassword} placeholder={t("Geli password-kaaga")} />
              {mode === "register" ? (
                <>
                  <Text style={styles.label}>{t("Xaqiiji Password")}</Text>
                  <InputRow icon="shield-checkmark-outline" secure value={confirmPassword} onChangeText={setConfirmPassword} placeholder={t("Mar labaad geli password-ka")} />
                </>
              ) : null}
            </>
          ) : (
            <>
              <Text style={styles.label}>{t("Username")}</Text>
              <InputRow icon="person-outline" value={username} onChangeText={setUsername} placeholder={t("Geli username-kaaga")} autoCapitalize="none" autoCorrect={false} />
              <Text style={styles.label}>{t("Password")}</Text>
              <InputRow icon="lock-closed-outline" secure value={password} onChangeText={setPassword} placeholder={t("Geli password-kaaga")} />
            </>
          )}

          <TouchableOpacity style={[styles.button, loading && { opacity: 0.7 }]} onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{isParent ? (mode === "register" ? t("Samee Xisaab") : t("Soo Gal")) : t("Soo Gal (Log In)")}</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>© {new Date().getFullYear()} Taysir Foundation</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.paper },
  scroll: { flexGrow: 1, paddingBottom: 28 },
  hero: { alignItems: "center", paddingBottom: 70, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, overflow: "hidden" },
  decoA: { position: "absolute", top: -70, end: -50, width: 210, height: 210, borderRadius: 105, backgroundColor: "rgba(255,255,255,0.06)" },
  decoB: { position: "absolute", bottom: -90, start: -60, width: 190, height: 190, borderRadius: 95, backgroundColor: "rgba(255,255,255,0.05)" },
  langWrap: { position: "absolute", top: 46, end: 18 },
  logoBadge: { width: 68, height: 68, borderRadius: 22, backgroundColor: "#0ea5e9", alignItems: "center", justifyContent: "center", marginBottom: 14, ...SHADOW.raised },
  logoText: { color: "#fff", fontWeight: "800", fontSize: 24 },
  title: { color: "#fff", fontSize: 24, fontWeight: "800" },
  subtitle: { color: "rgba(255,255,255,0.65)", fontSize: 13, marginTop: 4 },
  card: { marginHorizontal: 18, marginTop: -44, backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: 20, ...SHADOW.raised },
  segment: { flexDirection: "row", backgroundColor: COLORS.paper, borderRadius: RADIUS.md, padding: 4 },
  segItem: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 10, borderRadius: RADIUS.sm },
  segItemActive: { backgroundColor: COLORS.surface, ...SHADOW.card },
  segText: { fontSize: 12, fontWeight: "600", color: COLORS.faint },
  segTextActive: { color: COLORS.navy, fontWeight: "800" },
  welcome: { fontSize: 22, fontWeight: "800", color: COLORS.ink, marginTop: 20 },
  welcomeSub: { fontSize: 13, color: COLORS.muted, marginTop: 4 },
  modeRow: { flexDirection: "row", gap: 8, marginTop: 14 },
  modeTab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.pill, backgroundColor: COLORS.paper },
  modeTabActive: { backgroundColor: COLORS.navy },
  modeText: { fontSize: 13, color: COLORS.muted, fontWeight: "600" },
  modeTextActive: { color: "#fff", fontWeight: "700" },
  note: { backgroundColor: COLORS.navyTint, color: COLORS.ink, padding: 12, borderRadius: RADIUS.md, marginBottom: 4, fontSize: 12.5, overflow: "hidden" },
  label: { fontSize: 12.5, color: COLORS.muted, fontWeight: "600", marginBottom: 6, marginTop: 14 },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1.2, borderColor: COLORS.line, borderRadius: RADIUS.md, paddingHorizontal: 14, backgroundColor: COLORS.paper },
  inputRowFocused: { borderColor: COLORS.navy, backgroundColor: "#fff" },
  input: { flex: 1, paddingVertical: Platform.OS === "web" ? 13 : 12, fontSize: 15, color: COLORS.ink, outlineStyle: "none" },
  button: { backgroundColor: COLORS.brand, borderRadius: RADIUS.md, height: 54, alignItems: "center", justifyContent: "center", marginTop: 24, ...SHADOW.raised },
  buttonText: { color: "#fff", fontWeight: "800", fontSize: 16, letterSpacing: 0.2 },
  footer: { textAlign: "center", color: COLORS.faint, fontSize: 12, marginTop: 22 },
});

export default LoginScreen;
