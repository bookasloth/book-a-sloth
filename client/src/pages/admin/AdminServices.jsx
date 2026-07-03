import { useState, useEffect } from "react";
import { adminGetServices, adminDeleteService } from "../../services/api";
import toast from "react-hot-toast";
import SeoDrawer from "../../components/admin/SeoDrawer";
import { PageHeader, Badge } from "../../components/admin/ui";

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
    return <div className="text-center py-12 adm-t3">Loading...</div>;

  return (
    <div className="max-w-5xl">
      <PageHeader title="All Services" subtitle={`${services.length} services on the platform.`} />

      <div className="adm-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="adm-table w-full text-sm fb-table">
            <thead className="text-left text-xs adm-t3 uppercase">
              <tr>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Host</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y adm-border">
              {services.map((s) => (
                <tr key={s.id}>
                  <td data-label="Service" className="px-4 py-3">
                    <p className="font-medium adm-t1">{s.title}</p>
                    <p className="text-xs adm-t3">
                      {s.duration} min · {s.meeting_mode || "online"}
                    </p>
                  </td>
                  <td data-label="Host" className="px-4 py-3 text-xs adm-t2">
                    <p>{s.profiles?.name}</p>
                    <p className="adm-t3">@{s.profiles?.username}</p>
                  </td>
                  <td
                    data-label="Type"
                    className="px-4 py-3 text-xs capitalize adm-t2"
                  >
                    {s.type?.replace("_", " ")}
                  </td>
                  <td data-label="Price" className="px-4 py-3 font-medium adm-t1">
                    {s.price === 0 ? "Free" : `₹${s.price}`}
                  </td>
                  <td data-label="Status" className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-1">
                      <Badge tone={s.is_active ? 'ok' : 'neutral'}>
                        {s.is_active ? "Active" : "Inactive"}
                      </Badge>
                      {s.is_indexable === false && (
                        <Badge tone="danger">No-index</Badge>
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
