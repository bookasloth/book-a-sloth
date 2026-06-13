import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminGetBookings, adminUpdateBooking, adminDeleteBooking } from '../../services/api';
import toast from 'react-hot-toast';

// ───────────────────────────────────────────────────────────────
// Admin Bookings — support/operations console
//
// SCOPE NOTE (UI/UX restructure only):
//   The list endpoint (GET /admin/bookings) currently supports only
//   { status, page, limit }. There is NO server-side search or
//   time-aware state filter. Per the redesign brief we do NOT add
//   backend features here, so search + operational-state filtering
//   are done CLIENT-SIDE over a generously-limited fetch. A real
//   backend search/state endpoint is future work (see TODO below).
//
//   Likewise: Disputes (no `dispute` column), Payouts (P2 not built),
//   Session start/end timestamps, meeting provider/id, vendor phone,
//   and several actions are PLACEHOLDERS. They are intentionally left
//   visible + active-styled and wired to notImplemented() so the final
//   workflow is locked in before the backend lands.
// ───────────────────────────────────────────────────────────────

// TODO(backend): add GET /admin/bookings search params (q matches
// booking id / guest_phone / guest_email) + server-side operational
// state filter so we can drop the high-limit client-side fetch below.
const FETCH_LIMIT = 200;

// ── Inline SVG icons (no emoji — consistent 1.75 stroke) ──────────
const Ic = ({ d, size = 16, className = '', strokeWidth = 1.75 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
    className={`flex-shrink-0 ${className}`}>
    {(Array.isArray(d) ? d : [d]).map((p, i) => <path key={i} d={p} />)}
  </svg>
);

const IC = {
  search:  'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  eye:     ['M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z', 'M12 9a3 3 0 100 6 3 3 0 000-6z'],
  pencil:  ['M12 20h9', 'M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4 12.5-12.5z'],
  x:       ['M18 6L6 18', 'M6 6l12 12'],
  clock:   ['M12 2a10 10 0 100 20A10 10 0 0012 2z', 'M12 7v5l3 2'],
  calendar:'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  user:    ['M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2', 'M12 7a4 4 0 100 8 4 4 0 000-8z'],
  building:['M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z', 'M9 22V12h6v10'],
  mail:    ['M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z', 'M22 6l-10 7L2 6'],
  phone:   ['M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0122 16.92z'],
  copy:    ['M9 9h10a2 2 0 012 2v10a2 2 0 01-2 2H9a2 2 0 01-2-2V11a2 2 0 012-2z', 'M5 15H4a2 2 0 01-2-2V3a2 2 0 012-2h10a2 2 0 012 2v1'],
  external:['M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6', 'M15 3h6v6', 'M10 14L21 3'],
  link:    ['M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71', 'M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71'],
  video:   ['M23 7l-7 5 7 5V7z', 'M14 5H3a2 2 0 00-2 2v10a2 2 0 002 2h11a2 2 0 002-2V7a2 2 0 00-2-2z'],
  card:    ['M21 4H3a2 2 0 00-2 2v12a2 2 0 002 2h18a2 2 0 002-2V6a2 2 0 00-2-2z', 'M1 10h22'],
  wallet:  ['M21 12V7H5a2 2 0 010-4h14v4', 'M3 5v14a2 2 0 002 2h16v-5', 'M18 12a2 2 0 000 4h4v-4z'],
  refresh: ['M1 4v6h6', 'M23 20v-6h-6', 'M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15'],
  alert:   ['M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z', 'M12 9v4', 'M12 17h.01'],
  check:   'M20 6L9 17l-5-5',
  checkCircle: ['M22 11.08V12a10 10 0 11-5.93-9.14', 'M22 4L12 14.01l-3-3'],
  xCircle: ['M12 2a10 10 0 100 20A10 10 0 0012 2z', 'M15 9l-6 6', 'M9 9l6 6'],
  ban:     ['M12 2a10 10 0 100 20A10 10 0 0012 2z', 'M4.93 4.93l14.14 14.14'],
  trash:   ['M3 6h18', 'M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2'],
  chevD:   'M6 9l6 6 6-6',
  chevR:   'M9 18l6-6-6-6',
  msg:     'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z',
  shield:  ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'],
  swap:    ['M16 3h5v5', 'M4 20L21 3', 'M21 16v5h-5', 'M15 15l6 6', 'M4 4l5 5'],
  note:    ['M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z', 'M14 2v6h6', 'M16 13H8', 'M16 17H8'],
  zap:     'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  dot:     'M12 12m-3 0a3 3 0 106 0 3 3 0 10-6 0',
  inbox:   ['M22 12h-6l-2 3h-4l-2-3H2', 'M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z'],
};

// ── Operational state model ───────────────────────────────────────
// UI philosophy: future = Upcoming, ongoing = Live, past = Completed.
// Backend has no `dispute` flag yet, so DISPUTED is never derived here
// (the Disputes tab shows an empty state). The modal still designs the
// full disputed action-set for when the backend lands.
const STATES = {
  upcoming:  { label: 'Upcoming',  icon: IC.clock,       badge: 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/15',     dot: 'bg-blue-500' },
  live:      { label: 'Live',      icon: IC.dot,         badge: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/15', dot: 'bg-emerald-500 animate-pulse' },
  completed: { label: 'Completed', icon: IC.checkCircle, badge: 'bg-gray-100 text-gray-600 ring-1 ring-gray-500/15',    dot: 'bg-gray-400' },
  cancelled: { label: 'Cancelled', icon: IC.xCircle,     badge: 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/15',     dot: 'bg-rose-500' },
  disputed:  { label: 'Disputed',  icon: IC.alert,       badge: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/15',  dot: 'bg-amber-500' },
};

const PAYMENT = {
  paid:     { label: 'Paid',     badge: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/15' },
  unpaid:   { label: 'Unpaid',   badge: 'bg-gray-100 text-gray-500 ring-1 ring-gray-400/20' },
  refunded: { label: 'Refunded', badge: 'bg-purple-50 text-purple-700 ring-1 ring-purple-600/15' },
};

const deriveState = (b, now = Date.now()) => {
  if (b.status === 'cancelled') return 'cancelled';
  const start = new Date(b.scheduled_at).getTime();
  const durMin = b.services?.duration || 30;
  const end = start + durMin * 60000;
  if (b.status === 'completed' || end < now) return 'completed';
  if (now >= start && now <= end) return 'live';
  return 'upcoming';
};

// Tabs map 1:1 to the existing /admin/bookings/:filter routes used by the sidebar.
const TABS = [
  { key: 'all',       label: 'All',       to: '/admin/bookings' },
  { key: 'upcoming',  label: 'Upcoming',  to: '/admin/bookings/upcoming' },
  { key: 'live',      label: 'Live',      to: '/admin/bookings/live' },
  { key: 'completed', label: 'Completed', to: '/admin/bookings/completed' },
  { key: 'cancelled', label: 'Cancelled', to: '/admin/bookings/cancelled' },
  { key: 'disputes',  label: 'Disputes',  to: '/admin/bookings/disputes' },
];

// ── Formatting helpers ────────────────────────────────────────────
const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const shortId = (id) => (id ? `#${String(id).slice(0, 8).toUpperCase()}` : '#—');
const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
const fmtTime = (d) => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
const endTime = (b) => {
  const durMin = b.services?.duration || 30;
  return new Date(new Date(b.scheduled_at).getTime() + durMin * 60000);
};
const meetingProvider = (link) => {
  if (!link) return '—';
  if (/meet\.google/.test(link)) return 'Google Meet';
  if (/zoom\./.test(link)) return 'Zoom';
  return 'Online';
};
const meetingId = (link) => {
  if (!link) return '—';
  try { return new URL(link).pathname.split('/').filter(Boolean).pop() || '—'; }
  catch { return '—'; }
};
const copy = (val, label) => {
  if (!val) return toast.error(`No ${label} to copy`);
  navigator.clipboard?.writeText(val).then(() => toast.success(`${label} copied`)).catch(() => toast.error('Copy failed'));
};
// Single sink for every not-yet-built action so the workflow stays visible.
const notImplemented = (name) => toast(`${name} — coming soon`, { icon: '🛠️' });

// ── Small presentational atoms ────────────────────────────────────
const StatePill = ({ state, size = 'sm' }) => {
  const s = STATES[state] || STATES.upcoming;
  const pad = size === 'lg' ? 'px-2.5 py-1 text-[12px]' : 'px-2 py-0.5 text-[11px]';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${pad} ${s.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
};

const PaymentPill = ({ status }) => {
  const p = PAYMENT[status] || PAYMENT.unpaid;
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${p.badge}`}>{p.label}</span>;
};

const IconBtn = ({ icon, label, onClick, href, tone = 'gray' }) => {
  const tones = {
    gray:    'text-gray-500 hover:text-gray-800 hover:bg-gray-100',
    primary: 'text-[#FE5100] hover:bg-[#FE5100]/10',
    danger:  'text-rose-500 hover:text-rose-700 hover:bg-rose-50',
  };
  const cls = `inline-flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${tones[tone]}`;
  if (href) return <a href={href} target="_blank" rel="noreferrer" title={label} aria-label={label} className={cls}><Ic d={icon} size={16} /></a>;
  return <button type="button" title={label} aria-label={label} onClick={onClick} className={cls}><Ic d={icon} size={16} /></button>;
};

// Action button used inside the detail modal's Actions sections.
const ActionBtn = ({ icon, label, onClick, href, variant = 'default' }) => {
  const variants = {
    default: 'border border-gray-200 text-gray-700 bg-white hover:bg-gray-50',
    primary: 'bg-[#FE5100] text-white hover:bg-[#e54900] border border-transparent shadow-sm',
    danger:  'border border-rose-200 text-rose-600 bg-white hover:bg-rose-50',
  };
  const cls = `inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${variants[variant]}`;
  if (href) return <a href={href} target="_blank" rel="noreferrer" className={cls}><Ic d={icon} size={15} />{label}</a>;
  return <button type="button" onClick={onClick} className={cls}><Ic d={icon} size={15} />{label}</button>;
};

// ── Booking card (fast-scan row) ──────────────────────────────────
const BookingCard = ({ b, state, onView, onEdit }) => {
  const price = b.services?.price || 0;
  return (
    <div className="group bg-white border border-gray-200/80 rounded-xl p-4 hover:border-gray-300 hover:shadow-sm transition-all">
      <div className="flex items-start gap-4">
        {/* Left: identity */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <code className="text-[12px] font-bold text-gray-900 font-mono">{shortId(b.id)}</code>
            <StatePill state={state} />
            <PaymentPill status={b.payment_status} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-[12.5px]">
            <p className="text-gray-600 truncate">
              <span className="text-gray-400">Customer</span>{' '}
              <span className="font-semibold text-gray-900">{b.guest_name || '—'}</span>
            </p>
            <p className="text-gray-600 truncate">
              <span className="text-gray-400">Vendor</span>{' '}
              <span className="font-semibold text-gray-900">{b.profiles?.name || '—'}</span>
            </p>
          </div>
          <div className="flex items-center gap-3 mt-1.5 text-[12px] text-gray-500 flex-wrap">
            <span className="inline-flex items-center gap-1"><Ic d={IC.calendar} size={13} className="text-gray-400" />{fmtDate(b.scheduled_at)}</span>
            <span className="inline-flex items-center gap-1"><Ic d={IC.clock} size={13} className="text-gray-400" />{fmtTime(b.scheduled_at)}</span>
            <span className="text-gray-400">·</span>
            <span>{b.services?.duration || 30} min</span>
            <span className="text-gray-300 truncate hidden md:inline">{b.services?.title || 'Service'}</span>
          </div>
        </div>

        {/* Right: price + quick actions */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <p className="font-bold text-sm text-gray-900">{inr(price)}</p>
          <div className="flex items-center gap-0.5">
            <IconBtn icon={IC.eye}    label="View details" tone="primary" onClick={() => onView(b)} />
            <IconBtn icon={IC.pencil} label="Edit booking"  tone="gray"    onClick={() => onEdit(b)} />
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Detail modal: the primary management interface ────────────────
const Row = ({ label, value, mono }) => (
  <div className="flex items-start justify-between gap-4 py-1.5">
    <span className="text-[12px] text-gray-400 flex-shrink-0">{label}</span>
    <span className={`text-[12.5px] text-gray-800 text-right ${mono ? 'font-mono' : 'font-medium'}`}>{value ?? '—'}</span>
  </div>
);

const Section = ({ title, icon, children, action }) => (
  <section className="border-b border-gray-100 last:border-0 py-4">
    <div className="flex items-center justify-between mb-2">
      <h4 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">
        {icon && <Ic d={icon} size={13} className="text-gray-400" />}{title}
      </h4>
      {action}
    </div>
    {children}
  </section>
);

const Timeline = ({ b }) => {
  // Built from real timestamps where available; the rest are designed-but-pending.
  const events = [
    { label: 'Booking Created',  at: b.created_at,            done: !!b.created_at },
    { label: 'Payment Received', at: b.paid_at,               done: b.payment_status === 'paid' || !!b.paid_at },
    { label: 'Vendor Confirmed', at: null,                    done: ['confirmed', 'completed'].includes(b.status) },
    { label: 'Reminder Sent',    at: null,                    done: !!(b.reminder_24h_sent || b.reminder_1h_sent) },
    { label: 'Session Started',  at: null,                    done: false, pending: true },  // TODO(backend): no session-start ts
    { label: 'Session Ended',    at: null,                    done: false, pending: true },  // TODO(backend): no session-end ts
    { label: 'Booking Completed', at: b.completed_at,         done: b.status === 'completed' || !!b.completed_at },
  ];
  return (
    <ol className="relative ml-1">
      {events.map((e, i) => (
        <li key={i} className="flex gap-3 pb-3 last:pb-0 relative">
          {i < events.length - 1 && <span className="absolute left-[6px] top-4 bottom-0 w-px bg-gray-200" />}
          <span className={`relative z-10 mt-1 w-3 h-3 rounded-full flex-shrink-0 ${e.done ? 'bg-[#FE5100]' : 'bg-gray-200 ring-2 ring-white'}`} />
          <div className="flex-1 min-w-0 flex items-baseline justify-between gap-2">
            <span className={`text-[12.5px] ${e.done ? 'font-medium text-gray-800' : 'text-gray-400'}`}>
              {e.label}{e.pending && <span className="ml-1.5 text-[10px] text-gray-300">(pending)</span>}
            </span>
            {e.at && <span className="text-[11px] text-gray-400 flex-shrink-0">{fmtDate(e.at)} · {fmtTime(e.at)}</span>}
          </div>
        </li>
      ))}
    </ol>
  );
};

// State-driven primary actions (per brief). Placeholders are wired to notImplemented().
const stateActions = (state, b, handlers) => {
  switch (state) {
    case 'upcoming':
      return [
        { icon: IC.refresh, label: 'Reschedule',      onClick: () => notImplemented('Reschedule') },
        { icon: IC.xCircle, label: 'Cancel Booking',  onClick: handlers.cancel, variant: 'danger' },
        { icon: IC.msg,     label: 'Message Customer', onClick: () => notImplemented('Message Customer') },
        { icon: IC.msg,     label: 'Message Vendor',   onClick: () => notImplemented('Message Vendor') },
      ];
    case 'live':
      return [
        { icon: IC.video, label: 'Join Meeting',     href: b.meeting_link || undefined, onClick: b.meeting_link ? undefined : () => notImplemented('Join Meeting'), variant: 'primary' },
        { icon: IC.msg,   label: 'Message Customer', onClick: () => notImplemented('Message Customer') },
        { icon: IC.msg,   label: 'Message Vendor',   onClick: () => notImplemented('Message Vendor') },
      ];
    case 'completed':
      return [
        { icon: IC.refresh, label: 'Issue Refund', onClick: () => notImplemented('Issue Refund') },
        { icon: IC.alert,   label: 'Open Dispute', onClick: () => notImplemented('Open Dispute') },
      ];
    case 'cancelled':
      return [
        { icon: IC.calendar, label: 'Rebook', onClick: () => notImplemented('Rebook'), variant: 'primary' },
        { icon: IC.refresh,  label: 'Refund', onClick: () => notImplemented('Refund') },
      ];
    case 'disputed':
      return [
        { icon: IC.wallet,  label: 'Refund Customer',        onClick: () => notImplemented('Refund Customer'), variant: 'danger' },
        { icon: IC.check,   label: 'Release Vendor Payment', onClick: () => notImplemented('Release Vendor Payment') },
        { icon: IC.refresh, label: 'Partial Refund',         onClick: () => notImplemented('Partial Refund') },
        { icon: IC.checkCircle, label: 'Close Dispute',      onClick: () => notImplemented('Close Dispute') },
      ];
    default:
      return [];
  }
};

const BookingDetailModal = ({ b, state, onClose, onEdit, onCancel, onDelete }) => {
  const [adminOpen, setAdminOpen] = useState(false);
  if (!b) return null;

  const host = b.profiles || {};
  const total = b.services?.price || 0;
  const fee = b.platform_fee_amount;
  const earnings = b.vendor_amount;
  const tax = (Number(b.commission_gst) || 0) + (Number(b.razorpay_tax_actual) || 0);
  const showJoin = state === 'live';
  const showMeetingLink = state === 'upcoming' || state === 'live';

  const actions = stateActions(state, b, { cancel: onCancel });

  const adminActions = [
    { icon: IC.ban,     label: 'Force Cancel',          onClick: onCancel, danger: true },
    { icon: IC.wallet,  label: 'Force Refund',          onClick: () => notImplemented('Force Refund') },
    { icon: IC.pencil,  label: 'Edit Booking',          onClick: () => onEdit(b) },
    { icon: IC.swap,    label: 'Change Vendor',         onClick: () => notImplemented('Change Vendor') },
    { icon: IC.link,    label: 'Regenerate Meeting Link', onClick: () => notImplemented('Regenerate Meeting Link') },
    { icon: IC.note,    label: 'Add Internal Note',     onClick: () => notImplemented('Add Internal Note') },
    { icon: IC.trash,   label: 'Delete Permanently',    onClick: onDelete, danger: true },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[92vh] flex flex-col animate-[slideUp_.18s_ease-out]">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <code className="text-[13px] font-bold font-mono text-gray-900">{shortId(b.id)}</code>
              <StatePill state={state} size="lg" />
            </div>
            <p className="text-[12px] text-gray-400 truncate">{b.services?.title || 'Service'} · {inr(total)}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-1.5 -mr-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <Ic d={IC.x} size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-5 flex-1">
          {/* Customer */}
          <Section title="Customer Information" icon={IC.user}
            action={
              <div className="flex items-center gap-0.5">
                <IconBtn icon={IC.mail}  label="Email customer" href={b.guest_email ? `mailto:${b.guest_email}` : undefined} onClick={b.guest_email ? undefined : () => toast.error('No email')} />
                <IconBtn icon={IC.phone} label="Call customer"  href={b.guest_phone ? `tel:${b.guest_phone}` : undefined} onClick={b.guest_phone ? undefined : () => toast.error('No phone')} />
              </div>
            }>
            <Row label="Name" value={b.guest_name} />
            <div className="flex items-center justify-between gap-2 py-1.5">
              <span className="text-[12px] text-gray-400">Email</span>
              <span className="flex items-center gap-1.5 min-w-0">
                <span className="text-[12.5px] font-medium text-gray-800 truncate">{b.guest_email || '—'}</span>
                <IconBtn icon={IC.copy} label="Copy email" onClick={() => copy(b.guest_email, 'Email')} />
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 py-1.5">
              <span className="text-[12px] text-gray-400">Phone</span>
              <span className="flex items-center gap-1.5 min-w-0">
                <span className="text-[12.5px] font-medium text-gray-800 truncate">{b.guest_phone || '—'}</span>
                <IconBtn icon={IC.copy} label="Copy phone" onClick={() => copy(b.guest_phone, 'Phone')} />
              </span>
            </div>
          </Section>

          {/* Vendor */}
          <Section title="Vendor Information" icon={IC.building}
            action={
              <div className="flex items-center gap-0.5">
                <IconBtn icon={IC.mail}     label="Email vendor" href={host.email ? `mailto:${host.email}` : undefined} onClick={host.email ? undefined : () => toast.error('No email')} />
                {/* TODO(backend): host phone not selected by list endpoint */}
                <IconBtn icon={IC.phone}    label="Call vendor"  onClick={() => notImplemented('Call Vendor')} />
                <IconBtn icon={IC.external} label="View vendor profile" href={host.username ? `/${host.username}` : undefined} onClick={host.username ? undefined : () => toast.error('No profile')} />
              </div>
            }>
            <Row label="Vendor Name" value={host.name} />
            <Row label="Email" value={host.email} />
            <Row label="Phone" value={'—'} />
          </Section>

          {/* Booking */}
          <Section title="Booking Information" icon={IC.calendar}>
            <Row label="Booking ID" value={shortId(b.id)} mono />
            <Row label="Date" value={fmtDate(b.scheduled_at)} />
            <Row label="Start Time" value={fmtTime(b.scheduled_at)} />
            <Row label="End Time" value={fmtTime(endTime(b))} />
            <Row label="Duration" value={`${b.services?.duration || 30} min`} />
            <Row label="Timezone" value="Asia/Kolkata (IST)" />
            <div className="flex items-center justify-between gap-4 py-1.5">
              <span className="text-[12px] text-gray-400">Current State</span>
              <StatePill state={state} />
            </div>
          </Section>

          {/* Payment Summary */}
          <Section title="Payment Summary" icon={IC.card}>
            <Row label="Total Amount" value={inr(total)} />
            <Row label="Platform Fee" value={fee != null ? inr(fee) : '—'} />
            <Row label="Vendor Earnings" value={earnings != null ? inr(earnings) : '—'} />
            <Row label="Taxes" value={tax ? inr(tax) : '—'} />
            <Row label="Payment Method" value={b.payment_id ? 'Razorpay' : '—'} />
            <div className="flex items-center justify-between gap-4 py-1.5">
              <span className="text-[12px] text-gray-400">Payment Status</span>
              <PaymentPill status={b.payment_status} />
            </div>
          </Section>

          {/* Payout (P2 not built — placeholder) */}
          <Section title="Payout Information" icon={IC.wallet}>
            {/* TODO(backend): settlement/payout (P2) not implemented */}
            <Row label="Payout Status" value={b.settlement_status || 'Pending'} />
            <Row label="Payout Date" value={b.settled_at ? fmtDate(b.settled_at) : '—'} />
            <Row label="Transaction ID" value={b.payment_id} mono />
          </Section>

          {/* Meeting */}
          <Section title="Meeting Information" icon={IC.video}>
            <Row label="Meeting Provider" value={meetingProvider(b.meeting_link)} />
            <div className="flex items-center justify-between gap-2 py-1.5">
              <span className="text-[12px] text-gray-400">Meeting Link</span>
              {b.meeting_link ? (
                <span className="flex items-center gap-1.5 min-w-0">
                  <a href={b.meeting_link} target="_blank" rel="noreferrer" className="text-[12.5px] text-[#FE5100] hover:underline truncate max-w-[180px]">{b.meeting_link}</a>
                  {showMeetingLink && <IconBtn icon={IC.copy} label="Copy link" onClick={() => copy(b.meeting_link, 'Link')} />}
                </span>
              ) : <span className="text-[12.5px] text-gray-400">—</span>}
            </div>
            <Row label="Meeting ID" value={meetingId(b.meeting_link)} mono />
            {showJoin && b.meeting_link && (
              <div className="pt-2">
                <ActionBtn icon={IC.video} label="Join Meeting" href={b.meeting_link} variant="primary" />
              </div>
            )}
          </Section>

          {/* Timeline */}
          <Section title="Timeline" icon={IC.clock}><Timeline b={b} /></Section>

          {/* Actions (state-driven) */}
          {actions.length > 0 && (
            <Section title="Actions" icon={IC.zap}>
              <div className="grid grid-cols-2 gap-2">
                {actions.map((a, i) => <ActionBtn key={i} {...a} />)}
              </div>
            </Section>
          )}

          {/* Admin Actions (collapsed by default, visually separated) */}
          <Section title={null}>
            <button onClick={() => setAdminOpen(o => !o)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors">
              <span className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider">
                <Ic d={IC.shield} size={14} />Admin Actions
              </span>
              <Ic d={IC.chevD} size={16} className={`transition-transform ${adminOpen ? 'rotate-180' : ''}`} />
            </button>
            {adminOpen && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                {adminActions.map((a, i) => (
                  <ActionBtn key={i} icon={a.icon} label={a.label} onClick={a.onClick} variant={a.danger ? 'danger' : 'default'} />
                ))}
              </div>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
};

// ── Edit modal (preserves existing capability: status + payment) ──
// Backend updateBooking only accepts { status, payment_status }.
const EditModal = ({ b, onClose, onSave }) => {
  const [status, setStatus] = useState(b.status);
  const [payment, setPayment] = useState(b.payment_status);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try { await onSave(b.id, { status, payment_status: payment }); onClose(); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-sm text-gray-900">Edit Booking <span className="font-mono text-gray-400">{shortId(b.id)}</span></h3>
          <button onClick={onClose} aria-label="Close" className="p-1.5 -mr-1.5 rounded-lg text-gray-400 hover:bg-gray-100"><Ic d={IC.x} size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <label className="block">
            <span className="text-[12px] font-medium text-gray-500 mb-1.5 block">Booking Status</span>
            <select value={status} onChange={e => setStatus(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#FE5100]/30 focus:border-[#FE5100] outline-none">
              {['pending', 'confirmed', 'completed', 'cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-[12px] font-medium text-gray-500 mb-1.5 block">Payment Status</span>
            <select value={payment} onChange={e => setPayment(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#FE5100]/30 focus:border-[#FE5100] outline-none">
              {['unpaid', 'paid', 'refunded'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">Cancel</button>
          <button onClick={save} disabled={saving} className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#FE5100] text-white hover:bg-[#e54900] disabled:opacity-50 transition-colors">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Page ──────────────────────────────────────────────────────────
const PER_PAGE = 12;

const AdminBookings = () => {
  const { filter = 'all' } = useParams();
  const tab = TABS.find(t => t.key === filter) ? filter : 'all';

  const [raw, setRaw] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState(null);
  const [editing, setEditing] = useState(null);

  // Client-side fetch (see scope note). Pulls a generous page so search
  // + state filters work across the whole recent set without a new API.
  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminGetBookings({ status: 'all', page: 1, limit: FETCH_LIMIT });
      setRaw(data.bookings || []);
    } catch { toast.error('Failed to load bookings'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);
  useEffect(() => { setPage(1); }, [tab, query]);

  // Annotate each booking with its derived operational state once.
  const withState = useMemo(() => raw.map(b => ({ b, state: deriveState(b) })), [raw]);

  // Search: Booking ID / phone / email ONLY (per brief — nothing else).
  const searched = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return withState;
    const digits = q.replace(/\D/g, '');
    return withState.filter(({ b }) => {
      const idMatch = String(b.id).toLowerCase().includes(q);
      const emailMatch = (b.guest_email || '').toLowerCase().includes(q);
      const phoneMatch = digits.length >= 3 && (b.guest_phone || '').replace(/\D/g, '').includes(digits);
      return idMatch || emailMatch || phoneMatch;
    });
  }, [withState, query]);

  // Tab filter (Disputes has no backend source yet → always empty).
  const filtered = useMemo(() => {
    if (tab === 'all') return searched;
    if (tab === 'disputes') return searched.filter(({ state }) => state === 'disputed');
    return searched.filter(({ state }) => state === tab);
  }, [searched, tab]);

  // Tab counts (over the searched set so counts respect active search).
  const counts = useMemo(() => {
    const c = { all: searched.length, upcoming: 0, live: 0, completed: 0, cancelled: 0, disputes: 0 };
    searched.forEach(({ state }) => { if (c[state] != null) c[state] += 1; });
    return c;
  }, [searched]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE) || 1;
  const pageItems = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // ── Real mutations (preserved) ──────────────────────────────────
  const handleSave = async (id, updates) => {
    try {
      await adminUpdateBooking(id, updates);
      toast.success('Booking updated');
      setRaw(rs => rs.map(r => (r.id === id ? { ...r, ...updates, updated_at: new Date().toISOString() } : r)));
      setDetail(d => (d && d.id === id ? { ...d, ...updates } : d));
    } catch { toast.error('Update failed'); }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this booking?')) return;
    await handleSave(id, { status: 'cancelled' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete this booking? This cannot be undone.')) return;
    try {
      await adminDeleteBooking(id);
      toast.success('Booking deleted');
      setRaw(rs => rs.filter(r => r.id !== id));
      setDetail(null);
    } catch { toast.error('Delete failed'); }
  };

  return (
    <div className="max-w-[1100px]">
      <style>{`@keyframes slideUp{from{transform:translateY(12px);opacity:.6}to{transform:translateY(0);opacity:1}}`}</style>

      {/* Header */}
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">Bookings</h1>
        <p className="text-[12px] text-gray-400 mt-0.5">Search, triage, and manage every booking on the platform.</p>
      </div>

      {/* Search — Booking ID / Phone / Email only */}
      <div className="relative mb-4">
        <Ic d={IC.search} size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by Booking ID, phone, or email…"
          className="w-full pl-10 pr-9 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-[#FE5100]/25 focus:border-[#FE5100] outline-none transition"
        />
        {query && (
          <button onClick={() => setQuery('')} aria-label="Clear search" className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100">
            <Ic d={IC.x} size={15} />
          </button>
        )}
      </div>

      {/* State tabs */}
      <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1 -mx-0.5 px-0.5" style={{ scrollbarWidth: 'none' }}>
        {TABS.map(t => {
          const active = t.key === tab;
          const count = counts[t.key === 'disputes' ? 'disputes' : t.key];
          return (
            <Link key={t.key} to={t.to}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12.5px] font-medium whitespace-nowrap transition-colors
                ${active ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:text-gray-800 hover:border-gray-300'}`}>
              {t.label}
              {count > 0 && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}>{count}</span>}
            </Link>
          );
        })}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-[88px] bg-white border border-gray-200/70 rounded-xl animate-pulse" />)}
        </div>
      ) : pageItems.length === 0 ? (
        <div className="bg-white border border-gray-200/80 rounded-2xl py-16 px-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Ic d={tab === 'disputes' ? IC.alert : IC.inbox} size={24} className="text-gray-400" />
          </div>
          <h3 className="text-sm font-bold text-gray-800 mb-1">
            {query ? 'No matches' : tab === 'disputes' ? 'No disputes' : `No ${tab === 'all' ? '' : tab + ' '}bookings`}
          </h3>
          <p className="text-[12.5px] text-gray-400 max-w-sm mx-auto">
            {query ? 'No booking matches that ID, phone, or email.'
              : tab === 'disputes' ? 'Disputed bookings will appear here once a customer or vendor raises a dispute.'
              : 'Nothing to show in this view yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {pageItems.map(({ b, state }) => (
            <BookingCard key={b.id} b={b} state={state} onView={setDetail} onEdit={setEditing} />
          ))}
        </div>
      )}

      {/* Pagination (client-side) */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-5">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-2.5 h-8 rounded-lg text-[12px] font-medium bg-white border border-gray-200 text-gray-500 disabled:opacity-40 hover:border-gray-300 transition">Prev</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
            .map((n, idx, arr) => (
              <span key={n} className="flex items-center">
                {idx > 0 && n - arr[idx - 1] > 1 && <span className="px-1 text-gray-300">…</span>}
                <button onClick={() => setPage(n)}
                  className={`w-8 h-8 rounded-lg text-[12px] font-medium transition ${page === n ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300'}`}>{n}</button>
              </span>
            ))}
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="px-2.5 h-8 rounded-lg text-[12px] font-medium bg-white border border-gray-200 text-gray-500 disabled:opacity-40 hover:border-gray-300 transition">Next</button>
        </div>
      )}

      {/* Modals */}
      {detail && (
        <BookingDetailModal
          b={detail}
          state={deriveState(detail)}
          onClose={() => setDetail(null)}
          onEdit={(b) => { setEditing(b); }}
          onCancel={() => handleCancel(detail.id)}
          onDelete={() => handleDelete(detail.id)}
        />
      )}
      {editing && (
        <EditModal b={editing} onClose={() => setEditing(null)} onSave={handleSave} />
      )}
    </div>
  );
};

export default AdminBookings;
