import { Fragment, useEffect, useState, useMemo } from "react";
import { Wallet, CheckCircle2, AlertCircle, ChevronDown, ChevronRight, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import api from "../../api/axios";
import { formatMoney, statusLabel, statusBadgeClass } from "../../utils/format";
import { downloadExcel } from "../../utils/excel";
import { t } from "../../i18n";

const parseIdNum = (parentCode) => parseInt((parentCode || "").replace(/\D/g, ""), 10) || 0;

const SORT_GETTERS = {
  id: (p) => parseIdNum(p.parentCode),
  totalFees: (p) => p.totalFees,
  totalPaid: (p) => p.totalPaid,
  totalDebt: (p) => p.totalDebt,
};

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

const SortableTh = ({ sortKey: key, activeKey, dir, onClick, align, children }) => (
  <th className={align === "right" ? "text-end" : ""}>
    <button
      onClick={() => onClick(key)}
      className={`flex items-center gap-1 text-inherit hover:text-ink ${align === "right" ? "ms-auto" : ""}`}
    >
      {children}
      {activeKey === key ? (
        dir === "asc" ? <ArrowUp size={13} /> : <ArrowDown size={13} />
      ) : (
        <ArrowUpDown size={13} className="text-ink/30" />
      )}
    </button>
  </th>
);

const ParentsSummaryReport = () => {
  const [data, setData] = useState({ parents: [], totals: { totalFees: 0, totalPaid: 0, totalDebt: 0 } });
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");

  useEffect(() => {
    api.get("/reports/parents-summary").then((res) => setData(res.data));
  }, []);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const filtered = useMemo(() => {
    const rows = data.parents.filter(
      (p) =>
        p.fullName.toLowerCase().includes(search.toLowerCase()) ||
        p.phone.toLowerCase().includes(search.toLowerCase()) ||
        p.parentCode.toLowerCase().includes(search.toLowerCase())
    );
    if (!sortKey) return rows;
    const getValue = SORT_GETTERS[sortKey];
    return [...rows].sort((a, b) => (sortDir === "asc" ? getValue(a) - getValue(b) : getValue(b) - getValue(a)));
  }, [data.parents, search, sortKey, sortDir]);

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
        <h2 className="text-2xl font-bold tracking-tight">{t("Wadarta Lacagta Waalidiinta — Dhammaan Sannadaha")}</h2>
        <button onClick={handleExport} className="btn-secondary text-sm">{t("⬇ Soo Deji Excel")}</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label={t("Wadarta Lacagta School-ka")} value={formatMoney(data.totals.totalFees)} icon={Wallet} iconBg="bg-navy/10" iconColor="text-navy" />
        <StatCard label={t("Wadarta La Bixiyey")} value={formatMoney(data.totals.totalPaid)} accent="text-success" icon={CheckCircle2} iconBg="bg-success/10" iconColor="text-success" />
        <StatCard label={t("Wadarta Ku Dhiman")} value={formatMoney(data.totals.totalDebt)} accent="text-danger" icon={AlertCircle} iconBg="bg-danger/10" iconColor="text-danger" />
      </div>

      <input
        className="input-field max-w-xs"
        placeholder={t("Raadi magaca, phone ama ID...")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th></th>
              <SortableTh sortKey="id" activeKey={sortKey} dir={sortDir} onClick={toggleSort}>ID</SortableTh>
              <th>{t("Magaca Waalidka")}</th>
              <th>{t("Phone")}</th>
              <th className="text-end">{t("Sannadaha")}</th>
              <SortableTh sortKey="totalFees" activeKey={sortKey} dir={sortDir} onClick={toggleSort} align="right">{t("Wadarta Fee")}</SortableTh>
              <SortableTh sortKey="totalPaid" activeKey={sortKey} dir={sortDir} onClick={toggleSort} align="right">{t("La Bixiyey")}</SortableTh>
              <SortableTh sortKey="totalDebt" activeKey={sortKey} dir={sortDir} onClick={toggleSort} align="right">{t("Ku Dhiman")}</SortableTh>
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
                      {p.yearsCount > 0 && (isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} className="rtl:rotate-180" />)}
                    </td>
                    <td>{p.parentCode}</td>
                    <td className="font-medium">{p.fullName}</td>
                    <td>{p.phone}</td>
                    <td className="text-end">{p.yearsCount}</td>
                    <td className="text-end">{formatMoney(p.totalFees)}</td>
                    <td className="text-end text-success">{formatMoney(p.totalPaid)}</td>
                    <td className="text-end text-danger">{formatMoney(p.totalDebt)}</td>
                  </tr>
                  {isOpen && p.years.length > 0 && (
                    <tr>
                      <td colSpan={8} className="bg-paper p-0">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-ink/50">
                              <th className="text-start font-normal py-2 ps-10">{t("Sanad Dugsiyeed")}</th>
                              <th className="text-end font-normal py-2">{t("Wadarta Fee")}</th>
                              <th className="text-end font-normal py-2">{t("La Bixiyey")}</th>
                              <th className="text-end font-normal py-2">{t("Ku Dhiman")}</th>
                              <th className="text-end font-normal py-2 pe-4">{t("Status")}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {p.years.map((y) => (
                              <tr key={y.academicYearId} className="border-t border-line/60">
                                <td className="py-2 ps-10">{y.academicYear}</td>
                                <td className="text-end py-2">{formatMoney(y.totalAmount)}</td>
                                <td className="text-end py-2 text-success">{formatMoney(y.totalPaid)}</td>
                                <td className="text-end py-2 text-danger">{formatMoney(y.balance)}</td>
                                <td className="text-end py-2 pe-4">
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
              <tr><td colSpan={8} className="text-center text-ink/40 py-6">{t("Waalid lama helin.")}</td></tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <td className="font-medium py-3" colSpan={5}>{t("Wadarta Guud")}</td>
              <td className="text-end font-medium py-3">{formatMoney(data.totals.totalFees)}</td>
              <td className="text-end font-medium py-3 text-success">{formatMoney(data.totals.totalPaid)}</td>
              <td className="text-end font-medium py-3 text-danger">{formatMoney(data.totals.totalDebt)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default ParentsSummaryReport;
