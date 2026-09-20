import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import staffApi from "../../api/staffClient";
import { useAuth } from "../../context/AuthContext";
import { useStaff } from "../../context/StaffContext";
import { ScreenHeader, Card, Badge, ScreenModal, Field, PrimaryButton, ErrorText } from "../../components/StaffUI";
import ConfirmPasswordModal from "../../components/ConfirmPasswordModal";
import { COLORS } from "../../utils/format";

const StaffAcademicYearsScreen = ({ navigation }) => {
  const { staff } = useAuth();
  const { years, refreshYears } = useStaff();
  const isAdmin = staff?.role === "admin";

  const [startYear, setStartYear] = useState("");
  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);
  const [edit, setEdit] = useState(null);
  const [editError, setEditError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionError, setActionError] = useState("");

  const handleCreate = async () => {
    setCreateError("");
    setCreating(true);
    try {
      await staffApi.post("/academic-years", { startYear: Number(startYear) });
      setStartYear("");
      refreshYears();
    } catch (err) {
      setCreateError(err.response?.data?.message || "Khalad ayaa dhacay.");
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (y) => {
    setActionError("");
    try {
      await staffApi.put(`/academic-years/${y._id}/${y.isActive ? "deactivate" : "activate"}`);
      refreshYears();
    } catch (err) {
      setActionError(err.response?.data?.message || "Khalad ayaa dhacay.");
    }
  };

  const saveEdit = async () => {
    setEditError("");
    setSaving(true);
    try {
      await staffApi.put(`/academic-years/${edit._id}`, {
        name: edit.name,
        startMonth: edit.startMonth,
        endMonth: edit.endMonth,
      });
      setEdit(null);
      refreshYears();
    } catch (err) {
      setEditError(err.response?.data?.message || "Khalad ayaa dhacay.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    await staffApi.delete(`/academic-years/${deleteTarget._id}`);
    setDeleteTarget(null);
    refreshYears();
  };

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Sanad Dugsiyeedka" onBack={navigation.goBack} />
      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 40 }}>
        {isAdmin && (
          <Card>
            <ErrorText text={createError} />
            <Field
              label="Sanadka Bilowga (tusaale 2026)"
              value={startYear}
              onChangeText={setStartYear}
              keyboardType="numeric"
              maxLength={4}
            />
            <PrimaryButton title="+ Samee Sanad Dugsiyeed" onPress={handleCreate} loading={creating} disabled={!startYear} />
          </Card>
        )}
        <ErrorText text={actionError} />

        {years.map((y) => (
          <Card key={y._id}>
            <View style={styles.head}>
              <View>
                <Text style={styles.name}>{y.name}</Text>
                <Text style={styles.sub}>
                  {y.startMonth} → {y.endMonth}
                </Text>
              </View>
              {y.isActive ? <Badge text="Firfircoon" color={COLORS.success} /> : <Text style={styles.inactive}>Aan firfircoon</Text>}
            </View>
            {isAdmin && (
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => { setEditError(""); setEdit({ ...y }); }}>
                  <Text style={styles.link}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => toggleActive(y)}>
                  <Text style={y.isActive ? styles.linkDanger : styles.link}>{y.isActive ? "Deactivate" : "Activate"}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setDeleteTarget(y)}>
                  <Text style={styles.linkDanger}>Tirtir</Text>
                </TouchableOpacity>
              </View>
            )}
          </Card>
        ))}
      </ScrollView>

      <ScreenModal visible={!!edit} title="Edit Sanad Dugsiyeed" onClose={() => setEdit(null)}>
        <ErrorText text={editError} />
        {edit && (
          <>
            <Field label="Sanad" value={edit.name} onChangeText={(v) => setEdit({ ...edit, name: v })} />
            <Field label="Bilowga" value={edit.startMonth} onChangeText={(v) => setEdit({ ...edit, startMonth: v })} />
            <Field label="Dhammaadka" value={edit.endMonth} onChangeText={(v) => setEdit({ ...edit, endMonth: v })} />
            <PrimaryButton title="Kaydi" onPress={saveEdit} loading={saving} />
          </>
        )}
      </ScreenModal>

      <ConfirmPasswordModal
        visible={!!deleteTarget}
        title="Tirtir Sanad Dugsiyeedka?"
        message={
          deleteTarget
            ? `Waxaad tirtirayaa ${deleteTarget.name}. Tan waxay sidoo kale tirtiraysaa dhammaan Fee-yada iyo Lacag-bixinnada sanadkan la xidhiidha oo dhan — lama soo celin karo.`
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
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  name: { fontSize: 16, fontWeight: "700", color: COLORS.ink },
  sub: { fontSize: 12, color: "rgba(20,24,33,0.5)", marginTop: 2 },
  inactive: { fontSize: 12, color: "rgba(20,24,33,0.4)" },
  actions: { flexDirection: "row", gap: 18, marginTop: 10, borderTopWidth: 1, borderTopColor: COLORS.line, paddingTop: 10 },
  link: { color: COLORS.navy, fontSize: 13, fontWeight: "600" },
  linkDanger: { color: COLORS.danger, fontSize: 13, fontWeight: "600" },
});

export default StaffAcademicYearsScreen;
