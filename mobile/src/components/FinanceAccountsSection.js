import { useCallback, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import staffApi from "../api/staffClient";
import { Card, Badge, ScreenModal, Field, Chip, ChipRow, PrimaryButton, ErrorText } from "./StaffUI";
import ConfirmPasswordModal from "./ConfirmPasswordModal";
import { COLORS } from "../utils/format";
import { t } from "../i18n";

const emptyForm = { fullName: "", username: "", password: "" };

// System-admin side of the finance section: who can log in to "Maaliyadda".
// These accounts only open the finance section; they can't see fees, parents or payments.
const FinanceAccountsSection = () => {
  const [users, setUsers] = useState([]);
  const [addForm, setAddForm] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await staffApi.get("/finance-users");
    setUsers(res.data);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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
    run(() => staffApi.post("/finance-users", addForm), () => setAddForm(null));
  };

  const saveEdit = () => {
    const { _id, password, ...rest } = editForm;
    run(() => staffApi.put(`/finance-users/${_id}`, password ? { ...rest, password } : rest), () => setEditForm(null));
  };

  const handleDelete = async () => {
    await staffApi.delete(`/finance-users/${deleteTarget._id}`);
    setDeleteTarget(null);
    load();
  };

  return (
    <View>
      <Card>
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.section}>{t("Akoonnada Maaliyadda")}</Text>
            <Text style={styles.note}>{t("Waxay galaan qaybta Maaliyadda oo kaliya — lacagaha waalidiinta ma arkaan.")}</Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              setError("");
              setAddForm({ ...emptyForm });
            }}
          >
            <Text style={styles.add}>{t("+ Cusub")}</Text>
          </TouchableOpacity>
        </View>

        {users.length === 0 && <Text style={styles.empty}>{t("Weli akoon Maaliyadda ah lama abuurin.")}</Text>}
        {users.map((u) => (
          <View key={u._id} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{u.fullName}</Text>
              <Text style={styles.sub}>{u.username}</Text>
            </View>
            <Badge text={u.status === "active" ? t("Active") : t("Inactive")} color={u.status === "active" ? COLORS.success : COLORS.danger} />
            <TouchableOpacity
              style={{ marginLeft: 12 }}
              onPress={() => {
                setError("");
                setEditForm({ _id: u._id, fullName: u.fullName, status: u.status, password: "" });
              }}
            >
              <Text style={styles.link}>{t("Edit")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ marginLeft: 12 }} onPress={() => setDeleteTarget(u)}>
              <Text style={styles.linkDanger}>{t("Tirtir")}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </Card>

      <ScreenModal visible={!!addForm} title={t("Akoon Maaliyadda Cusub")} onClose={() => setAddForm(null)}>
        <ErrorText text={error} />
        {addForm && (
          <>
            <Field label={t("Magaca *")} value={addForm.fullName} onChangeText={(v) => setAddForm({ ...addForm, fullName: v })} />
            <Field label={t("Username *")} value={addForm.username} onChangeText={(v) => setAddForm({ ...addForm, username: v })} autoCapitalize="none" autoCorrect={false} />
            <Field label={t("Password * (ugu yaraan 6 xaraf)")} value={addForm.password} onChangeText={(v) => setAddForm({ ...addForm, password: v })} secureTextEntry autoCapitalize="none" />
            <PrimaryButton title={t("Kaydi Akoonka")} onPress={saveNew} loading={saving} />
          </>
        )}
      </ScreenModal>

      <ScreenModal visible={!!editForm} title={t("Edit Akoonka Maaliyadda")} onClose={() => setEditForm(null)}>
        <ErrorText text={error} />
        {editForm && (
          <>
            <Field label={t("Magaca")} value={editForm.fullName} onChangeText={(v) => setEditForm({ ...editForm, fullName: v })} />
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
        title={t("Tirtir Akoonka Maaliyadda?")}
        message={
          deleteTarget
            ? t("Waxaad tirtirayaa {name} ({username}). Ma awoodo mar dambe inuu soo galo qaybta Maaliyadda. Diiwaannadiisii hore way hadhayaan.", { name: deleteTarget.fullName, username: deleteTarget.username })
            : ""
        }
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  titleRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 6 },
  section: { fontSize: 15, fontWeight: "700", color: COLORS.ink },
  note: { fontSize: 11, color: "rgba(20,24,33,0.5)", marginTop: 2, marginRight: 8 },
  add: { color: COLORS.brand, fontSize: 13, fontWeight: "700" },
  empty: { color: "rgba(20,24,33,0.4)", fontSize: 13, paddingVertical: 8 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderTopWidth: 1, borderTopColor: COLORS.line },
  name: { fontSize: 14, fontWeight: "600", color: COLORS.ink },
  sub: { fontSize: 12, color: "rgba(20,24,33,0.5)", marginTop: 2 },
  link: { color: COLORS.navy, fontSize: 13, fontWeight: "600" },
  linkDanger: { color: COLORS.danger, fontSize: 13, fontWeight: "600" },
  label: { fontSize: 13, color: "rgba(20,24,33,0.7)", marginBottom: 6, marginTop: 12 },
});

export default FinanceAccountsSection;
