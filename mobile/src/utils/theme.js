import { Platform } from "react-native";

// Design tokens shared by every screen. COLORS is also re-exported from utils/format
// so existing imports keep working.
export const COLORS = {
  navy: "#2563EB", // the app's accent blue (kept under the old name so every screen picks it up)
  navyLight: "#3B82F6",
  navyDark: "#1D4ED8",
  amber: "#F59E0B",
  brand: "#2563EB",
  success: "#16A34A",
  danger: "#E11D48",
  paper: "#F5F7FB",
  surface: "#FFFFFF",
  ink: "#0F172A",
  line: "#E8EBF0",
  muted: "#64748B",
  faint: "#94A3B8",
  navyTint: "rgba(37,99,235,0.10)",
  successTint: "rgba(22,163,74,0.11)",
  dangerTint: "rgba(225,29,72,0.10)",
  amberTint: "rgba(245,158,11,0.14)",
  brandTint: "rgba(37,99,235,0.10)",
};

export const RADIUS = { sm: 10, md: 12, lg: 16, xl: 22, pill: 999 };

const shadow = (opacity, radius, y, elevation) =>
  Platform.select({
    android: { elevation },
    default: { shadowColor: "#0B1B33", shadowOpacity: opacity, shadowRadius: radius, shadowOffset: { width: 0, height: y } },
  });

export const SHADOW = {
  card: shadow(0.05, 10, 2, 1),
  raised: shadow(0.14, 16, 8, 5),
  top: Platform.select({
    android: { elevation: 10 },
    default: { shadowColor: "#0B1B33", shadowOpacity: 0.08, shadowRadius: 14, shadowOffset: { width: 0, height: -4 } },
  }),
};

// Initials-avatar colours: a stable pick per name.
const AVATARS = ["#2563EB", "#16A34A", "#EA580C", "#7C3AED", "#0E7490", "#E11D48", "#CA8A04"];
export const avatarColor = (name = "") => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATARS[h % AVATARS.length];
};
