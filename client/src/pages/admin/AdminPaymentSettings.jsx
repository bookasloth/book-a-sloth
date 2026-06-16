import { useState, useEffect } from "react";
import { adminGetRazorpay, adminUpdateRazorpay, adminTestRazorpay } from "../../services/api";
import toast from "react-hot-toast";

const AdminPaymentSettings = () => {
  const [cfg, setCfg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  // Secrets are write-only: blank means "leave unchanged".
  const [form, setForm] = useState({ key_id: "", key_secret: "", webhook_secret: "", enabled: false, mode: "test" });

  const load = () => {
    setLoading(true);
    adminGetRazorpay()
      .then((r) => {
        setCfg(r.data);
        setForm((f) => ({ ...f, key_id: r.data.key_id || "", enabled: !!r.data.enabled, mode: r.data.mode || "test", key_secret: "", webhook_secret: "" }));
      })
      .catch(() => toast.error("Failed to load Razorpay settings"))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const save = async () => {
    setSaving(true);
    try {
      const payload = { key_id: form.key_id, enabled: form.enabled, mode: form.mode };
      if (form.key_secret.trim()) payload.key_secret = form.key_secret.trim();
      if (form.webhook_secret.trim()) payload.webhook_secret = form.webhook_secret.trim();
      const { data } = await adminUpdateRazorpay(payload);
      setCfg(data);
      setForm((f) => ({ ...f, key_secret: "", webhook_secret: "" }));
      toast.success("Razorpay settings saved");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const test = async () => {
    setTesting(true);
    try {
      // Test the typed secret if present, else the stored one (server falls back).
      const payload = {};
      if (form.key_id.trim()) payload.key_id = form.key_id.trim();
      if (form.key_secret.trim()) payload.key_secret = form.key_secret.trim();
      const { data } = await adminTestRazorpay(payload);
      data.ok ? toast.success(data.message) : toast.error(data.message);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Test failed — credentials rejected");
    } finally {
      setTesting(false);
    }
  };

  const copyWebhook = () => {
    if (cfg?.webhook_url) {
      navigator.clipboard?.writeText(cfg.webhook_url);
      toast.success("Webhook URL copied");
    }
  };

  if (loading) return <div className="text-center py-12 text-gray-400">Loading…</div>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-1">Payment — Razorpay</h1>
      <p className="text-sm text-gray-400 mb-6">
        Enter your Razorpay API credentials here. Stored encrypted; used for all bookings, products, and subscription billing.
      </p>

      <div className="bg-white border rounded-xl p-5 space-y-5">
        {/* Enabled */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Razorpay enabled</p>
            <p className="text-xs text-gray-400">When off, payment flows are disabled platform-wide.</p>
          </div>
          <button
            onClick={() => setForm((f) => ({ ...f, enabled: !f.enabled }))}
            className={`relative w-12 h-6 rounded-full transition-colors ${form.enabled ? "bg-emerald-500" : "bg-gray-300"}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.enabled ? "left-[26px]" : "left-0.5"}`} />
          </button>
        </div>

        {/* Mode */}
        <div>
          <label className="block text-sm font-medium mb-1">Mode</label>
          <select className="fb-input w-40" value={form.mode} onChange={(e) => setForm((f) => ({ ...f, mode: e.target.value }))}>
            <option value="test">Test</option>
            <option value="live">Live</option>
          </select>
          <p className="text-xs text-gray-400 mt-1">Informational label — use matching test/live keys below.</p>
        </div>

        {/* Key ID */}
        <div>
          <label className="block text-sm font-medium mb-1">Key ID</label>
          <input className="fb-input font-mono text-sm" placeholder="rzp_test_xxxxxxxx or rzp_live_xxxxxxxx"
            value={form.key_id} onChange={(e) => setForm((f) => ({ ...f, key_id: e.target.value }))} />
        </div>

        {/* Key Secret */}
        <div>
          <label className="block text-sm font-medium mb-1">Key Secret</label>
          <input type="password" className="fb-input font-mono text-sm" autoComplete="new-password"
            placeholder={cfg?.key_secret_set ? `Saved (${cfg.key_secret_hint}) — leave blank to keep` : "Enter key secret"}
            value={form.key_secret} onChange={(e) => setForm((f) => ({ ...f, key_secret: e.target.value }))} />
          <p className="text-xs text-gray-400 mt-1">Stored encrypted. Leave blank to keep the existing secret.</p>
        </div>

        {/* Webhook Secret */}
        <div>
          <label className="block text-sm font-medium mb-1">Webhook Secret</label>
          <input type="password" className="fb-input font-mono text-sm" autoComplete="new-password"
            placeholder={cfg?.webhook_secret_set ? "Saved — leave blank to keep" : "Enter webhook secret"}
            value={form.webhook_secret} onChange={(e) => setForm((f) => ({ ...f, webhook_secret: e.target.value }))} />
        </div>

        {/* Webhook URL (read-only, for the Razorpay dashboard) */}
        <div className="border-t pt-4">
          <label className="block text-sm font-medium mb-1">Webhook URL</label>
          <div className="flex gap-2">
            <input className="fb-input font-mono text-xs bg-gray-50" readOnly value={cfg?.webhook_url || ""} />
            <button onClick={copyWebhook} className="btn btn--outline px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 whitespace-nowrap">Copy</button>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            In the Razorpay dashboard, add this as a webhook and enable events:
            <span className="font-mono"> payment.captured, payment.failed, subscription.activated, subscription.charged, subscription.halted, subscription.cancelled</span>.
          </p>
        </div>

        <div className="flex gap-2 pt-2 border-t">
          <button onClick={test} disabled={testing}
            className="btn btn--outline px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
            {testing ? "Testing…" : "Test connection"}
          </button>
          <button onClick={save} disabled={saving}
            className="btn bg-gray-900 text-white px-6 py-2.5 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 flex-1">
            {saving ? "Saving…" : "Save Razorpay Settings"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPaymentSettings;
