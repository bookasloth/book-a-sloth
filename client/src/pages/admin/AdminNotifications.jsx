import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  adminGetNotifProvider, adminUpdateNotifProvider, adminTestNotifProvider,
  adminGetNotifEvents, adminUpdateNotifEvent,
  adminTestNotifSend, adminGetNotifLogs, adminRetryNotifLog,
} from '../../services/api';

const Toggle = ({ on, onChange, color = 'bg-emerald-500' }) => (
  <button onClick={onChange} type="button"
    className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${on ? color : 'bg-gray-300'}`}>
    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${on ? 'left-[22px]' : 'left-0.5'}`} />
  </button>
);

const StatusBadge = ({ status }) => {
  const styles = {
    sent:    'bg-emerald-50 text-emerald-600',
    failed:  'bg-red-50 text-red-600',
    pending: 'bg-amber-50 text-amber-600',
  };
  return <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${styles[status] || 'bg-gray-100 text-gray-500'}`}>{status}</span>;
};

// Template variable previews for the approved AiSensy templates
const TEMPLATE_PREVIEWS = {
  BOOKING_OTP:                 '{{1}} = OTP code',
  BOOKING_CONFIRMED_CUSTOMER:  '{{1}} customer · {{2}} service · {{3}} vendor · {{4}} date/time',
  BOOKING_CONFIRMED_VENDOR:    '{{1}} vendor · {{2}} customer · {{3}} service · {{4}} date/time',
  BOOKING_COMPLETED_CUSTOMER:  '{{1}} customer · {{2}} service · {{3}} vendor · {{4}} date/time',
  BOOKING_CANCELLED_CUSTOMER:  '{{1}} customer · {{2}} service · {{3}} vendor · {{4}} date/time',
  BOOKING_CANCELLED_VENDOR:    '{{1}} vendor · {{2}} customer · {{3}} service · {{4}} date/time',
};

const AdminNotifications = () => {
  const [tab, setTab] = useState('provider');

  // ── Provider state ──
  const [provider, setProvider] = useState(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [connectedNumber, setConnectedNumber] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [savingProvider, setSavingProvider] = useState(false);
  const [testingConn, setTestingConn] = useState(false);

  // ── Events state ──
  const [events, setEvents] = useState([]);
  const [savingEventId, setSavingEventId] = useState(null);
  const [testTarget, setTestTarget] = useState({});

  // ── Logs state ──
  const [logs, setLogs] = useState([]);
  const [logFilter, setLogFilter] = useState({ status: '', channel: '' });
  const [loadingLogs, setLoadingLogs] = useState(false);

  const loadProvider = useCallback(() => {
    adminGetNotifProvider().then((r) => {
      setProvider(r.data);
      setApiKeyInput(r.data.api_key_masked || '');
      setConnectedNumber(r.data.settings_json?.connected_number || '');
      setWebhookUrl(r.data.settings_json?.webhook_url || '');
      setWhatsappEnabled(!!r.data.is_active);
    }).catch(() => toast.error('Failed to load provider config'));
  }, []);

  const loadEvents = useCallback(() => {
    adminGetNotifEvents().then((r) => setEvents(r.data)).catch(() => toast.error('Failed to load events'));
  }, []);

  const loadLogs = useCallback(() => {
    setLoadingLogs(true);
    const params = {};
    if (logFilter.status)  params.status = logFilter.status;
    if (logFilter.channel) params.channel = logFilter.channel;
    adminGetNotifLogs(params).then((r) => setLogs(r.data)).catch(() => toast.error('Failed to load logs'))
      .finally(() => setLoadingLogs(false));
  }, [logFilter]);

  useEffect(() => { loadProvider(); loadEvents(); }, [loadProvider, loadEvents]);
  useEffect(() => { if (tab === 'logs') loadLogs(); }, [tab, loadLogs]);

  const saveProvider = async (overrideActive) => {
    setSavingProvider(true);
    try {
      const r = await adminUpdateNotifProvider({
        api_key: apiKeyInput,
        connected_number: connectedNumber,
        webhook_url: webhookUrl,
        is_active: overrideActive !== undefined ? overrideActive : whatsappEnabled,
      });
      setApiKeyInput(r.data.api_key_masked || '');
      setWhatsappEnabled(!!r.data.is_active);
      toast.success('AiSensy settings saved');
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Save failed');
    } finally {
      setSavingProvider(false);
    }
  };

  const testConnection = async () => {
    setTestingConn(true);
    try {
      const r = await adminTestNotifProvider();
      toast.success(r.data.message || 'Connection OK');
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Connection test failed');
    } finally {
      setTestingConn(false);
    }
  };

  const saveEvent = async (evt, changes) => {
    setSavingEventId(evt.id);
    try {
      const r = await adminUpdateNotifEvent(evt.id, changes);
      setEvents((prev) => prev.map((e) => (e.id === evt.id ? r.data : e)));
      toast.success(`${evt.event_key} updated`);
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Update failed');
    } finally {
      setSavingEventId(null);
    }
  };

  const sendTest = async (evt, channel) => {
    const destination = (testTarget[evt.id] || '').trim();
    if (!destination) return toast.error(channel === 'whatsapp' ? 'Enter a phone number' : 'Enter an email');
    try {
      const r = await adminTestNotifSend({ event_key: evt.event_key, channel, destination });
      toast.success(r.data.message || 'Test sent');
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Test failed');
    }
  };

  const retry = async (log) => {
    try {
      const r = await adminRetryNotifLog(log.id);
      toast.success(r.data.message || 'Retried');
      loadLogs();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Retry failed');
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Notification Settings</h1>
        <p className="text-[12px] text-gray-400 mt-0.5">WhatsApp (AiSensy) + email configuration, event registry and delivery logs</p>
      </div>

      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {[['provider', 'AiSensy Configuration'], ['events', 'Events'], ['logs', 'Logs']].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-1.5 rounded-md text-[13px] font-medium transition-colors ${tab === k ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── AiSensy Configuration ── */}
      {tab === 'provider' && (
        <div className="bg-white border rounded-xl p-5 max-w-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-800">AiSensy WhatsApp</p>
              <p className="text-xs text-gray-400">
                Status:{' '}
                {provider?.configured
                  ? <span className={whatsappEnabled ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>{whatsappEnabled ? 'Connected & enabled' : 'Configured, disabled'}</span>
                  : <span className="text-red-500 font-semibold">Not configured</span>}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Enable WhatsApp</span>
              <Toggle on={whatsappEnabled} onChange={() => setWhatsappEnabled((v) => !v)} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">API Key</label>
            <input type="text" className="fb-input font-mono text-xs" value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="Paste AiSensy API campaign key" />
            <p className="text-xs text-gray-400 mt-1">Stored server-side only. Shown masked. Paste a new key to replace.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Connected Number</label>
              <input type="text" className="fb-input" value={connectedNumber}
                onChange={(e) => setConnectedNumber(e.target.value)} placeholder="+15551234567" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Webhook URL</label>
              <input type="text" className="fb-input" value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://..." />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button onClick={() => saveProvider()} disabled={savingProvider}
              className="bg-gray-900 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50">
              {savingProvider ? 'Saving…' : 'Save'}
            </button>
            <button onClick={testConnection} disabled={testingConn}
              className="border px-5 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
              {testingConn ? 'Testing…' : 'Test Connection'}
            </button>
            {whatsappEnabled && (
              <button onClick={() => { setWhatsappEnabled(false); saveProvider(false); }}
                className="border border-red-200 text-red-600 px-5 py-2 rounded-lg text-sm font-medium hover:bg-red-50">
                Disable
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Event registry ── */}
      {tab === 'events' && (
        <div className="space-y-3">
          {events.length === 0 && <p className="text-sm text-gray-400">No events found — run migration v1.9.</p>}
          {events.map((evt) => (
            <div key={evt.id} className="bg-white border rounded-xl p-4">
              <div className="flex flex-wrap items-center gap-3 justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 font-mono">{evt.event_key}</p>
                  <p className="text-xs text-gray-400">{evt.display_name}
                    {evt.updated_at && <span className="ml-2">· modified {new Date(evt.updated_at).toLocaleString('en-IN')}</span>}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 text-xs text-gray-600">
                    WhatsApp <Toggle on={!!evt.whatsapp_enabled} onChange={() => saveEvent(evt, { whatsapp_enabled: !evt.whatsapp_enabled })} />
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-gray-600">
                    Email <Toggle on={!!evt.email_enabled} onChange={() => saveEvent(evt, { email_enabled: !evt.email_enabled })} color="bg-indigo-500" />
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-gray-600">
                    Active <Toggle on={!!evt.is_active} onChange={() => saveEvent(evt, { is_active: !evt.is_active })} color="bg-gray-700" />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">AiSensy Campaign Name</label>
                  <input type="text" className="fb-input text-sm" defaultValue={evt.campaign_name || ''}
                    onBlur={(e) => { if (e.target.value !== (evt.campaign_name || '')) saveEvent(evt, { campaign_name: e.target.value }); }}
                    placeholder="campaign name in AiSensy" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Email Subject</label>
                  <input type="text" className="fb-input text-sm" defaultValue={evt.email_subject || ''}
                    onBlur={(e) => { if (e.target.value !== (evt.email_subject || '')) saveEvent(evt, { email_subject: e.target.value }); }} />
                </div>
              </div>

              {TEMPLATE_PREVIEWS[evt.event_key] && (
                <p className="text-[11px] text-gray-400 mt-2 font-mono">Template vars: {TEMPLATE_PREVIEWS[evt.event_key]}</p>
              )}

              <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-50">
                <input type="text" className="fb-input text-sm flex-1 min-w-[200px]"
                  placeholder="Phone (91XXXXXXXXXX) or email for test"
                  value={testTarget[evt.id] || ''}
                  onChange={(e) => setTestTarget((p) => ({ ...p, [evt.id]: e.target.value }))} />
                <button onClick={() => sendTest(evt, 'whatsapp')}
                  className="text-xs font-semibold px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100">
                  Test WhatsApp
                </button>
                <button onClick={() => sendTest(evt, 'email')}
                  className="text-xs font-semibold px-3 py-2 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100">
                  Test Email
                </button>
                {savingEventId === evt.id && <span className="text-xs text-gray-400">Saving…</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Logs ── */}
      {tab === 'logs' && (
        <div className="bg-white border rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 p-3 border-b">
            <select className="fb-input text-sm w-36" value={logFilter.channel}
              onChange={(e) => setLogFilter((f) => ({ ...f, channel: e.target.value }))}>
              <option value="">All channels</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="email">Email</option>
            </select>
            <select className="fb-input text-sm w-36" value={logFilter.status}
              onChange={(e) => setLogFilter((f) => ({ ...f, status: e.target.value }))}>
              <option value="">All statuses</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
            </select>
            <button onClick={loadLogs} className="text-xs font-semibold px-3 py-2 rounded-lg border text-gray-600 hover:bg-gray-50">Refresh</button>
          </div>
          {loadingLogs ? (
            <p className="text-center text-sm text-gray-400 py-8">Loading…</p>
          ) : logs.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-8">No notification logs yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-gray-400 border-b">
                    <th className="px-4 py-2">Time</th><th className="px-4 py-2">Event</th>
                    <th className="px-4 py-2">Channel</th><th className="px-4 py-2">Destination</th>
                    <th className="px-4 py-2">Status</th><th className="px-4 py-2">Error</th><th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b last:border-0 hover:bg-gray-50/60">
                      <td className="px-4 py-2 text-xs text-gray-500 whitespace-nowrap">{new Date(log.created_at).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-2 font-mono text-xs">{log.event_key}</td>
                      <td className="px-4 py-2 text-xs capitalize">{log.channel}</td>
                      <td className="px-4 py-2 text-xs">{log.destination}</td>
                      <td className="px-4 py-2"><StatusBadge status={log.status} /></td>
                      <td className="px-4 py-2 text-xs text-red-500 max-w-[200px] truncate" title={log.error || ''}>{log.error || '—'}</td>
                      <td className="px-4 py-2">
                        {log.status === 'failed' && (
                          <button onClick={() => retry(log)} className="text-xs font-semibold text-indigo-600 hover:underline">Retry</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminNotifications;
