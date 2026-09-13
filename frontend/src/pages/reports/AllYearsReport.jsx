import { useEffect, useState } from "react";
import api from "../../api/axios";
import { formatMoney } from "../../utils/format";

const AllYearsReport = () => {
  const [data, setData] = useState({ years: [], totals: { totalFees: 0, totalPaid: 0, totalDebt: 0 } });

  useEffect(() => {
    api.get("/reports/all-years").then((res) => setData(res.data));
  }, []);

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-serif">Dhammaan Sannadaha — Lacagta Guud</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-xs uppercase tracking-wide text-ink/50">Wadarta Lacagta School-ka</p>
          <p className="text-2xl font-serif mt-1">{formatMoney(data.totals.totalFees)}</p>
        </div>
        <div className="card">
          <p className="text-xs uppercase tracking-wide text-ink/50">Wadarta La Bixiyey</p>
          <p className="text-2xl font-serif mt-1 text-success">{formatMoney(data.totals.totalPaid)}</p>
        </div>
        <div className="card">
          <p className="text-xs uppercase tracking-wide text-ink/50">Wadarta Ku Dhiman</p>
          <p className="text-2xl font-serif mt-1 text-danger">{formatMoney(data.totals.totalDebt)}</p>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th>Sanad Dugsiyeed</th>
              <th className="text-right">Waalidiinta</th>
              <th className="text-right">Wadarta Fee</th>
              <th className="text-right">La Bixiyey</th>
              <th className="text-right">Ku Dhiman</th>
              <th className="text-right">Collection Rate</th>
            </tr>
          </thead>
          <tbody>
            {data.years.map((y) => (
              <tr key={y.academicYearId}>
                <td>
                  {y.academicYear}
                  {y.isActive && <span className="badge badge-paid ml-2">Firfircoon</span>}
                </td>
                <td className="text-right">{y.totalParents}</td>
                <td className="text-right">{formatMoney(y.totalFees)}</td>
                <td className="text-right text-success">{formatMoney(y.totalPaid)}</td>
                <td className="text-right text-danger">{formatMoney(y.totalDebt)}</td>
                <td className="text-right">{y.collectionRate}%</td>
              </tr>
            ))}
            {data.years.length === 0 && (
              <tr><td colSpan={6} className="text-center text-ink/40 py-6">Sanad Dugsiyeed lama helin.</td></tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <td className="font-medium py-3">Wadarta Guud</td>
              <td></td>
              <td className="text-right font-medium py-3">{formatMoney(data.totals.totalFees)}</td>
              <td className="text-right font-medium py-3 text-success">{formatMoney(data.totals.totalPaid)}</td>
              <td className="text-right font-medium py-3 text-danger">{formatMoney(data.totals.totalDebt)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default AllYearsReport;
