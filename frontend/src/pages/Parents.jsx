import { useEffect, useState, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useAcademicYear } from "../context/AcademicYearContext";
import { formatMoney, statusLabel, statusBadgeClass } from "../utils/format";
import { downloadExcel, parseExcelFile } from "../utils/excel";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";

const emptyForm = { fullName: "", phone: "", alternativePhone: "", address: "", email: "", notes: "", academicYearId: "", totalAmount: "" };

const IMPORT_HEADERS = ["Magaca Waalidka", "Phone", "Alternative Phone", "Address", "Email", "Notes", "Total Fee"];
const IMPORT_KEYS = ["fullName", "phone", "alternativePhone", "address", "email", "notes", "totalAmount"];

const Parents = () => {
  const { user } = useAuth();
  const { selectedYearId, years } = useAcademicYear();
  const selectedYearName = years.find((y) => y._id === selectedYearId)?.name;
  const [parents, setParents] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [idSortDir, setIdSortDir] = useState(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef();
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const load = async () => {
    const res = await api.get("/parents", {
      params: { search, status, sort, academicYearId: selectedYearId },
    });
    setParents(res.data);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYearId, search, status, sort]);

  const handleDownloadTemplate = () => {
    downloadExcel("waalidiinta-template.xlsx", IMPORT_HEADERS, [
      ["Cali Xasan", "615111222", "", "Muqdisho", "cali@example.com", "", "100"],
    ]);
  };

  const handleFileSelected = async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;

    setImportResult(null);
    setImporting(true);
    try {
      const table = await parseExcelFile(file);
      if (table.length < 2) {
        setImportResult({ created: 0, errors: [{ row: 1, name: "", message: "Faylka waa madhan yahay ama qaab khalad ah ayuu leeyahay." }] });
        return;
      }

      const headerRow = table[0].map((h) => h.trim());
      const colIndex = IMPORT_HEADERS.map((h) => headerRow.findIndex((c) => c.toLowerCase() === h.toLowerCase()));

      const rows = table.slice(1).map((cells) => {
        const row = {};
        IMPORT_KEYS.forEach((key, i) => {
          const idx = colIndex[i];
          row[key] = idx >= 0 ? (cells[idx] || "").trim() : "";
        });
        return row;
      });

      const res = await api.post("/parents/bulk-import", { rows, academicYearId: selectedYearId });
      setImportResult(res.data);
      load();
    } catch (err) {
      setImportResult({ created: 0, errors: [{ row: "-", name: "", message: err.response?.data?.message || "Khalad ayaa dhacay." }] });
    } finally {
      setImporting(false);
    }
  };

  const toggleIdSort = () => {
    setIdSortDir((d) => (d === "asc" ? "desc" : "asc"));
  };

  const displayedParents = useMemo(() => {
    if (!idSortDir) return parents;
    const parseIdNum = (parentId) => parseInt((parentId || "").replace(/\D/g, ""), 10) || 0;
    return [...parents].sort((a, b) =>
      idSortDir === "asc" ? parseIdNum(a.parentId) - parseIdNum(b.parentId) : parseIdNum(b.parentId) - parseIdNum(a.parentId)
    );
  }, [parents, idSortDir]);

  const handleDelete = async () => {
    await api.delete(`/parents/${deleteTarget._id}`);
    setDeleteTarget(null);
    load();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const { academicYearId, totalAmount, ...parentFields } = form;
      const res = await api.post("/parents", parentFields);
      const totalAmountNum = Number(totalAmount);
      if (academicYearId && totalAmountNum > 0) {
        await api.post("/fees", { parentId: res.data._id, academicYearId, totalAmount: totalAmountNum });
      }
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Khalad ayaa dhacay.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-serif">Waalidiinta</h2>
          <p className="text-xs text-ink/50 mt-0.5">
            Lacagta hoos ku qoran waa tii sanadka <span className="font-medium">{selectedYearName || "la doortay"}</span> kaliya.
            Si aad u aragto wadarta dhammaan sannadaha, eeg <Link to="/reports/parents-summary" className="text-link hover:underline">Wadarta Waalidiinta</Link>.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button className="btn-secondary text-sm" onClick={handleDownloadTemplate}>⬇ Template</button>
          <button className="btn-secondary text-sm" onClick={() => fileInputRef.current.click()} disabled={importing}>
            {importing ? "Waa la geliyaa..." : "⬆ Upload Excel"}
          </button>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileSelected} />
          <button
            className="btn-primary"
            onClick={() => {
              if (!showForm) setForm((f) => ({ ...f, academicYearId: f.academicYearId || selectedYearId || "" }));
              setShowForm((v) => !v);
            }}
          >
            {showForm ? "Jooji" : "+ Waalid Cusub"}
          </button>
        </div>
      </div>

      {importResult && (
        <div className={`card ${importResult.errors.length > 0 ? "border-amber" : "border-success"}`}>
          <div className="flex items-center justify-between mb-2">
            <p className="font-medium">
              {importResult.created} waalid ayaa si guul leh loo daray
              {importResult.errors.length > 0 ? `, ${importResult.errors.length} saf ayaa la booday` : ""}.
            </p>
            <button className="text-sm text-ink/50 hover:text-ink" onClick={() => setImportResult(null)}>✕</button>
          </div>
          {importResult.errors.length > 0 && (
            <ul className="text-sm text-danger space-y-1">
              {importResult.errors.map((e, i) => (
                <li key={i}>Saf {e.row} {e.name ? `(${e.name})` : ""}: {e.message}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="card grid grid-cols-1 md:grid-cols-2 gap-4">
          {error && <div className="md:col-span-2 bg-danger/10 text-danger text-sm rounded-md px-3 py-2">{error}</div>}
          <div>
            <label className="label-field">Magaca Waalidka</label>
            <input className="input-field" required value={form.fullName} placeholder="Enter full name" onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </div>
          <div>
            <label className="label-field">Phone Number</label>
            <input className="input-field" required value={form.phone} placeholder="Enter phone number" onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="label-field">Alternative Phone</label>
            <input className="input-field" value={form.alternativePhone} placeholder="Enter alternative phone number" onChange={(e) => setForm({ ...form, alternativePhone: e.target.value })} />
          </div>
          <div>
            <label className="label-field">Address</label>
            <input className="input-field" required value={form.address} placeholder="Enter address" onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div>
            <label className="label-field">Email (ikhtiyaari)</label>
            <input className="input-field" value={form.email} placeholder="Enter email" onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="md:col-span-2 border-t border-line pt-4">
            <p className="text-sm text-ink/60 mb-3">Ikhtiyaari: hadda ku dar lacagta uu waalidkan ku leeyahay sanad dugsiyeedkan, si aadan mar dambe ugu noqon.</p>
          </div>
          <div>
            <label className="label-field">Sanad Dugsiyeedka</label>
            <select className="input-field" value={form.academicYearId} onChange={(e) => setForm({ ...form, academicYearId: e.target.value })}>
              <option value="">-- Ha dooran --</option>
              {years.map((y) => (
                <option key={y._id} value={y._id}>{y.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-field">Wadarta Fee</label>
            <input type="number" min="0" step="0.01" className="input-field" value={form.totalAmount} placeholder="Tusaale: 100" onChange={(e) => setForm({ ...form, totalAmount: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <label className="label-field">Notes</label>
            <textarea className="input-field" rows={2} value={form.notes} placeholder="Enter notes" onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <button className="btn-primary" disabled={saving}>{saving ? "Waa la kaydinayaa..." : "Kaydi Waalidka"}</button>
          </div>
        </form>
      )}

      <div className="flex flex-wrap gap-3">
        <input
          className="input-field max-w-xs"
          placeholder="Raadi magaca ama phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="input-field !w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Dhammaan Status</option>
          <option value="paid">Paid</option>
          <option value="partial">Partial</option>
          <option value="unpaid">Unpaid</option>
        </select>
        <select className="input-field !w-auto" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="">Kala Sooc</option>
          <option value="name">Magaca</option>
          <option value="balance_desc">Deynta ugu badan</option>
          <option value="balance_asc">Deynta ugu yar</option>
          <option value="date">Taariikhda</option>
        </select>
      </div>

      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th>
                <button
                  onClick={toggleIdSort}
                  className="flex items-center gap-1 text-inherit hover:text-ink"
                  title="Kala sooc ID-ga (low to high / high to low)"
                >
                  ID
                  {idSortDir === "asc" && <ArrowUp size={13} />}
                  {idSortDir === "desc" && <ArrowDown size={13} />}
                  {!idSortDir && <ArrowUpDown size={13} className="text-ink/30" />}
                </button>
              </th>
              <th>Magaca Waalidka</th>
              <th>Phone</th>
              <th className="text-right">Total Fee ({selectedYearName || "-"})</th>
              <th className="text-right">La Bixiyey ({selectedYearName || "-"})</th>
              <th className="text-right">Ku Dhiman ({selectedYearName || "-"})</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {displayedParents.map((p) => (
              <tr key={p._id}>
                <td>{p.parentId}</td>
                <td>
                  <Link to={`/parents/${p._id}`} className="text-link hover:underline font-medium">
                    {p.fullName}
                  </Link>
                </td>
                <td>{p.phone}</td>
                <td className="text-right">{formatMoney(p.totalFee)}</td>
                <td className="text-right">{formatMoney(p.totalPaid)}</td>
                <td className="text-right">{formatMoney(p.balance)}</td>
                <td><span className={statusBadgeClass(p.feeStatus)}>{statusLabel(p.feeStatus)}</span></td>
                <td className="text-right whitespace-nowrap">
                  <Link to={`/parents/${p._id}?edit=1`} className="text-sm text-link hover:underline mr-3">Edit</Link>
                  {user?.role === "admin" && (
                    <button onClick={() => setDeleteTarget(p)} className="text-sm text-danger hover:underline">Tirtir</button>
                  )}
                </td>
              </tr>
            ))}
            {displayedParents.length === 0 && (
              <tr><td colSpan={8} className="text-center text-ink/40 py-6">Waalid lama helin.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDeleteModal
        open={!!deleteTarget}
        title="Tirtir Waalidka?"
        message={deleteTarget ? `Waxaad tirtirayaa ${deleteTarget.fullName}. Tan waxay sidoo kale tirtiraysaa dhammaan Fee-yadiisa iyo Lacag-bixinnadiisa oo dhan — lama soo celin karo.` : ""}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default Parents;
