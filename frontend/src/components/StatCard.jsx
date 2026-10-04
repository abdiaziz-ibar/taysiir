const StatCard = ({ label, value, icon: Icon, iconBg, iconColor, accent }) => (
  <div className="card">
    <div className="flex items-center justify-between mb-2">
      <p className="text-xs uppercase tracking-wide text-ink/50">{label}</p>
      {Icon && (
        <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${iconBg || "bg-navy/10"}`}>
          <Icon size={16} className={iconColor || "text-navy"} />
        </span>
      )}
    </div>
    <p className={`text-xl font-serif ${accent || ""}`}>{value}</p>
  </div>
);

export default StatCard;
