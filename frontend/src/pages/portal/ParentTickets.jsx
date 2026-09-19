import { useEffect, useRef, useState } from "react";
import { MessageSquare, Paperclip, Send, ChevronDown, ChevronRight } from "lucide-react";
import parentApi from "../../api/parentAxios";
import { formatDate } from "../../utils/format";

const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

const statusBadge = (status) =>
  status === "resolved" ? "badge badge-paid" : "badge badge-unpaid";

const ParentTickets = ({ payments }) => {
  const [tickets, setTickets] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [paymentId, setPaymentId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef();

  const [openTicketId, setOpenTicketId] = useState(null);
  const [threads, setThreads] = useState({});
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);

  const loadTickets = () => {
    parentApi.get("/parent-portal/tickets").then((res) => setTickets(res.data));
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!message.trim()) {
      setError("Fadlan sharax dhibaatada.");
      return;
    }
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("message", message.trim());
      if (paymentId) form.append("paymentId", paymentId);
      if (fileInputRef.current?.files[0]) form.append("screenshot", fileInputRef.current.files[0]);

      await parentApi.post("/parent-portal/tickets", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMessage("");
      setPaymentId("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setShowForm(false);
      loadTickets();
    } catch (err) {
      setError(err.response?.data?.message || "Khalad ayaa dhacay.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleThread = async (ticketId) => {
    if (openTicketId === ticketId) {
      setOpenTicketId(null);
      return;
    }
    setOpenTicketId(ticketId);
    setReplyText("");
    if (!threads[ticketId]) {
      const res = await parentApi.get(`/parent-portal/tickets/${ticketId}`);
      setThreads((t) => ({ ...t, [ticketId]: res.data }));
    }
  };

  const handleReply = async (ticketId) => {
    if (!replyText.trim()) return;
    setReplying(true);
    try {
      await parentApi.post(`/parent-portal/tickets/${ticketId}/messages`, { message: replyText.trim() });
      const res = await parentApi.get(`/parent-portal/tickets/${ticketId}`);
      setThreads((t) => ({ ...t, [ticketId]: res.data }));
      setReplyText("");
      loadTickets();
    } finally {
      setReplying(false);
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-serif text-lg flex items-center gap-2">
          <MessageSquare size={18} className="text-navy" />
          Dhibaatooyinka Lacagta
        </h3>
        <button className="btn-secondary text-sm" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Jooji" : "+ Soo Gudbi Dhibaato"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-paper rounded-md p-4 space-y-3 mb-4">
          {error && <div className="bg-danger/10 text-danger text-sm rounded-md px-3 py-2">{error}</div>}
          <div>
            <label className="label-field">Lacag Bixin (ikhtiyaari)</label>
            <select className="input-field" value={paymentId} onChange={(e) => setPaymentId(e.target.value)}>
              <option value="">-- Ha dooran --</option>
              {payments.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.receiptNumber} — {formatDate(p.paymentDate)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-field">Sharaxaad</label>
            <textarea
              className="input-field"
              rows={3}
              required
              value={message}
              placeholder="Tusaale: lacagta waan bixiyey laakiin ma muuqato system-ka."
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          <div>
            <label className="label-field flex items-center gap-1.5">
              <Paperclip size={14} /> Screenshot-ka Caddaynta (PNG/JPG, ikhtiyaari)
            </label>
            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg" className="input-field" />
          </div>
          <button className="btn-primary" disabled={submitting}>
            {submitting ? "Waa la diraayaa..." : "Soo Gudbi"}
          </button>
        </form>
      )}

      <div className="space-y-2">
        {tickets.map((t) => {
          const isOpen = openTicketId === t._id;
          const thread = threads[t._id];
          return (
            <div key={t._id} className="border border-line rounded-md overflow-hidden">
              <button
                onClick={() => toggleThread(t._id)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-paper"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {isOpen ? <ChevronDown size={15} className="text-ink/40 shrink-0" /> : <ChevronRight size={15} className="text-ink/40 shrink-0" />}
                  <span className="truncate text-sm">{t.message}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-ink/40">{formatDate(t.createdAt)}</span>
                  <span className={statusBadge(t.status)}>{t.status === "resolved" ? "La Xaliyay" : "Furan"}</span>
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-line p-4 space-y-3 bg-paper">
                  {t.screenshotUrl && (
                    <a href={`${API_ORIGIN}${t.screenshotUrl}`} target="_blank" rel="noreferrer">
                      <img
                        src={`${API_ORIGIN}${t.screenshotUrl}`}
                        alt="Screenshot caddaynta"
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
                      handleReply(t._id);
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
        {tickets.length === 0 && !showForm && (
          <p className="text-sm text-ink/40 text-center py-4">Weli dhibaato lama soo gudbin.</p>
        )}
      </div>
    </div>
  );
};

export default ParentTickets;
