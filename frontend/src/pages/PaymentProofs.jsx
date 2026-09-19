import { useEffect, useState } from "react";
import { Receipt, ChevronDown, ChevronRight, Send, CheckCircle2, RotateCcw } from "lucide-react";
import api from "../api/axios";
import { formatMoney, formatDate } from "../utils/format";

const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

const statusBadge = (status) => (status === "confirmed" ? "badge badge-paid" : "badge badge-partial");
const statusLabel = (status) => (status === "confirmed" ? "La Xaqiijiyay" : "La Sugayo");
const typeBadge = (type) => (type === "complaint" ? "badge badge-unpaid" : "badge bg-navy/10 text-navy");
const typeLabel = (type) => (type === "complaint" ? "Cabasho" : "Invoice");

const PaymentProofs = () => {
  const [proofs, setProofs] = useState([]);
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [openId, setOpenId] = useState(null);
  const [thread, setThread] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const load = () => {
    api
      .get("/payment-proofs", { params: { status: status || undefined, type: type || undefined } })
      .then((res) => setProofs(res.data));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, type]);

  const toggleOpen = async (id) => {
    if (openId === id) {
      setOpenId(null);
      setThread(null);
      return;
    }
    setOpenId(id);
    setReplyText("");
    const res = await api.get(`/payment-proofs/${id}`);
    setThread(res.data);
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setReplying(true);
    try {
      await api.post(`/payment-proofs/${openId}/messages`, { message: replyText.trim() });
      const res = await api.get(`/payment-proofs/${openId}`);
      setThread(res.data);
      setReplyText("");
      load();
    } finally {
      setReplying(false);
    }
  };

  const toggleStatus = async () => {
    if (!thread) return;
    setUpdatingStatus(true);
    try {
      const newStatus = thread.status === "confirmed" ? "pending" : "confirmed";
      await api.put(`/payment-proofs/${openId}`, { status: newStatus });
      const res = await api.get(`/payment-proofs/${openId}`);
      setThread(res.data);
      load();
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-serif flex items-center gap-2">
          <Receipt size={20} className="text-navy" />
          Lacag Bixinta &amp; Cabashooyinka
        </h2>
        <div className="flex gap-2">
          <select className="input-field !w-auto" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">Nooca Oo Dhan</option>
            <option value="invoice">Invoice</option>
            <option value="complaint">Cabasho</option>
          </select>
          <select className="input-field !w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Dhammaan Status</option>
            <option value="pending">La Sugayo</option>
            <option value="confirmed">La Xaqiijiyay</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        {proofs.map((p) => {
          const isOpen = openId === p._id;
          return (
            <div key={p._id} className="card !p-0 overflow-hidden">
              <button
                onClick={() => toggleOpen(p._id)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-paper"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {isOpen ? <ChevronDown size={15} className="text-ink/40 shrink-0" /> : <ChevronRight size={15} className="text-ink/40 shrink-0" />}
                  <span className={typeBadge(p.type)}>{typeLabel(p.type)}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {p.parentId?.fullName} — {p.parentId?.phone} {p.amount ? `· ${formatMoney(p.amount)}` : ""}
                    </p>
                    <p className="text-xs text-ink/50 truncate">{p.message}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-ink/40 hidden sm:inline">{formatDate(p.createdAt)}</span>
                  <span className={statusBadge(p.status)}>{statusLabel(p.status)}</span>
                </div>
              </button>

              {isOpen && thread && (
                <div className="border-t border-line p-4 space-y-3 bg-paper">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-ink/70">
                      {thread.paymentId ? `La xidhiidha: ${thread.paymentId.receiptNumber}` : "Lama xidhiidhin lacag-bixin gaar ah"}
                    </p>
                    <button
                      onClick={toggleStatus}
                      disabled={updatingStatus}
                      className="btn-secondary text-xs flex items-center gap-1.5"
                    >
                      {thread.status === "confirmed" ? <RotateCcw size={13} /> : <CheckCircle2 size={13} />}
                      {thread.status === "confirmed" ? "Dib u Fur (Sugaya)" : "Calaamadi La Xaqiijiyay"}
                    </button>
                  </div>

                  {thread.screenshotUrl && (
                    <a href={`${API_ORIGIN}${thread.screenshotUrl}`} target="_blank" rel="noreferrer">
                      <img
                        src={`${API_ORIGIN}${thread.screenshotUrl}`}
                        alt="Caddaynta lacag bixinta"
                        className="max-h-56 rounded-md border border-line"
                      />
                    </a>
                  )}

                  <div className="space-y-2">
                    <div className="max-w-[80%] rounded-md px-3 py-2 text-sm bg-surface border border-line">
                      <p className="text-xs opacity-60 mb-0.5">{thread.parentId?.fullName}</p>
                      <p>{thread.message}</p>
                    </div>
                    {thread.messages?.map((m) => (
                      <div
                        key={m._id}
                        className={`max-w-[80%] rounded-md px-3 py-2 text-sm ${
                          m.senderType === "staff" ? "bg-navy text-white ml-auto" : "bg-surface border border-line"
                        }`}
                      >
                        <p className="text-xs opacity-60 mb-0.5">{m.senderType === "staff" ? m.senderName : thread.parentId?.fullName}</p>
                        <p>{m.message}</p>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleReply} className="flex gap-2">
                    <input
                      className="input-field"
                      placeholder="Qor jawaab..."
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
        {proofs.length === 0 && (
          <p className="text-center text-ink/40 py-8">Weli caddayn lacag bixin lama soo gudbin.</p>
        )}
      </div>
    </div>
  );
};

export default PaymentProofs;
