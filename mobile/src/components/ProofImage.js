import { useState } from "react";
import { View, Text, Image, TouchableOpacity, Linking, StyleSheet } from "react-native";
import { API_ORIGIN } from "../api/client";
import { COLORS } from "../utils/format";

// Payment-proof screenshot. If the in-app image fails to load, say so and let
// the user open it in the browser instead of leaving a silent blank space.
const ProofImage = ({ screenshotUrl, height = 180, onOpen }) => {
  const [failed, setFailed] = useState(false);

  if (!screenshotUrl) {
    return <Text style={styles.none}>Sawir lama soo lifaaqin.</Text>;
  }
  const uri = `${API_ORIGIN}${screenshotUrl}`;

  if (failed) {
    return (
      <View style={styles.fail}>
        <Text style={styles.failText}>Sawirka lama soo dejin karo halkan.</Text>
        <TouchableOpacity onPress={() => Linking.openURL(uri)}>
          <Text style={styles.link}>Ku fur browser-ka</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity onPress={() => onOpen(uri)} activeOpacity={0.8}>
      <Image
        source={{ uri }}
        resizeMode="cover"
        style={[styles.img, { height }]}
        onError={() => setFailed(true)}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  img: { width: "100%", borderRadius: 8, marginBottom: 10, backgroundColor: COLORS.line },
  none: { fontSize: 12, color: "rgba(20,24,33,0.45)", marginBottom: 10 },
  fail: { backgroundColor: "rgba(179,64,42,0.08)", borderRadius: 8, padding: 12, marginBottom: 10 },
  failText: { color: COLORS.danger, fontSize: 12, marginBottom: 4 },
  link: { color: COLORS.navy, fontSize: 13, fontWeight: "700", textDecorationLine: "underline" },
});

export default ProofImage;
