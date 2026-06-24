import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getGuestBookings, getBookingReview, createReview } from "../services/api";
import useFeatureFlags from "../hooks/useFeatureFlags";
import toast from "react-hot-toast";

// Dedicated "leave a review" page reached from the booking-completed email
// (cta -> /review/:bookingId). Guest reviews the host for one completed booking.
// The booking + host context is read from the guest's own bookings list, so no
// new backend endpoint is needed. Submission is feature-gated server-side
// (review_submission); we also surface a friendly off-state here.

const fmtWhen = (iso) =>
  iso
    ? new Date(iso).toLocaleString("en-IN", {
        weekday: "short", day: "numeric", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : "";

const hostOf = (b) => b?.["profiles!bookings_host_id_fkey"] || b?.profiles || {};

const Shell = ({ children }) => (
  <div className="app-container flex min-h-[calc(100vh-72px)] items-center justify-center py-8 sm:py-12">
    <div className="page-card w-full max-w-md p-5 sm:p-8">{children}</div>
  </div>
);

export default function ReviewPage() {
  const { bookingId } = useParams();
  const { on } = useFeatureFlags();
  const reviewsOn = on("review_submission");

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);
  const [existing, setExisting] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await getGuestBookings();
        const list = Array.isArray(data) ? data : [];
        const b = list.find((x) => x.id === bookingId);
        if (!active) return;
        if (!b) { setError("We couldn't find this booking on your account."); return; }
        setBooking(b);
        if (b.status === "completed") {
          try {
            const { data: r } = await getBookingReview(bookingId);
            if (active) setExisting(r);
          } catch { /* no existing review */ }
        }
      } catch {
        if (active) setError("Something went wrong loading your booking.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [bookingId]);

  const submit = async () => {
    if (rating < 1) { toast.error("Pick a rating"); return; }
    setBusy(true);
    try {
      await createReview({ booking_id: bookingId, rating, comment, direction: "guest_to_host" });
      setDone(true);
      toast.success("Thanks for your review!");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not submit review");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <Shell><p className="py-8 text-center text-gray-500">Loading…</p></Shell>;
  }

  if (error) {
    return (
      <Shell>
        <h1 className="mb-2 text-xl font-bold">Review unavailable</h1>
        <p className="text-sm text-gray-500">{error}</p>
        <Link to="/my-bookings" className="mt-4 inline-block text-sm text-primary hover:underline">
          Go to my bookings
        </Link>
      </Shell>
    );
  }

  const host = hostOf(booking);

  if (booking.status !== "completed") {
    return (
      <Shell>
        <h1 className="mb-2 text-xl font-bold">Not just yet</h1>
        <p className="text-sm text-gray-500">
          You can leave a review once this booking is marked completed.
        </p>
        <Link to="/my-bookings" className="mt-4 inline-block text-sm text-primary hover:underline">
          Go to my bookings
        </Link>
      </Shell>
    );
  }

  if (done || existing) {
    return (
      <Shell>
        <div className="text-center">
          <div className="mb-2 text-3xl text-[#FE5100]">★</div>
          <h1 className="mb-1 text-xl font-bold">{done ? "Thank you!" : "Already reviewed"}</h1>
          <p className="mb-4 text-sm text-gray-500">
            {done ? "Your review has been shared for " : "You've already reviewed "}
            {host.name || "your host"}.
          </p>
          {host.username && (
            <Link to={`/${host.username}`} className="text-sm text-primary hover:underline">
              View {host.name || "host"}'s profile
            </Link>
          )}
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <h1 className="mb-1 text-2xl font-bold">Leave a review</h1>
      <p className="mb-1 text-sm text-gray-500">
        How was your {booking.services?.title || "session"} with {host.name || "your host"}?
      </p>
      {booking.scheduled_at && (
        <p className="mb-4 text-xs text-gray-400">{fmtWhen(booking.scheduled_at)}</p>
      )}

      {!reviewsOn && (
        <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Reviews are temporarily unavailable. Please try again later.
        </p>
      )}

      <div className="mb-3 flex gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`Rate ${n} star${n > 1 ? "s" : ""}`}
            aria-pressed={n <= rating}
            onClick={() => setRating(n)}
            className={`text-3xl leading-none ${n <= rating ? "text-[#FE5100]" : "text-gray-300"}`}
          >
            ★
          </button>
        ))}
      </div>

      <textarea
        className="fb-input mb-4"
        rows={4}
        placeholder="Share a few words (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />

      <button
        type="button"
        onClick={submit}
        disabled={busy || !reviewsOn}
        className="btn w-full bg-primary py-2.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
      >
        {busy ? "Submitting…" : "Submit review"}
      </button>
    </Shell>
  );
}
