import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import staffApi from "../../api/staffClient";
import ProofImage from "../../components/ProofImage";
import { StaffHeader, Chip, Badge } from "../../components/StaffUI";
import { formatMoney, formatDate, COLORS } from "../../utils/format";

const statusColor = (s) => (s === "confirmed" ? COLORS.success : COLORS.amber);
const statusText = (s) => (s === "confirmed" ? "La Xaqiijiyay" : "La Sugayo");
const typeColor = (t) => (t === "complaint" ? COLORS.danger : COLORS.navy);
const typeText = (t) => (t === "complaint" ? "Cabasho" : "Invoice");

const StaffProofsScreen = ({ navigation }) => {
  const [proofs, setProofs] = useState([]);
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [openId, setOpenId] = useState(null);
  const [thread, setThread] = useState(null);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [viewerUri, setViewerUri] = useState(null);

  const load = useCallback(async () => {
    const res = await staffApi.get("/payment-proofs", {
      params: { type: type || undefined, status: status || undefined },
    });
    setProofs(res.data);
    setLoading(false);
  }, [type, status]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const unsub = navigation.addListener("focus", load);
    return unsub;
  }, [navigation, load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const toggleOpen = async (id) => {
    if (openId === id) {
      setOpenId(null);
      setThread(null);
      return;
    }
    setOpenId(id);
    setReply("");
    setThread(null);
    const res = await staffApi.get(`/payment-proofs/${id}`);
    setThread(res.data);
  };

  const refreshThread = async () => {
    const res = await staffApi.get(`/payment-proofs/${openId}`);
    setThread(res.data);
    load();
  };

  const sendReply = async () => {
    if (!reply.trim()) return;
    setBusy(true);
    try {
      await staffApi.post(`/payment-proofs/${openId}/messages`, { message: reply.trim() });
      setReply("");
      await refreshThread();
    } finally {
      setBusy(false);
    }
  };

  const toggleStatus = async () => {
    setBusy(true);
    try {
      await staffApi.put(`/payment-proofs/${openId}`, {
        status: thread.status === "confirmed" ? "pending" : "confirmed",
      });
      await refreshThread();
    } finally {
      setBusy(false);
    }
  };

  const renderItem = ({ item: p }) => {
    const isOpen = openId === p._id;
    return (
      <View style={styles.item}>
        <TouchableOpacity style={styles.itemHead} onPress={() => toggleOpen(p._id)}>
          <View style={styles.badges}>
            <Badge text={typeText(p.type)} color={typeColor(p.type)} />
            <Badge text={statusText(p.status)} color={statusColor(p.status)} />
          </View>
          <Text style={styles.name}>
            {p.parentId?.fullName} — {p.parentId?.phone}
            {p.amount ? `  ·  ${formatMoney(p.amount)}` : ""}
          </Text>
          <Text style={styles.msg} numberOfLines={isOpen ? undefined : 1}>
            {p.message}
          </Text>
          <Text style={styles.date}>{formatDate(p.createdAt)}</Text>
        </TouchableOpacity>

        {isOpen && (
          <View style={styles.thread}>
            {!thread ? (
              <ActivityIndicator color={COLORS.navy} />
            ) : (
              <>
                <TouchableOpacity style={styles.statusBtn} onPress={toggleStatus} disabled={busy}>
                  <Text style={styles.statusBtnText}>
                    {thread.status === "confirmed" ? "Dib u Fur (Sugaya)" : "Calaamadi La Xaqiijiyay"}
                  </Text>
                </TouchableOpacity>

                <ProofImage screenshotUrl={thread.screenshotUrl} height={180} onOpen={setViewerUri} />

                {thread.messages?.map((m) => {
                  const isStaff = m.senderType === "staff";
                  return (
                    <View key={m._id} style={[styles.bubble, isStaff ? styles.bubbleStaff : styles.bubbleParent]}>
                      <Text style={[styles.bubbleName, { color: isStaff ? "#fff" : COLORS.ink }]}>
                        {isStaff ? m.senderName : thread.parentId?.fullName}
                      </Text>
                      <Text style={{ color: isStaff ? "#fff" : COLORS.ink, fontSize: 13 }}>{m.message}</Text>
                    </View>
                  );
                })}

                <View style={styles.replyRow}>
                  <TextInput
                    style={styles.replyInput}
                    value={reply}
                    onChangeText={setReply}
                    placeholder="Qor jawaab..."
                    placeholderTextColor="#9CA3AF"
                  />
                  <TouchableOpacity style={styles.replyBtn} onPress={sendReply} disabled={busy}>
                    <Text style={styles.replyBtnText}>Dir</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.flex}>
      <StaffHeader title="Caddaynta & Cabashooyinka" />
      <View style={styles.filters}>
        <Chip label="Dhammaan" active={type === ""} onPress={() => setType("")} />
        <Chip label="Invoice" active={type === "invoice"} onPress={() => setType("invoice")} />
        <Chip label="Cabasho" active={type === "complaint"} onPress={() => setType("complaint")} />
      </View>
      <View style={styles.filters}>
        <Chip label="Dhammaan" active={status === ""} onPress={() => setStatus("")} />
        <Chip label="La Sugayo" active={status === "pending"} onPress={() => setStatus("pending")} />
        <Chip label="La Xaqiijiyay" active={status === "confirmed"} onPress={() => setStatus("confirmed")} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.navy} size="large" />
        </View>
      ) : (
        <FlatList
          data={proofs}
          keyExtractor={(p) => p._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 12, paddingBottom: 30 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<Text style={styles.empty}>Weli wax lama soo gudbin.</Text>}
        />
      )}

      <Modal visible={!!viewerUri} transparent animationType="fade" onRequestClose={() => setViewerUri(null)}>
        <TouchableOpacity style={styles.viewer} activeOpacity={1} onPress={() => setViewerUri(null)}>
          {viewerUri && <Image source={{ uri: viewerUri }} style={styles.viewerImg} resizeMode="contain" />}
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.paper },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  filters: { flexDirection: "row", paddingHorizontal: 12, paddingTop: 10 },
  empty: { textAlign: "center", color: "rgba(20,24,33,0.4)", paddingVertical: 30 },
  item: { backgroundColor: COLORS.surface, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: COLORS.line, overflow: "hidden" },
  itemHead: { padding: 14 },
  badges: { flexDirection: "row", gap: 6, marginBottom: 8 },
  name: { fontSize: 14, fontWeight: "600", color: COLORS.ink },
  msg: { fontSize: 13, color: "rgba(20,24,33,0.65)", marginTop: 4 },
  date: { fontSize: 11, color: "rgba(20,24,33,0.4)", marginTop: 6 },
  thread: { borderTopWidth: 1, borderTopColor: COLORS.line, padding: 12, backgroundColor: COLORS.paper },
  statusBtn: { borderWidth: 1, borderColor: COLORS.line, borderRadius: 999, paddingVertical: 8, alignItems: "center", backgroundColor: COLORS.surface, marginBottom: 10 },
  statusBtnText: { fontSize: 12, color: COLORS.navy, fontWeight: "600" },
  bubble: { maxWidth: "82%", borderRadius: 10, padding: 8, marginBottom: 6 },
  bubbleStaff: { backgroundColor: COLORS.navy, alignSelf: "flex-end" },
  bubbleParent: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.line, alignSelf: "flex-start" },
  bubbleName: { fontSize: 10, opacity: 0.7, marginBottom: 2 },
  replyRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  replyInput: { flex: 1, borderWidth: 1, borderColor: COLORS.line, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, backgroundColor: COLORS.surface, color: COLORS.ink },
  replyBtn: { backgroundColor: COLORS.brand, borderRadius: 8, paddingHorizontal: 16, justifyContent: "center" },
  replyBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  viewer: { flex: 1, backgroundColor: "rgba(0,0,0,0.9)", alignItems: "center", justifyContent: "center" },
  viewerImg: { width: "100%", height: "80%" },
});

export default StaffProofsScreen;
