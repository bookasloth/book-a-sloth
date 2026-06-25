import { useState, useEffect, useMemo } from "react";
import {
  getHostBookings,
  cancelBooking,
  completeBooking,
  rescheduleBooking,
  getAvailability,
  getBookedSlots,
} from "../services/api";
import toast from "react-hot-toast";
import { ChevronLeft, ChevronRight, Eye } from "lucide-react";
import ReviewModal from "../components/booking/ReviewModal";
import useFeatureFlags from "../hooks/useFeatureFlags";
import StatusChip from "../components/common/StatusChip";
import {
  PageHeader, Card, Button, SearchInput, FilterBar,
  StatusBadge, Modal, SkeletonCard, cn,
} from "../components/dashboard/ui";

const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const fmtTime = (iso) =>
  new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

const Row = ({ label, value, mono }) => (
  <div className="flex items-start justify-between gap-4">
    <span className="flex-shrink-0 text-xs text-gray-500">{label}</span>
    <span className={cn("text-right text-xs font-medium text-gray-800", mono && "font-mono")}>{value}</span>
  </div>
);

// ------ RESCHEDULE MODAL ------
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DS = ["S", "M", "T", "W", "T", "F", "S"];

const RescheduleModal = ({ booking, onClose, onDone }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [selDate, setSelDate] = useState(null);
  const [selTime, setSelTime] = useState("");
  const [saving, setSaving] = useState(false);
  const [avail, setAvail] = useState(null);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    getAvailability().then(({ data }) => setAvail(data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selDate || !booking?.host_id) return;
    setLoadingSlots(true);
    const d = selDate;
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    getBookedSlots(booking.host_id, dateStr)
      .then(({ data }) => setBookedSlots((data || []).filter((b) => b.id !== booking.id)))
      .catch(() => setBookedSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [selDate, booking]);

  const svcDuration = booking.services?.duration || 30;

  const getAvailSlots = () => {
    if (!selDate || !avail?.weekly_schedule) return [];
    const dayName = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][selDate.getDay()];
    const daySlots = avail.weekly_schedule[dayName] || [];
    const bufferMin = avail.buffer_minutes || 0;
    const stepMin = svcDuration + bufferMin;
    const slots = [];
    const now = new Date();
    const isToday = selDate.toDateString() === now.toDateString();
    const nowMin = isToday ? now.getHours() * 60 + now.getMinutes() + 1 : 0;

    for (const { start, end } of daySlots) {
      const [sh, sm] = start.split(":").map(Number);
      const [eh, em] = end.split(":").map(Number);
      let cur = sh * 60 + sm;
      const endMin = eh * 60 + em;
      while (cur + svcDuration <= endMin) {
        if (!isToday || cur >= nowMin) {
          const h = Math.floor(cur / 60), m = cur % 60;
          const tStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
          const sStart = new Date(selDate.getFullYear(), selDate.getMonth(), selDate.getDate(), h, m);
          const sEnd = new Date(sStart.getTime() + svcDuration * 60000);
          const blocked = bookedSlots.some((b) => {
            const bS = new Date(b.scheduled_at);
            const bE = new Date(bS.getTime() + (b.services?.duration || 30) * 60000);
            return sStart < bE && sEnd > bS;
          });
          if (!blocked) slots.push(tStr);
        }
        cur += stepMin;
      }
    }
    return slots;
  };

  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);

  const isDateSelectable = (d) => {
    const date = new Date(calYear, calMonth, d);
    if (date < today) return false;
    if (!avail?.weekly_schedule) return true;
    const name = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][date.getDay()];
    return (avail.weekly_schedule[name] || []).length > 0;
  };

  const isSel = (d) => selDate && selDate.getDate() === d && selDate.getMonth() === calMonth && selDate.getFullYear() === calYear;

  const save = async () => {
    if (!selDate || !selTime) { toast.error("Pick date and time"); return; }
    const [h, m] = selTime.split(":").map(Number);
    const dt = new Date(selDate.getFullYear(), selDate.getMonth(), selDate.getDate(), h, m);
    if (dt <= new Date()) { toast.error("Must be a future time"); return; }
    setSaving(true);
    try {
      await rescheduleBooking(booking.id, { scheduled_at: dt.toISOString() });
      toast.success("Booking rescheduled!");
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  const slots = getAvailSlots();
  const formatSlot = (t) => {
    const [h, m] = t.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM", hr = h % 12 || 12;
    return `${hr}:${String(m).padStart(2, "0")} ${ampm}`;
  };

  return (
    <Modal open onClose={onClose} title="Reschedule Booking" size="sm">
      <p className="mb-4 text-xs text-gray-400">{booking.services?.title} &bull; {booking.guest_name}</p>

      {/* Calendar */}
      <div className="mb-3 flex items-center justify-between">
        <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); }} className="rounded-lg p-1.5 hover:bg-gray-100">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold">{MONTHS[calMonth]} {calYear}</span>
        <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); }} className="rounded-lg p-1.5 hover:bg-gray-100">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="mb-1 grid grid-cols-7 text-center text-[10px] font-medium text-gray-400">
        {DS.map((d, i) => <div key={i}>{d}</div>)}
      </div>
      <div className="mb-4 grid grid-cols-7 gap-0.5 text-center">
        {cells.map((day, i) => {
          if (!day) return <div key={"e" + i} />;
          const ok = isDateSelectable(day);
          return (
            <button key={day} disabled={!ok}
              onClick={() => { if (ok) { setSelDate(new Date(calYear, calMonth, day)); setSelTime(""); } }}
              className={cn("rounded-lg py-1.5 text-xs transition-colors", isSel(day) ? "bg-primary font-semibold text-white" : !ok ? "cursor-default text-gray-300" : "hover:bg-gray-100")}>
              {day}
            </button>
          );
        })}
      </div>

      {/* Time slots from availability */}
      {selDate && (
        <div className="mb-4">
          <p className="mb-2 text-xs font-medium text-gray-500">
            Available times
            {avail?.timezone ? <span className="ml-1 text-gray-400">({avail.timezone.split("/")[1] || avail.timezone})</span> : ""}
          </p>
          {loadingSlots ? (
            <p className="py-2 text-xs text-gray-400">Loading slots…</p>
          ) : slots.length === 0 ? (
            <p className="py-2 text-xs text-gray-400">No available slots for this date.</p>
          ) : (
            <div className="grid max-h-40 grid-cols-3 gap-1.5 overflow-y-auto pr-1">
              {slots.map((t) => (
                <button key={t} onClick={() => setSelTime(t)}
                  className={cn("rounded-lg border py-2 text-xs font-medium transition-colors", selTime === t ? "border-primary bg-primary text-white" : "hover:border-gray-400")}>
                  {formatSlot(t)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <Button variant="outline" full onClick={onClose}>Cancel</Button>
        <Button full onClick={save} disabled={saving || !selDate || !selTime}>{saving ? "Saving…" : "Confirm"}</Button>
      </div>
    </Modal>
  );
};

// ------ DETAILS MODAL ------
const DetailsModal = ({ booking, onClose, onAction }) => {
  const { on } = useFeatureFlags();
  const [confirming, setConfirming] = useState(null); // 'cancel' | 'delete' | 'complete'
  const [busy, setBusy] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [showReview, setShowReview] = useState(false);

  const doAction = async (action) => {
    setBusy(true);
    try {
      if (action === "complete") {
        await completeBooking(booking.id);
        toast.success("Marked as completed");
      }
      if (action === "cancel") {
        await cancelBooking(booking.id);
        toast.success("Booking cancelled");
      }
      onAction();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setBusy(false);
      setConfirming(null);
    }
  };

  const dt = new Date(booking.scheduled_at);
  const endDt = new Date(dt.getTime() + (booking.services?.duration || 30) * 60000);

  if (showReschedule)
    return (
      <RescheduleModal
        booking={booking}
        onClose={() => setShowReschedule(false)}
        onDone={() => { setShowReschedule(false); onAction(); onClose(); }}
      />
    );

  if (showReview)
    return (
      <ReviewModal
        open
        booking={booking}
        direction="host_to_guest"
        onClose={() => setShowReview(false)}
        onDone={() => { setShowReview(false); onClose(); }}
      />
    );

  return (
    <Modal open onClose={onClose} title="Booking Details" size="lg">
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <p className="font-mono text-xs text-gray-400">#{booking.id.slice(0, 8).toUpperCase()}</p>
          <StatusChip status={booking.status} />
        </div>

        {/* Service */}
        <section>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Service</h4>
          <div className="space-y-2 rounded-xl bg-gray-50 p-4">
            <Row label="Service" value={booking.services?.title || "N/A"} />
            <Row label="Duration" value={(booking.services?.duration || 30) + " min"} />
            <Row label="Price" value={booking.services?.price === 0 ? "Free" : `₹${booking.services?.price}`} />
            <Row label="Mode" value={booking.services?.meeting_mode === "offline" ? "In-person" : "Online"} />
          </div>
        </section>

        {/* Booking Date & Time */}
        <section>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Booking Date & Time</h4>
          <div className="space-y-2 rounded-xl bg-gray-50 p-4">
            <Row label="Date" value={fmtDate(booking.scheduled_at)} />
            <Row label="Time Slot" value={fmtTime(dt) + " - " + fmtTime(endDt)} />
            <Row label="Booked on" value={fmtDate(booking.created_at)} />
            {booking.notes && <Row label="Notes" value={booking.notes} />}
          </div>
        </section>

        {/* Customer */}
        <section>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Customer Details</h4>
          <div className="space-y-2 rounded-xl bg-gray-50 p-4">
            <Row label="Name" value={booking.guest_name || "Guest"} />
            <Row label="Email" value={booking.guest_email || "-"} />
            <Row label="Phone" value={booking.guest_phone || "-"} />
          </div>
        </section>

        {/* Payment */}
        <section>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Payment Details</h4>
          <div className="space-y-2 rounded-xl bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Payment Status</span>
              <StatusBadge status={booking.payment_status} />
            </div>
            <Row label="Total Amount" value={booking.services?.price === 0 ? "Free" : `₹${booking.services?.price}`} />
            {booking.vendor_amount != null && <Row label="Your Earnings" value={`₹${booking.vendor_amount}`} />}
            {booking.platform_fee_amount != null && <Row label="Platform Fee" value={`₹${booking.platform_fee_amount}`} />}
            {booking.razorpay_order_id && <Row label="Order Ref" value={booking.razorpay_order_id} mono />}
            {booking.razorpay_payment_id && <Row label="Payment Ref" value={booking.razorpay_payment_id} mono />}
            {booking.meeting_link && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Meet Link</span>
                <a href={booking.meeting_link} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">Join</a>
              </div>
            )}
          </div>
        </section>

        {/* Reschedule status */}
        {booking.reschedule_status && booking.reschedule_status !== "none" && (
          <div className={cn("rounded-xl px-4 py-3 text-xs font-medium", booking.reschedule_status === "acknowledged" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700")}>
            {booking.reschedule_status === "awaiting_guest_ack"
              ? "Awaiting guest acknowledgement of reschedule"
              : "Guest acknowledged the new time"}
          </div>
        )}

        {/* Actions */}
        {confirming ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="mb-3 text-sm font-medium text-red-700">
              {confirming === "cancel" ? "Cancel this booking? The guest will be notified." : "Mark as completed?"}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" full onClick={() => setConfirming(null)}>Back</Button>
              <Button full variant={confirming === "cancel" ? "danger" : "primary"} onClick={() => doAction(confirming)} disabled={busy}>
                {busy ? "..." : `Yes, ${confirming}`}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 pt-1">
            {booking.status === "confirmed" && new Date(booking.scheduled_at) > new Date() && (
              <Button variant="outline" className="min-w-[120px] flex-1 text-primary" onClick={() => setShowReschedule(true)}>Reschedule</Button>
            )}
            {booking.status === "confirmed" && new Date(booking.scheduled_at) <= new Date() && (
              <Button className="min-w-[120px] flex-1" onClick={() => setConfirming("complete")}>Mark Completed</Button>
            )}
            {booking.status !== "cancelled" && booking.status !== "completed" && (
              <Button variant="danger-outline" className="min-w-[120px] flex-1" onClick={() => setConfirming("cancel")}>Cancel Booking</Button>
            )}
            {booking.status === "completed" && on("review_submission") && booking.guest_id && (
              <Button className="min-w-[120px] flex-1" onClick={() => setShowReview(true)}>Review Guest</Button>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

// ------ MAIN BOOKINGS PAGE ------
const PAGE_SIZE = 10;

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);

  const fetch = async () => {
    try {
      const { data } = await getHostBookings();
      setBookings(data || []);
    } catch {
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  const filtered = useMemo(() => {
    const now = new Date();
    let list = bookings;
    if (filter === "upcoming")
      list = list.filter((b) => b.status !== "cancelled" && new Date(b.scheduled_at) > now);
    else if (filter === "past")
      list = list.filter((b) => b.status !== "cancelled" && new Date(b.scheduled_at) <= now);
    else if (filter === "cancelled")
      list = list.filter((b) => b.status === "cancelled");
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (b) =>
          (b.guest_name || "").toLowerCase().includes(q) ||
          (b.guest_email || "").toLowerCase().includes(q) ||
          (b.services?.title || "").toLowerCase().includes(q) ||
          (b.id || "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [bookings, filter, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const counts = (() => {
    const now = new Date();
    return {
      all: bookings.length,
      upcoming: bookings.filter((b) => b.status !== "cancelled" && new Date(b.scheduled_at) > now).length,
      past: bookings.filter((b) => b.status !== "cancelled" && new Date(b.scheduled_at) <= now).length,
      cancelled: bookings.filter((b) => b.status === "cancelled").length,
    };
  })();

  if (loading) {
    return (
      <div>
        <PageHeader title="Bookings" subtitle="Manage your appointments." />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div>
      {selected && <DetailsModal booking={selected} onClose={() => setSelected(null)} onAction={fetch} />}

      <PageHeader
        title="Bookings"
        subtitle={`${bookings.length} total bookings`}
        actions={
          <SearchInput
            value={search}
            onChange={(v) => { setSearch(v); setPage(1); }}
            placeholder="Search customer, service…"
            className="sm:w-64"
          />
        }
      />

      {/* Filter tabs */}
      <FilterBar className="mb-5 flex-nowrap overflow-x-auto pb-1">
        {["all", "upcoming", "past", "cancelled"].map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f); setPage(1); }}
            className={cn(
              "whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-medium transition-colors",
              filter === f ? "bg-gray-900 text-white" : "border bg-white text-gray-500 hover:bg-gray-50",
            )}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
          </button>
        ))}
      </FilterBar>

      {/* Table */}
      <Card padded={false} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3 text-left font-semibold">Booking</th>
                <th className="px-4 py-3 text-left font-semibold">Customer</th>
                <th className="hidden px-4 py-3 text-left font-semibold md:table-cell">Phone</th>
                <th className="hidden px-4 py-3 text-left font-semibold sm:table-cell">Service</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="hidden px-4 py-3 text-left font-semibold md:table-cell">Payment</th>
                <th className="px-4 py-3 text-center font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paged.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-sm text-gray-400">No bookings found.</td></tr>
              ) : (
                paged.map((b) => (
                  <tr key={b.id} className="transition-colors hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs text-gray-400">#{b.id.slice(0, 8).toUpperCase()}</p>
                      <p className="mt-0.5 text-xs text-gray-600">{fmtDate(b.scheduled_at)}</p>
                      <p className="text-xs text-gray-400">{fmtTime(new Date(b.scheduled_at))}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{b.guest_name || "Guest"}</p>
                      <p className="max-w-[160px] truncate text-xs text-gray-400">{b.guest_email || "-"}</p>
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-gray-500 md:table-cell">{b.guest_phone || "-"}</td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <p className="max-w-[140px] truncate text-xs text-gray-700">{b.services?.title || "-"}</p>
                      <p className="text-xs text-gray-400">{b.services?.price === 0 ? "Free" : `₹${b.services?.price}`}</p>
                    </td>
                    <td className="px-4 py-3"><StatusChip status={b.status} /></td>
                    <td className="hidden px-4 py-3 md:table-cell"><StatusBadge status={b.payment_status} /></td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => setSelected(b)} title="View details"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-primary">
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-gray-500">
            <span className="text-xs">
              Showing {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = page <= 3 ? i + 1 : page + i - 2;
                if (p < 1 || p > totalPages) return null;
                return (
                  <Button key={p} size="sm" variant={p === page ? "primary" : "outline"} onClick={() => setPage(p)}>{p}</Button>
                );
              })}
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Bookings;
