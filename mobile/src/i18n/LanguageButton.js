import { useState } from "react";
import { View, Text, TouchableOpacity, Modal, Alert, StyleSheet } from "react-native";
import { LANGS, getLang, setLang, needsRestart, t } from "./index";
import { COLORS } from "../utils/format";

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
        <Text style={[styles.pillText, light && styles.pillTextLight]}>🌐 {current.short}</Text>
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
  pill: { borderWidth: 1, borderColor: COLORS.line, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: COLORS.surface },
  pillLight: { borderColor: "rgba(255,255,255,0.25)", backgroundColor: "transparent" },
  pillText: { fontSize: 12, color: COLORS.ink, fontWeight: "600" },
  pillTextLight: { color: "rgba(255,255,255,0.85)" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  card: { backgroundColor: COLORS.surface, borderRadius: 14, paddingVertical: 6, width: 240 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, paddingVertical: 14 },
  rowText: { fontSize: 16, color: COLORS.ink },
  rowActive: { fontWeight: "700", color: COLORS.navy },
  check: { color: COLORS.navy, fontSize: 16, fontWeight: "700" },
});

export default LanguageButton;
