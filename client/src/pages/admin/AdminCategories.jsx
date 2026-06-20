import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Check, X, Trash2, Plus, Pencil, Clock } from 'lucide-react';
import {
  adminListCategories, adminCreateCategory, adminUpdateCategory, adminDeleteCategory,
} from '../../services/api';

const STATUS_META = {
  pending:  { label: 'Pending approval', cls: 'bg-amber-100 text-amber-700' },
  active:   { label: 'Active',           cls: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rejected',         cls: 'bg-gray-100 text-gray-500' },
};

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newLabel, setNewLabel] = useState('');
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editLabel, setEditLabel] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    adminListCategories()
      .then(({ data }) => setCategories(data || []))
      .catch(() => toast.error('Failed to load categories'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    const label = newLabel.trim();
    if (label.length < 2) return toast.error('Enter a category name');
    setCreating(true);
    try {
      await adminCreateCategory({ label, status: 'active' });
      setNewLabel('');
      toast.success('Category created');
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not create');
    } finally {
      setCreating(false);
    }
  };

  const setStatus = async (cat, status) => {
    try {
      await adminUpdateCategory(cat.id, { status });
      toast.success(status === 'active' ? 'Approved' : 'Updated');
      load();
    } catch {
      toast.error('Update failed');
    }
  };

  const saveLabel = async (cat) => {
    const label = editLabel.trim();
    if (label.length < 2) return toast.error('Name too short');
    try {
      await adminUpdateCategory(cat.id, { label });
      setEditingId(null);
      load();
    } catch {
      toast.error('Update failed');
    }
  };

  const remove = async (cat) => {
    if (!window.confirm(`Delete category "${cat.label}"? This cannot be undone.`)) return;
    try {
      await adminDeleteCategory(cat.id);
      toast.success('Deleted');
      load();
    } catch {
      toast.error('Delete failed');
    }
  };

  const pending = categories.filter((c) => c.status === 'pending');
  const rest = categories.filter((c) => c.status !== 'pending');

  const Row = (cat) => (
    <div key={cat.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0">
        {editingId === cat.id ? (
          <div className="flex gap-2">
            <input
              className="fb-input flex-1 py-1.5"
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveLabel(cat)}
              autoFocus
            />
            <button onClick={() => saveLabel(cat)} className="text-green-600 px-2"><Check className="w-4 h-4" strokeWidth={3} /></button>
            <button onClick={() => setEditingId(null)} className="text-gray-400 px-2"><X className="w-4 h-4" strokeWidth={3} /></button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 truncate">{cat.label}</span>
            <span className="text-xs text-gray-400">/{cat.slug}</span>
          </div>
        )}
      </div>

      <span className={`text-xs font-medium px-2 py-0.5 rounded ${STATUS_META[cat.status]?.cls}`}>
        {STATUS_META[cat.status]?.label}
      </span>

      <div className="flex items-center gap-1 shrink-0">
        {cat.status === 'pending' && (
          <>
            <button onClick={() => setStatus(cat, 'active')} title="Approve"
              className="btn flex items-center gap-1 text-xs bg-green-600 text-white px-2 py-1 hover:bg-green-700">
              <Check className="w-3.5 h-3.5" strokeWidth={3} /> Approve
            </button>
            <button onClick={() => setStatus(cat, 'rejected')} title="Reject"
              className="text-xs text-gray-500 px-2 py-1 rounded hover:bg-gray-100">Reject</button>
          </>
        )}
        {cat.status === 'rejected' && (
          <button onClick={() => setStatus(cat, 'active')}
            className="text-xs text-green-600 px-2 py-1 rounded hover:bg-green-50">Activate</button>
        )}
        <button onClick={() => { setEditingId(cat.id); setEditLabel(cat.label); }} title="Edit"
          className="text-gray-400 hover:text-gray-700 p-1"><Pencil className="w-4 h-4" /></button>
        <button onClick={() => remove(cat)} title="Delete"
          className="text-gray-400 hover:text-red-600 p-1"><Trash2 className="w-4 h-4" /></button>
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-bold text-gray-900 mb-1">Professions / Categories</h1>
      <p className="text-sm text-gray-500 mb-6">
        Manage the categories hosts choose during onboarding. Approve host-suggested ones below.
      </p>

      {/* Add new */}
      <div className="flex gap-2 mb-6">
        <input
          className="fb-input flex-1"
          placeholder="Add a new category (e.g., Voice Coaching)"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && create()}
        />
        <button onClick={create} disabled={creating}
          className="btn flex items-center gap-1.5 bg-primary text-white px-4 text-sm font-medium hover:bg-primary-dark disabled:opacity-50 shrink-0">
          <Plus className="w-4 h-4" strokeWidth={3} /> Add
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm py-10 text-center">Loading…</p>
      ) : (
        <>
          {pending.length > 0 && (
            <div className="mb-6 border border-amber-200 rounded overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 text-sm font-medium">
                <Clock className="w-4 h-4" /> Pending approval ({pending.length})
              </div>
              {pending.map(Row)}
            </div>
          )}

          <div className="border border-gray-200 rounded overflow-hidden">
            {rest.length === 0 && <p className="px-4 py-6 text-sm text-gray-400">No categories yet.</p>}
            {rest.map(Row)}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminCategories;
