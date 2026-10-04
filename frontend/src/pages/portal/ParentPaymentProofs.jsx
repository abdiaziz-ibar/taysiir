import { useEffect, useRef, useState } from "react";
import { Receipt, Paperclip, Send, ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import parentApi from "../../api/parentAxios";
import { formatMoney, formatDate } from "../../utils/format";
import { t } from "../../i18n";

const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

const statusBadge = (status) => (status === "confirmed" ? "badge badge-paid" : "badge badge-partial");
const statusLabel = (status) => (status === "confirmed" ? t("La Xaqiijiyay") : t("La Sugayo"));
const typeBadge = (type) => (type === "complaint" ? "badge badge-unpaid" : "badge bg-navy/10 text-navy");
const typeLabel = (type) => (type === "complaint" ? t("Cabasho") : t("Invoice"));

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
      setError(type === "complaint" ? t("Fadlan sharax cabashadaada.") : t("Fadlan sharax lacag-bixinta aad sameysay."));
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
      setError(t(err.response?.data?.message || "Khalad ayaa dhacay."));
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

  const handleDelete = async (id) => {
    if (!window.confirm(t("Ma hubtaa inaad tirtirto caddayntan/cabashadan?"))) return;
    try {
      await parentApi.delete(`/parent-portal/payment-proofs/${id}`);
      setOpenId(null);
      load();
    } catch (err) {
      window.alert(t(err.response?.data?.message || "Khalad ayaa dhacay."));
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-serif text-lg flex items-center gap-2">
          <Receipt size={18} className="text-navy" />
          {t("Lacag Bixinta & Cabashooyinka")}
        </h3>
        <button className="btn-secondary text-sm" onClick={() => setShowForm((v) => !v)}>
          {showForm ? t("Jooji") : t("+ Soo Gudbi")}
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
              {t("Soo Gudbi Invoice")}
            </button>
            <button
              type="button"
              onClick={() => { setType("complaint"); setError(""); }}
              className={`flex-1 py-1.5 rounded-full transition-colors ${type === "complaint" ? "bg-navy text-white" : "bg-surface text-ink/60 hover:bg-surface/70"}`}
            >
              {t("Qor Cabasho")}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {error && <div className="bg-danger/10 text-danger text-sm rounded-md px-3 py-2">{error}</div>}

            {type === "invoice" ? (
              <p className="text-xs text-ink/50">
                {t("Haddii aad lacag bixisay (tusaale EVC Plus/Zaad), halkan ku soo gudbi caddayntiisa (invoice/screenshot) si maamulku u ogaado in lacagta la dhiibay.")}
              </p>
            ) : (
              <p className="text-xs text-ink/50">
                {t("Haddii dhibaato ka qabto lacag-bixin (tusaale lama xisaabin, qalad ayaa ka dhacay), halkan ku sharax cabashadaada.")}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {type === "invoice" && (
                <div>
                  <label className="label-field">{t("Lacagta La Bixiyay ($)")}</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="input-field"
                    value={amount}
                    placeholder={t("Tusaale: 50")}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
              )}
              <div className={type === "complaint" ? "sm:col-span-2" : ""}>
                <label className="label-field">{t("Lacag Bixin (ikhtiyaari)")}</label>
                <select className="input-field" value={paymentId} onChange={(e) => setPaymentId(e.target.value)}>
                  <option value="">{t("-- Ha dooran --")}</option>
                  {payments.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.receiptNumber} — {formatDate(p.paymentDate)}
                    </option>
                  ))}
                </select>
                {payments.length === 0 && (
                  <p className="text-xs text-ink/40 mt-1">{t("Weli lacag lama bixin, marka liiskani madhan yahay.")}</p>
                )}
              </div>
            </div>

            <div>
              <label className="label-field">{type === "complaint" ? t("Sharax Cabashadaada") : t("Faahfaahin")}</label>
              <textarea
                className="input-field"
                rows={3}
                required
                value={message}
                placeholder={type === "complaint" ? t("Tusaale: Lacagtii aan bixiyey lama xisaabin.") : t("Tusaale: Waxaan ku bixiyey EVC Plus 19/09/2026.")}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <div>
              <label className="label-field flex items-center gap-1.5">
                <Paperclip size={14} /> {type === "complaint" ? t("Caddayn (ikhtiyaari)") : t("Invoice/Screenshot (PNG/JPG)")}
              </label>
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg" className="input-field" />
            </div>

            <button className="btn-primary" disabled={submitting}>
              {submitting ? t("Waa la diraayaa...") : t("Soo Gudbi")}
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
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-start hover:bg-paper"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {isOpen ? <ChevronDown size={15} className="text-ink/40 shrink-0" /> : <ChevronRight size={15} className="text-ink/40 shrink-0 rtl:rotate-180" />}
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
                        alt={t("Caddaynta lacag bixinta")}
                        className="max-h-48 rounded-md border border-line"
                      />
                    </a>
                  )}

                  <div className="space-y-2">
                    {thread?.messages?.map((m) => (
                      <div
                        key={m._id}
                        className={`max-w-[80%] rounded-md px-3 py-2 text-sm ${
                          m.senderType === "parent" ? "bg-navy text-white ms-auto" : "bg-surface border border-line"
                        }`}
                      >
                        <p className="text-xs opacity-60 mb-0.5">{m.senderType === "parent" ? t("Adiga") : m.senderName}</p>
                        <p>{m.message}</p>
                      </div>
                    ))}
                    {thread && thread.messages.length === 0 && (
                      <p className="text-sm text-ink/40">{t("Weli jawaab lama bixin.")}</p>
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
                      placeholder={t("Qor fariin...")}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                    />
                    <button className="btn-primary shrink-0 px-3" disabled={replying}>
                      <Send size={16} />
                    </button>
                  </form>

                  {p.status !== "confirmed" && (
                    <button
                      type="button"
                      onClick={() => handleDelete(p._id)}
                      className="inline-flex items-center gap-1.5 text-sm text-danger hover:underline"
                    >
                      <Trash2 size={14} /> {t("Tirtir")}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {proofs.length === 0 && !showForm && (
          <p className="text-sm text-ink/40 text-center py-4">{t("Weli lacag-bixin ama cabasho lama soo gudbin.")}</p>
        )}
      </div>
    </div>
  );
};

export default ParentPaymentProofs;
