import { useCallback, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import staffApi from "../../api/staffClient";
import {
  ScreenHeader,
  Loading,
  Card,
  Badge,
  ScreenModal,
  Field,
  Chip,
  ChipRow,
  PrimaryButton,
  ErrorText,
} from "../../components/StaffUI";
import ConfirmPasswordModal from "../../components/ConfirmPasswordModal";
import { COLORS } from "../../utils/format";

const emptyForm = { fullName: "", username: "", email: "", password: "", role: "staff" };
const SCOPE_LABEL = { parent: "Waalid", verify: "Password-ka tirtirka", staff: "System User" };

const StaffUsersScreen = ({ navigation }) => {
  const [users, setUsers] = useState(null);
  const [locked, setLocked] = useState([]);

  const [addForm, setAddForm] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [u, l] = await Promise.all([staffApi.get("/users"), staffApi.get("/users/locked")]);
    setUsers(u.data);
    setLocked(l.data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const run = async (fn, close) => {
    setError("");
    setSaving(true);
    try {
      await fn();
      close();
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Khalad ayaa dhacay.");
    } finally {
      setSaving(false);
    }
  };

  const saveNew = () => {
    if (!addForm.fullName.trim() || !addForm.username.trim() || !addForm.password) {
      return setError("Magaca, Username iyo Password waa waajib.");
    }
    run(() => staffApi.post("/users", addForm), () => setAddForm(null));
  };

  const saveEdit = () => {
    const { password, ...rest } = editForm;
    run(
      () => staffApi.put(`/users/${editForm._id}`, password ? { ...rest, password } : rest),
      () => setEditForm(null)
    );
  };

  const unlock = async (l) => {
    await staffApi.post("/users/unlock", { scope: l.scope, identifier: l.identifier });
    load();
  };

  const handleDelete = async () => {
    await staffApi.delete(`/users/${deleteTarget._id}`);
    setDeleteTarget(null);
    load();
  };

  return (
    <View style={styles.flex}>
      <ScreenHeader
        title="Isticmaalayaasha"
        onBack={navigation.goBack}
        right={
          <TouchableOpacity onPress={() => { setError(""); setAddForm({ ...emptyForm }); }}>
            <Text style={styles.add}>+ Cusub</Text>
          </TouchableOpacity>
        }
      />
      {users === null ? (
        <Loading />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 40 }}>
          <Card>
            <Text style={styles.section}>Akoonno Xiran (password khaldan)</Text>
            {locked.length === 0 && <Text style={styles.empty}>Ma jiro akoon xiran hadda.</Text>}
            {locked.map((l) => (
              <View key={`${l.scope}:${l.identifier}`} style={styles.lockRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{l.name || l.identifier}</Text>
                  <Text style={styles.sub}>
                    {SCOPE_LABEL[l.scope] || l.scope} · wuu furmayaa ~{Math.ceil(l.remainingMs / 60000)} daqiiqo
                  </Text>
                </View>
                <TouchableOpacity style={styles.unlockBtn} onPress={() => unlock(l)}>
                  <Text style={styles.unlockText}>Fur</Text>
                </TouchableOpacity>
              </View>
            ))}
          </Card>

          {users.map((u) => (
            <Card key={u._id}>
              <View style={styles.head}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{u.fullName}</Text>
                  <Text style={styles.sub}>{u.username}</Text>
                </View>
                <View style={{ alignItems: "flex-end", gap: 4 }}>
                  <Badge text={u.role === "admin" ? "Admin" : "Staff"} color={COLORS.navy} />
                  <Badge text={u.status === "active" ? "Active" : "Inactive"} color={u.status === "active" ? COLORS.success : COLORS.danger} />
                </View>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity
                  onPress={() => {
                    setError("");
                    setEditForm({ _id: u._id, fullName: u.fullName, email: u.email || "", role: u.role, status: u.status, password: "" });
                  }}
                >
                  <Text style={styles.link}>Edit</Text>
                </TouchableOpacity>
                {u.username !== "admin" && (
                  <TouchableOpacity onPress={() => setDeleteTarget(u)}>
                    <Text style={styles.linkDanger}>Tirtir</Text>
                  </TouchableOpacity>
                )}
              </View>
            </Card>
          ))}
        </ScrollView>
      )}

      <ScreenModal visible={!!addForm} title="Isticmaale Cusub" onClose={() => setAddForm(null)}>
        <ErrorText text={error} />
        {addForm && (
          <>
            <Field label="Magaca *" value={addForm.fullName} onChangeText={(v) => setAddForm({ ...addForm, fullName: v })} />
            <Field label="Username *" value={addForm.username} onChangeText={(v) => setAddForm({ ...addForm, username: v })} autoCapitalize="none" autoCorrect={false} />
            <Field label="Email (ikhtiyaari)" value={addForm.email} onChangeText={(v) => setAddForm({ ...addForm, email: v })} autoCapitalize="none" keyboardType="email-address" />
            <Field label="Password *" value={addForm.password} onChangeText={(v) => setAddForm({ ...addForm, password: v })} secureTextEntry autoCapitalize="none" />
            <Text style={styles.label}>Role</Text>
            <ChipRow>
              <Chip label="Staff" active={addForm.role === "staff"} onPress={() => setAddForm({ ...addForm, role: "staff" })} />
              <Chip label="Admin" active={addForm.role === "admin"} onPress={() => setAddForm({ ...addForm, role: "admin" })} />
            </ChipRow>
            <PrimaryButton title="Kaydi Isticmaalaha" onPress={saveNew} loading={saving} />
          </>
        )}
      </ScreenModal>

      <ScreenModal visible={!!editForm} title="Edit Isticmaale" onClose={() => setEditForm(null)}>
        <ErrorText text={error} />
        {editForm && (
          <>
            <Field label="Magaca" value={editForm.fullName} onChangeText={(v) => setEditForm({ ...editForm, fullName: v })} />
            <Field label="Email" value={editForm.email} onChangeText={(v) => setEditForm({ ...editForm, email: v })} autoCapitalize="none" keyboardType="email-address" />
            <Text style={styles.label}>Role</Text>
            <ChipRow>
              <Chip label="Staff" active={editForm.role === "staff"} onPress={() => setEditForm({ ...editForm, role: "staff" })} />
              <Chip label="Admin" active={editForm.role === "admin"} onPress={() => setEditForm({ ...editForm, role: "admin" })} />
            </ChipRow>
            <Text style={styles.label}>Xaalad</Text>
            <ChipRow>
              <Chip label="Active" active={editForm.status === "active"} onPress={() => setEditForm({ ...editForm, status: "active" })} />
              <Chip label="Inactive" active={editForm.status === "inactive"} onPress={() => setEditForm({ ...editForm, status: "inactive" })} />
            </ChipRow>
            <Field
              label="Password cusub (ka tag madhan haddii aadan beddelayn)"
              value={editForm.password}
              onChangeText={(v) => setEditForm({ ...editForm, password: v })}
              secureTextEntry
              autoCapitalize="none"
            />
            <PrimaryButton title="Kaydi" onPress={saveEdit} loading={saving} />
          </>
        )}
      </ScreenModal>

      <ConfirmPasswordModal
        visible={!!deleteTarget}
        title="Tirtir Isticmaalaha?"
        message={
          deleteTarget
            ? `Waxaad tirtirayaa ${deleteTarget.fullName} (${deleteTarget.username}). Ma awoodo mar dambe inuu soo galo system-ka — lama soo celin karo.`
            : ""
        }
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.paper },
  add: { color: "#fff", fontSize: 13, fontWeight: "600" },
  section: { fontSize: 15, fontWeight: "700", color: COLORS.ink, marginBottom: 8 },
  empty: { color: "rgba(20,24,33,0.4)", fontSize: 13 },
  lockRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderTopWidth: 1, borderTopColor: COLORS.line },
  unlockBtn: { borderWidth: 1, borderColor: COLORS.line, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 7 },
  unlockText: { color: COLORS.ink, fontSize: 13, fontWeight: "600" },
  head: { flexDirection: "row", alignItems: "center" },
  name: { fontSize: 15, fontWeight: "600", color: COLORS.ink },
  sub: { fontSize: 12, color: "rgba(20,24,33,0.5)", marginTop: 2 },
  actions: { flexDirection: "row", gap: 18, marginTop: 10, borderTopWidth: 1, borderTopColor: COLORS.line, paddingTop: 10 },
  link: { color: COLORS.navy, fontSize: 13, fontWeight: "600" },
  linkDanger: { color: COLORS.danger, fontSize: 13, fontWeight: "600" },
  label: { fontSize: 13, color: "rgba(20,24,33,0.7)", marginBottom: 6, marginTop: 12 },
});

export default StaffUsersScreen;
