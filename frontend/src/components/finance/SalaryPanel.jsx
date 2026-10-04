import { useEffect, useState } from "react";
import { Download, Wallet, CheckCircle2, AlertCircle } from "lucide-react";
import api, { verifyFinancePassword } from "../../api/financeAxios";
import ConfirmDeleteModal from "../ConfirmDeleteModal";
import StatCard from "../StatCard";
import { formatMoney, formatDate, statusLabel, statusBadgeClass } from "../../utils/format";
import { downloadExcel } from "../../utils/excel";
import { EMPLOYEE_TYPES, PAYMENT_METHODS, monthLabel, todayISO } from "../../utils/finance";
import { t } from "../../i18n";

// Records the month's salary payment, or (when `payment` is given) edits the one already recorded:
// each employee gets one payment per month.
const PayModal = ({ row, payment, period, onClose, onSaved }) => {
  const editing = !!payment;
  const [amount, setAmount] = useState(editing ? String(payment.amount) : row.balance > 0 ? String(row.balance) : "");
  const [paymentDate, setPaymentDate] = useState(editing ? payment.paymentDate.slice(0, 10) : todayISO());
  const [paymentMethod, setPaymentMethod] = useState(editing ? payment.paymentMethod : "Cash");
  const [notes, setNotes] = useState(editing ? payment.notes || "" : "");
  const [allowOverpayment, setAllowOverpayment] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const body = { amount: Number(amount), paymentDate, paymentMethod, notes, allowOverpayment };
      if (editing) await api.put(`/salaries/${payment._id}`, body);
      else await api.post("/salaries", { ...body, employeeId: row.employee._id, period });
      onSaved();
    } catch (err) {
      setError(t(err.response?.data?.message || "Khalad ayaa dhacay."));
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <form onSubmit={submit} className="card max-w-md w-full space-y-4" onClick={(e) => e.stopPropagation()}>
        <div>
          <h3 className="font-serif text-lg">{editing ? t("Wax Ka Beddel Mushaharka") : t("Bixi Mushaharka")}</h3>
          <p className="text-sm text-ink/60 mt-0.5">
            {row.employee.fullName} · {monthLabel(period)}
          </p>
          <p className="text-xs text-ink/50 mt-1">
            {t("Mushahar")} {formatMoney(row.monthlySalary)} {t("· La bixiyey")} {formatMoney(row.totalPaid)} {t("· Ku dhiman")}{" "}
            <span className="text-danger">{formatMoney(row.balance)}</span>
          </p>
        </div>

        {error && <div className="bg-danger/10 text-danger text-sm rounded-md px-3 py-2">{error}</div>}

        <div>
          <label className="label-field">{t("Lacagta ($) *")}</label>
          <input required autoFocus type="number" min="0.01" step="0.01" className="input-field" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-field">{t("Taariikhda")}</label>
            <input type="date" className="input-field" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
          </div>
          <div>
            <label className="label-field">{t("Habka")}</label>
            <select className="input-field" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>{t(m)}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="label-field">{t("Faallo (ikhtiyaari)")}</label>
          <input className="input-field" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-sm text-ink/70">
          <input type="checkbox" checked={allowOverpayment} onChange={(e) => setAllowOverpayment(e.target.checked)} />
          {t("Ogolow in ka badato mushaharka (tusaale bonus)")}
        </label>

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" className="btn-secondary text-sm" onClick={onClose} disabled={saving}>{t("Jooji")}</button>
          <button className="btn-primary text-sm" disabled={saving}>{saving ? t("Waa la kaydinayaa...") : editing ? t("Kaydi") : t("Bixi")}</button>
        </div>
      </form>
    </div>
  );
};

// The payroll sheet for one month, shown inside the Qarashaadka page when the
// "Mushaharka (Shaqaalaha)" category is chosen. The month comes from the page.
const SalaryPanel = ({ period, refreshKey }) => {
  const [data, setData] = useState(null);
  const [type, setType] = useState(""); // "" = Macalin + Shaqaale
  const [payTarget, setPayTarget] = useState(null); // { row, payment? }
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = () => api.get("/salaries/summary", { params: { period } }).then((res) => setData(res.data));

  useEffect(() => {
    setData(null);
    load();
  }, [period, refreshKey]);

  const rows = (data?.rows || []).filter((r) => !type || r.employee.type === type);
  const totals = {
    salary: rows.reduce((s, r) => s + r.monthlySalary, 0),
    paid: rows.reduce((s, r) => s + r.totalPaid, 0),
    balance: rows.reduce((s, r) => s + r.balance, 0),
  };

  const payments = rows
    .flatMap((r) => r.payments.map((p) => ({ ...p, employee: r.employee })))
    .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));

  const handleDelete = async () => {
    await api.delete(`/salaries/${deleteTarget._id}`);
    setDeleteTarget(null);
    load();
  };

  const exportExcel = () => {
    const headers = ["ID", "Magaca", "Nooca", "Shaqada", "Mushahar", "La Bixiyey", "Ku Dhiman", "Xaalad"];
    const sheet = rows.map((r) => [
      r.employee.employeeId,
      r.employee.fullName,
      EMPLOYEE_TYPES[r.employee.type],
      r.employee.position || "",
      r.monthlySalary,
      r.totalPaid,
      r.balance,
      r.status,
    ]);
    downloadExcel(`mushaharka-${period}.xlsx`, headers, sheet);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          {[["", "Dhammaan"], ["teacher", "Macalimiin"], ["staff", "Shaqaale"]].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setType(value)}
              className={`px-4 py-1.5 rounded-full text-sm border ${type === value ? "bg-navy text-white border-navy" : "bg-surface text-ink border-line hover:bg-paper"}`}
            >
              {t(label)}
            </button>
          ))}
        </div>
        <button className="btn-secondary text-sm inline-flex items-center gap-1.5" onClick={exportExcel} disabled={!data || rows.length === 0}>
          <Download size={15} /> Excel
        </button>
      </div>

      {!data ? (
        <p className="text-ink/50">{t("Waa la soo shubayaa...")}</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label={t("Wadarta Mushaharka")} value={formatMoney(totals.salary)} icon={Wallet} />
            <StatCard label={t("La Bixiyey")} value={formatMoney(totals.paid)} accent="text-success" icon={CheckCircle2} iconBg="bg-success/10" iconColor="text-success" />
            <StatCard label={t("Ku Dhiman")} value={formatMoney(totals.balance)} accent="text-danger" icon={AlertCircle} iconBg="bg-danger/10" iconColor="text-danger" />
          </div>

          <div className="card overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>{t("Magaca")}</th>
                  <th>{t("Nooca")}</th>
                  <th className="text-end">{t("Mushahar")}</th>
                  <th className="text-end">{t("La Bixiyey")}</th>
                  <th className="text-end">{t("Ku Dhiman")}</th>
                  <th>{t("Xaalad")}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.employee._id}>
                    <td className="text-ink/60">{r.employee.employeeId}</td>
                    <td>
                      <span className="font-medium">{r.employee.fullName}</span>
                      {r.employee.position && <span className="block text-xs text-ink/50">{r.employee.position}</span>}
                    </td>
                    <td>{EMPLOYEE_TYPES[r.employee.type]}</td>
                    <td className="text-end">{formatMoney(r.monthlySalary)}</td>
                    <td className="text-end text-success">{formatMoney(r.totalPaid)}</td>
                    <td className="text-end text-danger">{formatMoney(r.balance)}</td>
                    <td><span className={statusBadgeClass(r.status)}>{statusLabel(r.status)}</span></td>
                    <td className="text-end">
                      {r.payments.length === 0 ? (
                        <button className="btn-primary !px-4 !py-1.5 text-sm" onClick={() => setPayTarget({ row: r })}>{t("Bixi")}</button>
                      ) : (
                        <button className="btn-secondary !px-4 !py-1.5 text-sm" onClick={() => setPayTarget({ row: r, payment: r.payments[0] })}>{t("Edit")}</button>
                      )}
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={8} className="text-center text-ink/40 py-6">{t("Shaqaale Active ah ma jiro. Ku dar tab-ka \"Shaqaalaha\".")}</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="card overflow-x-auto">
            <h3 className="font-serif text-lg mb-3">{t("Mushaharka La Bixiyey Bishan")}</h3>
            <table className="table-base">
              <thead>
                <tr>
                  <th>{t("Voucher")}</th>
                  <th>{t("Shaqaalaha")}</th>
                  <th>{t("Taariikh")}</th>
                  <th>{t("Habka")}</th>
                  <th>{t("Faallo")}</th>
                  <th className="text-end">{t("Lacag")}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p._id}>
                    <td className="text-ink/60">{p.voucherNumber}</td>
                    <td>{p.employee.fullName}</td>
                    <td>{formatDate(p.paymentDate)}</td>
                    <td>{t(p.paymentMethod)}</td>
                    <td className="text-ink/60">{p.notes || "-"}</td>
                    <td className="text-end font-medium">{formatMoney(p.amount)}</td>
                    <td className="text-end whitespace-nowrap">
                      <button
                        onClick={() => setPayTarget({ row: rows.find((r) => r.employee._id === p.employee._id), payment: p })}
                        className="text-sm text-link hover:underline me-3"
                      >
                        {t("Edit")}
                      </button>
                      <button onClick={() => setDeleteTarget(p)} className="text-sm text-danger hover:underline">{t("Tirtir")}</button>
                    </td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr><td colSpan={7} className="text-center text-ink/40 py-6">{t("Bishan weli mushahar lama bixin.")}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {payTarget && (
        <PayModal
          row={payTarget.row}
          payment={payTarget.payment}
          period={period}
          onClose={() => setPayTarget(null)}
          onSaved={() => {
            setPayTarget(null);
            load();
          }}
        />
      )}

      <ConfirmDeleteModal
        open={!!deleteTarget}
        title={t("Tirtir Mushaharka La Bixiyey?")}
        message={deleteTarget ? t("Waxaad tirtirayaa {voucher} ({amount} — {name}). Ku dhimanka shaqaalahan ayaa dib u kordhi doona.", { voucher: deleteTarget.voucherNumber, amount: formatMoney(deleteTarget.amount), name: deleteTarget.employee.fullName }) : ""}
        verify={verifyFinancePassword}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default SalaryPanel;
