import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Wallet, CheckCircle2, AlertCircle } from "lucide-react";
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

  if (error) return <p className="p-6 text-danger">{error}</p>;
  if (!data) return <p className="p-6 text-ink/50">Waa la soo shubayaa...</p>;

  const { parent, fees, payments } = data;
  const totalFee = fees.reduce((s, f) => s + f.totalAmount, 0);
  const totalPaid = fees.reduce((s, f) => s + f.totalPaid, 0);
  const totalBalance = fees.reduce((s, f) => s + f.balance, 0);

  return (
    <div className="min-h-screen bg-paper">
      <header className="bg-surface border-b border-line px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-lg">Taysir Foundation</h1>
          <p className="text-xs text-ink/50">Salaan, {parent.fullName}</p>
        </div>
        <button onClick={handleLogout} className="text-sm text-danger hover:underline">Ka Bax</button>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard label="Wadarta Lacagta" value={formatMoney(totalFee)} icon={Wallet} iconBg="bg-navy/10" iconColor="text-navy" />
          <StatCard label="La Bixiyey" value={formatMoney(totalPaid)} accent="text-success" icon={CheckCircle2} iconBg="bg-success/10" iconColor="text-success" />
          <StatCard label="Ku Dhiman" value={formatMoney(totalBalance)} accent="text-danger" icon={AlertCircle} iconBg="bg-danger/10" iconColor="text-danger" />
        </div>

        <div className="card overflow-x-auto">
          <h3 className="font-serif text-lg mb-3">Sanad Dugsiyeedka</h3>
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
          <h3 className="font-serif text-lg mb-3">Taariikhda Lacag Bixinta</h3>
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
