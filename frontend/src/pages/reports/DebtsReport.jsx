import { useEffect, useState } from "react";
import api from "../../api/axios";
import { useAcademicYear } from "../../context/AcademicYearContext";
import { formatMoney, statusLabel, statusBadgeClass } from "../../utils/format";
import { downloadExcel } from "../../utils/excel";

const DebtsReport = () => {
  const { selectedYearId, years } = useAcademicYear();
  const [data, setData] = useState({ totalDebt: 0, debts: [] });
  const yearName = years.find((y) => y._id === selectedYearId)?.name;

  useEffect(() => {
    if (!selectedYearId) return;
    api.get("/reports/debts", { params: { academicYearId: selectedYearId } }).then((res) => setData(res.data));
  }, [selectedYearId]);

  const handlePrint = () => window.print();

  const handleExport = () => {
    const headers = ["Waalid", "Phone", "Academic Year", "Total Fee", "Paid", "Balance", "Status"];
    const rows = data.debts.map((f) => [
      f.parentId?.fullName,
      f.parentId?.phone,
      f.academicYearId?.name,
      f.totalAmount,
      f.totalPaid,
      f.balance,
      statusLabel(f.status),
    ]);
    rows.push(["", "", "", "", "", data.totalDebt, "Wadarta Deynta"]);
    const today = new Date().toISOString().slice(0, 10);
    downloadExcel(`warbixinta-deymaha-${yearName || today}.xlsx`, headers, rows);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-serif">Warbixinta Deymaha {yearName ? `— ${yearName}` : ""}</h2>
        <div className="flex gap-3 print:hidden">
          <button onClick={handleExport} className="btn-secondary">⬇ Soo Deji Excel</button>
          <button onClick={handlePrint} className="btn-secondary">Print</button>
        </div>
      </div>

      <div className="card overflow-x-auto print:overflow-visible print:border-0 print:shadow-none print:p-0">
        <table className="table-base">
          <thead>
            <tr>
              <th>Waalid</th>
              <th>Phone</th>
              <th>Academic Year</th>
              <th className="text-right">Total Fee</th>
              <th className="text-right">Paid</th>
              <th className="text-right">Balance</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.debts.map((f) => (
              <tr key={f._id}>
                <td>{f.parentId?.fullName}</td>
                <td>{f.parentId?.phone}</td>
                <td>{f.academicYearId?.name}</td>
                <td className="text-right">{formatMoney(f.totalAmount)}</td>
                <td className="text-right">{formatMoney(f.totalPaid)}</td>
                <td className="text-right">{formatMoney(f.balance)}</td>
                <td><span className={statusBadgeClass(f.status)}>{statusLabel(f.status)}</span></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={5} className="text-right font-medium py-3">Wadarta Deynta:</td>
              <td className="text-right font-medium py-3">{formatMoney(data.totalDebt)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default DebtsReport;
