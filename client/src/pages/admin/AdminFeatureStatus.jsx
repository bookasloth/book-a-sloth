import { useEffect, useState } from 'react';
import { adminGetFeatures, adminToggleFeature } from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminFeatureStatus() {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);

  useEffect(() => {
    adminGetFeatures()
      .then(({ data }) => setFlags(Array.isArray(data) ? data : []))
      .catch(() => setFlags([]))
      .finally(() => setLoading(false));
  }, []);

  const toggle = async (f) => {
    const next = !f.enabled;
    setBusy(f.key);
    setFlags((fs) => fs.map((x) => (x.key === f.key ? { ...x, enabled: next } : x)));
    try {
      await adminToggleFeature(f.key, next);
      toast.success(`${f.label} ${next ? 'enabled' : 'disabled'}`);
    } catch (e) {
      setFlags((fs) => fs.map((x) => (x.key === f.key ? { ...x, enabled: f.enabled } : x)));
      toast.error('Could not update');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-bold mb-1">Feature Status</h1>
      <p className="text-sm text-gray-500 mb-6">Turn platform features on or off.</p>
      {loading ? (
        <p className="text-gray-400">Loading…</p>
      ) : (
        <div className="space-y-3">
          {flags.map((f) => (
            <div key={f.key} className="flex items-start justify-between gap-4 bg-white border rounded-xl p-4">
              <div className="min-w-0">
                <p className="font-semibold">{f.label}</p>
                <p className="text-sm text-gray-500 mt-0.5">{f.description}</p>
              </div>
              <button
                role="switch"
                aria-checked={f.enabled}
                aria-label={f.label}
                disabled={busy === f.key}
                onClick={() => toggle(f)}
                className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${f.enabled ? 'bg-[#FE5100]' : 'bg-gray-300'} disabled:opacity-50`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${f.enabled ? 'translate-x-5' : ''}`} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
