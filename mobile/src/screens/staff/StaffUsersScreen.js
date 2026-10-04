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
import FinanceAccountsSection from "../../components/FinanceAccountsSection";
import { COLORS } from "../../utils/format";
import { t } from "../../i18n";

const emptyForm = { fullName: "", username: "", email: "", password: "", role: "staff" };
const SCOPE_LABEL = { parent: "Waalid", verify: "Password-ka tirtirka", staff: "System User", finance: "Maaliyadda" };

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
      setError(t(err.response?.data?.message || "Khalad ayaa dhacay."));
    } finally {
      setSaving(false);
    }
  };

  const saveNew = () => {
    if (!addForm.fullName.trim() || !addForm.username.trim() || !addForm.password) {
      return setError(t("Magaca, Username iyo Password waa waajib."));
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
        title={t("Isticmaalayaasha")}
        onBack={navigation.goBack}
        right={
          <TouchableOpacity onPress={() => { setError(""); setAddForm({ ...emptyForm }); }}>
            <Text style={styles.add}>{t("+ Cusub")}</Text>
          </TouchableOpacity>
        }
      />
      {users === null ? (
        <Loading />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 40 }}>
          <Card>
            <Text style={styles.section}>{t("Akoonno Xiran (password khaldan)")}</Text>
            {locked.length === 0 && <Text style={styles.empty}>{t("Ma jiro akoon xiran hadda.")}</Text>}
            {locked.map((l) => (
              <View key={`${l.scope}:${l.identifier}`} style={styles.lockRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{l.name || l.identifier}</Text>
                  <Text style={styles.sub}>
                    {t(SCOPE_LABEL[l.scope] || l.scope)} {t("· wuu furmayaa ~")}{Math.ceil(l.remainingMs / 60000)} {t("daqiiqo")}
                  </Text>
                </View>
                <TouchableOpacity style={styles.unlockBtn} onPress={() => unlock(l)}>
                  <Text style={styles.unlockText}>{t("Fur")}</Text>
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
                  <Badge text={u.role === "admin" ? t("Admin") : t("Staff")} color={COLORS.navy} />
                  <Badge text={u.status === "active" ? t("Active") : t("Inactive")} color={u.status === "active" ? COLORS.success : COLORS.danger} />
                </View>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity
                  onPress={() => {
                    setError("");
                    setEditForm({ _id: u._id, fullName: u.fullName, email: u.email || "", role: u.role, status: u.status, password: "" });
                  }}
                >
                  <Text style={styles.link}>{t("Edit")}</Text>
                </TouchableOpacity>
                {u.username !== "admin" && (
                  <TouchableOpacity onPress={() => setDeleteTarget(u)}>
                    <Text style={styles.linkDanger}>{t("Tirtir")}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </Card>
          ))}

          <FinanceAccountsSection />
        </ScrollView>
      )}

      <ScreenModal visible={!!addForm} title={t("Isticmaale Cusub")} onClose={() => setAddForm(null)}>
        <ErrorText text={error} />
        {addForm && (
          <>
            <Field label={t("Magaca *")} value={addForm.fullName} onChangeText={(v) => setAddForm({ ...addForm, fullName: v })} />
            <Field label={t("Username *")} value={addForm.username} onChangeText={(v) => setAddForm({ ...addForm, username: v })} autoCapitalize="none" autoCorrect={false} />
            <Field label={t("Email (ikhtiyaari)")} value={addForm.email} onChangeText={(v) => setAddForm({ ...addForm, email: v })} autoCapitalize="none" keyboardType="email-address" />
            <Field label={t("Password *")} value={addForm.password} onChangeText={(v) => setAddForm({ ...addForm, password: v })} secureTextEntry autoCapitalize="none" />
            <Text style={styles.label}>{t("Role")}</Text>
            <ChipRow>
              <Chip label={t("Staff")} active={addForm.role === "staff"} onPress={() => setAddForm({ ...addForm, role: "staff" })} />
              <Chip label={t("Admin")} active={addForm.role === "admin"} onPress={() => setAddForm({ ...addForm, role: "admin" })} />
            </ChipRow>
            <PrimaryButton title={t("Kaydi Isticmaalaha")} onPress={saveNew} loading={saving} />
          </>
        )}
      </ScreenModal>

      <ScreenModal visible={!!editForm} title={t("Edit Isticmaale")} onClose={() => setEditForm(null)}>
        <ErrorText text={error} />
        {editForm && (
          <>
            <Field label={t("Magaca")} value={editForm.fullName} onChangeText={(v) => setEditForm({ ...editForm, fullName: v })} />
            <Field label={t("Email")} value={editForm.email} onChangeText={(v) => setEditForm({ ...editForm, email: v })} autoCapitalize="none" keyboardType="email-address" />
            <Text style={styles.label}>{t("Role")}</Text>
            <ChipRow>
              <Chip label={t("Staff")} active={editForm.role === "staff"} onPress={() => setEditForm({ ...editForm, role: "staff" })} />
              <Chip label={t("Admin")} active={editForm.role === "admin"} onPress={() => setEditForm({ ...editForm, role: "admin" })} />
            </ChipRow>
            <Text style={styles.label}>{t("Xaalad")}</Text>
            <ChipRow>
              <Chip label={t("Active")} active={editForm.status === "active"} onPress={() => setEditForm({ ...editForm, status: "active" })} />
              <Chip label={t("Inactive")} active={editForm.status === "inactive"} onPress={() => setEditForm({ ...editForm, status: "inactive" })} />
            </ChipRow>
            <Field
              label={t("Password cusub (ka tag madhan haddii aadan beddelayn)")}
              value={editForm.password}
              onChangeText={(v) => setEditForm({ ...editForm, password: v })}
              secureTextEntry
              autoCapitalize="none"
            />
            <PrimaryButton title={t("Kaydi")} onPress={saveEdit} loading={saving} />
          </>
        )}
      </ScreenModal>

      <ConfirmPasswordModal
        visible={!!deleteTarget}
        title={t("Tirtir Isticmaalaha?")}
        message={
          deleteTarget
            ? t("Waxaad tirtirayaa {name} ({username}). Ma awoodo mar dambe inuu soo galo system-ka — lama soo celin karo.", { name: deleteTarget.fullName, username: deleteTarget.username })
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
