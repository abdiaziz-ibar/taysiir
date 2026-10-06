import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { GraduationCap, Users, Receipt, Wallet, AlertCircle, ChevronRight } from "lucide-react";
import api from "../../api/financeAxios";
import MonthBar from "../../components/finance/MonthBar";
import StatCard from "../../components/StatCard";
import { formatMoney } from "../../utils/format";
import { currentMonth, monthLabel } from "../../utils/finance";
import { t } from "../../i18n";

const pct = (paid, due) => (due > 0 ? Math.min(100, Math.round((paid / due) * 100)) : 0);

const Progress = ({ label, icon: Icon, group }) => (
  <div>
    <div className="flex items-center justify-between text-sm mb-1.5">
      <span className="inline-flex items-center gap-2 font-medium"><Icon size={15} className="text-navy" /> {label}</span>
      <span className="text-ink/60">{formatMoney(group.paid)} / {formatMoney(group.due)}</span>
    </div>
    <div className="h-2 rounded-full bg-line overflow-hidden">
      <div className="h-full bg-success rounded-full" style={{ width: `${pct(group.paid, group.due)}%` }} />
    </div>
    <p className="text-xs text-ink/50 mt-1">
      {t("{paid} ka mid ah {count} la bixiyey", { paid: group.paidCount, count: group.count })}
      {group.remaining > 0 && <span className="text-danger font-medium"> · {t("Dhiman: {amount}", { amount: formatMoney(group.remaining) })}</span>}
    </p>
  </div>
);

const SectionCard = ({ title, to, linkLabel, children }) => (
  <div className="card">
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-serif text-lg">{title}</h3>
      <Link to={to} className="text-sm text-link hover:underline inline-flex items-center gap-0.5">
        {linkLabel} <ChevronRight size={14} className="rtl:rotate-180" />
      </Link>
    </div>
    {children}
  </div>
);

// One page that tracks every part of the finance section for a month: salaries (teachers and
// staff), other expenses, what is paid / unpaid, and the school year at a glance.
const Dashboard = () => {
  const [month, setMonth] = useState(currentMonth());
  const [m, setM] = useState(null);
  const [year, setYear] = useState(null);
  const [unpaid, setUnpaid] = useState(null);
  const [paidCats, setPaidCats] = useState(null);
  const [knownCats, setKnownCats] = useState([]); // regular categories used so far

  // The school year (Sep → Aug) the month belongs to.
  const startYear = (() => {
    const [y, mo] = month.split("-").map(Number);
    return mo >= 9 ? y : y - 1;
  })();

  useEffect(() => {
    setM(null);
    setUnpaid(null);
    setPaidCats(null);
    api.get("/finance/month", { params: { period: month } }).then((res) => setM(res.data));
    api.get("/salaries/summary", { params: { period: month } }).then((res) => setUnpaid(res.data.rows.filter((r) => r.status !== "paid")));
    api.get("/expenses", { params: { month } }).then((res) => {
      setPaidCats(res.data.expenses);
      setKnownCats(res.data.known.map((k) => k.category));
    });
  }, [month]);

  useEffect(() => {
    setYear(null);
    api.get("/finance/year", { params: { startYear } }).then((res) => setYear(res.data));
  }, [startYear]);

  const regular = knownCats;
  const paidRegular = paidCats ? regular.filter((c) => paidCats.some((x) => x.category.toLowerCase() === c.toLowerCase())) : [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold tracking-tight">{t("Dashboard")} — {monthLabel(month)}</h2>
        <MonthBar month={month} onChange={setMonth} />
      </div>

      {!m ? (
        <p className="text-ink/50">{t("Waa la soo shubayaa...")}</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard tone="purple" label={t("Wadarta Bisha Baxday")} value={formatMoney(m.totals.paid)} icon={Wallet} footer={t("Mushaharka + qarashaadka")} />
            <StatCard tone="teal" label={t("Mushaharka La Bixiyey")} value={formatMoney(m.teachers.paid + m.staff.paid)} icon={GraduationCap} footer={t("Mushaharka: {amount}", { amount: formatMoney(m.totals.salaryDue) })} />
            <StatCard tone="blue" label={t("Qarashaadka")} value={formatMoney(m.expenses.total)} icon={Receipt} footer={t("{count} kharash", { count: m.expenses.count })} />
            <StatCard
              tone="pink"
              label={t("Mushahar Dhiman")}
              value={formatMoney(m.totals.salaryRemaining)}
              icon={AlertCircle}
              footer={t("Qarashaad lama bixin: {count} nooc", { count: m.expenses.unpaid.count })}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <SectionCard title={t("Mushaharka")} to="/finance/salaries" linkLabel={t("Fur Mushaharka")}>
              <div className="space-y-4">
                <Progress label={t("Macalimiinta")} icon={GraduationCap} group={m.teachers} />
                <Progress label={t("Shaqaale")} icon={Users} group={m.staff} />
              </div>
              {unpaid && unpaid.length > 0 && (
                <div className="mt-4 pt-3 border-t border-line">
                  <p className="text-xs uppercase tracking-wide text-ink/50 mb-2">{t("Weli lama bixin")}</p>
                  <div className="divide-y divide-line">
                    {unpaid.slice(0, 5).map((r) => (
                      <div key={r.employee._id} className="flex items-center justify-between py-1.5 text-sm">
                        <span>{r.employee.fullName} <span className="text-xs text-ink/50">· {r.employee.type === "teacher" ? t("Macalin") : t("Shaqaale")}</span></span>
                        <span className="text-danger font-medium">{formatMoney(r.balance)}</span>
                      </div>
                    ))}
                    {unpaid.length > 5 && <p className="text-xs text-ink/50 pt-2">+{unpaid.length - 5} {t("kale")}</p>}
                  </div>
                </div>
              )}
            </SectionCard>

            <SectionCard title={t("Qarashaadka")} to="/finance/expenses" linkLabel={t("Fur Qarashaadka")}>
              <p className="text-sm text-ink/60 mb-3">
                {t("{paid} ka mid ah {count} noocyood ayaa la bixiyey", { paid: paidRegular.length, count: regular.length })}
              </p>
              {m.expenses.byCategory.length === 0 ? (
                <p className="text-sm text-ink/40">{t("Kharash lama diiwaan gelin.")}</p>
              ) : (
                <div className="divide-y divide-line">
                  {m.expenses.byCategory.slice(0, 6).map((c) => (
                    <div key={c.category} className="flex justify-between py-1.5 text-sm">
                      <span>{t(c.category)}</span>
                      <span className="font-medium">{formatMoney(c.total)}</span>
                    </div>
                  ))}
                </div>
              )}
              {paidCats && regular.length - paidRegular.length > 0 && (
                <p className="text-xs text-danger mt-3">
                  {t("Lama bixin")}: {regular.filter((c) => !paidRegular.includes(c)).map((c) => t(c)).join(", ")}
                </p>
              )}
            </SectionCard>
          </div>

          <SectionCard title={`${t("Sanadka")} ${year ? year.schoolYear : ""}`} to="/finance/total" linkLabel={t("Wadarta Guud")}>
            {!year ? (
              <p className="text-ink/50">{t("Waa la soo shubayaa...")}</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={year.months.map((x) => ({ month: x.month, salaries: x.salaryPaid, expenses: x.expenses, unpaid: x.unpaid }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E3E8EC" />
                  <XAxis dataKey="month" tickFormatter={(v) => t(v)} tick={{ fontSize: 12, fill: "#6B7280" }} />
                  <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} />
                  <Tooltip labelFormatter={(l) => t(l)} formatter={(v) => formatMoney(v)} contentStyle={{ background: "#FFFFFF", border: "1px solid #E3E8EC", borderRadius: 6, color: "#14181F" }} cursor={{ fill: "#F5F5F4" }} />
                  <Legend />
                  <Bar isAnimationActive={false} dataKey="salaries" stackId="paid" name={t("Mushaharka")} fill="#2563EB" />
                  <Bar isAnimationActive={false} dataKey="expenses" stackId="paid" name={t("Qarashaadka")} fill="#10B981" radius={[3, 3, 0, 0]} />
                  <Bar isAnimationActive={false} dataKey="unpaid" name={t("Lama Bixin")} fill="#F43F5E" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </SectionCard>
        </>
      )}
    </div>
  );
};

export default Dashboard;
