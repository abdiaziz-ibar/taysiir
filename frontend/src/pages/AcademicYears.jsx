import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAcademicYear } from "../context/AcademicYearContext";

const AcademicYears = () => {
  const { refreshYears } = useAcademicYear();
  const [years, setYears] = useState([]);
  const [startYear, setStartYear] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    const res = await api.get("/academic-years");
    setYears(res.data);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/academic-years", { startYear: Number(startYear) });
      setStartYear("");
      load();
      refreshYears();
    } catch (err) {
      setError(err.response?.data?.message || "Khalad ayaa dhacay.");
    }
  };

  const handleActivate = async (id) => {
    await api.put(`/academic-years/${id}/activate`);
    load();
    refreshYears();
  };

  const handleDeactivate = async (id) => {
    await api.put(`/academic-years/${id}/deactivate`);
    load();
    refreshYears();
  };

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-serif">Sanad Dugsiyeedka (Academic Years)</h2>

      <form onSubmit={handleCreate} className="card flex items-end gap-3">
        {error && <div className="bg-danger/10 text-danger text-sm rounded-md px-3 py-2">{error}</div>}
        <div>
          <label className="label-field">Sanadka Bilowga (e.g. 2026)</label>
          <input type="number" required className="input-field" value={startYear} onChange={(e) => setStartYear(e.target.value)} />
        </div>
        <button className="btn-primary">+ Samee Sanad Dugsiyeed</button>
      </form>

      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr><th>Sanad</th><th>Bilowga</th><th>Dhammaadka</th><th>Xaalad</th><th></th></tr>
          </thead>
          <tbody>
            {years.map((y) => (
              <tr key={y._id}>
                <td>{y.name}</td>
                <td>{y.startMonth}</td>
                <td>{y.endMonth}</td>
                <td>{y.isActive ? <span className="badge badge-paid">Firfircoon</span> : <span className="text-ink/40">Aan firfircoon</span>}</td>
                <td className="text-right">
                  {y.isActive ? (
                    <button onClick={() => handleDeactivate(y._id)} className="text-sm text-danger hover:underline">Deactivate</button>
                  ) : (
                    <button onClick={() => handleActivate(y._id)} className="text-sm text-navy hover:underline">Activate</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AcademicYears;
