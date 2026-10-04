import { Globe } from "lucide-react";
import { LANGS, getLang, setLang } from "./index";

// Compact language picker (Soomaali · English · العربية) used in every header and on the login page.
// `light` is for dark backgrounds (the parent portal header).
const LanguageSwitcher = ({ light = false, className = "" }) => (
  <label className={`inline-flex items-center gap-1.5 text-sm ${light ? "text-white/80" : "text-ink/70"} ${className}`}>
    <Globe size={15} className="shrink-0" />
    <select
      aria-label="Language"
      className={`bg-transparent border rounded-full px-2.5 py-1 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-navy-light ${
        light ? "border-white/20 text-white" : "border-line text-ink"
      }`}
      value={getLang()}
      onChange={(e) => setLang(e.target.value)}
    >
      {LANGS.map((l) => (
        <option key={l.code} value={l.code} className="text-ink">
          {l.label}
        </option>
      ))}
    </select>
  </label>
);

export default LanguageSwitcher;
