import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  CalendarClock, CheckCircle2, XCircle, CalendarDays, LayoutGrid, IndianRupee,
  UserCheck, Activity, Camera, UserCog, Tag, CalendarCheck, CreditCard, ShieldCheck,
  Check, ArrowRight, Copy, Link2, MessageCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getHostBookings, getMyServices, getGuestBookings } from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/booking/Modal';
import WhatsAppVerify from '../components/whatsapp/WhatsAppVerify';
import StatusChip from '../components/common/StatusChip';

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

// ── Guest view (non-host) — unchanged behaviour ─────────────────────────
const GuestBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getGuestBookings().then(({ data }) => setBookings(data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-8 text-gray-400 text-sm">Loading your bookings…</div>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">My Bookings</h2>
      {bookings.length === 0 ? (
        <div className="bg-white border rounded p-8 text-center">
          <p className="text-lg font-semibold mb-2">No bookings yet</p>
          <p className="text-sm text-gray-500 mb-4">Browse services and book a session to get started.</p>
          <Link to="/" className="btn bg-primary text-white px-6 py-2.5 text-sm font-medium hover:bg-primary-dark inline-block">
            Explore Services
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <div key={b.id} className="bg-white border rounded p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="font-semibold text-sm">{b.services?.title || 'Service'}</p>
                <p className="text-xs text-gray-400">
                  {b['profiles!bookings_host_id_fkey']?.name || 'Host'} · {fmtDate(b.scheduled_at)}
                </p>
              </div>
              <StatusChip status={b.status} className="self-start sm:self-center" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Stat tile ───────────────────────────────────────────────────────────
const Stat = ({ Icon, label, value, tint }) => (
  <div className="rounded border border-gray-200 bg-white p-3 sm:p-4">
    <div className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-md ${tint}`}>
      <Icon className="h-4 w-4" strokeWidth={2.25} />
    </div>
    <p className="text-xl sm:text-2xl font-bold text-gray-900 leading-none">{value}</p>
    <p className="text-xs text-gray-500 mt-1">{label}</p>
  </div>
);

// ── Booking row (compact) ───────────────────────────────────────────────
const BookingRow = ({ b }) => (
  <div className="flex items-center justify-between gap-3 py-2.5">
    <div className="min-w-0">
      <p className="font-medium text-sm text-gray-900 truncate">{b.guest_name || 'Guest'}</p>
      <p className="text-xs text-gray-400 truncate">{b.services?.title} · {fmtDate(b.scheduled_at)}</p>
    </div>
    <StatusChip status={b.status} className="shrink-0" />
  </div>
);

const Dashboard = () => {
  const { user, connectGoogleCalendar, updateUser } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isHost = user?.role === 'host';

  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [bannerDismissed, setBannerDismissed] = useState(
    () => localStorage.getItem('legacyPlanBannerDismissed') === '1'
  );
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [whatsappEntry, setWhatsappEntry] = useState(undefined); // { country, number } preserved across close

  // Legacy paid vendors were backfilled to subscription_status='active' but have
  // NO auto-renew mandate — nudge them onto auto-renew before their period ends.
  const showLegacyBanner =
    isHost && user?.plan && user.plan !== 'starter' &&
    user.subscription_status === 'active' && !user.has_payment_mandate &&
    !bannerDismissed;

  const dismissBanner = () => {
    localStorage.setItem('legacyPlanBannerDismissed', '1');
    setBannerDismissed(true);
  };

  // Google-calendar return toast
  useEffect(() => {
    const g = searchParams.get('google');
    if (g === 'connected') {
      toast.success('Google Calendar connected!');
      updateUser({ google_calendar_connected: true });
      window.history.replaceState({}, '', '/dashboard');
    } else if (g === 'error') {
      toast.error('Failed to connect Google Calendar.');
      window.history.replaceState({}, '', '/dashboard');
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isHost) return;
    Promise.all([getHostBookings(), getMyServices()])
      .then(([b, s]) => { setBookings(b.data || []); setServices(s.data || []); })
      .catch(() => {});
  }, [isHost]);

  // Derived stats — all from real data, nothing hardcoded.
  const m = useMemo(() => {
    const now = new Date();
    const future = (b) => new Date(b.scheduled_at) > now;
    const upcomingList = bookings
      .filter((b) => b.status !== 'cancelled' && b.status !== 'completed' && future(b))
      .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
    const recentList = [...bookings]
      .filter((b) => b.status === 'completed' || !future(b))
      .sort((a, b) => new Date(b.scheduled_at) - new Date(a.scheduled_at));
    return {
      upcoming: upcomingList.length,
      completed: bookings.filter((b) => b.status === 'completed').length,
      cancelled: bookings.filter((b) => b.status === 'cancelled').length,
      total: bookings.length,
      services: services.length,
      earnings: bookings.filter((b) => b.payment_status === 'paid').reduce((s, b) => s + (b.services?.price || 0), 0),
      active: bookings.filter((b) => b.status === 'confirmed' && future(b)).length,
      upcomingList: upcomingList.slice(0, 2),
      recentList: recentList.slice(0, 2),
    };
  }, [bookings, services]);

  // Profile-completion checklist — derived from real profile + data.
  const checklist = useMemo(() => [
    { key: 'photo',   label: 'Upload profile photo',     done: !!user?.profile_image,                 Icon: Camera,       to: '/dashboard/profile' },
    { key: 'profile', label: 'Complete your profile',    done: !!(user?.bio && user?.username),        Icon: UserCog,      to: '/dashboard/profile' },
    { key: 'service', label: 'Add a service',            done: services.length > 0,                    Icon: LayoutGrid,   to: '/dashboard/services' },
    { key: 'pricing', label: 'Set service pricing',      done: services.some((s) => Number(s.price) > 0), Icon: Tag,        to: '/dashboard/services' },
    { key: 'gcal',    label: 'Connect Google Calendar',  done: !!user?.google_calendar_connected,      Icon: CalendarCheck, onClick: connectGoogleCalendar },
    { key: 'plan',    label: 'Choose a plan',            done: !!user?.plan,                           Icon: CreditCard,   to: '/dashboard/upgrade' },
    { key: 'verify',  label: 'Verify contact details',   done: !!user?.is_verified,                    Icon: ShieldCheck,  to: '/dashboard/profile' },
    { key: 'whatsapp', label: 'Add WhatsApp for Booking Updates', done: !!user?.whatsapp_verified, Icon: MessageCircle, onClick: () => setWhatsappModalOpen(true) },
  ], [user, services, connectGoogleCalendar]);

  const completion = Math.round((checklist.filter((c) => c.done).length / checklist.length) * 100);
  const allDone = completion === 100;

  if (!isHost) {
    return (
      <div className="w-full max-w-5xl">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1">Welcome back, {user?.name?.split(' ')[0]}</h1>
        <p className="text-sm text-gray-400 mb-6">Here's what's happening with your bookings.</p>
        <GuestBookings />
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl">
      <h1 className="text-2xl sm:text-3xl font-bold mb-1">Welcome back, {user?.name?.split(' ')[0]}</h1>
      <p className="text-sm text-gray-400 mb-6">Here's what's happening with your bookings.</p>

      {/* Legacy plan → auto-renew migration nudge */}
      {showLegacyBanner && (
        <div className="mb-5 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded p-4">
          <CreditCard className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" strokeWidth={2.25} />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-gray-900 capitalize">Your {user.plan} plan won't auto-renew</p>
            <p className="text-xs text-gray-600 mt-0.5">Set up auto-renew so you never lose access when your current period ends.</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link to="/dashboard/upgrade" className="btn px-3 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition-colors whitespace-nowrap">
              Set up auto-renew
            </Link>
            <button onClick={dismissBanner} aria-label="Dismiss" className="text-amber-500 hover:text-amber-700 p-1">
              <XCircle className="h-4 w-4" strokeWidth={2.25} />
            </button>
          </div>
        </div>
      )}

      {/* Profile URL pill */}
      {user?.username ? (
        <div className="mb-5 flex items-center gap-2 bg-white border border-gray-200 rounded px-4 py-2.5">
          <Link2 className="h-3.5 w-3.5 text-gray-400 shrink-0" strokeWidth={2.25} />
          <span className="text-xs text-gray-400 shrink-0">Your profile:</span>
          <a href={`/${user.username}`} target="_blank" rel="noreferrer" className="text-xs font-semibold text-primary hover:underline truncate">
            bookasloth.com/{user.username}
          </a>
          <button
            onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/${user.username}`); toast.success('Link copied!'); }}
            className="ml-auto shrink-0 text-gray-400 hover:text-gray-700 transition-colors p-1" title="Copy link"
          >
            <Copy className="h-3.5 w-3.5" strokeWidth={2.25} />
          </button>
        </div>
      ) : (
        <div className="mb-5 flex items-start gap-3 bg-primary-light border border-primary/30 rounded p-4">
          <Link2 className="h-5 w-5 text-primary shrink-0 mt-0.5" strokeWidth={2.25} />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-gray-900">Set up your public profile</p>
            <p className="text-xs text-gray-500 mt-0.5">Add a username so clients can find and book you.</p>
          </div>
          <Link to="/dashboard/profile" className="btn shrink-0 px-3 py-1.5 text-xs font-bold text-white bg-primary hover:bg-primary-dark transition-colors whitespace-nowrap">
            Set username
          </Link>
        </div>
      )}

      {/* 2 rows × 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
        {/* Top-Left: bookings stats (2×2) */}
        <section className="rounded border border-gray-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Bookings overview</h2>
          <div className="grid grid-cols-2 gap-3">
            <Stat Icon={CalendarClock} label="Upcoming"       value={m.upcoming}  tint="bg-blue-50 text-blue-600" />
            <Stat Icon={CheckCircle2}  label="Completed"      value={m.completed} tint="bg-green-50 text-green-600" />
            <Stat Icon={XCircle}       label="Cancelled"      value={m.cancelled} tint="bg-red-50 text-red-600" />
            <Stat Icon={CalendarDays}  label="Total Bookings" value={m.total}     tint="bg-gray-100 text-gray-600" />
          </div>
        </section>

        {/* Top-Right: business stats (2×2) */}
        <section className="rounded border border-gray-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Your business</h2>
          <div className="grid grid-cols-2 gap-3">
            <Stat Icon={LayoutGrid}  label="Total Services"      value={m.services}        tint="bg-purple-50 text-purple-600" />
            <Stat Icon={IndianRupee} label="Total Earnings"      value={`₹${m.earnings}`}  tint="bg-primary-light text-primary" />
            <Stat Icon={UserCheck}   label="Profile Completion"  value={`${completion}%`}  tint="bg-amber-50 text-amber-600" />
            <Stat Icon={Activity}    label="Active Bookings"     value={m.active}          tint="bg-teal-50 text-teal-600" />
          </div>
        </section>

        {/* Bottom-Left: upcoming + recent (1 col, 2 rows) */}
        <section className="rounded border border-gray-200 bg-white p-4 flex flex-col gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold text-gray-700">Upcoming Bookings</h2>
              <Link to="/dashboard/bookings" className="text-xs text-primary hover:underline">View all</Link>
            </div>
            {m.upcomingList.length === 0 ? (
              <p className="text-xs text-gray-400 py-3">No upcoming bookings. Share your profile to get booked.</p>
            ) : (
              <div className="divide-y divide-gray-100">{m.upcomingList.map((b) => <BookingRow key={b.id} b={b} />)}</div>
            )}
          </div>
          <div className="border-t border-gray-100 pt-3">
            <h2 className="text-sm font-semibold text-gray-700 mb-1">Recent Bookings</h2>
            {m.recentList.length === 0 ? (
              <p className="text-xs text-gray-400 py-3">No past bookings yet.</p>
            ) : (
              <div className="divide-y divide-gray-100">{m.recentList.map((b) => <BookingRow key={b.id} b={b} />)}</div>
            )}
          </div>
        </section>

        {/* Bottom-Right: checklist or success */}
        <section className="rounded border border-gray-200 bg-white p-4">
          {allDone ? (
            <div className="flex h-full flex-col items-center justify-center text-center py-6">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
                <CheckCircle2 className="h-7 w-7 text-green-600" strokeWidth={2} />
              </div>
              <p className="font-semibold text-gray-900">Everything is set.</p>
              <p className="text-xs text-gray-500 mt-1">Your account is fully configured. You're ready to grow.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-700">Finish setup</h2>
                <span className="text-xs font-medium text-gray-500">{completion}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-gray-100 mb-4 overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${completion}%` }} />
              </div>
              <ul className="space-y-1.5">
                {checklist.map((c) => {
                  const inner = (
                    <>
                      <span className={`flex h-7 w-7 items-center justify-center rounded-md shrink-0 ${c.done ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                        {c.done ? <Check className="h-4 w-4" strokeWidth={3} /> : <c.Icon className="h-4 w-4" strokeWidth={2.25} />}
                      </span>
                      <span className={`flex-1 text-sm ${c.done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{c.label}</span>
                      {!c.done && <ArrowRight className="h-4 w-4 text-gray-300 shrink-0" strokeWidth={2.25} />}
                    </>
                  );
                  const cls = 'flex items-center gap-3 w-full rounded p-1.5 text-left transition hover:bg-gray-50 disabled:hover:bg-transparent';
                  if (c.done) return <li key={c.key}><div className="flex items-center gap-3 p-1.5">{inner}</div></li>;
                  return (
                    <li key={c.key}>
                      {c.onClick
                        ? <button onClick={c.onClick} className={cls}>{inner}</button>
                        : <button onClick={() => navigate(c.to)} className={cls}>{inner}</button>}
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </section>
      </div>

      <Modal open={whatsappModalOpen} title="Verify WhatsApp" onClose={() => setWhatsappModalOpen(false)}>
        <p className="text-sm text-gray-500 mb-4">
          Receive booking confirmations and important updates directly on WhatsApp.
        </p>
        <WhatsAppVerify
          initialCountry={whatsappEntry?.country}
          initialPhone={whatsappEntry?.number}
          onPhoneChange={setWhatsappEntry}
          onVerified={(phone) => {
            updateUser({ whatsapp_verified: true, whatsapp_number: phone });
            setWhatsappModalOpen(false);
            toast.success("WhatsApp successfully verified.\nYou'll now receive booking updates.");
          }}
        />
      </Modal>
    </div>
  );
};

export default Dashboard;
