import { useState, useEffect } from "react";
import { adminGetServices, adminDeleteService } from "../../services/api";
import toast from "react-hot-toast";
import SeoDrawer from "../../components/admin/SeoDrawer";

const AdminServices = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seoEntity, setSeoEntity] = useState(null);

  // Merge the admin SEO update back into the row so the No-index badge reflects.
  const handleSeoSaved = (row) =>
    setServices((list) => list.map((s) => (s.id === row.id ? { ...s, ...row } : s)));

  const fetch = async () => {
    try {
      const { data } = await adminGetServices();
      setServices(data);
    } catch {
      toast.error("Failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this service?")) return;
    try {
      await adminDeleteService(id);
      toast.success("Deleted");
      fetch();
    } catch {
      toast.error("Failed");
    }
  };

  if (loading)
    return <div className="text-center py-12 text-gray-400">Loading...</div>;

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold mb-1">All Services</h1>
      <p className="text-sm text-gray-400 mb-6">
        {services.length} services on the platform.
      </p>

      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm fb-table">
            <thead className="bg-gray-50 text-left text-xs text-gray-400 uppercase">
              <tr>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Vendor</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {services.map((s) => (
                <tr key={s.id}>
                  <td data-label="Service" className="px-4 py-3">
                    <p className="font-medium">{s.title}</p>
                    <p className="text-xs text-gray-400">
                      {s.duration} min · {s.meeting_mode || "online"}
                    </p>
                  </td>
                  <td data-label="Vendor" className="px-4 py-3 text-xs">
                    <p>{s.profiles?.name}</p>
                    <p className="text-gray-400">@{s.profiles?.username}</p>
                  </td>
                  <td
                    data-label="Type"
                    className="px-4 py-3 text-xs capitalize"
                  >
                    {s.type?.replace("_", " ")}
                  </td>
                  <td data-label="Price" className="px-4 py-3 font-medium">
                    {s.price === 0 ? "Free" : `₹${s.price}`}
                  </td>
                  <td data-label="Status" className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-1">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${s.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                      >
                        {s.is_active ? "Active" : "Inactive"}
                      </span>
                      {s.is_indexable === false && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-red-50 text-red-600">
                          No-index
                        </span>
                      )}
                    </div>
                  </td>
                  <td data-label="Actions" className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSeoEntity(s)}
                      className="text-xs text-[#FE5100] hover:underline mr-3"
                    >
                      SEO
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {seoEntity && (
        <SeoDrawer
          kind="service"
          entity={seoEntity}
          onClose={() => setSeoEntity(null)}
          onSaved={handleSeoSaved}
        />
      )}
    </div>
  );
};

export default AdminServices;
