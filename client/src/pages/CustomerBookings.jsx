import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getGuestBookings, cancelBooking, getBookingReview } from "../services/api";
import { useAuth } from "../context/AuthContext";
import useFeatureFlags from "../hooks/useFeatureFlags";
import RescheduleModal from "../components/booking/RescheduleModal";
import ReviewModal from "../components/booking/ReviewModal";
import toast from "react-hot-toast";

// Customer-facing "My Bookings" — a read-only list of the bookings a guest has
// made. Replaces the old behaviour where /my-bookings rendered the full vendor
// Dashboard (guests saw vendor controls they couldn't use).

const STATUS_STYLE = {
  confirmed: "bg-green-50 text-green-700 border-green-200",
  pending:   "bg-amber-50 text-amber-700 border-amber-200",
  completed: "bg-blue-50 text-blue-700 border-blue-200",
  cancelled: "bg-gray-100 text-gray-500 border-gray-200",
};

const fmtWhen = (iso) =>
  new Date(iso).toLocaleString("en-IN", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

const CustomerBookings = () => {
  const { user } = useAuth();
  const { on } = useFeatureFlags();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);
  const [reviews, setReviews] = useState({});       // bookingId -> review|null
  const [reschedFor, setReschedFor] = useState(null);
  const [reviewFor, setReviewFor] = useState(null);

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
  const upcoming = bookings.filter((b) => new Date(b.scheduled_at) >= now && b.status !== "cancelled");
  const past = bookings.filter((b) => new Date(b.scheduled_at) < now || b.status === "cancelled");

  const Card = ({ b }) => {
    const host = b["profiles!bookings_host_id_fkey"] || b.profiles || {};
    const svc = b.services || {};
    const isUpcoming = new Date(b.scheduled_at) >= now && b.status !== "cancelled";
    return (
      <div className="bg-white border rounded-2xl p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">{svc.title || "Service"}</p>
            <p className="text-sm text-gray-500 mt-0.5">
              with {host.username
                ? <Link to={`/${host.username}`} className="text-primary hover:underline">{host.name || "Host"}</Link>
                : (host.name || "Host")}
            </p>
            <p className="text-sm text-gray-600 mt-2">{fmtWhen(b.scheduled_at)}</p>
            {svc.duration ? <p className="text-xs text-gray-400 mt-0.5">{svc.duration} min</p> : null}
          </div>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full border whitespace-nowrap ${STATUS_STYLE[b.status] || STATUS_STYLE.pending}`}>
            {b.status}
          </span>
        </div>
        {(isUpcoming || b.status === "completed" || b.status === "cancelled" || b.meeting_link) && (
          <div className="mt-3 pt-3 border-t flex flex-wrap items-center gap-3">
            {b.meeting_link && (
              <a href={b.meeting_link} target="_blank" rel="noreferrer"
                className="text-sm font-medium text-primary hover:underline">
                Join Google Meet →
              </a>
            )}
            {isUpcoming && on("reschedule") && (
              <button onClick={() => setReschedFor(b)}
                className="text-sm font-medium text-primary hover:underline">Reschedule</button>
            )}
            {b.status === "completed" && (
              reviews[b.id]
                ? <span className="text-sm text-gray-500">Your review {"★".repeat(reviews[b.id].rating)}</span>
                : <button onClick={() => setReviewFor(b)}
                    className="text-sm font-medium text-primary hover:underline">Leave review</button>
            )}
            {(b.status === "completed" || b.status === "cancelled") && host.username && svc.slug && (
              <Link to={`/${host.username}/booking/${svc.slug}`}
                className="text-sm text-gray-600 hover:underline">Rebook</Link>
            )}
            {isUpcoming && (
              <button onClick={() => handleCancel(b.id)} disabled={cancelling === b.id}
                className="text-sm text-red-500 hover:text-red-600 disabled:opacity-50 ml-auto">
                {cancelling === b.id ? "Cancelling…" : "Cancel"}
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen" style={{ background: "#f7f5ef" }}>
      <div className="app-container py-8 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">My Bookings</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {user?.name ? `Hi ${user.name.split(" ")[0]}, ` : ""}here are the sessions you've booked.
            </p>
          </div>
          <Link to="/" className="text-sm text-primary hover:underline whitespace-nowrap">Browse creators →</Link>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400">
            <div className="w-7 h-7 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin mx-auto" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white border rounded-2xl p-10 text-center">
            <p className="text-gray-500 mb-1">No bookings yet</p>
            <p className="text-sm text-gray-400 mb-4">When you book a session it'll show up here.</p>
            <Link to="/" className="inline-block text-sm font-medium text-primary hover:underline">Find a creator to book →</Link>
          </div>
        ) : (
          <div className="space-y-6">
            {upcoming.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Upcoming</h2>
                <div className="space-y-3">{upcoming.map((b) => <Card key={b.id} b={b} />)}</div>
              </section>
            )}
            {past.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Past &amp; cancelled</h2>
                <div className="space-y-3">{past.map((b) => <Card key={b.id} b={b} />)}</div>
              </section>
            )}
          </div>
        )}
      </div>
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

export default CustomerBookings;
