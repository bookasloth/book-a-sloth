import { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, ChevronRight, Image as ImageIcon, X } from 'lucide-react';
import {
  adminListServiceCategories,
  adminCreateServiceCategory,
  adminUpdateServiceCategory,
  adminDeleteServiceCategory,
  adminUploadImage,
} from '../../services/api';

// ── helpers ───────────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  name: '',
  description: '',
  icon_url: '',
  parent_id: '',
  display_order: 0,
  is_active: true,
  seo_title: '',
  seo_description: '',
  seo_keywords: '',
};

// Build a parent/child tree sorted by display_order then name.
function buildTree(categories) {
  const sorted = [...categories].sort(
    (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0) || a.name.localeCompare(b.name)
  );
  const parents = sorted.filter((c) => !c.parent_id);
  return parents.map((p) => ({
    ...p,
    children: sorted.filter((c) => c.parent_id === p.id),
  }));
}

// ── sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ active }) {
  return active ? (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium rounded-full px-2 py-0.5 bg-green-50 text-green-700 border border-green-200">
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium rounded-full px-2 py-0.5 bg-red-50 text-red-700 border border-red-200">
      Inactive
    </span>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────

function CategoryModal({ open, onClose, onSaved, editing, topLevelCategories }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);

  // Reset form whenever modal opens/closes or editing target changes.
  useEffect(() => {
    if (open) {
      setForm(
        editing
          ? {
              name: editing.name ?? '',
              description: editing.description ?? '',
              icon_url: editing.icon_url ?? '',
              parent_id: editing.parent_id ?? '',
              display_order: editing.display_order ?? 0,
              is_active: editing.is_active ?? true,
              seo_title: editing.seo_title ?? '',
              seo_description: editing.seo_description ?? '',
              seo_keywords: editing.seo_keywords ?? '',
            }
          : EMPTY_FORM
      );
    }
  }, [open, editing]);

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleIconUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'].includes(file.type)) {
      toast.error('Use a JPG, PNG, WEBP or SVG image');
      return;
    }
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be under 2 MB'); return; }
    setUploadingImg(true);
    try {
      const { data } = await adminUploadImage(file, 'service-categories');
      set('icon_url', data.url);
      toast.success('Icon uploaded');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Upload failed');
    } finally {
      setUploadingImg(false);
    }
  };

  const save = async () => {
    const name = form.name.trim();
    if (name.length < 2) { toast.error('Name must be at least 2 characters'); return; }

    setSaving(true);
    try {
      const payload = {
        name,
        description: form.description.trim() || null,
        icon_url: form.icon_url.trim() || null,
        parent_id: form.parent_id || null,
        display_order: Number(form.display_order) || 0,
        is_active: form.is_active,
        seo_title: form.seo_title.trim() || null,
        seo_description: form.seo_description.trim() || null,
        seo_keywords: form.seo_keywords.trim() || null,
      };
      if (editing) {
        await adminUpdateServiceCategory(editing.id, payload);
        toast.success('Category updated');
      } else {
        await adminCreateServiceCategory(payload);
        toast.success('Category created');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || (editing ? 'Update failed' : 'Create failed'));
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  // Top-level parents available for the parent select — exclude the category
  // being edited (can't be its own parent) and its children (already children).
  const parentOptions = topLevelCategories.filter((c) => !editing || c.id !== editing.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            {editing ? 'Edit Category' : 'New Service Category'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              className="fb-input w-full"
              placeholder="e.g. Photography"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
            <textarea
              className="fb-input w-full resize-none"
              rows={3}
              placeholder="Short description for this category"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </div>

          {/* Icon upload */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Icon / Image</label>
            <div className="flex items-center gap-3">
              {form.icon_url ? (
                <img
                  src={form.icon_url}
                  alt="icon"
                  className="w-12 h-12 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <ImageIcon className="w-5 h-5 text-gray-400" />
                </div>
              )}
              <div className="flex-1">
                <label className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-medium text-[#FE5100] hover:text-[#e04800] border border-[#FE5100] rounded px-3 py-1.5">
                  {uploadingImg ? 'Uploading…' : (form.icon_url ? 'Replace' : 'Upload')}
                  <input type="file" className="hidden" accept="image/*" onChange={handleIconUpload} disabled={uploadingImg} />
                </label>
                {form.icon_url && (
                  <button
                    onClick={() => set('icon_url', '')}
                    className="ml-2 text-xs text-gray-400 hover:text-red-500"
                  >
                    Remove
                  </button>
                )}
                <p className="text-[11px] text-gray-400 mt-1">JPG, PNG, WEBP or SVG, max 2 MB</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Parent category */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Parent Category</label>
              <select
                className="fb-input w-full"
                value={form.parent_id}
                onChange={(e) => set('parent_id', e.target.value)}
              >
                <option value="">None (top level)</option>
                {parentOptions.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Display order */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Display Order</label>
              <input
                type="number"
                className="fb-input w-full"
                value={form.display_order}
                onChange={(e) => set('display_order', e.target.value)}
                min={0}
              />
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between py-1">
            <span className="text-sm text-gray-700">Active</span>
            <button
              type="button"
              onClick={() => set('is_active', !form.is_active)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                form.is_active ? 'bg-[#FE5100]' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  form.is_active ? 'translate-x-4.5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* SEO accordion */}
          <details className="border border-gray-200 rounded-lg">
            <summary className="px-3 py-2 text-xs font-semibold text-gray-600 cursor-pointer select-none hover:bg-gray-50 rounded-lg">
              SEO (optional)
            </summary>
            <div className="px-3 pb-3 pt-2 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">SEO Title</label>
                <input className="fb-input w-full" placeholder="Page title for search engines" value={form.seo_title} onChange={(e) => set('seo_title', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">SEO Description</label>
                <textarea className="fb-input w-full resize-none" rows={2} placeholder="Meta description" value={form.seo_description} onChange={(e) => set('seo_description', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">SEO Keywords</label>
                <input className="fb-input w-full" placeholder="comma, separated, keywords" value={form.seo_keywords} onChange={(e) => set('seo_keywords', e.target.value)} />
              </div>
            </div>
          </details>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100">
          <button onClick={onClose} className="btn text-sm text-gray-600 hover:bg-gray-100 px-4">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving || uploadingImg}
            className="btn bg-[#FE5100] text-white px-5 text-sm font-medium hover:bg-[#e04800] disabled:opacity-50"
          >
            {saving ? 'Saving…' : (editing ? 'Save Changes' : 'Create')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Row components ────────────────────────────────────────────────────────────

function CategoryRow({ cat, depth, onEdit, onToggle, onDelete }) {
  const indent = depth * 20;
  return (
    <tr className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors">
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-2" style={{ paddingLeft: indent }}>
          {depth > 0 && <ChevronRight className="w-3 h-3 text-gray-300 flex-shrink-0" />}
          {cat.icon_url ? (
            <img src={cat.icon_url} alt="" className="w-7 h-7 rounded object-cover border border-gray-200 flex-shrink-0" />
          ) : (
            <div className="w-7 h-7 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
              <ImageIcon className="w-3.5 h-3.5 text-gray-300" />
            </div>
          )}
          <div>
            <div className="font-medium text-gray-900 text-sm">{cat.name}</div>
            <div className="text-[11px] text-gray-400">/{cat.slug}</div>
          </div>
        </div>
      </td>
      <td className="px-3 py-2.5">
        <StatusBadge active={cat.is_active} />
      </td>
      <td className="px-3 py-2.5 text-center tabular-nums text-sm text-gray-600">
        {cat.serviceCount ?? 0}
      </td>
      <td className="px-3 py-2.5 text-center tabular-nums text-sm text-gray-500">
        {cat.display_order ?? 0}
      </td>
      <td className="px-3 py-2.5">
        <div className="flex items-center justify-end gap-1">
          {/* Active toggle */}
          <button
            onClick={() => onToggle(cat)}
            title={cat.is_active ? 'Deactivate' : 'Activate'}
            className={`text-xs px-2 py-1 rounded border font-medium transition-colors ${
              cat.is_active
                ? 'border-red-200 text-red-600 hover:bg-red-50'
                : 'border-green-200 text-green-600 hover:bg-green-50'
            }`}
          >
            {cat.is_active ? 'Deactivate' : 'Activate'}
          </button>
          {/* Edit */}
          <button
            onClick={() => onEdit(cat)}
            title="Edit"
            className="text-gray-400 hover:text-[#FE5100] p-1.5 rounded transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
          {/* Delete */}
          <button
            onClick={() => onDelete(cat)}
            title="Delete"
            className="text-gray-400 hover:text-red-600 p-1.5 rounded transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

const AdminServiceCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // null = create mode

  const load = useCallback(() => {
    setLoading(true);
    adminListServiceCategories()
      .then(({ data }) => setCategories(data?.categories || []))
      .catch(() => toast.error('Failed to load service categories'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  // Build parent/child tree for display.
  const tree = useMemo(() => buildTree(categories), [categories]);

  // Only top-level categories for the parent dropdown (no grandchildren supported).
  const topLevel = useMemo(() => categories.filter((c) => !c.parent_id), [categories]);

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (cat) => { setEditing(cat); setModalOpen(true); };

  const handleToggle = async (cat) => {
    try {
      await adminUpdateServiceCategory(cat.id, { is_active: !cat.is_active });
      toast.success(cat.is_active ? 'Category deactivated' : 'Category activated');
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Update failed');
    }
  };

  const handleDelete = async (cat) => {
    const inUse = (cat.serviceCount ?? 0) > 0;
    const msg = inUse
      ? `"${cat.name}" is used by ${cat.serviceCount} service${cat.serviceCount === 1 ? '' : 's'}. Deactivate it instead?`
      : `Delete "${cat.name}"? This cannot be undone.`;

    if (!window.confirm(msg)) return;
    if (inUse) return; // user confirmed but it's in use — block

    try {
      await adminDeleteServiceCategory(cat.id);
      toast.success('Category deleted');
      load();
    } catch (err) {
      // Server returns 409 with { message: "Category is in use by N services" }
      toast.error(err?.response?.data?.message || 'Delete failed');
    }
  };

  const totalActive = categories.filter((c) => c.is_active).length;
  const totalServices = categories.reduce((n, c) => n + (c.serviceCount ?? 0), 0);

  return (
    <div className="max-w-5xl">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Service Categories</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage the categories that hosts assign to their services.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="btn flex items-center gap-1.5 bg-[#FE5100] text-white px-4 text-sm font-medium hover:bg-[#e04800] shrink-0"
        >
          <Plus className="w-4 h-4" strokeWidth={3} /> New Category
        </button>
      </div>

      {/* Stats */}
      {!loading && (
        <div className="grid grid-cols-3 gap-3 mt-5 mb-5">
          <div className="rounded border border-gray-200 p-3">
            <div className="text-2xl font-bold text-gray-900">{categories.length}</div>
            <div className="text-xs text-gray-500">Total categories</div>
          </div>
          <div className="rounded border border-gray-200 p-3">
            <div className="text-2xl font-bold text-gray-900">{totalActive}</div>
            <div className="text-xs text-gray-500">Active</div>
          </div>
          <div className="rounded border border-gray-200 p-3">
            <div className="text-2xl font-bold text-gray-900">{totalServices}</div>
            <div className="text-xs text-gray-500">Services categorised</div>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <p className="text-gray-400 text-sm py-12 text-center">Loading…</p>
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 border-b border-gray-200">
                <th className="px-3 py-2.5">Category</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5 text-center">Services</th>
                <th className="px-3 py-2.5 text-center">Order</th>
                <th className="px-3 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tree.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-sm text-gray-400 text-center">
                    No service categories yet.{' '}
                    <button onClick={openCreate} className="text-[#FE5100] underline">
                      Create one
                    </button>
                    .
                  </td>
                </tr>
              ) : (
                tree.map((parent) => (
                  <>
                    <CategoryRow
                      key={parent.id}
                      cat={parent}
                      depth={0}
                      onEdit={openEdit}
                      onToggle={handleToggle}
                      onDelete={handleDelete}
                    />
                    {parent.children.map((child) => (
                      <CategoryRow
                        key={child.id}
                        cat={child}
                        depth={1}
                        onEdit={openEdit}
                        onToggle={handleToggle}
                        onDelete={handleDelete}
                      />
                    ))}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <CategoryModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={load}
        editing={editing}
        topLevelCategories={topLevel}
      />
    </div>
  );
};

export default AdminServiceCategories;
