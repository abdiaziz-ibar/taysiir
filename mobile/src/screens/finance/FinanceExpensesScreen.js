import { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from "react-native";
import financeApi, { verifyFinancePassword } from "../../api/financeClient";
import { Loading, ListRow, ScreenModal, Field, Chip, ChipRow, PrimaryButton, ErrorText, EmptyState, Fab } from "../../components/StaffUI";
import { FinanceHeader } from "../../components/FinanceUI";
import ConfirmPasswordModal from "../../components/ConfirmPasswordModal";
import MonthNav from "../../components/MonthNav";
import Icon from "../../components/Icon";
import { formatMoney, formatDate } from "../../utils/format";
import { COLORS, RADIUS, SHADOW } from "../../utils/theme";
import { EXPENSE_CATEGORIES, PAYMENT_METHODS, currentMonth, monthLabel, todayISO, isValidDate } from "../../utils/finance";
import { t } from "../../i18n";

// Same rule as the server: a description is real text, not just a number.
const descriptionError = (text) => {
  const v = text.trim();
  if (v.length < 3) return t("Sharaxaadda aad bay u gaaban tahay (ugu yaraan 3 xaraf).");
  if (!/\p{L}/u.test(v)) return t("Sharaxaadda waa inay noqotaa qoraal (ereyo), ma aha lambar kaliya.");
  return "";
};

const CATEGORY_ICON = {
  Koronto: "flash",
  Biyaha: "water",
  Kiro: "home",
  "Internet & Telefoon": "wifi",
  "Agabka & Qalabka": "cube",
  "Qalin & Buugaag": "pencil",
  Dayactir: "construct",
  "Gaadiid & Shidaal": "car",
  Nadaafad: "sparkles",
  "Cunto & Casuumaad": "restaurant",
  Kale: "ellipsis-horizontal-circle",
};

// New regular costs repeat every month by default (entered once; "Kale" is the exception).
const emptyForm = () => ({ category: EXPENSE_CATEGORIES[0], description: "", amount: "", expenseDate: todayISO(), paymentMethod: "Cash", notes: "", recurring: true });

// A recurring row from the server has the id "rec:<templateId>:<YYYY-MM>".
const rowMonth = (x) => x._id.split(":")[2];

// Everything the school spends apart from salaries (those have their own tab).
const FinanceExpensesScreen = ({ navigation, route }) => {
  const [month, setMonth] = useState(currentMonth());
  const [allMonths, setAllMonths] = useState(false);
  const [category, setCategory] = useState("");
  const [data, setData] = useState(null);

  const [form, setForm] = useState(null); // null = closed; { _id } present = editing
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await financeApi.get("/expenses", { params: { month: allMonths ? undefined : month, category: category || undefined } });
    setData(res.data);
  }, [month, allMonths, category]);

  useEffect(() => {
    setData(null);
    load();
  }, [load]);

  useEffect(() => navigation.addListener("focus", load), [navigation, load]);

  const openNew = useCallback(() => {
    setError("");
    const first = category || EXPENSE_CATEGORIES[0];
    setForm({ ...emptyForm(), category: first, recurring: first !== "Kale" });
  }, [category]);

  // The Home tab's "Kharash Cusub" shortcut lands here with { add: true }.
  useEffect(() => {
    if (route?.params?.add) {
      openNew();
      navigation.setParams({ add: false });
    }
  }, [route?.params?.add, openNew, navigation]);

  const openEdit = (x) => {
    setError("");
    setForm({ _id: x._id, category: x.category, description: x.description, amount: String(x.amount), expenseDate: x.expenseDate.slice(0, 10), paymentMethod: x.paymentMethod, notes: x.notes || "", recurring: !!x.recurring, recurringId: x.recurringId, month: x.recurring ? rowMonth(x) : undefined });
  };

  const save = async () => {
    const problem = !form.description.trim() ? t("Fadlan sharax kharashka.") : descriptionError(form.description);
    if (problem) return setError(problem);
    if (!(Number(form.amount) > 0)) return setError(t("Lacagta waa inay ka weyn tahay 0."));
    if (!isValidDate(form.expenseDate)) return setError(t("Taariikhda u qor sida YYYY-MM-DD."));
    setError("");
    setSaving(true);
    try {
      const { _id, recurringId, month: rowMonthKey, ...rest } = form;
      const payload = { ...rest, amount: Number(rest.amount) };
      if (recurringId) {
        // Changes this month and every later one; earlier months keep what they had.
        await financeApi.put(`/expenses/recurring/${recurringId}`, { ...payload, month: rowMonthKey });
      } else if (_id) await financeApi.put(`/expenses/${_id}`, payload);
      else await financeApi.post("/expenses", payload);
      setForm(null);
      load();
    } catch (err) {
      setError(t(err.response?.data?.message || "Khalad ayaa dhacay."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleteTarget.recurring) await financeApi.delete(`/expenses/recurring/${deleteTarget.recurringId}`, { params: { month: rowMonth(deleteTarget) } });
    else await financeApi.delete(`/expenses/${deleteTarget._id}`);
    setDeleteTarget(null);
    load();
  };

  // One tap: every regular cost of this month becomes a monthly one from here on.
  const repeatThisMonth = () =>
    Alert.alert(t("Ka dhig bil kasta"), t("Dhammaan kharashyada bishan (marka laga reebo \"Kale\") ka dhig kuwo bil kasta ah, oo bilaha soo socda isla muuqda?"), [
      { text: t("Jooji"), style: "cancel" },
      {
        text: t("Haa"),
        onPress: async () => {
          try {
            await financeApi.post("/expenses/recurring/from-month", { month });
            load();
          } catch (err) {
            Alert.alert(t(err.response?.data?.message || "Khalad ayaa dhacay."));
          }
        },
      },
    ]);

  const canRepeatMonth = !allMonths && !!data && data.expenses.some((x) => !x.recurring && x.category !== "Kale");

  const editing = !!form?._id;
  // A category already stored but not in the preset list stays selectable while editing.
  const formCategories = form && !EXPENSE_CATEGORIES.includes(form.category) ? [form.category, ...EXPENSE_CATEGORIES] : EXPENSE_CATEGORIES;

  return (
    <View style={styles.flex}>
      <FinanceHeader title={t("Qarashaadka")} />

      <View style={styles.top}>
        <MonthNav period={month} onChange={setMonth} allActive={allMonths} onAll={() => setAllMonths((v) => !v)} />
      </View>

      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12 }}>
          <Chip label={t("Dhammaan")} active={category === ""} onPress={() => setCategory("")} />
          {EXPENSE_CATEGORIES.map((c) => (
            <Chip key={c} label={t(c)} active={category === c} onPress={() => setCategory(c)} />
          ))}
        </ScrollView>
      </View>

      {data === null ? (
        <Loading />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          <View style={styles.total}>
            <View>
              <Text style={styles.totalLabel}>{t("Wadarta Qarashaadka")}</Text>
              <Text style={styles.totalValue}>{formatMoney(data.total)}</Text>
            </View>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{data.expenses.length}</Text>
            </View>
          </View>

          {canRepeatMonth ? (
            <TouchableOpacity style={styles.repeatBtn} onPress={repeatThisMonth} activeOpacity={0.8}>
              <Icon name="repeat" size={17} color={COLORS.navy} />
              <Text style={styles.repeatText}>{t("Ka dhig bil kasta")}</Text>
            </TouchableOpacity>
          ) : null}

          {data.expenses.length === 0 ? (
            <EmptyState icon="receipt-outline" text={t("Kharash lama diiwaan gelin.")} />
          ) : (
            data.expenses.map((x) => (
              <ListRow
                key={x._id}
                left={
                  <View style={styles.catIcon}>
                    <Icon name={CATEGORY_ICON[x.category] || "pricetag"} size={19} color={COLORS.brand} />
                  </View>
                }
                title={x.description}
                subtitle={`${x.recurring ? "↻ " + t("Bil kasta") : formatDate(x.expenseDate)} · ${t(x.category)} · ${t(x.paymentMethod)}`}
                onPress={() => openEdit(x)}
              >
                <View style={{ alignItems: "flex-end", gap: 6 }}>
                  <Text style={styles.amount}>{formatMoney(x.amount)}</Text>
                  <TouchableOpacity onPress={() => setDeleteTarget(x)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Icon name="trash-outline" size={17} color={COLORS.danger} />
                  </TouchableOpacity>
                </View>
              </ListRow>
            ))
          )}
        </ScrollView>
      )}

      <Fab onPress={openNew} label={t("Kharash Cusub")} />

      <ScreenModal visible={!!form} title={editing ? t("Wax Ka Beddel Kharashka") : t("Kharash Cusub")} onClose={() => setForm(null)}>
        <ErrorText text={error} />
        {form && (
          <>
            <Text style={styles.label}>{t("Nooca *")}</Text>
            <ChipRow>
              {formCategories.map((c) => (
                <Chip key={c} label={t(c)} active={form.category === c} onPress={() => setForm({ ...form, category: c, ...(editing ? {} : { recurring: c !== "Kale" }) })} />
              ))}
            </ChipRow>
            {form.recurringId ? (
              <Text style={styles.note}>{t("Kharashkan waa bil kasta. Isbeddelku wuxuu khuseeyaa {month} iyo bilaha xiga; bilihii hore isma beddelayaan.", { month: monthLabel(form.month) })}</Text>
            ) : null}
            {!editing && form.category !== "Kale" ? (
              <Text style={styles.hint}>{t("Nooc kasta hal mar bishii ayaa la diiwaan gelin karaa. Haddii aad rabto inaad wax ka beddesho, liiska ka dooro oo Edit samee.")}</Text>
            ) : null}
            <Field label={t("Sharaxaad *")} value={form.description} onChangeText={(v) => setForm({ ...form, description: v })} placeholder={t("Tusaale: Biilka korontada")} />
            <Field label={t("Lacagta ($) *")} value={form.amount} onChangeText={(v) => setForm({ ...form, amount: v })} keyboardType="decimal-pad" />
            {!form.recurringId && (
              <Field label={t("Taariikhda (YYYY-MM-DD)")} value={form.expenseDate} onChangeText={(v) => setForm({ ...form, expenseDate: v })} autoCapitalize="none" />
            )}
            <Text style={styles.label}>{t("Habka Lacag Bixinta")}</Text>
            <ChipRow>
              {PAYMENT_METHODS.map((m) => (
                <Chip key={m} label={t(m)} active={form.paymentMethod === m} onPress={() => setForm({ ...form, paymentMethod: m })} />
              ))}
            </ChipRow>
            <Field label={t("Faallo (ikhtiyaari)")} value={form.notes} onChangeText={(v) => setForm({ ...form, notes: v })} />
            {form.category !== "Kale" && !form.recurringId ? (
              <TouchableOpacity style={styles.toggle} onPress={() => setForm({ ...form, recurring: !form.recurring })} activeOpacity={0.8}>
                <Icon name={form.recurring ? "checkbox" : "square-outline"} size={22} color={form.recurring ? COLORS.brand : COLORS.muted} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleTitle}>{t("Bil kasta (hal mar geli)")}</Text>
                  <Text style={styles.toggleHint}>{t("Bisha dooratay iyo bilaha xiga isla kharashkan ayaa si toos ah u muuqan doona. Bilihii hore waxba kuma darmaan.")}</Text>
                </View>
              </TouchableOpacity>
            ) : null}
            <PrimaryButton title={t("Kaydi")} onPress={save} loading={saving} />
          </>
        )}
      </ScreenModal>

      <ConfirmPasswordModal
        visible={!!deleteTarget}
        title={t("Tirtir Kharashka?")}
        message={
          deleteTarget?.recurring
            ? t("Kharashkan bil kasta ah ({description} — {amount}) wuu joogsanayaa {month} iyo wixii ka dambeeya. Bilihii hore waa sidooda.", { description: deleteTarget.description, amount: formatMoney(deleteTarget.amount), month: monthLabel(rowMonth(deleteTarget)) })
            : deleteTarget
              ? t("Waxaad tirtirayaa {voucher} ({description} — {amount}). Lama soo celin karo.", { voucher: deleteTarget.voucherNumber, description: deleteTarget.description, amount: formatMoney(deleteTarget.amount) })
              : ""
        }
        verify={verifyFinancePassword}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.paper },
  top: { paddingHorizontal: 16, paddingTop: 14 },
  total: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 16, marginBottom: 14, ...SHADOW.card },
  totalLabel: { fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 0.6 },
  totalValue: { fontSize: 26, fontWeight: "800", color: COLORS.danger, marginTop: 3 },
  countBadge: { minWidth: 36, height: 36, borderRadius: 18, paddingHorizontal: 10, backgroundColor: COLORS.navyTint, alignItems: "center", justifyContent: "center" },
  countText: { fontSize: 14, fontWeight: "800", color: COLORS.navy },
  catIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: COLORS.brandTint, alignItems: "center", justifyContent: "center" },
  amount: { fontSize: 15, fontWeight: "800", color: COLORS.ink },
  label: { fontSize: 12.5, color: COLORS.muted, fontWeight: "600", marginBottom: 8, marginTop: 14 },
  hint: { fontSize: 12, color: COLORS.muted, marginTop: 10 },
  note: { fontSize: 12.5, color: COLORS.navy, backgroundColor: COLORS.navyTint, borderRadius: RADIUS.md, padding: 10, marginTop: 10 },
  repeatBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 11, borderRadius: RADIUS.lg, backgroundColor: COLORS.navyTint, marginBottom: 14 },
  repeatText: { fontSize: 14, fontWeight: "700", color: COLORS.navy },
  toggle: { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: COLORS.navyTint, borderRadius: RADIUS.md, padding: 12, marginTop: 14 },
  toggleTitle: { fontSize: 14, fontWeight: "700", color: COLORS.ink },
  toggleHint: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
});

export default FinanceExpensesScreen;
