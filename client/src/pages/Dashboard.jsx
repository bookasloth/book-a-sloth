import { useState, useEffect, useMemo } from 'react';
import { Link, Navigate, useSearchParams, useNavigate } from 'react-router-dom';
import {
  CalendarClock, CheckCircle2, XCircle, CalendarDays, LayoutGrid, IndianRupee,
  UserCheck, Activity, Camera, UserCog, Tag, CalendarCheck, CreditCard, ShieldCheck,
  Check, ArrowRight, Copy, Link2, MessageCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getHostBookings, getMyServices } from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/booking/Modal';
import WhatsAppVerify from '../components/whatsapp/WhatsAppVerify';
import StatusChip from '../components/common/StatusChip';
import { PageHeader, Card, buttonClasses, fmtMoney, cn } from '../components/dashboard/ui';

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

// ── Stat tile (flat — lives inside a Card panel) ─────────────────────────
const Stat = ({ Icon, label, value, tint }) => (
  <div className="rounded-md border border-gray-100 bg-gray-50/60 p-3 sm:p-4">
    <div className={cn('mb-2 inline-flex h-8 w-8 items-center justify-center rounded-md', tint)}>
      <Icon className="h-4 w-4" strokeWidth={2.25} />
    </div>
    <p className="text-xl font-bold leading-none text-gray-900 sm:text-2xl">{value}</p>
    <p className="mt-1 text-xs text-gray-500">{label}</p>
  </div>
);

// ── Booking row (compact) ───────────────────────────────────────────────
const BookingRow = ({ b }) => (
  <div className="flex items-center justify-between gap-3 py-2.5">
    <div className="min-w-0">
      <p className="truncate text-sm font-medium text-gray-900">{b.guest_name || 'Guest'}</p>
      <p className="truncate text-xs text-gray-400">{b.services?.title} · {fmtDate(b.scheduled_at)}</p>
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
    // When already verified, no onClick — item renders as a static "done" badge
    { key: 'whatsapp', label: 'Add WhatsApp for Booking Updates', done: !!user?.whatsapp_verified, Icon: MessageCircle, ...(user?.whatsapp_verified ? {} : { onClick: () => setWhatsappModalOpen(true) }) },
  ], [user, services, connectGoogleCalendar]);

  const completion = Math.round((checklist.filter((c) => c.done).length / checklist.length) * 100);
  const allDone = completion === 100;

  if (!isHost) return <Navigate to="/user/my-bookings" replace />;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title={`Welcome back, ${user?.name?.split(' ')[0]}`} subtitle="Here's what's happening with your bookings." />

      {/* Legacy plan → auto-renew migration nudge */}
      {showLegacyBanner && (
        <div className="mb-5 flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 p-4">
          <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" strokeWidth={2.25} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold capitalize text-gray-900">Your {user.plan} plan won't auto-renew</p>
            <p className="mt-0.5 text-xs text-gray-600">Set up auto-renew so you never lose access when your current period ends.</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link to="/dashboard/upgrade" className="whitespace-nowrap rounded bg-amber-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-amber-700">
              Set up auto-renew
            </Link>
            <button onClick={dismissBanner} aria-label="Dismiss" className="p-1 text-amber-500 hover:text-amber-700">
              <XCircle className="h-4 w-4" strokeWidth={2.25} />
            </button>
          </div>
        </div>
      )}

      {/* Profile URL pill */}
      {user?.username ? (
        <div className="mb-5 flex items-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2.5">
          <Link2 className="h-3.5 w-3.5 shrink-0 text-gray-400" strokeWidth={2.25} />
          <span className="shrink-0 text-xs text-gray-400">Your profile:</span>
          <a href={`/${user.username}`} target="_blank" rel="noreferrer" className="truncate text-xs font-semibold text-primary hover:underline">
            bookasloth.com/{user.username}
          </a>
          <button
            onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/${user.username}`); toast.success('Link copied!'); }}
            className="ml-auto shrink-0 p-1 text-gray-400 transition-colors hover:text-gray-700" title="Copy link"
          >
            <Copy className="h-3.5 w-3.5" strokeWidth={2.25} />
          </button>
        </div>
      ) : (
        <div className="mb-5 flex items-start gap-3 rounded-md border border-primary/30 bg-primary-light p-4">
          <Link2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" strokeWidth={2.25} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900">Set up your public profile</p>
            <p className="mt-0.5 text-xs text-gray-500">Add a username so clients can find and book you.</p>
          </div>
          <Link to="/dashboard/profile" className={cn(buttonClasses({ variant: 'primary', size: 'sm' }), 'shrink-0 whitespace-nowrap')}>
            Set username
          </Link>
        </div>
      )}

      {/* 2 rows × 2 columns */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
        {/* Top-Left: bookings stats (2×2) */}
        <Card as="section">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">Bookings overview</h2>
          <div className="grid grid-cols-2 gap-3">
            <Stat Icon={CalendarClock} label="Upcoming"       value={m.upcoming}  tint="bg-blue-50 text-blue-600" />
            <Stat Icon={CheckCircle2}  label="Completed"      value={m.completed} tint="bg-green-50 text-green-600" />
            <Stat Icon={XCircle}       label="Cancelled"      value={m.cancelled} tint="bg-red-50 text-red-600" />
            <Stat Icon={CalendarDays}  label="Total Bookings" value={m.total}     tint="bg-gray-100 text-gray-600" />
          </div>
        </Card>

        {/* Top-Right: business stats (2×2) */}
        <Card as="section">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">Your business</h2>
          <div className="grid grid-cols-2 gap-3">
            <Stat Icon={LayoutGrid}  label="Total Services"      value={m.services}            tint="bg-purple-50 text-purple-600" />
            <Stat Icon={IndianRupee} label="Total Earnings"      value={fmtMoney(m.earnings)}  tint="bg-primary-light text-primary" />
            <Stat Icon={UserCheck}   label="Profile Completion"  value={`${completion}%`}      tint="bg-amber-50 text-amber-600" />
            <Stat Icon={Activity}    label="Active Bookings"     value={m.active}              tint="bg-teal-50 text-teal-600" />
          </div>
        </Card>

        {/* Bottom-Left: upcoming + recent (1 col, 2 rows) */}
        <Card as="section" className="flex flex-col gap-4">
          <div>
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">Upcoming Bookings</h2>
              <Link to="/dashboard/bookings" className="text-xs text-primary hover:underline">View all</Link>
            </div>
            {m.upcomingList.length === 0 ? (
              <p className="py-3 text-xs text-gray-400">No upcoming bookings. Share your profile to get booked.</p>
            ) : (
              <div className="divide-y divide-gray-100">{m.upcomingList.map((b) => <BookingRow key={b.id} b={b} />)}</div>
            )}
          </div>
          <div className="border-t border-gray-100 pt-3">
            <h2 className="mb-1 text-sm font-semibold text-gray-700">Recent Bookings</h2>
            {m.recentList.length === 0 ? (
              <p className="py-3 text-xs text-gray-400">No past bookings yet.</p>
            ) : (
              <div className="divide-y divide-gray-100">{m.recentList.map((b) => <BookingRow key={b.id} b={b} />)}</div>
            )}
          </div>
        </Card>

        {/* Bottom-Right: checklist or success */}
        <Card as="section">
          {allDone ? (
            <div className="flex h-full flex-col items-center justify-center py-6 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
                <CheckCircle2 className="h-7 w-7 text-green-600" strokeWidth={2} />
              </div>
              <p className="font-semibold text-gray-900">Everything is set.</p>
              <p className="mt-1 text-xs text-gray-500">Your account is fully configured. You're ready to grow.</p>
            </div>
          ) : (
            <>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-700">Finish setup</h2>
                <span className="text-xs font-medium text-gray-500">{completion}%</span>
              </div>
              <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div className="h-full bg-primary transition-all" style={{ width: `${completion}%` }} />
              </div>
              <ul className="space-y-1.5">
                {checklist.map((c) => {
                  const inner = (
                    <>
                      <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-md', c.done ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500')}>
                        {c.done ? <Check className="h-4 w-4" strokeWidth={3} /> : <c.Icon className="h-4 w-4" strokeWidth={2.25} />}
                      </span>
                      <span className={cn('flex-1 text-sm', c.done ? 'text-gray-400 line-through' : 'text-gray-700')}>{c.label}</span>
                      {!c.done && <ArrowRight className="h-4 w-4 shrink-0 text-gray-300" strokeWidth={2.25} />}
                    </>
                  );
                  const cls = 'flex w-full items-center gap-3 rounded p-1.5 text-left transition hover:bg-gray-50 disabled:hover:bg-transparent';
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
        </Card>
      </div>

      {/* Only render the modal when the host is not yet verified — belt-and-suspenders guard */}
      <Modal open={whatsappModalOpen && !user?.whatsapp_verified} title="Verify WhatsApp" onClose={() => setWhatsappModalOpen(false)}>
        <p className="mb-4 text-sm text-gray-500">
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
