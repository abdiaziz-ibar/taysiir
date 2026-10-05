import { I18nManager } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../utils/theme";

const MIRROR = { "chevron-forward": "chevron-back", "chevron-back": "chevron-forward", "arrow-forward": "arrow-back", "arrow-back": "arrow-forward" };

// Vector icon (Ionicons). Direction-bound icons are mirrored in right-to-left layouts.
const Icon = ({ name, size = 20, color = COLORS.ink, style }) => (
  <Ionicons name={I18nManager.isRTL && MIRROR[name] ? MIRROR[name] : name} size={size} color={color} style={style} />
);

export default Icon;
