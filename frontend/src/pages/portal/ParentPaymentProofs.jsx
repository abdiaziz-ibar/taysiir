import { useEffect, useRef, useState } from "react";
import { Receipt, Paperclip, Send, ChevronDown, ChevronRight } from "lucide-react";
import parentApi from "../../api/parentAxios";
import { formatMoney, formatDate } from "../../utils/format";

const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

const statusBadge = (status) => (status === "confirmed" ? "badge badge-paid" : "badge badge-partial");
const statusLabel = (status) => (status === "confirmed" ? "La Xaqiijiyay" : "La Sugayo");
const typeBadge = (type) => (type === "complaint" ? "badge badge-unpaid" : "badge bg-navy/10 text-navy");
const typeLabel = (type) => (type === "complaint" ? "Cabasho" : "Invoice");

const ParentPaymentProofs = ({ payments }) => {
  const [proofs, setProofs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState("invoice");
  const [paymentId, setPaymentId] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef();

  const [openId, setOpenId] = useState(null);
  const [threads, setThreads] = useState({});
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);

  const load = () => {
    parentApi.get("/parent-portal/payment-proofs").then((res) => setProofs(res.data));
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setMessage("");
    setAmount("");
    setPaymentId("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!message.trim()) {
      setError(type === "complaint" ? "Fadlan sharax cabashadaada." : "Fadlan sharax lacag-bixinta aad sameysay.");
      return;
    }
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("type", type);
      form.append("message", message.trim());
      if (amount) form.append("amount", amount);
      if (paymentId) form.append("paymentId", paymentId);
      if (fileInputRef.current?.files[0]) form.append("screenshot", fileInputRef.current.files[0]);

      await parentApi.post("/parent-portal/payment-proofs", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      resetForm();
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Khalad ayaa dhacay.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleThread = async (id) => {
    if (openId === id) {
      setOpenId(null);
      return;
    }
    setOpenId(id);
    setReplyText("");
    if (!threads[id]) {
      const res = await parentApi.get(`/parent-portal/payment-proofs/${id}`);
      setThreads((t) => ({ ...t, [id]: res.data }));
    }
  };

  const handleReply = async (id) => {
    if (!replyText.trim()) return;
    setReplying(true);
    try {
      await parentApi.post(`/parent-portal/payment-proofs/${id}/messages`, { message: replyText.trim() });
      const res = await parentApi.get(`/parent-portal/payment-proofs/${id}`);
      setThreads((t) => ({ ...t, [id]: res.data }));
      setReplyText("");
      load();
    } finally {
      setReplying(false);
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-serif text-lg flex items-center gap-2">
          <Receipt size={18} className="text-navy" />
          Lacag Bixinta &amp; Cabashooyinka
        </h3>
        <button className="btn-secondary text-sm" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Jooji" : "+ Soo Gudbi"}
        </button>
      </div>

      {showForm && (
        <div className="bg-paper rounded-md p-4 space-y-3 mb-4">
          <div className="flex gap-2 text-sm">
            <button
              type="button"
              onClick={() => { setType("invoice"); setError(""); }}
              className={`flex-1 py-1.5 rounded-full transition-colors ${type === "invoice" ? "bg-navy text-white" : "bg-surface text-ink/60 hover:bg-surface/70"}`}
            >
              Soo Gudbi Invoice
            </button>
            <button
              type="button"
              onClick={() => { setType("complaint"); setError(""); }}
              className={`flex-1 py-1.5 rounded-full transition-colors ${type === "complaint" ? "bg-navy text-white" : "bg-surface text-ink/60 hover:bg-surface/70"}`}
            >
              Qor Cabasho
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {error && <div className="bg-danger/10 text-danger text-sm rounded-md px-3 py-2">{error}</div>}

            {type === "invoice" ? (
              <p className="text-xs text-ink/50">
                Haddii aad lacag bixisay (tusaale EVC Plus/Zaad), halkan ku soo gudbi caddayntiisa (invoice/screenshot) si maamulku u ogaado in lacagta la dhiibay.
              </p>
            ) : (
              <p className="text-xs text-ink/50">
                Haddii dhibaato ka qabto lacag-bixin (tusaale lama xisaabin, qalad ayaa ka dhacay), halkan ku sharax cabashadaada.
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {type === "invoice" && (
                <div>
                  <label className="label-field">Lacagta La Bixiyay ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="input-field"
                    value={amount}
                    placeholder="Tusaale: 50"
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
              )}
              <div className={type === "complaint" ? "sm:col-span-2" : ""}>
                <label className="label-field">Lacag Bixin (ikhtiyaari)</label>
                <select className="input-field" value={paymentId} onChange={(e) => setPaymentId(e.target.value)}>
                  <option value="">-- Ha dooran --</option>
                  {payments.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.receiptNumber} — {formatDate(p.paymentDate)}
                    </option>
                  ))}
                </select>
                {payments.length === 0 && (
                  <p className="text-xs text-ink/40 mt-1">Weli lacag lama bixin, marka liiskani madhan yahay.</p>
                )}
              </div>
            </div>

            <div>
              <label className="label-field">{type === "complaint" ? "Sharax Cabashadaada" : "Faahfaahin"}</label>
              <textarea
                className="input-field"
                rows={3}
                required
                value={message}
                placeholder={type === "complaint" ? "Tusaale: Lacagtii aan bixiyey lama xisaabin." : "Tusaale: Waxaan ku bixiyey EVC Plus 19/09/2026."}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <div>
              <label className="label-field flex items-center gap-1.5">
                <Paperclip size={14} /> {type === "complaint" ? "Caddayn (ikhtiyaari)" : "Invoice/Screenshot (PNG/JPG)"}
              </label>
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg" className="input-field" />
            </div>

            <button className="btn-primary" disabled={submitting}>
              {submitting ? "Waa la diraayaa..." : "Soo Gudbi"}
            </button>
          </form>
        </div>
      )}

      <div className="space-y-2">
        {proofs.map((p) => {
          const isOpen = openId === p._id;
          const thread = threads[p._id];
          return (
            <div key={p._id} className="border border-line rounded-md overflow-hidden">
              <button
                onClick={() => toggleThread(p._id)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-paper"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {isOpen ? <ChevronDown size={15} className="text-ink/40 shrink-0" /> : <ChevronRight size={15} className="text-ink/40 shrink-0" />}
                  <span className={typeBadge(p.type)}>{typeLabel(p.type)}</span>
                  <span className="truncate text-sm">
                    {p.amount ? `${formatMoney(p.amount)} — ` : ""}
                    {p.message}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-ink/40">{formatDate(p.createdAt)}</span>
                  <span className={statusBadge(p.status)}>{statusLabel(p.status)}</span>
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-line p-4 space-y-3 bg-paper">
                  {p.screenshotUrl && (
                    <a href={`${API_ORIGIN}${p.screenshotUrl}`} target="_blank" rel="noreferrer">
                      <img
                        src={`${API_ORIGIN}${p.screenshotUrl}`}
                        alt="Caddaynta lacag bixinta"
                        className="max-h-48 rounded-md border border-line"
                      />
                    </a>
                  )}

                  <div className="space-y-2">
                    {thread?.messages?.map((m) => (
                      <div
                        key={m._id}
                        className={`max-w-[80%] rounded-md px-3 py-2 text-sm ${
                          m.senderType === "parent" ? "bg-navy text-white ml-auto" : "bg-surface border border-line"
                        }`}
                      >
                        <p className="text-xs opacity-60 mb-0.5">{m.senderType === "parent" ? "Adiga" : m.senderName}</p>
                        <p>{m.message}</p>
                      </div>
                    ))}
                    {thread && thread.messages.length === 0 && (
                      <p className="text-sm text-ink/40">Weli jawaab lama bixin.</p>
                    )}
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleReply(p._id);
                    }}
                    className="flex gap-2"
                  >
                    <input
                      className="input-field"
                      placeholder="Qor fariin..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                    />
                    <button className="btn-primary shrink-0 px-3" disabled={replying}>
                      <Send size={16} />
                    </button>
                  </form>
                </div>
              )}
            </div>
          );
        })}
        {proofs.length === 0 && !showForm && (
          <p className="text-sm text-ink/40 text-center py-4">Weli lacag-bixin ama cabasho lama soo gudbin.</p>
        )}
      </div>
    </div>
  );
};

export default ParentPaymentProofs;
