import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2, Calendar, Clock, Video, MapPin, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import { getManageBooking, cancelManageBooking } from "../services/api";

// /manage-booking/:token — public, token-authorized self-service for anonymous
// (no-session) guests (MF3 #516). View + cancel exactly one booking. Reschedule
// via link is a deliberate follow-up; guests are pointed at support for now.

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "";
const fmtTime = (iso) =>
  iso ? new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }) : "";

const StatusPill = ({ status }) => {
  const map = {
    confirmed: ["Confirmed", "bg-green-100 text-green-800"],
    pending:   ["Pending payment", "bg-amber-100 text-amber-800"],
    cancelled: ["Cancelled", "bg-red-100 text-red-700"],
    completed: ["Completed", "bg-gray-100 text-gray-700"],
    no_show:   ["Missed", "bg-gray-100 text-gray-700"],
  };
  const [label, cls] = map[status] || [status, "bg-gray-100 text-gray-700"];
  return <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>{label}</span>;
};

export default function ManageBooking() {
  const { token } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    let alive = true;
    getManageBooking(token)
      .then(({ data }) => { if (alive) setBooking(data); })
      .catch((err) => { if (alive) setError(err.response?.data?.message || "This link is invalid or has expired."); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [token]);

  const onCancel = async () => {
    if (!window.confirm("Cancel this booking? This can't be undone.")) return;
    setCancelling(true);
    try {
      const { data } = await cancelManageBooking(token);
      setBooking(data);
      toast.success("Booking cancelled");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not cancel. Please try again or contact support.");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <main className="mx-auto max-w-lg px-5 py-12 sm:py-16">
      <h1 className="text-2xl font-bold text-ink">Manage your booking</h1>

      {loading ? (
        <div className="py-16 text-center">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-gray-400" />
        </div>
      ) : error ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <XCircle className="mx-auto h-8 w-8 text-red-500" />
          <p className="mt-3 font-semibold text-red-800">{error}</p>
          <p className="mt-1 text-sm text-red-600">
            Need help? Email{" "}
            <a href="mailto:bolt@bookasloth.in" className="font-medium underline">bolt@bookasloth.in</a>.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-5 rounded-2xl border bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-lg font-semibold text-gray-900">{booking.service_title || "Your booking"}</p>
              {booking.host_name && <p className="text-sm text-gray-500">with {booking.host_name}</p>}
            </div>
            <StatusPill status={booking.status} />
          </div>

          <div className="space-y-2.5 border-t pt-4 text-sm text-gray-700">
            <p className="flex items-center gap-2"><Calendar size={16} className="text-gray-400" /> {fmtDate(booking.scheduled_at)}</p>
            <p className="flex items-center gap-2"><Clock size={16} className="text-gray-400" /> {fmtTime(booking.scheduled_at)}</p>
            {booking.meeting_mode === "offline" && booking.location && (
              <p className="flex items-start gap-2">
                <MapPin size={16} className="mt-0.5 shrink-0 text-gray-400" />
                <span>
                  {booking.location}
                  {booking.map_link && (
                    <> · <a href={booking.map_link} target="_blank" rel="noreferrer" className="font-medium text-[#FE5100] underline">Directions</a></>
                  )}
                </span>
              </p>
            )}
            {booking.meeting_mode !== "offline" && booking.meeting_link && (
              <p className="flex items-center gap-2">
                <Video size={16} className="text-gray-400" />
                <a href={booking.meeting_link} target="_blank" rel="noreferrer" className="font-medium text-[#FE5100] underline">Join link</a>
              </p>
            )}
          </div>

          {booking.status === "cancelled" ? (
            <div className="flex items-center gap-2 rounded-xl bg-gray-50 p-3 text-sm text-gray-600">
              <CheckCircle2 size={16} className="text-gray-400" /> This booking has been cancelled.
            </div>
          ) : booking.cancellable ? (
            <div className="border-t pt-4">
              <button
                onClick={onCancel}
                disabled={cancelling}
                className="btn w-full rounded-xl border border-red-200 bg-red-50 py-3 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
              >
                {cancelling ? "Cancelling…" : "Cancel this booking"}
              </button>
              {booking.payment_status === "paid" && (
                <p className="mt-2 flex items-start gap-1.5 text-xs text-gray-500">
                  <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                  Cancelling does not refund automatically — contact the host or{" "}
                  <a href="mailto:bolt@bookasloth.in" className="underline">support</a>.
                </p>
              )}
              <p className="mt-3 text-center text-xs text-gray-400">
                Need to reschedule instead? Email{" "}
                <a href="mailto:bolt@bookasloth.in" className="underline">bolt@bookasloth.in</a>.
              </p>
            </div>
          ) : (
            <div className="rounded-xl bg-gray-50 p-3 text-sm text-gray-600">This booking can no longer be changed.</div>
          )}
        </div>
      )}
    </main>
  );
}
