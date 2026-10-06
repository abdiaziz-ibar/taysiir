import { useMemo } from "react";

// A figure card: a tinted icon tile beside the label, the big number, and an optional small `footer`.
// `tone` picks the icon colour (pink = orange, purple = violet, blue, teal = green).
const TONES = {
  pink: { tile: "bg-orange-50", icon: "text-orange-500" },
  purple: { tile: "bg-violet-50", icon: "text-violet-600" },
  blue: { tile: "bg-blue-50", icon: "text-blue-600" },
  teal: { tile: "bg-emerald-50", icon: "text-emerald-600" },
  navy: { tile: "bg-slate-100", icon: "text-slate-600" },
};

const StatCard = ({ label, value, icon: Icon, iconBg, iconColor, accent, tone, footer }) => {
  const look = useMemo(() => (tone ? TONES[tone] || TONES.navy : { tile: iconBg || "bg-slate-100", icon: iconColor || "text-slate-600" }), [tone, iconBg, iconColor]);
  return (
    <div className="card !p-4">
      <div className="flex items-center gap-2.5">
        {Icon && (
          <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${look.tile}`}>
            <Icon size={17} className={look.icon} />
          </span>
        )}
        <p className="text-sm text-ink/60 leading-tight">{label}</p>
      </div>
      <p className={`text-2xl font-bold mt-3 tracking-tight ${accent || "text-ink"}`}>{value}</p>
      {footer && <p className="text-xs text-ink/55 mt-1.5">{footer}</p>}
    </div>
  );
};

export default StatCard;
