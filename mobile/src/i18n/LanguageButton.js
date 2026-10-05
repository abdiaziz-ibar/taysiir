import { useState } from "react";
import { View, Text, TouchableOpacity, Modal, Alert, StyleSheet } from "react-native";
import { LANGS, getLang, setLang, needsRestart, t } from "./index";
import { COLORS, RADIUS } from "../utils/theme";
import Icon from "../components/Icon";

// Small "🌐 SO" pill that opens a language list (Soomaali · English · العربية).
// `light` is for dark headers.
const LanguageButton = ({ light = false }) => {
  const [open, setOpen] = useState(false);
  const current = LANGS.find((l) => l.code === getLang());

  const choose = async (code) => {
    setOpen(false);
    await setLang(code);
    if (needsRestart()) {
      Alert.alert(t("Luuqadda"), t("Si habaynta bogga (midig/bidix) u dhaqan galo, fadlan xir app-ka oo dib u fur."));
    }
  };

  return (
    <>
      <TouchableOpacity style={[styles.pill, light && styles.pillLight]} onPress={() => setOpen(true)}>
        <Icon name="globe-outline" size={16} color={light ? "#fff" : COLORS.ink} />
        <Text style={[styles.pillText, light && styles.pillTextLight]}>{current.short}</Text>
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={styles.card}>
            {LANGS.map((l) => (
              <TouchableOpacity key={l.code} style={styles.row} onPress={() => choose(l.code)}>
                <Text style={[styles.rowText, l.code === current.code && styles.rowActive]}>{l.label}</Text>
                {l.code === current.code ? <Text style={styles.check}>✓</Text> : null}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  pill: { flexDirection: "row", alignItems: "center", gap: 5, height: 38, borderRadius: RADIUS.pill, paddingHorizontal: 12, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.line },
  pillLight: { backgroundColor: "rgba(255,255,255,0.14)", borderColor: "transparent" },
  pillText: { fontSize: 12.5, color: COLORS.ink, fontWeight: "700" },
  pillTextLight: { color: "#fff" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, paddingVertical: 6, width: 250 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, paddingVertical: 14 },
  rowText: { fontSize: 16, color: COLORS.ink },
  rowActive: { fontWeight: "700", color: COLORS.navy },
  check: { color: COLORS.navy, fontSize: 16, fontWeight: "700" },
});

export default LanguageButton;
