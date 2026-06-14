import { useState, useEffect } from "react";
import {
  adminGetUsers,
  adminUpdateUser,
  adminDeleteUser,
} from "../../services/api";
import toast from "react-hot-toast";

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
      <h1 className="text-2xl font-bold mb-1">Users & Vendors</h1>
      <p className="text-sm text-gray-400 mb-6">
        Manage all platform accounts.
      </p>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="flex gap-1">
          {["all", "guest", "host", "superadmin"].map((r) => (
            <button
              key={r}
              onClick={() => {
                setFilter(r);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize ${filter === r ? "bg-gray-900 text-white" : "bg-white border text-gray-500"}`}
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
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : (
        <>
          <div className="bg-white border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm fb-table">
                <thead className="bg-gray-50 text-left text-xs text-gray-400 uppercase">
                  <tr>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Joined</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.map((u) => (
                    <tr
                      key={u.id}
                      className={`${u.is_banned ? "bg-red-50/50" : ""}`}
                    >
                      <td data-label="User" className="px-4 py-3">
                        <p className="font-medium">{u.name}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                        {u.username && (
                          <p className="text-[10px] text-gray-300">
                            @{u.username}
                          </p>
                        )}
                      </td>
                      <td data-label="Role" className="px-4 py-3">
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
                      </td>
                      <td data-label="Status" className="px-4 py-3">
                        <div className="flex gap-1">
                          {u.is_verified && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700">
                              Verified
                            </span>
                          )}
                          {u.is_banned && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-600">
                              Banned
                            </span>
                          )}
                          {u.google_calendar_connected && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-600">
                              GCal
                            </span>
                          )}
                        </div>
                      </td>
                      <td
                        data-label="Joined"
                        className="px-4 py-3 text-xs text-gray-400"
                      >
                        {new Date(u.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "2-digit",
                        })}
                      </td>
                      <td data-label="Actions" className="px-4 py-3">
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

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
