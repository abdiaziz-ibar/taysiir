import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Wallet, CheckCircle2, AlertCircle, GraduationCap, Receipt } from "lucide-react";
import parentApi from "../../api/parentAxios";
import { formatMoney, formatDate, statusLabel, statusBadgeClass } from "../../utils/format";

const StatCard = ({ label, value, icon: Icon, iconBg, iconColor, accent }) => (
  <div className="card">
    <div className="flex items-center justify-between mb-2">
      <p className="text-xs uppercase tracking-wide text-ink/50">{label}</p>
      <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}>
        <Icon size={16} className={iconColor} />
      </span>
    </div>
    <p className={`text-2xl font-serif ${accent || ""}`}>{value}</p>
  </div>
);

const ParentPortalDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    parentApi
      .get("/parent-portal/me")
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || "Khalad ayaa dhacay."));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("parentToken");
    localStorage.removeItem("parent");
    navigate("/portal/login");
  };

  if (error) return <p className="min-h-screen flex items-center justify-center text-danger">{error}</p>;
  if (!data) return <p className="min-h-screen flex items-center justify-center text-ink/50">Waa la soo shubayaa...</p>;

  const { parent, fees, payments } = data;
  const totalFee = fees.reduce((s, f) => s + f.totalAmount, 0);
  const totalPaid = fees.reduce((s, f) => s + f.totalPaid, 0);
  const totalBalance = fees.reduce((s, f) => s + f.balance, 0);
  const paidPct = totalFee > 0 ? Math.min(100, Math.round((totalPaid / totalFee) * 100)) : 0;

  return (
    <div className="min-h-screen bg-paper">
      <header className="bg-navy-dark px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center text-white font-serif font-bold text-sm shrink-0 shadow-sm">
            TF
          </div>
          <div>
            <h1 className="font-serif text-lg text-white leading-tight">Taysir Foundation</h1>
            <p className="text-white/50 text-xs mt-0.5">Xisaabta Waalidka</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-white/80 border border-white/20 rounded-full px-4 py-1.5 hover:bg-white/10 hover:text-white transition-colors"
        >
          Ka Bax
        </button>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="card bg-gradient-to-br from-navy to-navy-light text-white border-0">
          <p className="text-white/60 text-sm">Salaan,</p>
          <h2 className="font-serif text-2xl mb-4">{parent.fullName}</h2>
          <div className="w-full bg-white/15 rounded-full h-2 overflow-hidden">
            <div className="bg-white h-full rounded-full transition-all" style={{ width: `${paidPct}%` }} />
          </div>
          <p className="text-white/70 text-xs mt-2">{paidPct}% ee lacagta guud ayaa la bixiyey</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard label="Wadarta Lacagta" value={formatMoney(totalFee)} icon={Wallet} iconBg="bg-navy/10" iconColor="text-navy" />
          <StatCard label="La Bixiyey" value={formatMoney(totalPaid)} accent="text-success" icon={CheckCircle2} iconBg="bg-success/10" iconColor="text-success" />
          <StatCard label="Ku Dhiman" value={formatMoney(totalBalance)} accent="text-danger" icon={AlertCircle} iconBg="bg-danger/10" iconColor="text-danger" />
        </div>

        <div className="card overflow-x-auto">
          <h3 className="font-serif text-lg mb-3 flex items-center gap-2">
            <GraduationCap size={18} className="text-navy" />
            Sanad Dugsiyeedka
          </h3>
          <table className="table-base">
            <thead>
              <tr>
                <th>Sanad Dugsiyeed</th>
                <th className="text-right">Total Fee</th>
                <th className="text-right">La Bixiyey</th>
                <th className="text-right">Ku Dhiman</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {fees.map((f) => (
                <tr key={f._id}>
                  <td>{f.academicYearId?.name}</td>
                  <td className="text-right">{formatMoney(f.totalAmount)}</td>
                  <td className="text-right">{formatMoney(f.totalPaid)}</td>
                  <td className="text-right">{formatMoney(f.balance)}</td>
                  <td><span className={statusBadgeClass(f.status)}>{statusLabel(f.status)}</span></td>
                </tr>
              ))}
              {fees.length === 0 && (
                <tr><td colSpan={5} className="text-center text-ink/40 py-4">Weli Fee lama dhigin.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card overflow-x-auto">
          <h3 className="font-serif text-lg mb-3 flex items-center gap-2">
            <Receipt size={18} className="text-navy" />
            Taariikhda Lacag Bixinta
          </h3>
          <table className="table-base">
            <thead>
              <tr>
                <th>Receipt</th>
                <th>Taariikh</th>
                <th>Sanad Dugsiyeed</th>
                <th className="text-right">Lacag</th>
                <th>Habka Lacagta</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p._id}>
                  <td>{p.receiptNumber}</td>
                  <td>{formatDate(p.paymentDate)}</td>
                  <td>{p.academicYearId?.name}</td>
                  <td className="text-right">{formatMoney(p.amount)}</td>
                  <td>{p.paymentMethod}</td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr><td colSpan={5} className="text-center text-ink/40 py-4">Weli lacag lama bixin.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default ParentPortalDashboard;
