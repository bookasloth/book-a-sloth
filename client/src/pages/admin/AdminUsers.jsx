import { useState, useEffect } from "react";
import {
  adminGetUsers,
  adminUpdateUser,
  adminDeleteUser,
  getCategories,
  adminSetUserCategories,
} from "../../services/api";
import toast from "react-hot-toast";
import { PageHeader, Badge, Table } from "../../components/admin/ui";

const ROLE_COLORS = {
  guest: "bg-blue-100 text-blue-700",
  host: "bg-green-100 text-green-700",
  superadmin: "bg-purple-100 text-purple-700",
};

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState(null);
  const [catOptions, setCatOptions] = useState([]);

  useEffect(() => {
    getCategories().then(({ data }) => setCatOptions(data || [])).catch(() => {});
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await adminGetUsers({
        role: filter,
        search,
        page,
        limit: 15,
      });
      setUsers(data.users);
      setTotal(data.total);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filter, search, page]);

  const handleToggleVerify = async (user) => {
    try {
      await adminUpdateUser(user.id, { is_verified: !user.is_verified });
      toast.success(user.is_verified ? "Unverified" : "Verified");
      fetchUsers();
    } catch {
      toast.error("Failed");
    }
  };

  const handleToggleBan = async (user) => {
    if (!window.confirm(`${user.is_banned ? "Unban" : "Ban"} ${user.name}?`))
      return;
    try {
      await adminUpdateUser(user.id, { is_banned: !user.is_banned });
      toast.success(user.is_banned ? "Unbanned" : "Banned");
      fetchUsers();
    } catch {
      toast.error("Failed");
    }
  };

  const handleChangeRole = async (user, newRole) => {
    // BUG-23 fixed: require explicit confirmation before granting superadmin
    if (newRole === "superadmin") {
      const confirmed = window.confirm(
        `⚠️ You are about to grant SUPERADMIN access to ${user.name} (${user.email}).\n\nThis gives full platform control. Are you absolutely sure?`
      );
      if (!confirmed) {
        setEditingId(null);
        return;
      }
    }
    try {
      await adminUpdateUser(user.id, { role: newRole });
      toast.success(`Role changed to ${newRole}`);
      setEditingId(null);
      fetchUsers();
    } catch {
      toast.error("Failed");
    }
  };

  const handleSetCategory = async (user, slug) => {
    if (!slug) return;
    try {
      await adminSetUserCategories(user.id, { primary_category: slug, categories: [slug] });
      toast.success('Category updated');
      fetchUsers();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed');
    }
  };

  const handleDelete = async (user) => {
    if (
      !window.confirm(
        `Permanently delete ${user.name} (${user.email})? This cannot be undone.`,
      )
    )
      return;
    try {
      await adminDeleteUser(user.id);
      toast.success("User deleted");
      fetchUsers();
    } catch {
      toast.error("Failed");
    }
  };

  const totalPages = Math.ceil(total / 15);

  return (
    <div className="max-w-5xl">
      <PageHeader title="Users & Hosts" subtitle="Manage all platform accounts." />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="inline-grid grid-cols-4 gap-1">
          {["all", "guest", "host", "superadmin"].map((r) => (
            <button
              key={r}
              onClick={() => {
                setFilter(r);
                setPage(1);
              }}
              className={`w-full inline-flex justify-center px-3 py-1.5 rounded-full text-xs font-medium capitalize ${filter === r ? "bg-gray-900 text-white" : "bg-white border text-gray-500"}`}
            >
              {r}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search name or email..."
          className="fb-input flex-1 min-w-[200px]"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {loading ? (
        <div className="text-center py-12 adm-t3">Loading...</div>
      ) : (
        <>
          <Table
            rowKey={(u) => u.id}
            rowClassName={(u) => (u.is_banned ? "bg-[var(--adm-danger-bg)]" : "")}
            empty={
              <div className="px-4 py-12 text-center text-sm adm-t3">
                No {filter === "all" ? "" : filter + " "}accounts found.
              </div>
            }
            columns={[
              {
                key: "user",
                label: "User",
                render: (u) => (
                  <>
                    <p className="font-medium adm-t1">{u.name}</p>
                    <p className="text-xs adm-t3">{u.email}</p>
                    {u.username && (
                      <p className="text-[10px] adm-t3">
                        @{u.username}
                      </p>
                    )}
                  </>
                ),
              },
              {
                key: "role",
                label: "Role",
                render: (u) => (
                  <>
                    {editingId === u.id ? (
                      <select
                        className="border rounded px-2 py-1 text-xs"
                        value={u.role}
                        onChange={(e) =>
                          handleChangeRole(u, e.target.value)
                        }
                        onBlur={() => setEditingId(null)}
                      >
                        <option value="guest">guest</option>
                        <option value="host">host</option>
                        <option value="superadmin">superadmin</option>
                      </select>
                    ) : (
                      <button
                        onClick={() => setEditingId(u.id)}
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[u.role]}`}
                      >
                        {u.role}
                      </button>
                    )}
                    {u.role === 'host' && (
                      <select
                        className="border rounded px-1.5 py-1 text-xs mt-1"
                        value={u.primary_category || ''}
                        onChange={(e) => handleSetCategory(u, e.target.value)}
                        title="Set primary category"
                      >
                        <option value="">— category —</option>
                        {catOptions.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}
                      </select>
                    )}
                  </>
                ),
              },
              {
                key: "status",
                label: "Status",
                render: (u) => (
                  <div className="flex gap-1">
                    {u.is_verified && <Badge tone="ok">Verified</Badge>}
                    {u.is_banned && <Badge tone="danger">Banned</Badge>}
                    {u.google_calendar_connected && <Badge tone="info">GCal</Badge>}
                  </div>
                ),
              },
              {
                key: "joined",
                label: "Joined",
                render: (u) =>
                  new Date(u.created_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "2-digit",
                  }),
              },
              {
                key: "actions",
                label: "Actions",
                className: "text-right",
                render: (u) => (
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleToggleVerify(u)}
                      className="text-[10px] text-primary hover:underline"
                    >
                      {u.is_verified ? "Unverify" : "Verify"}
                    </button>
                    <button
                      onClick={() => handleToggleBan(u)}
                      className="text-[10px] text-amber-600 hover:underline"
                    >
                      {u.is_banned ? "Unban" : "Ban"}
                    </button>
                    <button
                      onClick={() => handleDelete(u)}
                      className="text-[10px] text-red-500 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                ),
              },
            ]}
            rows={users}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`btn w-8 h-8 text-xs font-medium ${page === i + 1 ? "bg-gray-900 text-white" : "btn--outline bg-white text-gray-500"}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminUsers;
