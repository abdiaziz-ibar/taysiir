import { Platform } from "react-native";

// Design tokens shared by every screen. COLORS is also re-exported from utils/format
// so existing imports keep working.
export const COLORS = {
  navy: "#1F3A5F",
  navyLight: "#2E5386",
  navyDark: "#152943",
  amber: "#C98A2C",
  brand: "#C2410C",
  success: "#2F7A4D",
  danger: "#B3402A",
  paper: "#F4F5F8",
  surface: "#FFFFFF",
  ink: "#111827",
  line: "#E8EAEF",
  muted: "#6B7280",
  faint: "#9CA3AF",
  navyTint: "rgba(31,58,95,0.09)",
  successTint: "rgba(47,122,77,0.11)",
  dangerTint: "rgba(179,64,42,0.10)",
  amberTint: "rgba(201,138,44,0.14)",
  brandTint: "rgba(194,65,12,0.10)",
};

export const RADIUS = { sm: 10, md: 14, lg: 18, xl: 26, pill: 999 };

const shadow = (opacity, radius, y, elevation) =>
  Platform.select({
    android: { elevation },
    default: { shadowColor: "#0B1B33", shadowOpacity: opacity, shadowRadius: radius, shadowOffset: { width: 0, height: y } },
  });

export const SHADOW = {
  card: shadow(0.07, 12, 4, 2),
  raised: shadow(0.14, 16, 8, 5),
  top: Platform.select({
    android: { elevation: 10 },
    default: { shadowColor: "#0B1B33", shadowOpacity: 0.08, shadowRadius: 14, shadowOffset: { width: 0, height: -4 } },
  }),
};

// Initials-avatar colours: a stable pick per name.
const AVATARS = ["#1F3A5F", "#2F7A4D", "#C2410C", "#7C3AED", "#0E7490", "#B3402A", "#A16207"];
export const avatarColor = (name = "") => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATARS[h % AVATARS.length];
};
