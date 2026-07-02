import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { adminGetStats, adminGetBookings, adminGetUsers, adminOpsSummary, adminGetProviderPlanAnalytics } from '../../services/api';
import Ic from '../../components/admin/Ic';
import { IC } from '../../components/admin/adminNav';
import AdminInsights from './AdminInsights';
import { PageHeader, Card, StatCard, Badge } from '../../components/admin/ui';

const TABS = [
  { id: 'overview',   label: 'Overview',        to: '/super-dashboard' },
  { id: 'revenue',    label: 'Revenue',          to: '/super-dashboard/revenue' },
  { id: 'users',      label: 'Users',            to: '/super-dashboard/users' },
  { id: 'providers',  label: 'Hosts',            to: '/super-dashboard/providers' },
  { id: 'bookings',   label: 'Bookings',         to: '/super-dashboard/bookings' },
  { id: 'pending',    label: 'Pending Actions',  to: '/super-dashboard/pending' },
  { id: 'insights',   label: 'Insights',         to: '/super-dashboard/insights' },
];

const STATUS_DOT = {
  confirmed: 'bg-green-500',
  pending:   'bg-yellow-400',
  completed: 'bg-blue-500',
  cancelled: 'bg-red-400',
};

// ── Empty state ───────────────────────────────────────────────
const Empty = ({ icon, title, desc }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="w-14 h-14 rounded-2xl bg-[var(--adm-hover)] flex items-center justify-center mb-4">
      <Ic d={IC[icon]} size={22} className="adm-t3" />
    </div>
    <p className="text-base font-semibold adm-t2 mb-1">{title}</p>
    <p className="text-sm adm-t3 max-w-xs">{desc}</p>
  </div>
);

// ── Overview Tab ──────────────────────────────────────────────
const OverviewTab = ({ stats, ops }) => {
  const s = stats || {};
  // No fake trend percentages — `change` is only shown when a real value is present.
  const cards = [
    { label: 'Platform Revenue',  value: `₹${(s.revenue || 0).toLocaleString('en-IN')}`, sub: 'Fees + commission collected', icon: 'dollar',  iconColor: 'bg-[#FE5100]', to: '/super-dashboard/revenue' },
    { label: 'Total Bookings',    value: (s.bookings || 0).toLocaleString(),              sub: `${s.confirmed || 0} paid`,    icon: 'calendar', iconColor: 'bg-[#1E1E1E]', to: '/super-dashboard/bookings' },
    { label: 'Active Hosts',      value: (s.vendors || 0).toLocaleString(),               sub: 'Registered hosts',            icon: 'building', iconColor: 'bg-[#1E1E1E]', to: '/super-dashboard/providers' },
    { label: 'Total Users',       value: (s.users || 0).toLocaleString(),                 sub: 'Guests + hosts',              icon: 'users',    iconColor: 'bg-[#1E1E1E]', to: '/super-dashboard/users' },
    { label: 'Active Services',   value: (s.services || 0).toLocaleString(),              sub: 'Published listings',          icon: 'grid',     iconColor: 'bg-[#1E1E1E]', to: '/admin/services' },
    { label: 'Pending Actions',   value: (ops?.totalAttention ?? 0).toLocaleString(),     sub: 'Requires review',             icon: 'alert',    iconColor: ops?.totalAttention ? 'bg-[#FE5100]' : 'bg-[#1E1E1E]', to: '/super-dashboard/pending' },
  ];

  return (
    <div className="space-y-7">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map(c => <StatCard key={c.label} {...c} />)}
      </div>

      {/* Quick navigation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { title: 'Manage Bookings',      desc: 'View, update status, resolve disputes',    to: '/admin/bookings',   icon: 'calendar', color: 'text-violet-600 bg-violet-50' },
          { title: 'Manage Users',          desc: 'Verify, ban, or delete platform accounts', to: '/admin/users',      icon: 'users',    color: 'text-blue-600 bg-blue-50' },
          { title: 'Manage Services',       desc: 'Review and moderate provider services',     to: '/admin/services',   icon: 'grid',     color: 'text-pink-600 bg-pink-50' },
          { title: 'Payouts',               desc: 'Approve and release host payout requests', to: '/admin/finance/payouts', icon: 'dollar', color: 'text-[#FE5100] bg-orange-50' },
          { title: 'Platform Settings',     desc: 'Configure fees, maintenance, branding',     to: '/admin/settings',   icon: 'activity', color: 'text-emerald-600 bg-emerald-50' },
          { title: 'Support Tickets',       desc: 'Respond to user issues and disputes',       to: '/admin/support/tickets', icon: 'clock', color: 'text-amber-600 bg-amber-50' },
        ].map(item => (
          <Link key={item.to} to={item.to}
            className="flex items-center gap-4 adm-card rounded-2xl p-4 hover:shadow-sm transition-all group">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${item.color.split(' ')[1]}`}>
              <Ic d={IC[item.icon]} size={17} className={item.color.split(' ')[0]} />
            </div>
            <div className="min-w-0">
              <p className="font-semibold adm-t1 text-sm">{item.title}</p>
              <p className="text-[12px] adm-t3 truncate mt-0.5">{item.desc}</p>
            </div>
            <Ic d={IC.arrow} size={14} className="adm-t3 ml-auto group-hover:text-gray-500 transition-colors flex-shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
};

// ── Revenue Tab ───────────────────────────────────────────────
const RevenueTab = ({ stats }) => {
  const s = stats || {};
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue',    value: `₹${(s.revenue || 0).toLocaleString('en-IN')}`,    sub: 'Platform fees collected' },
          { label: 'Paid Bookings',    value: (s.confirmed || 0).toLocaleString(),                sub: 'Completed payments' },
          { label: 'Avg per Booking',  value: s.confirmed ? `₹${Math.round(s.revenue / s.confirmed)}` : '₹0', sub: 'Revenue per booking' },
          { label: 'Refunds',          value: (s.cancelled || 0).toLocaleString(),               sub: 'Cancelled / refunded' },
        ].map(c => (
          <Card key={c.label}>
            <p className="text-[11px] font-medium adm-t3 uppercase tracking-wide mb-1">{c.label}</p>
            <p className="text-2xl font-bold adm-t1">{c.value}</p>
            <p className="text-[11px] adm-t3 mt-1">{c.sub}</p>
          </Card>
        ))}
      </div>
      <Card className="p-6">
        <p className="text-sm font-semibold adm-t1 mb-1">Revenue trend</p>
        <p className="text-xs adm-t3 mb-6">Monthly platform revenue breakdown</p>
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[var(--adm-hover)] flex items-center justify-center mb-3">
            <Ic d={IC.activity} size={20} className="adm-t3" />
          </div>
          <p className="text-sm font-medium adm-t2">Trend charts arrive with Analytics</p>
          <p className="text-[12px] adm-t3 max-w-xs mt-1">
            Time-series revenue, GMV and MRR land in the Analytics milestone. Totals above are live.
          </p>
        </div>
      </Card>
      <div className="flex gap-3">
        <Link to="/admin/finance/transactions" className="btn btn--outline flex-1 adm-card p-4 hover:shadow-sm transition-all text-center">
          <p className="font-semibold adm-t1 text-sm">All Transactions</p>
          <p className="text-xs adm-t3 mt-0.5">View full transaction ledger</p>
        </Link>
        <Link to="/admin/finance/refunds" className="btn btn--outline flex-1 adm-card p-4 hover:shadow-sm transition-all text-center">
          <p className="font-semibold adm-t1 text-sm">Refunds</p>
          <p className="text-xs adm-t3 mt-0.5">Manage refund requests</p>
        </Link>
        <Link to="/admin/finance/payouts" className="btn btn--outline flex-1 adm-card p-4 hover:shadow-sm transition-all text-center">
          <p className="font-semibold adm-t1 text-sm">Payouts</p>
          <p className="text-xs adm-t3 mt-0.5">Approve &amp; release</p>
        </Link>
      </div>
    </div>
  );
};

// ── Users Tab ─────────────────────────────────────────────────
const UsersTab = ({ stats }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminGetUsers({ page: 1, limit: 10, role: 'guest' })
      .then(r => setUsers(r.data.users || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Guests',     value: (stats?.users || 0).toLocaleString(),    sub: 'Guest accounts' },
          { label: 'Total Hosts',      value: (stats?.vendors || 0).toLocaleString(),  sub: 'Host accounts' },
          { label: 'Total Accounts',   value: ((stats?.users || 0) + (stats?.vendors || 0)).toLocaleString(), sub: 'Combined' },
        ].map(c => (
          <Card key={c.label}>
            <p className="text-[11px] font-medium adm-t3 uppercase tracking-wide mb-1">{c.label}</p>
            <p className="text-2xl font-bold adm-t1">{c.value}</p>
            <p className="text-[11px] adm-t3 mt-1">{c.sub}</p>
          </Card>
        ))}
      </div>
      <Card className="p-0 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b adm-border">
          <p className="font-semibold adm-t1 text-sm">Recent Users</p>
          <Link to="/admin/users" className="text-[12px] text-[#FE5100] hover:underline font-medium">View all</Link>
        </div>
        {loading ? (
          <div className="py-10 text-center adm-t3 text-sm">Loading...</div>
        ) : users.length === 0 ? (
          <Empty icon="users" title="No users yet" desc="Users will appear here once they sign up." />
        ) : (
          <div className="divide-y adm-border">
            {users.map(u => (
              <div key={u.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
                  style={{ background: '#FE5100' }}>
                  {(u.name || u.email || '?')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium adm-t1 truncate">{u.name || '—'}</p>
                  <p className="text-[11px] adm-t3 truncate">{u.email}</p>
                </div>
                <Badge tone={u.is_banned ? 'danger' : 'ok'}>{u.is_banned ? 'Banned' : 'Active'}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

// ══ Provider plan charts (dependency-free SVG) ════════════════
const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

// Plan visual identity. Starter = white (needs border), Host+ = grey, Studio = brand orange.
const PLAN_ORDER = ['starter', 'creator', 'professional'];
const PLAN_META = {
  starter:      { label: 'Starter',  color: '#ffffff' },
  creator:      { label: 'Host+',    color: '#9ca3af' },
  professional: { label: 'Studio',   color: '#FE5100' },
};
const PIE_BORDER = '#374151'; // gray-700 — keeps the white slice readable on a white card
const PLAN_NAME = { starter: 'Starter', creator: 'Host+', professional: 'Studio' };

const polar = (cx, cy, r, deg) => {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
};
const arcPath = (cx, cy, r, start, end) => {
  const [x1, y1] = polar(cx, cy, r, end);
  const [x2, y2] = polar(cx, cy, r, start);
  const large = end - start <= 180 ? 0 : 1;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 0 ${x2} ${y2} Z`;
};

// Plan-share pie — slice size = provider headcount. Border on pie + each slice.
const PlanSharePie = ({ distribution }) => {
  const data = PLAN_ORDER.map((k) => ({ key: k, ...PLAN_META[k], value: distribution?.[k] || 0 }));
  const total = data.reduce((s, d) => s + d.value, 0);
  const top = data.reduce((a, b) => (b.value > a.value ? b : a), data[0]);
  const cx = 90, cy = 90, r = 80;

  return (
    <Card>
      <p className="text-sm font-semibold adm-t1 mb-0.5">Plan Share</p>
      <p className="text-[12px] adm-t3 mb-4">Hosts by subscription plan</p>
      {total === 0 ? (
        <div className="py-10 text-center text-[12px] adm-t3">No hosts on any plan yet.</div>
      ) : (
        <>
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <svg width="180" height="180" viewBox="0 0 180 180" className="flex-shrink-0">
            {data.filter((d) => d.value > 0).length === 1 ? (() => {
              // Single plan holds 100% — an arc would collapse, so draw a full circle.
              const only = data.find((d) => d.value > 0);
              return (
                <circle cx={cx} cy={cy} r={r} fill={only.color} stroke={PIE_BORDER} strokeWidth="2">
                  <title>{PLAN_NAME[only.key]}: {only.value} (100%)</title>
                </circle>
              );
            })() : (() => {
              let acc = 0;
              return data.filter((d) => d.value > 0).map((d) => {
                const start = (acc / total) * 360;
                acc += d.value;
                const end = (acc / total) * 360;
                return (
                  <path key={d.key} d={arcPath(cx, cy, r, start, end)} fill={d.color} stroke={PIE_BORDER} strokeWidth="1.5" strokeLinejoin="round">
                    <title>{PLAN_NAME[d.key]}: {d.value} ({Math.round((d.value / total) * 100)}%)</title>
                  </path>
                );
              });
            })()}
            {/* crisp outer rim */}
            <circle cx={cx} cy={cy} r={r} fill="none" stroke={PIE_BORDER} strokeWidth="1.5" />
          </svg>
          <ul className="flex-1 w-full space-y-2">
            {data.map((d) => (
              <li key={d.key} className="flex items-center gap-2 text-[12px]">
                <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: d.color, border: `1px solid ${PIE_BORDER}` }} />
                <span className="adm-t2 flex-1">{d.label}</span>
                <span className="font-semibold adm-t1 tabular-nums">{d.value}</span>
                <span className="adm-t3 tabular-nums w-10 text-right">{total ? Math.round((d.value / total) * 100) : 0}%</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-4 pt-3 border-t adm-border text-[11px] adm-t3">
          Largest group: <span className="font-semibold adm-t2">{PLAN_NAME[top.key]}</span> — {top.value} host{top.value !== 1 ? 's' : ''} ({Math.round((top.value / total) * 100)}%).
        </p>
        </>
      )}
    </Card>
  );
};

// Grouped (double) bar — per plan: earning from plans vs from their bookings.
const EARN_PERIODS = [['all', 'All'], ['12m', '12m'], ['90d', '90d'], ['30d', '30d']];

const PlanEarningsBars = ({ planEarnings, bookingEarnings, period, onPeriod }) => {
  const groups = [
    { key: 'creator',      label: 'Host+ (₹1,499)' },
    { key: 'professional', label: 'Studio (₹3,650)' },
  ];
  const series = [
    { key: 'plans',    label: 'Earning from Plans',    color: '#FE5100', data: planEarnings },
    { key: 'bookings', label: 'Earning from Bookings', color: '#1E1E1E', data: bookingEarnings },
  ];
  const valueOf = (g, s) => Number(s.data?.[g.key]) || 0;
  const max = Math.max(1, ...groups.flatMap((g) => series.map((s) => valueOf(g, s))));
  const grand = groups.reduce((t, g) => t + series.reduce((a, s) => a + valueOf(g, s), 0), 0);
  const H = 176; // px plot height
  const hasData = grand > 0;

  return (
    <Card>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-sm font-semibold adm-t1 mb-0.5">Earnings by Plan</p>
          <p className="text-[12px] adm-t3">Subscription revenue vs booking commission</p>
        </div>
        {onPeriod && (
          <div className="flex gap-0.5 bg-gray-100 rounded-lg p-0.5 flex-shrink-0">
            {EARN_PERIODS.map(([k, lbl]) => (
              <button key={k} onClick={() => onPeriod(k)}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${period === k ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                {lbl}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mb-4">
        <p className="text-2xl font-bold adm-t1 tabular-nums">{inr(grand)}</p>
        <p className="text-[11px] adm-t3">Total platform earnings{period && period !== 'all' ? ' in selected period' : ''}</p>
      </div>

      {!hasData ? (
        <div className="flex items-center justify-center text-center text-[12px] adm-t3" style={{ height: H + 28 }}>
          {period && period !== 'all' ? 'No earnings in this period.' : 'No earnings to show yet.'}
        </div>
      ) : (
        <>
          <div className="flex items-end justify-around gap-6" style={{ height: H + 28 }}>
            {groups.map((g) => (
              <div key={g.key} className="flex-1 flex flex-col items-center">
                <div className="flex items-end justify-center gap-3" style={{ height: H }}>
                  {series.map((s) => {
                    const v = valueOf(g, s);
                    const h = Math.max(v > 0 ? 3 : 0, (v / max) * H);
                    const pct = grand ? Math.round((v / grand) * 100) : 0;
                    return (
                      <div key={s.key} className="group relative flex flex-col items-center justify-end" style={{ height: H }}>
                        <span className="text-[10px] font-semibold adm-t2 tabular-nums mb-1 whitespace-nowrap">{inr(v)}</span>
                        <div className="w-9 rounded-t-md transition-opacity group-hover:opacity-80" style={{ height: h, background: s.color }} />
                        <div className="pointer-events-none absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 z-10">
                          {s.label}: {inr(v)} ({pct}%)
                        </div>
                      </div>
                    );
                  })}
                </div>
                <span className="mt-2 text-[11px] font-medium adm-t3 text-center">{g.label}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t adm-border">
            {series.map((s) => (
              <span key={s.key} className="flex items-center gap-1.5 text-[11px] adm-t3">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: s.color }} />{s.label}
              </span>
            ))}
          </div>
        </>
      )}
    </Card>
  );
};

// ── Providers Tab ─────────────────────────────────────────────
const PERIOD_DAYS = { all: null, '12m': 365, '90d': 90, '30d': 30 };
const periodSince = (key) => {
  const days = PERIOD_DAYS[key];
  if (!days) return undefined;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
};

const ProvidersTab = ({ stats }) => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [period, setPeriod] = useState('all');

  useEffect(() => {
    adminGetUsers({ page: 1, limit: 10, role: 'host' })
      .then(r => setProviders(r.data.users || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    adminGetProviderPlanAnalytics({ since: periodSince(period) })
      .then(r => setAnalytics(r.data))
      .catch(() => {});
  }, [period]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Hosts', value: (stats?.vendors || 0).toLocaleString(), sub: 'Registered hosts' },
          { label: 'Active Services', value: (stats?.services || 0).toLocaleString(), sub: 'Published listings' },
          { label: 'Bookings Made',   value: (stats?.bookings || 0).toLocaleString(), sub: 'All-time' },
        ].map(c => (
          <Card key={c.label}>
            <p className="text-[11px] font-medium adm-t3 uppercase tracking-wide mb-1">{c.label}</p>
            <p className="text-2xl font-bold adm-t1">{c.value}</p>
            <p className="text-[11px] adm-t3 mt-1">{c.sub}</p>
          </Card>
        ))}
      </div>

      {/* Plan analytics — two columns: share pie + earnings bars */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PlanSharePie distribution={analytics?.distribution} />
        <PlanEarningsBars planEarnings={analytics?.planEarnings} bookingEarnings={analytics?.bookingEarnings} period={period} onPeriod={setPeriod} />
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b adm-border">
          <p className="font-semibold adm-t1 text-sm">Active Hosts</p>
          <Link to="/admin/providers/active" className="text-[12px] text-[#FE5100] hover:underline font-medium">View all</Link>
        </div>
        {loading ? (
          <div className="py-10 text-center adm-t3 text-sm">Loading...</div>
        ) : providers.length === 0 ? (
          <Empty icon="building" title="No hosts yet" desc="Hosts will appear here once they register." />
        ) : (
          <div className="divide-y adm-border">
            {providers.map(p => (
              <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0 bg-blue-500">
                  {(p.name || p.email || '?')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium adm-t1 truncate">{p.name || '—'}</p>
                    <Badge tone={p.is_verified ? 'ok' : 'warn'}>{p.is_verified ? 'Verified' : 'Unverified'}</Badge>
                  </div>
                  <p className="text-[11px] adm-t3 truncate">@{p.username || p.email}</p>
                </div>
                <span className="text-[11px] adm-t3 flex-shrink-0 capitalize">{p.plan || 'starter'}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

// ── Bookings Tab ──────────────────────────────────────────────
const BookingsTab = ({ stats }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminGetBookings({ page: 1, limit: 10 })
      .then(r => setBookings(r.data.bookings || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total',     value: (stats?.bookings   || 0).toLocaleString(), color: 'text-gray-900' },
          { label: 'Paid',      value: (stats?.confirmed  || 0).toLocaleString(), color: 'text-green-700' },
          { label: 'Cancelled', value: (stats?.cancelled  || 0).toLocaleString(), color: 'text-red-600' },
          { label: 'Pending',   value: ((stats?.bookings || 0) - (stats?.confirmed || 0) - (stats?.cancelled || 0)).toLocaleString(), color: 'text-amber-600' },
        ].map(c => (
          <Card key={c.label}>
            <p className="text-[11px] font-medium adm-t3 uppercase tracking-wide mb-1">{c.label}</p>
            <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
          </Card>
        ))}
      </div>
      <Card className="p-0 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b adm-border">
          <p className="font-semibold adm-t1 text-sm">Recent Bookings</p>
          <Link to="/admin/bookings" className="text-[12px] text-[#FE5100] hover:underline font-medium">View all</Link>
        </div>
        {loading ? (
          <div className="py-10 text-center adm-t3 text-sm">Loading...</div>
        ) : bookings.length === 0 ? (
          <Empty icon="calendar" title="No bookings yet" desc="Bookings will appear here once guests start booking." />
        ) : (
          <div className="divide-y adm-border">
            {bookings.map(b => {
              const dt = new Date(b.scheduled_at);
              return (
                <div key={b.id} className="flex items-center gap-3 px-5 py-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[b.status] || 'bg-gray-300'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium adm-t1 truncate">{b.services?.title || 'Service'}</p>
                    <p className="text-[11px] adm-t3">{b.guest_name || b.guest_email} · {dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold adm-t1">₹{b.services?.price || 0}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium capitalize
                      ${b.status === 'confirmed' ? 'text-green-700 bg-green-50' : b.status === 'cancelled' ? 'text-red-600 bg-red-50' : 'text-amber-700 bg-amber-50'}`}>
                      {b.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};

// ── Pending Tab — the Operations Center attention queue (real data) ───────────
const SEVERITY_STYLE = {
  danger:  'bg-red-50 text-red-600',
  warning: 'bg-[#FE5100]/10 text-[#FE5100]',
  ok:      'bg-gray-100 text-gray-400',
};

const PendingTab = ({ ops }) => {
  const items = ops?.attention || [];
  const clear = ops && (ops.totalAttention === 0);

  return (
    <div className="space-y-4">
      {clear && (
        <Card className="p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-4">
            <Ic d={IC.check} size={22} className="text-green-500" />
          </div>
          <p className="font-semibold adm-t1 mb-1">All clear</p>
          <p className="text-sm adm-t3 max-w-sm mx-auto">Nothing needs attention right now.</p>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map(item => (
          <Link key={item.key} to={item.to}
            className="adm-card rounded-2xl p-5 hover:shadow-sm transition-all flex items-center gap-4 group">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${SEVERITY_STYLE[item.severity] || SEVERITY_STYLE.ok}`}>
              <Ic d={IC.alert} size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold adm-t1 text-sm">{item.label}</p>
              <p className="text-[12px] adm-t3 mt-0.5">{item.count ? 'Needs attention' : 'Nothing pending'}</p>
            </div>
            <span className={`text-sm font-bold px-2.5 py-1 rounded-lg flex-shrink-0 ${item.count ? SEVERITY_STYLE[item.severity] : 'text-gray-300 bg-gray-100'}`}>
              {item.count}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};

// ── SuperDashboard ────────────────────────────────────────────
const SuperDashboard = () => {
  const { view } = useParams();
  const navigate  = useNavigate();
  const [stats, setStats]     = useState(null);
  const [ops, setOps]         = useState(null);
  const [loading, setLoading] = useState(true);

  const activeTab = view || 'overview';

  useEffect(() => {
    Promise.all([adminGetStats(), adminOpsSummary()])
      .then(([s, o]) => { setStats(s.data); setOps(o.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Page header */}
      <PageHeader
        title="Dashboard"
        subtitle="Platform overview and key metrics"
        actions={
          <div className="text-[11px] adm-t3 adm-card rounded-lg px-3 py-1.5">
            {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 adm-card rounded-xl p-1 w-fit flex-wrap">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => navigate(tab.to)}
            className={`px-3.5 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-150
              ${activeTab === tab.id
                ? 'text-[#FE5100] shadow-sm'
                : 'adm-t2 hover:text-gray-700 hover:bg-gray-50'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-[#FE5100] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm adm-t3">Loading dashboard...</p>
          </div>
        </div>
      ) : (
        <>
          {activeTab === 'overview'  && <OverviewTab  stats={stats} ops={ops} />}
          {activeTab === 'revenue'   && <RevenueTab   stats={stats} />}
          {activeTab === 'users'     && <UsersTab      stats={stats} />}
          {activeTab === 'providers' && <ProvidersTab  stats={stats} />}
          {activeTab === 'bookings'  && <BookingsTab   stats={stats} />}
          {activeTab === 'pending'   && <PendingTab ops={ops} />}
          {activeTab === 'insights'  && <AdminInsights />}
        </>
      )}
    </div>
  );
};

export default SuperDashboard;
