// Marketing / Performance Insights — admin command center.
//
// Design (see marketing-analytics-stack): a STRIP of owned KPI tiles (Postgres
// truth, from GET /admin/insights/kpis) + a LAUNCHPAD of cards deep-linking into
// the native tool dashboards. We deliberately DON'T re-implement heatmaps /
// attribution / funnels here — those live in their own tools and rot if cloned.
import { useState, useEffect } from 'react';
import { adminGetInsights } from '../../services/api';
import { PageHeader, Card } from '../../components/admin/ui';

// Native dashboards (open in a new tab). Generic entry URLs — each lands the
// admin in their own logged-in account; no per-project secrets in the client.
const LAUNCHPAD = [
  {
    label: 'PostHog',
    desc: 'Product funnels, retention, paths, event explorer.',
    href: 'https://us.posthog.com',
    accent: '#1d4ed8',
  },
  {
    label: 'GA4',
    desc: 'Acquisition, channels, UTM attribution, Google Ads ROI.',
    href: 'https://analytics.google.com',
    accent: '#ea4335',
  },
  {
    label: 'Microsoft Clarity',
    desc: 'Session replays + heatmaps (where users click & rage-click).',
    href: 'https://clarity.microsoft.com',
    accent: '#7c3aed',
  },
  {
    label: 'Meta Events Manager',
    desc: 'Pixel + Conversions API events, ad campaign conversions.',
    href: 'https://business.facebook.com/events_manager2',
    accent: '#1877f2',
  },
];

const inr = (n) => `₹${(Number(n) || 0).toLocaleString('en-IN')}`;

// Growth delta vs the prior 30-day window. Returns null when there's no base.
const delta = (cur, prev) => {
  if (!prev) return null;
  const pct = Math.round(((cur - prev) / prev) * 1000) / 10;
  return pct;
};

const Tile = ({ label, value, sub, foot }) => (
  <Card>
    <p className="text-xs adm-t3 mb-1">{label}</p>
    <p className="text-3xl font-bold adm-t1">{value}</p>
    {sub && <p className="text-xs adm-t2 mt-1">{sub}</p>}
    {foot}
  </Card>
);

const AdminInsights = () => {
  const [kpi, setKpi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    adminGetInsights()
      .then((r) => setKpi(r.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-16 adm-t3">Loading insights…</div>;

  const revDelta = kpi && delta(kpi.revenue?.last30, kpi.revenue?.prev30);
  const gmvDelta = kpi && delta(kpi.gmv?.last30, kpi.gmv?.prev30);

  return (
    <div className="max-w-5xl">
      <PageHeader title="Marketing & Performance" subtitle={<>
        Owned KPIs from our database · deep-dive in the native tools below.
        {kpi?.generatedAt && (
          <span className="ml-1 adm-t3">
            (as of {new Date(kpi.generatedAt).toLocaleString('en-IN')})
          </span>
        )}
      </>} />

      {error && (
        <div className="mb-6 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-4 py-3">
          Couldn't load KPI data. The launchpad below still works.
        </div>
      )}

      {/* ── Owned KPI strip (Postgres truth) ── */}
      {kpi && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <Tile
            label="Platform Revenue"
            value={inr(kpi.revenue?.total)}
            sub={`${inr(kpi.revenue?.last30)} last 30d`}
            foot={
              revDelta != null && (
                <p className={`text-xs mt-2 font-semibold ${revDelta >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {revDelta >= 0 ? '▲' : '▼'} {Math.abs(revDelta)}% vs prior 30d
                </p>
              )
            }
          />
          <Tile
            label="Paid Bookings"
            value={kpi.bookings?.paid ?? 0}
            sub={`${kpi.bookings?.last30 ?? 0} last 30d · ${kpi.bookings?.total ?? 0} total`}
          />
          <Tile
            label="Booking → Paid"
            value={`${kpi.conversion?.rate ?? 0}%`}
            sub={`${kpi.conversion?.paid ?? 0} of ${kpi.conversion?.created ?? 0} created`}
          />
          <Tile
            label="Hosts"
            value={kpi.hosts?.total ?? 0}
            sub={`+${kpi.hosts?.new30 ?? 0} last 30d · ${kpi.guests?.total ?? 0} guests`}
          />
          <Tile
            label="GMV (bookings + products)"
            value={inr(kpi.gmv?.total)}
            sub={`${inr(kpi.gmv?.last30)} last 30d · take ${kpi.gmv?.takeRate ?? 0}%`}
            foot={
              gmvDelta != null && (
                <p className={`text-xs mt-2 font-semibold ${gmvDelta >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {gmvDelta >= 0 ? '▲' : '▼'} {Math.abs(gmvDelta)}% vs prior 30d
                </p>
              )
            }
          />
          <Tile
            label="Host Activation"
            value={`${kpi.activation?.activationRate ?? 0}%`}
            sub={`${kpi.activation?.activatedCount ?? 0} of ${kpi.activation?.totalHosts ?? 0} hosts · +${kpi.activation?.new30 ?? 0} 30d`}
            foot={
              <p className="text-xs mt-2 text-gray-400">
                {kpi.activation?.medianTimeToFirstBookingDays != null
                  ? `~${kpi.activation.medianTimeToFirstBookingDays}d to first booking`
                  : '— no activated hosts yet'}
              </p>
            }
          />
        </div>
      )}

      {/* ── Launchpad — native tool dashboards ── */}
      <h2 className="text-sm font-semibold adm-t2 mb-3">Open a tool</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {LAUNCHPAD.map((t) => (
          <a
            key={t.label}
            href={t.href}
            target="_blank"
            rel="noreferrer"
            className="adm-card rounded-xl p-5 hover:shadow-sm transition-shadow flex items-start gap-3"
          >
            <span className="mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: t.accent }} />
            <span>
              <span className="font-semibold adm-t1 flex items-center gap-1">
                {t.label}
                <svg className="w-3.5 h-3.5 adm-t3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </span>
              <span className="block text-xs adm-t3 mt-0.5">{t.desc}</span>
            </span>
          </a>
        ))}
      </div>

      <p className="text-xs adm-t3 mt-6">
        Traffic sources &amp; the full visitor funnel live in PostHog/GA4 — a native
        in-dashboard view is planned (PostHog query API).
      </p>
    </div>
  );
};

export default AdminInsights;
