import { useCallback, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Modal,
  Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import api from "../api/client";
import ProofImage from "./ProofImage";
import { formatMoney, formatDate, COLORS } from "../utils/format";

const statusColor = (status) => (status === "confirmed" ? COLORS.success : COLORS.amber);
const statusLabel = (status) => (status === "confirmed" ? "La Xaqiijiyay" : "La Sugayo");
const typeColor = (type) => (type === "complaint" ? COLORS.danger : COLORS.navy);
const typeLabel = (type) => (type === "complaint" ? "Cabasho" : "Invoice");

const Badge = ({ text, color }) => (
  <View style={[styles.badge, { backgroundColor: `${color}1A` }]}>
    <Text style={[styles.badgeText, { color }]}>{text}</Text>
  </View>
);

const PaymentProofsSection = ({ payments }) => {
  const [proofs, setProofs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState("invoice");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [image, setImage] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [openProof, setOpenProof] = useState(null);
  const [thread, setThread] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const [viewerUri, setViewerUri] = useState(null);

  const load = useCallback(async () => {
    const res = await api.get("/parent-portal/payment-proofs");
    setProofs(res.data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError("Fadlan ogolow galitaanka sawirrada (photos) si aad screenshot u soo gudbiso.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1, // resized/compressed on submit
    });
    if (!result.canceled) setImage(result.assets[0]);
  };

  const resetForm = () => {
    setMessage("");
    setAmount("");
    setImage(null);
  };

  const handleSubmit = async () => {
    setError("");
    if (!message.trim()) {
      setError(type === "complaint" ? "Fadlan sharax cabashadaada." : "Fadlan sharax lacag-bixinta aad sameysay.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = { type, message: message.trim() };
      if (amount) payload.amount = amount;
      if (image) {
        // Shrink to ~1280px wide JPEG and send as base64 JSON: small enough for
        // the server's upload limit, and avoids multipart uploads from the app.
        const shrunk = await ImageManipulator.manipulateAsync(
          image.uri,
          image.width > 1280 ? [{ resize: { width: 1280 } }] : [],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
        );
        payload.screenshotBase64 = shrunk.base64;
        payload.screenshotMime = "image/jpeg";
      }
      const res = await api.post("/parent-portal/payment-proofs", payload);
      if (image && !res.data?.screenshotUrl) {
        load(); // the proof itself was saved; only the image is missing
        setError("Sawirka ma gaadhin server-ka. Fadlan isku day mar kale.");
        return;
      }
      resetForm();
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Khalad ayaa dhacay.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleThread = async (proof) => {
    if (openProof === proof._id) {
      setOpenProof(null);
      return;
    }
    setOpenProof(proof._id);
    setReplyText("");
    const res = await api.get(`/parent-portal/payment-proofs/${proof._id}`);
    setThread(res.data);
  };

  const handleDelete = (id) => {
    Alert.alert("Tirtir", "Ma hubtaa inaad tirtirto caddayntan/cabashadan?", [
      { text: "Maya", style: "cancel" },
      {
        text: "Tirtir",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/parent-portal/payment-proofs/${id}`);
            setOpenProof(null);
            load();
          } catch (err) {
            Alert.alert("Khalad", err.response?.data?.message || "Khalad ayaa dhacay.");
          }
        },
      },
    ]);
  };

  const handleReply = async (id) => {
    if (!replyText.trim()) return;
    setReplying(true);
    try {
      await api.post(`/parent-portal/payment-proofs/${id}/messages`, { message: replyText.trim() });
      const res = await api.get(`/parent-portal/payment-proofs/${id}`);
      setThread(res.data);
      setReplyText("");
      load();
    } finally {
      setReplying(false);
    }
  };

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Lacag Bixinta &amp; Cabashooyinka</Text>
        <TouchableOpacity style={styles.smallBtn} onPress={() => setShowForm((v) => !v)}>
          <Text style={styles.smallBtnText}>{showForm ? "Jooji" : "+ Soo Gudbi"}</Text>
        </TouchableOpacity>
      </View>

      {showForm && (
        <View style={styles.formBox}>
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tab, type === "invoice" && styles.tabActive]}
              onPress={() => {
                setType("invoice");
                setError("");
              }}
            >
              <Text style={[styles.tabText, type === "invoice" && styles.tabTextActive]}>Soo Gudbi Invoice</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, type === "complaint" && styles.tabActive]}
              onPress={() => {
                setType("complaint");
                setError("");
              }}
            >
              <Text style={[styles.tabText, type === "complaint" && styles.tabTextActive]}>Qor Cabasho</Text>
            </TouchableOpacity>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {type === "invoice" && (
            <>
              <Text style={styles.label}>Lacagta La Bixiyay ($)</Text>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                placeholder="Tusaale: 50"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
            </>
          )}

          <Text style={styles.label}>{type === "complaint" ? "Sharax Cabashadaada" : "Faahfaahin"}</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={message}
            onChangeText={setMessage}
            placeholder={type === "complaint" ? "Tusaale: Lacagtii aan bixiyey lama xisaabin." : "Tusaale: Waxaan ku bixiyey EVC Plus."}
            placeholderTextColor="#9CA3AF"
            multiline
          />

          <Text style={styles.label}>{type === "complaint" ? "Caddayn (ikhtiyaari)" : "Invoice/Screenshot"}</Text>
          <TouchableOpacity style={styles.pickBtn} onPress={pickImage}>
            <Text style={styles.pickBtnText}>{image ? "Beddel Sawirka" : "Dooro Sawir"}</Text>
          </TouchableOpacity>
          {image && <Image source={{ uri: image.uri }} style={styles.previewImg} />}

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Soo Gudbi</Text>}
          </TouchableOpacity>
        </View>
      )}

      {proofs.length === 0 && !showForm && <Text style={styles.emptyText}>Weli lacag-bixin ama cabasho lama soo gudbin.</Text>}

      {proofs.map((p) => {
        const isOpen = openProof === p._id;
        return (
          <View key={p._id} style={styles.proofItem}>
            <TouchableOpacity style={styles.proofHeader} onPress={() => toggleThread(p)}>
              <View style={{ flex: 1 }}>
                <View style={styles.proofBadgeRow}>
                  <Badge text={typeLabel(p.type)} color={typeColor(p.type)} />
                  <Badge text={statusLabel(p.status)} color={statusColor(p.status)} />
                </View>
                <Text style={styles.proofMessage} numberOfLines={isOpen ? undefined : 1}>
                  {p.amount ? `${formatMoney(p.amount)} — ` : ""}
                  {p.message}
                </Text>
                <Text style={styles.proofDate}>{formatDate(p.createdAt)}</Text>
              </View>
            </TouchableOpacity>

            {isOpen && thread && (
              <View style={styles.threadBox}>
                <ProofImage screenshotUrl={thread.screenshotUrl} height={160} onOpen={setViewerUri} />
                {thread.messages?.map((m) => {
                  const isParent = m.senderType === "parent";
                  return (
                    <View key={m._id} style={[styles.msgBubble, isParent ? styles.msgParent : styles.msgStaff]}>
                      <Text style={[styles.msgSender, isParent ? styles.msgTextLight : styles.msgTextDark]}>
                        {isParent ? "Adiga" : m.senderName}
                      </Text>
                      <Text style={isParent ? styles.msgTextLight : styles.msgTextDark}>{m.message}</Text>
                    </View>
                  );
                })}
                {thread.messages?.length === 0 && <Text style={styles.emptyText}>Weli jawaab lama bixin.</Text>}

                <View style={styles.replyRow}>
                  <TextInput
                    style={[styles.input, styles.replyInput]}
                    value={replyText}
                    onChangeText={setReplyText}
                    placeholder="Qor fariin..."
                    placeholderTextColor="#9CA3AF"
                  />
                  <TouchableOpacity
                    style={styles.replyBtn}
                    onPress={() => handleReply(p._id)}
                    disabled={replying}
                  >
                    {replying ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.replyBtnText}>Dir</Text>}
                  </TouchableOpacity>
                </View>

                {p.status !== "confirmed" && (
                  <TouchableOpacity onPress={() => handleDelete(p._id)} style={styles.deleteBtn}>
                    <Text style={styles.deleteBtnText}>Tirtir</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        );
      })}

      <Modal visible={!!viewerUri} transparent animationType="fade" onRequestClose={() => setViewerUri(null)}>
        <TouchableOpacity style={styles.viewerBackdrop} activeOpacity={1} onPress={() => setViewerUri(null)}>
          {viewerUri && <Image source={{ uri: viewerUri }} style={styles.viewerImg} resizeMode="contain" />}
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  deleteBtn: { alignSelf: "flex-start", marginTop: 12, paddingVertical: 4 },
  deleteBtnText: { color: COLORS.danger, fontSize: 13, fontWeight: "600" },
  section: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: COLORS.line },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: COLORS.ink, flexShrink: 1 },
  smallBtn: { borderWidth: 1, borderColor: COLORS.line, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  smallBtnText: { fontSize: 12, color: COLORS.ink },
  formBox: { backgroundColor: COLORS.paper, borderRadius: 10, padding: 12, marginBottom: 12 },
  tabRow: { flexDirection: "row", backgroundColor: COLORS.surface, borderRadius: 999, padding: 3, marginBottom: 10 },
  tab: { flex: 1, paddingVertical: 7, borderRadius: 999, alignItems: "center" },
  tabActive: { backgroundColor: COLORS.navy },
  tabText: { fontSize: 12, color: "rgba(20,24,33,0.6)" },
  tabTextActive: { color: "#fff" },
  error: { backgroundColor: "rgba(179,64,42,0.1)", color: COLORS.danger, padding: 8, borderRadius: 8, marginBottom: 8, fontSize: 12 },
  label: { fontSize: 12, color: "rgba(20,24,33,0.6)", marginBottom: 4, marginTop: 8 },
  input: { borderWidth: 1, borderColor: COLORS.line, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, color: COLORS.ink, backgroundColor: COLORS.surface },
  textarea: { minHeight: 64, textAlignVertical: "top" },
  pickBtn: { borderWidth: 1, borderColor: COLORS.line, borderRadius: 8, paddingVertical: 9, alignItems: "center", backgroundColor: COLORS.surface },
  pickBtnText: { fontSize: 12, color: COLORS.navy },
  previewImg: { width: "100%", height: 140, borderRadius: 8, marginTop: 8, resizeMode: "cover" },
  submitBtn: { backgroundColor: COLORS.brand, borderRadius: 999, paddingVertical: 11, alignItems: "center", marginTop: 12 },
  submitBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  emptyText: { color: "rgba(20,24,33,0.4)", fontSize: 12, textAlign: "center", paddingVertical: 10 },
  proofItem: { borderWidth: 1, borderColor: COLORS.line, borderRadius: 10, marginBottom: 8, overflow: "hidden" },
  proofHeader: { padding: 12 },
  proofBadgeRow: { flexDirection: "row", gap: 6, marginBottom: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  badgeText: { fontSize: 10, fontWeight: "700" },
  proofMessage: { fontSize: 13, color: COLORS.ink },
  proofDate: { fontSize: 11, color: "rgba(20,24,33,0.4)", marginTop: 4 },
  threadBox: { borderTopWidth: 1, borderTopColor: COLORS.line, padding: 12, backgroundColor: COLORS.paper },
  msgBubble: { maxWidth: "82%", borderRadius: 10, padding: 8, marginBottom: 6 },
  msgParent: { backgroundColor: COLORS.navy, alignSelf: "flex-end" },
  msgStaff: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.line, alignSelf: "flex-start" },
  msgSender: { fontSize: 10, opacity: 0.7, marginBottom: 2 },
  msgTextLight: { fontSize: 13, color: "#fff" },
  msgTextDark: { fontSize: 13, color: COLORS.ink },
  replyRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  replyInput: { flex: 1 },
  replyBtn: { backgroundColor: COLORS.brand, borderRadius: 8, paddingHorizontal: 16, alignItems: "center", justifyContent: "center" },
  replyBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  viewerBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.9)", alignItems: "center", justifyContent: "center" },
  viewerImg: { width: "100%", height: "80%" },
});

export default PaymentProofsSection;
