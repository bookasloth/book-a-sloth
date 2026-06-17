import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Eye, HelpCircle, ChevronDown, Download, X, Calendar, Clock,
  Hash, IndianRupee, Video, RotateCcw, Star, Repeat,
} from "lucide-react";
import { getGuestBookings, cancelBooking, getBookingReview } from "../services/api";
import { useAuth } from "../context/AuthContext";
import useFeatureFlags from "../hooks/useFeatureFlags";
import RescheduleModal from "../components/booking/RescheduleModal";
import ReviewModal from "../components/booking/ReviewModal";
import toast from "react-hot-toast";

// Customer-facing "My Bookings" — list of bookings a guest has made, with a
// status filter, per-row Booking ID + Amount Paid, and a details drawer that
// includes an invoice download.

const STATUS_STYLE = {
  confirmed: "bg-green-50 text-green-700 border-green-200",
  pending:   "bg-amber-50 text-amber-700 border-amber-200",
  completed: "bg-blue-50 text-blue-700 border-blue-200",
  cancelled: "bg-gray-100 text-gray-500 border-gray-200",
};

const FILTERS = [
  { key: "all",       label: "All bookings" },
  { key: "upcoming",  label: "Upcoming" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

const fmtWhen = (iso) =>
  new Date(iso).toLocaleString("en-IN", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

const shortId = (id) => (id ? `#${String(id).replace(/-/g, "").slice(0, 8).toUpperCase()}` : "—");

const amountPaid = (b) => {
  const price = Number(b.services?.price || 0);
  if (price === 0) return "Free";
  if (b.payment_status === "paid") return `₹${price.toLocaleString("en-IN")}`;
  if (b.payment_status === "refunded") return `₹${price.toLocaleString("en-IN")} (refunded)`;
  return "Unpaid";
};

// Client-side invoice — generates a printable HTML document and downloads it.
// (A branded server-side PDF is a future enhancement — see gap list.)
const downloadInvoice = (b, host) => {
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Invoice ${shortId(b.id)}</title>
<style>body{font-family:system-ui,sans-serif;color:#1E1E1E;max-width:640px;margin:40px auto;padding:0 20px}
h1{color:#FE5100;margin:0 0 4px}.muted{color:#888;font-size:13px}
table{width:100%;border-collapse:collapse;margin:24px 0}td{padding:8px 0;border-bottom:1px solid #eee;font-size:14px}
td:last-child{text-align:right;font-weight:600}.total td{border-top:2px solid #1E1E1E;border-bottom:none;font-size:16px;padding-top:12px}</style>
</head><body>
<h1>Book A Sloth</h1><p class="muted">Booking invoice</p>
<table>
<tr><td>Invoice / Booking ID</td><td>${shortId(b.id)}</td></tr>
<tr><td>Date</td><td>${fmtWhen(b.scheduled_at)}</td></tr>
<tr><td>Service</td><td>${b.services?.title || "Service"}</td></tr>
<tr><td>Host</td><td>${host?.name || "Host"}</td></tr>
<tr><td>Status</td><td>${b.status}</td></tr>
<tr><td>Payment status</td><td>${b.payment_status || "—"}</td></tr>
<tr class="total"><td>Amount</td><td>${amountPaid(b)}</td></tr>
</table>
<p class="muted">Thank you for booking with Book A Sloth.</p>
<script>window.onload=function(){window.print&&setTimeout(function(){window.print()},300)}</script>
</body></html>`;
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `invoice-${shortId(b.id).replace("#", "")}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

const CustomerBookings = () => {
  const { user } = useAuth();
  const { on } = useFeatureFlags();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);
  const [reviews, setReviews] = useState({});
  const [reschedFor, setReschedFor] = useState(null);
  const [reviewFor, setReviewFor] = useState(null);
  const [filter, setFilter] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [detailsFor, setDetailsFor] = useState(null);

  const load = () => {
    getGuestBookings()
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : [];
        setBookings(list);
        const completed = list.filter((b) => b.status === "completed");
        Promise.all(completed.map((b) =>
          getBookingReview(b.id).then(({ data: r }) => [b.id, r]).catch(() => [b.id, null])
        )).then((pairs) => setReviews(Object.fromEntries(pairs)));
      })
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this booking? This cannot be undone.")) return;
    setCancelling(id);
    try {
      await cancelBooking(id);
      toast.success("Booking cancelled");
      setBookings((bs) => bs.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b)));
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not cancel");
    } finally {
      setCancelling(null);
    }
  };

  const now = new Date();
  const isUpcoming = (b) => new Date(b.scheduled_at) >= now && b.status !== "cancelled" && b.status !== "completed";

  const filtered = bookings.filter((b) => {
    if (filter === "all") return true;
    if (filter === "upcoming") return isUpcoming(b);
    return b.status === filter;
  });

  const hostOf = (b) => b["profiles!bookings_host_id_fkey"] || b.profiles || {};

  const Row = ({ b }) => {
    const host = hostOf(b);
    const svc = b.services || {};
    return (
      <div className="bg-white border rounded-2xl p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-gray-900 truncate">{svc.title || "Service"}</p>
            <p className="text-sm text-gray-500 mt-0.5">
              with {host.username
                ? <Link to={`/${host.username}`} className="text-[#FE5100] hover:underline">{host.name || "Host"}</Link>
                : (host.name || "Host")}
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-600">
              <span className="inline-flex items-center gap-1.5"><Calendar size={14} className="text-gray-400" />{fmtWhen(b.scheduled_at)}</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-gray-400">
              <span className="inline-flex items-center gap-1"><Hash size={12} />{shortId(b.id)}</span>
              <span className="inline-flex items-center gap-1"><IndianRupee size={12} />{amountPaid(b)}</span>
            </div>
          </div>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full border whitespace-nowrap ${STATUS_STYLE[b.status] || STATUS_STYLE.pending}`}>
            {b.status}
          </span>
        </div>

        <div className="mt-3 pt-3 border-t flex items-center gap-2">
          <button onClick={() => setDetailsFor(b)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-[#FE5100] px-2.5 py-1.5 rounded-lg hover:bg-[#FE5100]/5">
            <Eye size={15} /> Details
          </button>
          <Link to="/help"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-[#FE5100] px-2.5 py-1.5 rounded-lg hover:bg-[#FE5100]/5 hover:no-underline">
            <HelpCircle size={15} /> Help
          </Link>
          {b.meeting_link && isUpcoming(b) && (
            <a href={b.meeting_link} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#FE5100] hover:underline px-2.5 py-1.5 ml-auto">
              <Video size={15} /> Join
            </a>
          )}
        </div>
      </div>
    );
  };

  const activeFilterLabel = FILTERS.find((f) => f.key === filter)?.label;

  return (
    <div className="min-h-screen" style={{ background: "#f7f5ef" }}>
      <div className="app-container py-8 max-w-2xl">
        <div className="flex items-start justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold">My Bookings</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {user?.name ? `Hi ${user.name.split(" ")[0]}, ` : ""}here are the sessions you've booked.
            </p>
          </div>
          {/* Filter dropdown */}
          <div className="relative" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setFilterOpen(false); }}>
            <button onClick={() => setFilterOpen((o) => !o)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 bg-white border rounded-xl px-3.5 py-2 hover:border-[#FE5100]/40 whitespace-nowrap">
              {activeFilterLabel}
              <ChevronDown size={15} className={`text-gray-400 transition-transform ${filterOpen ? "rotate-180" : ""}`} />
            </button>
            {filterOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border rounded-xl shadow-lg z-20 overflow-hidden py-1">
                {FILTERS.map((f) => (
                  <button key={f.key} onClick={() => { setFilter(f.key); setFilterOpen(false); }}
                    className={`flex w-full items-center px-4 py-2.5 text-sm hover:bg-[#FE5100]/5 ${filter === f.key ? "text-[#FE5100] font-medium" : "text-gray-600"}`}>
                    {f.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400">
            <div className="w-7 h-7 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin mx-auto" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white border rounded-2xl p-10 text-center">
            <p className="text-gray-500 mb-1">No bookings yet</p>
            <p className="text-sm text-gray-400 mb-4">When you book a session it'll show up here.</p>
            <Link to="/" className="inline-block text-sm font-medium text-[#FE5100] hover:underline">Find a creator to book →</Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border rounded-2xl p-10 text-center text-gray-400 text-sm">
            No {activeFilterLabel.toLowerCase()} to show.
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((b) => <Row key={b.id} b={b} />)}
          </div>
        )}

        <div className="text-center mt-6">
          <Link to="/" className="text-sm text-[#FE5100] hover:underline">Browse creators →</Link>
        </div>
      </div>

      {/* Details drawer/modal */}
      {detailsFor && (
        <DetailsModal
          b={detailsFor}
          host={hostOf(detailsFor)}
          review={reviews[detailsFor.id]}
          onClose={() => setDetailsFor(null)}
          canReschedule={isUpcoming(detailsFor) && on("reschedule")}
          canCancel={isUpcoming(detailsFor)}
          cancelling={cancelling === detailsFor.id}
          onReschedule={() => { setReschedFor(detailsFor); setDetailsFor(null); }}
          onReview={() => { setReviewFor(detailsFor); setDetailsFor(null); }}
          onCancel={() => handleCancel(detailsFor.id)}
        />
      )}

      {reschedFor && (
        <RescheduleModal open booking={reschedFor} onClose={() => setReschedFor(null)}
          onDone={(newWhen) => {
            setBookings((bs) => bs.map((x) => x.id === reschedFor.id
              ? { ...x, scheduled_at: newWhen, reschedule_count: (x.reschedule_count || 0) + 1 } : x));
            setReschedFor(null);
          }} />
      )}
      {reviewFor && (
        <ReviewModal open booking={reviewFor} onClose={() => setReviewFor(null)}
          onDone={(review) => { setReviews((m) => ({ ...m, [reviewFor.id]: review })); setReviewFor(null); }} />
      )}
    </div>
  );
};

// ── Booking Details modal ─────────────────────────────────────────────────────
const DetailsModal = ({ b, host, review, onClose, canReschedule, canCancel, cancelling, onReschedule, onReview, onCancel }) => {
  const svc = b.services || {};
  const Line = ({ icon: Icon, label, value }) => (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-100 text-sm">
      <span className="inline-flex items-center gap-2 text-gray-500"><Icon size={14} className="text-gray-400" />{label}</span>
      <span className="font-medium text-gray-800 text-right">{value}</span>
    </div>
  );
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 bg-white">
          <h2 className="font-bold text-gray-900">Booking details</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"><X size={18} /></button>
        </div>
        <div className="px-5 py-4">
          <p className="font-semibold text-gray-900">{svc.title || "Service"}</p>
          <p className="text-sm text-gray-500">with {host.name || "Host"}</p>

          <div className="mt-4">
            <Line icon={Hash} label="Booking ID" value={shortId(b.id)} />
            <Line icon={Calendar} label="Date & time" value={fmtWhen(b.scheduled_at)} />
            {svc.duration ? <Line icon={Clock} label="Duration" value={`${svc.duration} min`} /> : null}
            <Line icon={IndianRupee} label="Amount" value={amountPaid(b)} />
            <Line icon={Eye} label="Status" value={b.status} />
          </div>

          {b.meeting_link && (
            <a href={b.meeting_link} target="_blank" rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#FE5100] hover:underline">
              <Video size={15} /> Join Google Meet
            </a>
          )}

          {/* Actions */}
          <div className="mt-5 grid grid-cols-1 gap-2">
            <button onClick={() => downloadInvoice(b, host)}
              className="btn inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#FE5100] hover:bg-[#d94400]">
              <Download size={15} /> Download invoice
            </button>
            {canReschedule && (
              <button onClick={onReschedule}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 border rounded-xl hover:bg-gray-50">
                <RotateCcw size={15} /> Reschedule
              </button>
            )}
            {b.status === "completed" && !review && (
              <button onClick={onReview}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 border rounded-xl hover:bg-gray-50">
                <Star size={15} /> Leave a review
              </button>
            )}
            {b.status === "completed" && review && (
              <p className="text-center text-sm text-gray-500 py-1">Your review {"★".repeat(review.rating)}</p>
            )}
            {(b.status === "completed" || b.status === "cancelled") && host.username && svc.slug && (
              <Link to={`/${host.username}/booking/${svc.slug}`}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 border rounded-xl hover:bg-gray-50 hover:no-underline">
                <Repeat size={15} /> Rebook
              </Link>
            )}
            {canCancel && (
              <button onClick={onCancel} disabled={cancelling}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl disabled:opacity-50">
                {cancelling ? "Cancelling…" : "Cancel booking"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerBookings;
