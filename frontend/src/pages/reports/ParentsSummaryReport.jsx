import { Fragment, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Wallet, CheckCircle2, AlertCircle, ChevronDown, ChevronRight } from "lucide-react";
import api from "../../api/axios";
import { formatMoney, statusLabel, statusBadgeClass } from "../../utils/format";
import { downloadExcel } from "../../utils/excel";

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

const ParentsSummaryReport = () => {
  const [data, setData] = useState({ parents: [], totals: { totalFees: 0, totalPaid: 0, totalDebt: 0 } });
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    api.get("/reports/parents-summary").then((res) => setData(res.data));
  }, []);

  const filtered = data.parents.filter(
    (p) =>
      p.fullName.toLowerCase().includes(search.toLowerCase()) ||
      p.phone.toLowerCase().includes(search.toLowerCase()) ||
      p.parentCode.toLowerCase().includes(search.toLowerCase())
  );

  const handleExport = () => {
    const headers = ["ID", "Magaca Waalidka", "Phone", "Tirada Sannadaha", "Wadarta Fee", "La Bixiyey", "Ku Dhiman"];
    const rows = filtered.map((p) => [p.parentCode, p.fullName, p.phone, p.yearsCount, p.totalFees, p.totalPaid, p.totalDebt]);
    rows.push(["", "Wadarta Guud", "", "", data.totals.totalFees, data.totals.totalPaid, data.totals.totalDebt]);
    const today = new Date().toISOString().slice(0, 10);
    downloadExcel(`waalidiinta-wadarta-${today}.xlsx`, headers, rows);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-serif">Wadarta Lacagta Waalidiinta — Dhammaan Sannadaha</h2>
        <button onClick={handleExport} className="btn-secondary text-sm">⬇ Soo Deji Excel</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Wadarta Lacagta School-ka" value={formatMoney(data.totals.totalFees)} icon={Wallet} iconBg="bg-navy/10" iconColor="text-navy" />
        <StatCard label="Wadarta La Bixiyey" value={formatMoney(data.totals.totalPaid)} accent="text-success" icon={CheckCircle2} iconBg="bg-success/10" iconColor="text-success" />
        <StatCard label="Wadarta Ku Dhiman" value={formatMoney(data.totals.totalDebt)} accent="text-danger" icon={AlertCircle} iconBg="bg-danger/10" iconColor="text-danger" />
      </div>

      <input
        className="input-field max-w-xs"
        placeholder="Raadi magaca, phone ama ID..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th></th>
              <th>ID</th>
              <th>Magaca Waalidka</th>
              <th>Phone</th>
              <th className="text-right">Sannadaha</th>
              <th className="text-right">Wadarta Fee</th>
              <th className="text-right">La Bixiyey</th>
              <th className="text-right">Ku Dhiman</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const isOpen = expandedId === p.parentId;
              return (
                <Fragment key={p.parentId}>
                  <tr
                    className="cursor-pointer hover:bg-paper"
                    onClick={() => setExpandedId(isOpen ? null : p.parentId)}
                  >
                    <td className="w-6 text-ink/40">
                      {p.yearsCount > 0 && (isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />)}
                    </td>
                    <td>{p.parentCode}</td>
                    <td>
                      <Link
                        to={`/parents/${p.parentId}`}
                        className="text-link hover:underline font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {p.fullName}
                      </Link>
                    </td>
                    <td>{p.phone}</td>
                    <td className="text-right">{p.yearsCount}</td>
                    <td className="text-right">{formatMoney(p.totalFees)}</td>
                    <td className="text-right text-success">{formatMoney(p.totalPaid)}</td>
                    <td className="text-right text-danger">{formatMoney(p.totalDebt)}</td>
                  </tr>
                  {isOpen && p.years.length > 0 && (
                    <tr>
                      <td colSpan={8} className="bg-paper p-0">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-ink/50">
                              <th className="text-left font-normal py-2 pl-10">Sanad Dugsiyeed</th>
                              <th className="text-right font-normal py-2">Wadarta Fee</th>
                              <th className="text-right font-normal py-2">La Bixiyey</th>
                              <th className="text-right font-normal py-2">Ku Dhiman</th>
                              <th className="text-right font-normal py-2 pr-4">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {p.years.map((y) => (
                              <tr key={y.academicYearId} className="border-t border-line/60">
                                <td className="py-2 pl-10">{y.academicYear}</td>
                                <td className="text-right py-2">{formatMoney(y.totalAmount)}</td>
                                <td className="text-right py-2 text-success">{formatMoney(y.totalPaid)}</td>
                                <td className="text-right py-2 text-danger">{formatMoney(y.balance)}</td>
                                <td className="text-right py-2 pr-4">
                                  <span className={statusBadgeClass(y.status)}>{statusLabel(y.status)}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="text-center text-ink/40 py-6">Waalid lama helin.</td></tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <td className="font-medium py-3" colSpan={5}>Wadarta Guud</td>
              <td className="text-right font-medium py-3">{formatMoney(data.totals.totalFees)}</td>
              <td className="text-right font-medium py-3 text-success">{formatMoney(data.totals.totalPaid)}</td>
              <td className="text-right font-medium py-3 text-danger">{formatMoney(data.totals.totalDebt)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default ParentsSummaryReport;
