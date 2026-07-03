import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import Ic from '../../components/admin/Ic';
import { IC } from '../../components/admin/adminNav';
import {
  adminGetBlockedIps, adminCreateBlockedIp, adminDeleteBlockedIp,
  adminGetAllowlist, adminCreateAllowlistIp, adminDeleteAllowlistIp,
} from '../../services/api';

const fmtDate = (s) => {
  if (!s) return '—';
  try { return new Date(s).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); }
  catch { return '—'; }
};

// Humanise how long until a ban expires (or "Permanent" when no expiry).
const timeLeft = (expires_at) => {
  if (!expires_at) return 'Permanent';
  const ms = new Date(expires_at).getTime() - Date.now();
  if (ms <= 0) return 'Expired';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h left`;
  if (h >= 1) return `${h}h ${m}m left`;
  return `${m}m left`;
};

const SOURCE_BADGE = {
  manual:        { label: 'Manual',     cls: 'bg-gray-100 text-gray-600 border-gray-200' },
  auto:          { label: 'Auto',       cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  auto_attack:   { label: 'Attack',     cls: 'bg-red-50 text-red-700 border-red-200' },
  admin_lockout: { label: 'Admin lock', cls: 'bg-purple-50 text-purple-700 border-purple-200' },
};

const AdminBlockedIps = () => {
  const [blocked, setBlocked] = useState([]);
  const [allowlist, setAllowlist] = useState([]);
  const [loading, setLoading] = useState(true);

  const [ip, setIp] = useState('');
  const [reason, setReason] = useState('');
  const [permanent, setPermanent] = useState(false);
  const [blocking, setBlocking] = useState(false);

  const [allowIp, setAllowIp] = useState('');
  const [allowNote, setAllowNote] = useState('');
  const [allowing, setAllowing] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([adminGetBlockedIps(), adminGetAllowlist()])
      .then(([b, a]) => {
        setBlocked(b.data?.blocked || []);
        setAllowlist(a.data?.allowlist || []);
      })
      .catch(() => toast.error('Failed to load IP rules'))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const block = async () => {
    const v = ip.trim();
    if (!v) return toast.error('Enter an IP address');
    setBlocking(true);
    try {
      await adminCreateBlockedIp({ ip: v, reason: reason.trim() || undefined, permanent });
      setIp(''); setReason(''); setPermanent(false);
      toast.success('IP blocked');
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not block that IP');
    } finally { setBlocking(false); }
  };

  const unblock = async (row) => {
    if (!window.confirm(`Unblock ${row.ip}?`)) return;
    try {
      await adminDeleteBlockedIp(row.ip);
      toast.success('IP unblocked');
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not unblock');
    }
  };

  const allow = async () => {
    const v = allowIp.trim();
    if (!v) return toast.error('Enter an IP address');
    setAllowing(true);
    try {
      await adminCreateAllowlistIp({ ip: v, note: allowNote.trim() || undefined });
      setAllowIp(''); setAllowNote('');
      toast.success('IP allowlisted');
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not allowlist that IP');
    } finally { setAllowing(false); }
  };

  const unallow = async (row) => {
    if (!window.confirm(`Remove ${row.ip} from the allowlist?`)) return;
    try {
      await adminDeleteAllowlistIp(row.ip);
      toast.success('Removed from allowlist');
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not remove');
    }
  };

  return (
    <div className="max-w-5xl">
      <h1 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
        <Ic d={IC.ban} size={20} className="text-red-600" /> Blocked IPs
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        IPs are auto-banned for repeated rate-limit violations, attack patterns, and admin-login brute-force.
        Add or remove bans manually below. Allowlisted IPs can never be auto-banned — add your office IP and
        monitors there first.
      </p>

      {/* ── Block an IP ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <input className="fb-input flex-1 min-w-[160px]" placeholder="IP address (e.g. 203.0.113.5)"
          value={ip} onChange={(e) => setIp(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && block()} />
        <input className="fb-input flex-1 min-w-[180px]" placeholder="Reason (optional)"
          value={reason} onChange={(e) => setReason(e.target.value)} />
        <label className="flex items-center gap-1.5 text-sm text-gray-600 select-none">
          <input type="checkbox" checked={permanent} onChange={(e) => setPermanent(e.target.checked)} />
          Permanent
        </label>
        <button onClick={block} disabled={blocking}
          className="btn flex items-center gap-1.5 bg-red-600 text-white px-4 text-sm font-medium hover:bg-red-700 disabled:opacity-50 shrink-0">
          <Ic d={IC.ban} size={16} strokeWidth={2.5} /> Block
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm py-10 text-center">Loading…</p>
      ) : (
        <>
          <div className="border border-gray-200 rounded overflow-x-auto mb-10">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500">
                  <th className="px-3 py-2">IP Address</th>
                  <th className="px-3 py-2">Source</th>
                  <th className="px-3 py-2">Reason</th>
                  <th className="px-3 py-2">Expires</th>
                  <th className="px-3 py-2">Added</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {blocked.map((row) => {
                  const badge = SOURCE_BADGE[row.source] || SOURCE_BADGE.manual;
                  return (
                    <tr key={row.ip} className="border-b border-gray-100 last:border-0">
                      <td className="px-3 py-2.5 font-mono text-gray-900">{row.ip}</td>
                      <td className="px-3 py-2.5">
                        <span className={`text-[11px] font-medium rounded border px-1.5 py-0.5 ${badge.cls}`}>{badge.label}</span>
                      </td>
                      <td className="px-3 py-2.5 text-gray-600 max-w-[220px] truncate" title={row.reason || ''}>{row.reason || '—'}</td>
                      <td className="px-3 py-2.5 text-xs text-gray-500 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          {!row.expires_at && <Ic d={IC.clock} size={12} className="text-gray-400" />}
                          {timeLeft(row.expires_at)}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-gray-500 whitespace-nowrap">
                        {fmtDate(row.created_at)}{row.created_by ? ` · ${row.created_by}` : ''}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <button onClick={() => unblock(row)} title="Unblock"
                          className="text-gray-400 hover:text-red-600 p-1">
                          <Ic d={IC.trash} size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {blocked.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-6 text-sm text-gray-400 text-center">No IPs are currently blocked.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ── Allowlist ─────────────────────────────────────────── */}
          <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
            <Ic d={IC.shieldOk} size={20} className="text-green-600" /> Allowlist
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            These IPs are <strong>never</strong> blocked or auto-banned. Add the founder/office IP and any uptime monitors here.
          </p>

          <div className="flex flex-wrap items-center gap-2 mb-5">
            <input className="fb-input flex-1 min-w-[160px]" placeholder="IP address"
              value={allowIp} onChange={(e) => setAllowIp(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && allow()} />
            <input className="fb-input flex-1 min-w-[180px]" placeholder="Note (e.g. office, UptimeRobot)"
              value={allowNote} onChange={(e) => setAllowNote(e.target.value)} />
            <button onClick={allow} disabled={allowing}
              className="btn flex items-center gap-1.5 bg-green-600 text-white px-4 text-sm font-medium hover:bg-green-700 disabled:opacity-50 shrink-0">
              <Ic d={IC.plus} size={16} strokeWidth={3} /> Allow
            </button>
          </div>

          <div className="border border-gray-200 rounded overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500">
                  <th className="px-3 py-2">IP Address</th>
                  <th className="px-3 py-2">Note</th>
                  <th className="px-3 py-2">Added</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {allowlist.map((row) => (
                  <tr key={row.ip} className="border-b border-gray-100 last:border-0">
                    <td className="px-3 py-2.5 font-mono text-gray-900">{row.ip}</td>
                    <td className="px-3 py-2.5 text-gray-600">{row.note || '—'}</td>
                    <td className="px-3 py-2.5 text-xs text-gray-500 whitespace-nowrap">
                      {fmtDate(row.created_at)}{row.created_by ? ` · ${row.created_by}` : ''}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <button onClick={() => unallow(row)} title="Remove"
                        className="text-gray-400 hover:text-red-600 p-1">
                        <Ic d={IC.trash} size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {allowlist.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-6 text-sm text-gray-400 text-center">No allowlisted IPs yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminBlockedIps;
