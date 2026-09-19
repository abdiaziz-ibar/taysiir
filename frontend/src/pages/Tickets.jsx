import { useEffect, useState } from "react";
import { MessageSquare, ChevronDown, ChevronRight, Send, CheckCircle2, RotateCcw } from "lucide-react";
import api from "../api/axios";
import { formatDate } from "../utils/format";

const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

const statusBadge = (status) => (status === "resolved" ? "badge badge-paid" : "badge badge-unpaid");

const Tickets = () => {
  const [tickets, setTickets] = useState([]);
  const [status, setStatus] = useState("");
  const [openId, setOpenId] = useState(null);
  const [thread, setThread] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const load = () => {
    api.get("/tickets", { params: { status: status || undefined } }).then((res) => setTickets(res.data));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const toggleOpen = async (id) => {
    if (openId === id) {
      setOpenId(null);
      setThread(null);
      return;
    }
    setOpenId(id);
    setReplyText("");
    const res = await api.get(`/tickets/${id}`);
    setThread(res.data);
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setReplying(true);
    try {
      await api.post(`/tickets/${openId}/messages`, { message: replyText.trim() });
      const res = await api.get(`/tickets/${openId}`);
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
      const newStatus = thread.status === "resolved" ? "open" : "resolved";
      await api.put(`/tickets/${openId}`, { status: newStatus });
      const res = await api.get(`/tickets/${openId}`);
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
          <MessageSquare size={20} className="text-navy" />
          Dhibaatooyinka Lacagta
        </h2>
        <select className="input-field !w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Dhammaan</option>
          <option value="open">Furan</option>
          <option value="resolved">La Xaliyay</option>
        </select>
      </div>

      <div className="space-y-2">
        {tickets.map((t) => {
          const isOpen = openId === t._id;
          return (
            <div key={t._id} className="card !p-0 overflow-hidden">
              <button
                onClick={() => toggleOpen(t._id)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-paper"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {isOpen ? <ChevronDown size={15} className="text-ink/40 shrink-0" /> : <ChevronRight size={15} className="text-ink/40 shrink-0" />}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{t.parentId?.fullName} — {t.parentId?.phone}</p>
                    <p className="text-xs text-ink/50 truncate">{t.message}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-ink/40 hidden sm:inline">{formatDate(t.createdAt)}</span>
                  <span className={statusBadge(t.status)}>{t.status === "resolved" ? "La Xaliyay" : "Furan"}</span>
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
                      {thread.status === "resolved" ? <RotateCcw size={13} /> : <CheckCircle2 size={13} />}
                      {thread.status === "resolved" ? "Dib u Fur" : "Calaamadi La Xaliyay"}
                    </button>
                  </div>

                  {thread.screenshotUrl && (
                    <a href={`${API_ORIGIN}${thread.screenshotUrl}`} target="_blank" rel="noreferrer">
                      <img
                        src={`${API_ORIGIN}${thread.screenshotUrl}`}
                        alt="Screenshot caddaynta"
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
        {tickets.length === 0 && (
          <p className="text-center text-ink/40 py-8">Dhibaato lama soo gudbin.</p>
        )}
      </div>
    </div>
  );
};

export default Tickets;
