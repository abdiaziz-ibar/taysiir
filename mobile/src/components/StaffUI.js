import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { useStaff } from "../context/StaffContext";
import { COLORS, RADIUS, SHADOW, avatarColor } from "../utils/theme";
import { formatMoney } from "../utils/format";
import LanguageButton from "../i18n/LanguageButton";
import Icon from "./Icon";
import { t } from "../i18n";

// ---------------------------------------------------------------- header

export const IconButton = ({ name, onPress, style, color = "#fff", size = 20, label }) => (
  <TouchableOpacity onPress={onPress} accessibilityLabel={label} activeOpacity={0.7} style={[styles.iconBtn, style]}>
    <Icon name={name} size={size} color={color} />
  </TouchableOpacity>
);

// The one header every screen uses: brand gradient, rounded bottom edge, safe-area aware.
export const AppHeader = ({ title, subtitle, onBack, actions, children }) => {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient
      colors={[COLORS.navyDark, COLORS.navy]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.header, { paddingTop: insets.top + 14 }]}
    >
      <View style={styles.decoA} pointerEvents="none" />
      <View style={styles.decoB} pointerEvents="none" />
      <View style={styles.headerRow}>
        {onBack ? <IconButton name="chevron-back" onPress={onBack} label="Back" style={{ marginEnd: 12 }} /> : null}
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.headerSub} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {actions ? <View style={styles.headerActions}>{actions}</View> : null}
      </View>
      {children}
    </LinearGradient>
  );
};

export const StaffHeader = ({ title }) => {
  const { staff, staffLogout } = useAuth();
  return (
    <AppHeader
      title={title}
      subtitle={staff?.fullName}
      actions={
        <>
          <LanguageButton light />
          <IconButton name="log-out-outline" onPress={staffLogout} label="Log out" />
        </>
      }
    />
  );
};

export const ScreenHeader = ({ title, onBack, right }) => <AppHeader title={title} onBack={onBack} actions={right} />;

// ---------------------------------------------------------------- filters / chips

export const YearChips = () => {
  const { years, selectedYearId, setSelectedYearId } = useStaff();
  return (
    <View style={styles.chipsWrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
        {years.map((y) => (
          <Chip key={y._id} label={`${y.name}${y.isActive ? " •" : ""}`} active={selectedYearId === y._id} onPress={() => setSelectedYearId(y._id)} />
        ))}
      </ScrollView>
    </View>
  );
};

export const Chip = ({ label, active, onPress }) => (
  <TouchableOpacity style={[styles.chip, active && styles.chipActive]} onPress={onPress} activeOpacity={0.8}>
    <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
  </TouchableOpacity>
);

export const ChipRow = ({ children }) => <View style={styles.chipRow}>{children}</View>;

// Two-to-four way switch ("Dhammaan | Macalimiin | Shaqaale") — clearer than a row of loose chips.
export const Segmented = ({ options, value, onChange }) => (
  <View style={styles.seg}>
    {options.map((o) => {
      const active = value === o.value;
      return (
        <TouchableOpacity key={o.value} style={[styles.segItem, active && styles.segItemActive]} onPress={() => onChange(o.value)} activeOpacity={0.8}>
          <Text style={[styles.segText, active && styles.segTextActive]} numberOfLines={1}>
            {o.label}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

export const Badge = ({ text, color }) => (
  <View style={[styles.badge, { backgroundColor: `${color}1A` }]}>
    <Text style={[styles.badgeText, { color }]}>{text}</Text>
  </View>
);

// ---------------------------------------------------------------- forms

export const ScreenModal = ({ visible, title, onClose, children }) => (
  <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: COLORS.paper }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <AppHeader title={title} actions={<IconButton name="close" onPress={onClose} label="Close" />} />
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  </Modal>
);

export const Field = ({ label, style, onFocus, onBlur, ...props }) => {
  const [focused, setFocused] = useState(false);
  return (
    <View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={[styles.input, focused && styles.inputFocused, style]}
        placeholderTextColor={COLORS.faint}
        onFocus={(e) => {
          setFocused(true);
          onFocus && onFocus(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur && onBlur(e);
        }}
        {...props}
      />
    </View>
  );
};

export const SearchBar = ({ value, onChangeText, placeholder, style }) => (
  <View style={[styles.search, style]}>
    <Icon name="search" size={18} color={COLORS.faint} />
    <TextInput
      style={styles.searchInput}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={COLORS.faint}
    />
    {value ? (
      <TouchableOpacity onPress={() => onChangeText("")}>
        <Icon name="close-circle" size={18} color={COLORS.faint} />
      </TouchableOpacity>
    ) : null}
  </View>
);

export const PrimaryButton = ({ title, onPress, loading, disabled, color }) => (
  <TouchableOpacity
    style={[styles.primaryBtn, color && { backgroundColor: color }, (disabled || loading) && { opacity: 0.6 }]}
    onPress={onPress}
    disabled={disabled || loading}
    activeOpacity={0.85}
  >
    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>{title}</Text>}
  </TouchableOpacity>
);

export const ErrorText = ({ text }) =>
  text ? (
    <View style={[styles.notice, { backgroundColor: COLORS.dangerTint }]}>
      <Icon name="alert-circle" size={18} color={COLORS.danger} />
      <Text style={[styles.noticeText, { color: COLORS.danger }]}>{text}</Text>
    </View>
  ) : null;

export const SuccessText = ({ text }) =>
  text ? (
    <View style={[styles.notice, { backgroundColor: COLORS.successTint }]}>
      <Icon name="checkmark-circle" size={18} color={COLORS.success} />
      <Text style={[styles.noticeText, { color: COLORS.success }]}>{text}</Text>
    </View>
  ) : null;

// ---------------------------------------------------------------- content blocks

export const Card = ({ children, style }) => <View style={[styles.card, style]}>{children}</View>;

export const SectionTitle = ({ children, action, onAction }) => (
  <View style={styles.sectionRow}>
    <Text style={styles.sectionTitle}>{children}</Text>
    {action ? (
      <TouchableOpacity onPress={onAction}>
        <Text style={styles.sectionAction}>{action}</Text>
      </TouchableOpacity>
    ) : null}
  </View>
);

export const InfoRow = ({ label, value }) =>
  value ? (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  ) : null;

// Big number tile with a tinted icon (dashboard grids).
export const StatTile = ({ icon, label, value, color = COLORS.navy }) => (
  <View style={styles.tile}>
    <View style={[styles.tileIcon, { backgroundColor: `${color}1A` }]}>
      <Icon name={icon} size={18} color={color} />
    </View>
    <Text style={styles.tileValue} numberOfLines={1} adjustsFontSizeToFit>
      {value}
    </Text>
    <Text style={styles.tileLabel} numberOfLines={1}>
      {label}
    </Text>
  </View>
);

export const Avatar = ({ name = "", size = 44 }) => {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const color = avatarColor(name);
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: `${color}1F`, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color, fontWeight: "700", fontSize: size * 0.36 }}>{initials || "?"}</Text>
    </View>
  );
};

export const EmptyState = ({ icon = "file-tray-outline", title, text, compact }) => (
  <View style={[styles.empty, compact && { paddingVertical: 16 }]}>
    <View style={styles.emptyIcon}>
      <Icon name={icon} size={30} color={COLORS.faint} />
    </View>
    {title ? <Text style={styles.emptyTitle}>{title}</Text> : null}
    {text ? <Text style={styles.emptyText}>{text}</Text> : null}
  </View>
);

// Standard list row: leading visual (avatar/icon), two text lines, trailing content.
export const ListRow = ({ left, title, subtitle, children, onPress, style }) => {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper style={[styles.listRow, style]} onPress={onPress} activeOpacity={0.75}>
      {left}
      <View style={{ flex: 1 }}>
        <Text style={styles.listTitle} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.listSub} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {children}
    </Wrapper>
  );
};

// Floating "add" button for list screens.
export const Fab = ({ onPress, icon = "add", label }) => (
  <TouchableOpacity style={styles.fab} onPress={onPress} activeOpacity={0.9} accessibilityLabel={label}>
    <Icon name={icon} size={28} color="#fff" />
  </TouchableOpacity>
);

export const Loading = () => (
  <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 40 }}>
    <ActivityIndicator color={COLORS.navy} size="large" />
  </View>
);

export const MonthBars = ({ data, valueKey, color }) => {
  const max = Math.max(1, ...data.map((d) => d[valueKey] || 0));
  return (
    <View>
      {data.map((d) => (
        <View key={d.month} style={styles.barRow}>
          <Text style={styles.barMonth}>{t(d.month)}</Text>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${((d[valueKey] || 0) / max) * 100}%`, backgroundColor: color || COLORS.navy }]} />
          </View>
          <Text style={styles.barValue}>{formatMoney(d[valueKey] || 0)}</Text>
        </View>
      ))}
    </View>
  );
};

export const feeStatusColor = (s) => (s === "paid" ? COLORS.success : s === "partial" ? COLORS.amber : COLORS.danger);
export const feeStatusText = (s) => (s === "paid" ? t("Paid") : s === "partial" ? t("Partial") : t("Unpaid"));

const styles = StyleSheet.create({
  // header
  header: {
    paddingHorizontal: 18,
    paddingBottom: 20,
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
    overflow: "hidden",
  },
  decoA: { position: "absolute", top: -60, end: -40, width: 170, height: 170, borderRadius: 85, backgroundColor: "rgba(255,255,255,0.06)" },
  decoB: { position: "absolute", bottom: -70, start: -50, width: 150, height: 150, borderRadius: 75, backgroundColor: "rgba(255,255,255,0.04)" },
  headerRow: { flexDirection: "row", alignItems: "center" },
  headerTitle: { color: "#fff", fontSize: 21, fontWeight: "800", letterSpacing: 0.2 },
  headerSub: { color: "rgba(255,255,255,0.65)", fontSize: 13, marginTop: 2 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.14)", alignItems: "center", justifyContent: "center" },

  // segmented control
  seg: { flexDirection: "row", backgroundColor: "#E7EAF0", borderRadius: RADIUS.md, padding: 4 },
  segItem: { flex: 1, paddingVertical: 9, borderRadius: 11, alignItems: "center" },
  segItemActive: { backgroundColor: COLORS.surface, ...SHADOW.card },
  segText: { fontSize: 13, fontWeight: "600", color: COLORS.muted },
  segTextActive: { color: COLORS.navy, fontWeight: "800" },

  // chips
  chipsWrap: { paddingTop: 14, paddingBottom: 4 },
  chip: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 15,
    paddingVertical: 9,
    marginEnd: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  chipActive: { backgroundColor: COLORS.navy, borderColor: COLORS.navy },
  chipText: { fontSize: 13, color: COLORS.ink, fontWeight: "500" },
  chipTextActive: { color: "#fff", fontWeight: "700" },
  chipRow: { flexDirection: "row", flexWrap: "wrap" },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.pill, alignSelf: "flex-start" },
  badgeText: { fontSize: 11, fontWeight: "700" },

  // forms
  label: { fontSize: 12.5, color: COLORS.muted, fontWeight: "600", marginBottom: 6, marginTop: 14 },
  input: {
    borderWidth: 1.2,
    borderColor: COLORS.line,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "web" ? 12 : 11,
    fontSize: 15,
    color: COLORS.ink,
    backgroundColor: COLORS.surface,
  },
  inputFocused: { borderColor: COLORS.navy, backgroundColor: "#fff" },
  search: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    borderWidth: 1.2,
    borderColor: COLORS.line,
    ...SHADOW.card,
  },
  searchInput: { flex: 1, paddingVertical: Platform.OS === "web" ? 12 : 10, fontSize: 15, color: COLORS.ink },
  primaryBtn: {
    backgroundColor: COLORS.brand,
    borderRadius: RADIUS.md,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    ...SHADOW.raised,
  },
  primaryBtnText: { color: "#fff", fontWeight: "800", fontSize: 16, letterSpacing: 0.2 },
  notice: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: RADIUS.md, marginBottom: 12 },
  noticeText: { flex: 1, fontSize: 13, fontWeight: "500" },

  // blocks
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.line,
    ...SHADOW.card,
  },
  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8, marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: COLORS.ink },
  sectionAction: { fontSize: 13, color: COLORS.brand, fontWeight: "700" },
  infoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 9, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.line },
  infoLabel: { color: COLORS.muted, fontSize: 13 },
  infoValue: { color: COLORS.ink, fontSize: 13, fontWeight: "600", flex: 1, textAlign: "right", marginStart: 12 },
  tile: {
    width: "48.4%",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.line,
    ...SHADOW.card,
  },
  tileIcon: { width: 34, height: 34, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  tileValue: { fontSize: 22, fontWeight: "800", color: COLORS.ink },
  tileLabel: { fontSize: 12, color: COLORS.muted, marginTop: 2, fontWeight: "500" },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.line,
    ...SHADOW.card,
  },
  listTitle: { fontSize: 15, fontWeight: "700", color: COLORS.ink },
  listSub: { fontSize: 12, color: COLORS.muted, marginTop: 3 },
  fab: { position: "absolute", end: 20, bottom: 22, width: 58, height: 58, borderRadius: 29, backgroundColor: COLORS.brand, alignItems: "center", justifyContent: "center", ...SHADOW.raised },
  empty: { alignItems: "center", paddingVertical: 40, paddingHorizontal: 24 },
  emptyIcon: { width: 68, height: 68, borderRadius: 34, backgroundColor: COLORS.navyTint, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: COLORS.ink, marginBottom: 4 },
  emptyText: { fontSize: 13, color: COLORS.muted, textAlign: "center" },
  barRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  barMonth: { width: 78, fontSize: 12, color: COLORS.muted },
  barTrack: { flex: 1, height: 10, backgroundColor: COLORS.paper, borderRadius: 5, overflow: "hidden" },
  barFill: { height: 10, borderRadius: 5 },
  barValue: { width: 74, textAlign: "right", fontSize: 12, fontWeight: "600", color: COLORS.ink },
});
