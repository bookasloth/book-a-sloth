import { useState, useEffect } from 'react';
import {
  adminListStaff, adminListRoles, adminCreateStaff,
  adminUpdateStaff, adminSetStaffActive, adminResetStaffPass,
} from '../../services/api';
import toast from 'react-hot-toast';

// Admin Staff & Roles (Super Admin only). Lists staff, creates/edits accounts,
// activates/deactivates, resets passwords. One-time temp passwords are shown
// in a copyable banner after create/reset — never re-retrievable.

const EMPTY_FORM = { email: '', username: '', name: '', role_key: 'operations', password: '' };

const fmtDate = (d) => (d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—');

const AdminStaff = () => {
  const [staff, setStaff]     = useState([]);
  const [roles, setRoles]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShow]   = useState(false);
  const [editing, setEditing] = useState(null);          // staff row being edited, or null
  const [form, setForm]       = useState(EMPTY_FORM);
  const [saving, setSaving]   = useState(false);
  const [secret, setSecret]   = useState(null);          // { username, password } one-time banner

  const load = async () => {
    setLoading(true);
    try {
      const [s, r] = await Promise.all([adminListStaff(), adminListRoles()]);
      setStaff(s.data.staff || []);
      setRoles(r.data.roles || []);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load staff');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const roleName = (key) => roles.find((r) => r.key === key)?.name || key;

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setShow(true); };
  const openEdit = (row) => {
    setEditing(row);
    setForm({ email: row.email, username: row.username, name: row.name, role_key: row.role_key, password: '' });
    setShow(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await adminUpdateStaff(editing.id, { name: form.name, role_key: form.role_key });
        toast.success('Staff updated');
      } else {
        const { data } = await adminCreateStaff(form);
        if (data.temp_password) setSecret({ username: data.staff.username, password: data.temp_password });
        toast.success('Staff created');
      }
      setShow(false);
      load();
    } catch (e2) {
      toast.error(e2.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (row) => {
    try {
      await adminSetStaffActive(row.id, !row.is_active);
      toast.success(row.is_active ? 'Deactivated' : 'Activated');
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Action failed');
    }
  };

  const resetPass = async (row) => {
    try {
      const { data } = await adminResetStaffPass(row.id, {});
      if (data.temp_password) setSecret({ username: row.username, password: data.temp_password });
      toast.success('Password reset');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Reset failed');
    }
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Staff &amp; Roles</h1>
          <p className="text-[12px] text-gray-400 mt-0.5">Admin accounts and their access level. Super Admin only.</p>
        </div>
        <button onClick={openCreate} className="fb-btn fb-btn--primary text-sm whitespace-nowrap">+ Add Staff</button>
      </div>

      {/* One-time credential banner */}
      {secret && (
        <div className="mb-5 rounded-xl border-2 border-[#1E1E1E] bg-[#FFF8EE] p-4">
          <p className="text-sm font-bold text-gray-900">Temporary password for @{secret.username}</p>
          <p className="text-[12px] text-gray-500 mb-2">Share it securely. It cannot be shown again.</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-white border rounded-lg text-sm font-mono select-all">{secret.password}</code>
            <button onClick={() => { navigator.clipboard?.writeText(secret.password); toast.success('Copied'); }}
              className="fb-btn fb-btn--secondary text-xs">Copy</button>
            <button onClick={() => setSecret(null)} className="fb-btn fb-btn--secondary text-xs">Done</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="bg-white border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-gray-400 border-b">
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Username</th>
                <th className="px-4 py-3 font-semibold hidden md:table-cell">Role</th>
                <th className="px-4 py-3 font-semibold hidden lg:table-cell">Last login</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((row) => (
                <tr key={row.id} className="border-b last:border-0 hover:bg-gray-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-800">{row.name}</p>
                    <p className="text-[11px] text-gray-400">{row.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">@{row.username}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-[#FE5100]/10 text-[#FE5100]">{roleName(row.role_key)}</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-[12px] text-gray-400">{fmtDate(row.last_login_at)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-semibold px-2 py-1 rounded-full ${row.is_active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                      {row.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => openEdit(row)} className="text-[12px] text-gray-500 hover:text-gray-900 px-2 py-1 rounded hover:bg-gray-100">Edit</button>
                      <button onClick={() => resetPass(row)} className="text-[12px] text-gray-500 hover:text-gray-900 px-2 py-1 rounded hover:bg-gray-100">Reset PW</button>
                      <button onClick={() => toggleActive(row)} className={`text-[12px] px-2 py-1 rounded hover:bg-gray-100 ${row.is_active ? 'text-red-500' : 'text-green-600'}`}>
                        {row.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {staff.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">No staff yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / edit modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShow(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-4">{editing ? 'Edit staff' : 'Add staff'}</h2>
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Full name</label>
                <input className="fb-input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Username</label>
                  <input className="fb-input" required disabled={!!editing} value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                  <input className="fb-input" type="email" required disabled={!!editing} value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Role</label>
                <select className="fb-input" value={form.role_key} onChange={(e) => setForm({ ...form, role_key: e.target.value })}>
                  {roles.map((r) => <option key={r.key} value={r.key}>{r.name}</option>)}
                </select>
                <p className="text-[11px] text-gray-400 mt-1">{roles.find((r) => r.key === form.role_key)?.description}</p>
              </div>
              {!editing && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Initial password <span className="text-gray-300">(optional)</span></label>
                  <input className="fb-input" type="text" placeholder="Leave blank to auto-generate" value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })} />
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={saving} className="fb-btn fb-btn--primary text-sm flex-1">{saving ? 'Saving…' : 'Save'}</button>
                <button type="button" onClick={() => setShow(false)} className="fb-btn fb-btn--secondary text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStaff;
