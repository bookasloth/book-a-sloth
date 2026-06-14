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

const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  confirmed: "bg-green-100 text-green-700 border-green-200",
  completed: "bg-blue-100 text-blue-600 border-blue-200",
  cancelled: "bg-red-100 text-red-600 border-red-200",
};
const PAY_COLORS = {
  paid: "bg-emerald-100 text-emerald-700",
  unpaid: "bg-gray-100 text-gray-500",
  refunded: "bg-orange-100 text-orange-600",
};

const fmt = (iso, tz) =>
  new Date(iso).toLocaleString("en-IN", {
    timeZone: tz || "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
const fmtTime = (iso) =>
  new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

// ------ RESCHEDULE MODAL ------
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DS = ["S", "M", "T", "W", "T", "F", "S"];

const RescheduleModal = ({ booking, onClose, onDone }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [selDate, setSelDate] = useState(null);
  const [selTime, setSelTime] = useState("");
  const [saving, setSaving] = useState(false);
  // BUG-14 fixed: fetch availability so only valid slots are shown
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
    const dayName = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"][selDate.getDay()];
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
          const tStr = `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
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
    const name = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"][date.getDay()];
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
    return `${hr}:${String(m).padStart(2,"0")} ${ampm}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="font-semibold text-sm">Reschedule Booking</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-5">
          <p className="text-xs text-gray-400 mb-4">{booking.services?.title} &bull; {booking.guest_name}</p>

          {/* Calendar */}
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); }} className="p-1.5 hover:bg-gray-100 rounded-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <span className="text-sm font-semibold">{MONTHS[calMonth]} {calYear}</span>
            <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); }} className="p-1.5 hover:bg-gray-100 rounded-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
          <div className="grid grid-cols-7 text-center text-[10px] font-medium text-gray-400 mb-1">
            {DS.map((d, i) => <div key={i}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-0.5 text-center mb-4">
            {cells.map((day, i) => {
              if (!day) return <div key={"e" + i} />;
              const ok = isDateSelectable(day);
              return (
                <button key={day} disabled={!ok}
                  onClick={() => { if (ok) { setSelDate(new Date(calYear, calMonth, day)); setSelTime(""); } }}
                  className={`py-1.5 rounded-lg text-xs transition-colors ${isSel(day) ? "bg-primary text-white font-semibold" : !ok ? "text-gray-300 cursor-default" : "hover:bg-gray-100"}`}>
                  {day}
                </button>
              );
            })}
          </div>

          {/* Time slots from availability */}
          {selDate && (
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-500 mb-2">
                Available times
                {avail?.timezone ? <span className="ml-1 text-gray-400">({avail.timezone.split("/")[1] || avail.timezone})</span> : ""}
              </p>
              {loadingSlots ? (
                <p className="text-xs text-gray-400 py-2">Loading slots…</p>
              ) : slots.length === 0 ? (
                <p className="text-xs text-gray-400 py-2">No available slots for this date.</p>
              ) : (
                <div className="grid grid-cols-3 gap-1.5 max-h-40 overflow-y-auto pr-1">
                  {slots.map((t) => (
                    <button key={t} onClick={() => setSelTime(t)}
                      className={`py-2 rounded-lg text-xs font-medium border transition-colors ${selTime === t ? "bg-primary text-white border-primary" : "hover:border-gray-400"}`}>
                      {formatSlot(t)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={onClose} className="btn btn--outline flex-1 py-2.5 text-sm text-gray-500">Cancel</button>
            <button onClick={save} disabled={saving || !selDate || !selTime}
              className="btn flex-1 bg-primary text-white py-2.5 text-sm font-semibold disabled:opacity-40">
              {saving ? "Saving…" : "Confirm"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ------ DETAILS MODAL ------
const DetailsModal = ({ booking, onClose, onAction }) => {
  const [confirming, setConfirming] = useState(null); // 'cancel' | 'delete' | 'complete'
  const [busy, setBusy] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);

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
  const endDt = new Date(
    dt.getTime() + (booking.services?.duration || 30) * 60000,
  );

  if (showReschedule)
    return (
      <RescheduleModal
        booking={booking}
        onClose={() => setShowReschedule(false)}
        onDone={() => {
          setShowReschedule(false);
          onAction();
          onClose();
        }}
      />
    );

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-4 border-b z-10">
          <div>
            <h3 className="font-bold text-base">Booking Details</h3>
            <p className="text-xs text-gray-400 font-mono">
              #{booking.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs px-2.5 py-1 rounded-full border font-medium ${STATUS_COLORS[booking.status]}`}
            >
              {booking.status}
            </span>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 ml-1"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Service */}
          <section>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Service
            </h4>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <Row label="Service" value={booking.services?.title || "N/A"} />
              <Row
                label="Duration"
                value={(booking.services?.duration || 30) + " min"}
              />
              <Row
                label="Price"
                value={
                  booking.services?.price === 0
                    ? "Free"
                    : `Rs.${booking.services?.price}`
                }
              />
              <Row
                label="Mode"
                value={
                  booking.services?.meeting_mode === "offline"
                    ? "In-person"
                    : "Online"
                }
              />
            </div>
          </section>

          {/* Booking Date & Time */}
          <section>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Booking Date & Time
            </h4>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <Row label="Date" value={fmtDate(booking.scheduled_at)} />
              <Row
                label="Time Slot"
                value={fmtTime(dt) + " - " + fmtTime(endDt)}
              />
              <Row label="Booked on" value={fmtDate(booking.created_at)} />
              {booking.notes && <Row label="Notes" value={booking.notes} />}
            </div>
          </section>

          {/* Customer */}
          <section>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Customer Details
            </h4>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <Row label="Name" value={booking.guest_name || "Guest"} />
              <Row label="Email" value={booking.guest_email || "-"} />
              <Row label="Phone" value={booking.guest_phone || "-"} />
            </div>
          </section>

          {/* Payment */}
          <section>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Payment Details
            </h4>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Payment Status</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${PAY_COLORS[booking.payment_status]}`}
                >
                  {booking.payment_status}
                </span>
              </div>
              <Row
                label="Total Amount"
                value={
                  booking.services?.price === 0
                    ? "Free"
                    : `Rs.${booking.services?.price}`
                }
              />
              {booking.vendor_amount != null && (
                <Row
                  label="Your Earnings"
                  value={`Rs.${booking.vendor_amount}`}
                />
              )}
              {booking.platform_fee_amount != null && (
                <Row
                  label="Platform Fee"
                  value={`Rs.${booking.platform_fee_amount}`}
                />
              )}
              {booking.razorpay_order_id && (
                <Row label="Order Ref" value={booking.razorpay_order_id} mono />
              )}
              {booking.razorpay_payment_id && (
                <Row
                  label="Payment Ref"
                  value={booking.razorpay_payment_id}
                  mono
                />
              )}
              {booking.meeting_link && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Meet Link</span>
                  <a
                    href={booking.meeting_link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary hover:underline"
                  >
                    Join
                  </a>
                </div>
              )}
            </div>
          </section>

          {/* Reschedule status */}
          {booking.reschedule_status &&
            booking.reschedule_status !== "none" && (
              <div
                className={`px-4 py-3 rounded-xl text-xs font-medium ${booking.reschedule_status === "acknowledged" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}
              >
                {booking.reschedule_status === "awaiting_guest_ack"
                  ? "Awaiting guest acknowledgement of reschedule"
                  : "Guest acknowledged the new time"}
              </div>
            )}

          {/* Actions */}
          {confirming ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-700 mb-3 font-medium">
                {confirming === "cancel"
                  ? "Cancel this booking? The guest will be notified."
                  : "Mark as completed?"}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirming(null)}
                  className="btn btn--outline flex-1 py-2 text-sm text-gray-500"
                >
                  Back
                </button>
                <button
                  onClick={() => doAction(confirming)}
                  disabled={busy}
                  className={`btn flex-1 py-2 text-sm font-semibold text-white disabled:opacity-50 ${confirming === "cancel" ? "bg-red-500" : "bg-primary"}`}
                >
                  {busy ? "..." : `Yes, ${confirming}`}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 pt-1">
              {booking.status === "confirmed" &&
                new Date(booking.scheduled_at) > new Date() && (
                  <button
                    onClick={() => setShowReschedule(true)}
                    className="btn btn--outline flex-1 min-w-[120px] text-primary py-2 text-sm font-medium hover:bg-primary/5"
                  >
                    Reschedule
                  </button>
                )}
              {booking.status === "confirmed" &&
                new Date(booking.scheduled_at) <= new Date() && (
                  <button
                    onClick={() => setConfirming("complete")}
                    className="btn flex-1 min-w-[120px] bg-primary text-white py-2 text-sm font-medium"
                  >
                    Mark Completed
                  </button>
                )}
              {booking.status !== "cancelled" &&
                booking.status !== "completed" && (
                  <button
                    onClick={() => setConfirming("cancel")}
                    className="btn btn--outline flex-1 min-w-[120px] text-red-500 py-2 text-sm font-medium hover:bg-red-50"
                  >
                    Cancel Booking
                  </button>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Row = ({ label, value, mono }) => (
  <div className="flex items-start justify-between gap-4">
    <span className="text-xs text-gray-500 flex-shrink-0">{label}</span>
    <span
      className={`text-xs text-gray-800 font-medium text-right ${mono ? "font-mono" : ""}`}
    >
      {value}
    </span>
  </div>
);

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

  useEffect(() => {
    fetch();
  }, []);

  // BUG-19 fixed: `now` is recalculated inside useMemo so past/upcoming is always current
  const filtered = useMemo(() => {
    const now = new Date();
    let list = bookings;
    if (filter === "upcoming")
      list = list.filter(
        (b) => b.status !== "cancelled" && new Date(b.scheduled_at) > now,
      );
    else if (filter === "past")
      list = list.filter(
        (b) => b.status !== "cancelled" && new Date(b.scheduled_at) <= now,
      );
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

  // BUG-19: recalculate now for counts too
  const counts = (() => {
    const now = new Date();
    return {
      all: bookings.length,
      upcoming: bookings.filter((b) => b.status !== "cancelled" && new Date(b.scheduled_at) > now).length,
      past: bookings.filter((b) => b.status !== "cancelled" && new Date(b.scheduled_at) <= now).length,
      cancelled: bookings.filter((b) => b.status === "cancelled").length,
    };
  })();

  if (loading)
    return <div className="text-center py-16 text-gray-400">Loading...</div>;

  return (
    <div className="w-full max-w-6xl">
      {selected && (
        <DetailsModal
          booking={selected}
          onClose={() => setSelected(null)}
          onAction={fetch}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Bookings</h1>
          <p className="text-sm text-gray-400">
            {bookings.length} total bookings
          </p>
        </div>
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search customer, service..."
          className="fb-input sm:w-64"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {["all", "upcoming", "past", "cancelled"].map((f) => (
          <button
            key={f}
            onClick={() => {
              setFilter(f);
              setPage(1);
            }}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === f ? "bg-gray-900 text-white" : "bg-white border text-gray-500 hover:bg-gray-50"}`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm fb-table">
            <thead>
              <tr className="border-b bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3 text-left font-semibold">Booking</th>
                <th className="px-4 py-3 text-left font-semibold">Customer</th>
                <th className="px-4 py-3 text-left font-semibold hidden md:table-cell">
                  Phone
                </th>
                <th className="px-4 py-3 text-left font-semibold hidden sm:table-cell">
                  Service
                </th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold hidden md:table-cell">
                  Payment
                </th>
                <th className="px-4 py-3 text-center font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paged.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-gray-400 text-sm"
                  >
                    No bookings found.
                  </td>
                </tr>
              ) : (
                paged.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                    <td data-label="Booking" className="px-4 py-3">
                      <p className="font-mono text-xs text-gray-400">
                        #{b.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {fmtDate(b.scheduled_at)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {fmtTime(new Date(b.scheduled_at))}
                      </p>
                    </td>
                    <td data-label="Customer" className="px-4 py-3">
                      <p className="font-medium text-gray-800">
                        {b.guest_name || "Guest"}
                      </p>
                      <p className="text-xs text-gray-400 truncate max-w-[160px]">
                        {b.guest_email || "-"}
                      </p>
                    </td>
                    <td
                      data-label="Phone"
                      className="px-4 py-3 hidden md:table-cell text-xs text-gray-500"
                    >
                      {b.guest_phone || "-"}
                    </td>
                    <td
                      data-label="Service"
                      className="px-4 py-3 hidden sm:table-cell"
                    >
                      <p className="text-xs text-gray-700 max-w-[140px] truncate">
                        {b.services?.title || "-"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {b.services?.price === 0
                          ? "Free"
                          : `Rs.${b.services?.price}`}
                      </p>
                    </td>
                    <td data-label="Status" className="px-4 py-3">
                      <span
                        className={`inline-block text-[11px] px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[b.status]}`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td
                      data-label="Payment"
                      className="px-4 py-3 hidden md:table-cell"
                    >
                      <span
                        className={`inline-block text-[11px] px-2 py-0.5 rounded-full font-medium ${PAY_COLORS[b.payment_status]}`}
                      >
                        {b.payment_status}
                      </span>
                    </td>
                    <td data-label="Action" className="px-4 py-3 text-center">
                      <button
                        onClick={() => setSelected(b)}
                        title="View details"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 text-gray-500 hover:text-primary transition-colors"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
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
          <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-gray-500">
            <span className="text-xs">
              Showing {(page - 1) * PAGE_SIZE + 1}-
              {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn btn--outline px-3 py-1 text-xs disabled:opacity-40 hover:bg-gray-50"
              >
                Prev
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = page <= 3 ? i + 1 : page + i - 2;
                if (p < 1 || p > totalPages) return null;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`btn px-3 py-1 text-xs ${p === page ? "bg-primary text-white" : "btn--outline hover:bg-gray-50"}`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn btn--outline px-3 py-1 text-xs disabled:opacity-40 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Bookings;
