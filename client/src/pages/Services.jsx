import { useState, useEffect, useMemo } from "react";
import {
  getMyServices,
  createService,
  updateService,
  toggleService,
} from "../services/api";
import ImageCropper from "../components/common/ImageCropper";
import toast from "react-hot-toast";

const MEETING_MODES = [
  { value: "online", label: "Online (Google Meet)" },
  { value: "offline", label: "Offline (In-person)" },
];
const SERVICE_TYPES = [
  { value: "one_on_one", label: "1:1 Call" },
  { value: "group", label: "Group Session" },
  { value: "paid_dm", label: "Paid DM" },
];
const GRACE_PERIODS = [
  { value: 10, label: "10 min (default)" },
  { value: 20, label: "20 min" },
  { value: 30, label: "30 min" },
  { value: 60, label: "60 min" },
];

const emptyForm = {
  title: "",
  description: "",
  type: "one_on_one",
  meeting_mode: "online",
  duration: 30,
  price: 0,
  currency: "INR",
  thumbnail_url: "",
  grace_period_minutes: 10,
};

// ------ SERVICE FORM MODAL ------
const ServiceModal = ({ service, onClose, onSaved }) => {
  const [form, setForm] = useState(
    service
      ? {
          title: service.title,
          description: service.description || "",
          type: service.type,
          meeting_mode: service.meeting_mode || "online",
          duration: service.duration,
          price: service.price,
          currency: service.currency || "INR",
          thumbnail_url: service.thumbnail_url || "",
          grace_period_minutes: service.grace_period_minutes ?? 10,
        }
      : emptyForm,
  );
  const [saving, setSaving] = useState(false);
  const [showCropper, setShowCropper] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (service) {
        await updateService(service.id, form);
        toast.success("Service updated!");
      } else {
        await createService(form);
        toast.success("Service created!");
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fb-modal" onClick={onClose}>
      {showCropper && (
        <ImageCropper
          aspect={16 / 9}
          folder="services"
          currentUrl={form.thumbnail_url}
          onUploaded={(url) => {
            set("thumbnail_url", url);
            setShowCropper(false);
          }}
          onClose={() => setShowCropper(false)}
          label="Service Thumbnail"
        />
      )}
      <div className="fb-modal__panel" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-4 border-b z-10">
          <h3 className="font-bold">
            {service ? "Edit Service" : "New Service"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <form onSubmit={save} className="p-5 space-y-4">
          {/* Thumbnail */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Thumbnail
            </label>
            <div
              className="relative group cursor-pointer rounded-xl overflow-hidden border border-dashed border-gray-300 h-32 bg-gray-50 flex items-center justify-center"
              onClick={() => setShowCropper(true)}
            >
              {form.thumbnail_url ? (
                <img
                  src={form.thumbnail_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center text-gray-400 text-xs">
                  <svg
                    className="w-8 h-8 mx-auto mb-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Upload thumbnail
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-xs font-medium">
                  Change photo
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Title *
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Career Mentorship Call"
              className="fb-input"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="What will you cover?"
              className="fb-input resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Type
              </label>
              <select
                value={form.type}
                onChange={(e) => set("type", e.target.value)}
                className="fb-input"
              >
                {SERVICE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Mode
              </label>
              <select
                value={form.meeting_mode}
                onChange={(e) => set("meeting_mode", e.target.value)}
                className="fb-input"
              >
                {MEETING_MODES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Duration (min)
              </label>
              <input
                type="number"
                required
                min={5}
                max={480}
                value={form.duration}
                onChange={(e) =>
                  set("duration", parseInt(e.target.value) || 30)
                }
                className="fb-input"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Price (INR)
              </label>
              <input
                type="number"
                required
                min={0}
                value={form.price}
                onChange={(e) => set("price", parseInt(e.target.value) || 0)}
                className="fb-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Grace Period
            </label>
            <select
              value={form.grace_period_minutes}
              onChange={(e) =>
                set("grace_period_minutes", parseInt(e.target.value))
              }
              className="fb-input"
            >
              {GRACE_PERIODS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              Buffer blocked before and after each booking.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="fb-btn fb-btn--secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="fb-btn fb-btn--primary"
            >
              {saving
                ? "Saving..."
                : service
                  ? "Save Changes"
                  : "Create Service"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ------ MAIN SERVICES PAGE ------
const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null); // null | 'create' | service object

  const fetch = async () => {
    try {
      // Fetch ALL services (including inactive) using host route
      const { data } = await getMyServices();
      setServices(data || []);
    } catch {
      toast.error("Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  const filtered = useMemo(() => {
    let list = services;
    if (filter === "active") list = list.filter((s) => s.is_active);
    if (filter === "disabled") list = list.filter((s) => !s.is_active);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          (s.title || "").toLowerCase().includes(q) ||
          (s.description || "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [services, filter, search]);

  const handleToggle = async (s) => {
    try {
      await toggleService(s.id);
      toast.success(s.is_active ? "Service disabled" : "Service enabled");
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  if (loading)
    return <div className="text-center py-16 text-gray-400">Loading...</div>;

  return (
    <div className="w-full max-w-6xl">
      {modal && (
        <ServiceModal
          service={modal === "create" ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            fetch();
          }}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Services</h1>
          <p className="text-sm text-gray-400">
            {services.filter((s) => s.is_active).length} active /{" "}
            {services.length} total
          </p>
        </div>
        <button
          onClick={() => setModal("create")}
          className="btn inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 text-sm font-semibold hover:bg-primary/90"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Service
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex gap-2">
          {["all", "active", "disabled"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === f ? "bg-gray-900 text-white" : "bg-white border text-gray-500 hover:bg-gray-50"}`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)} (
              {f === "all"
                ? services.length
                : f === "active"
                  ? services.filter((s) => s.is_active).length
                  : services.filter((s) => !s.is_active).length}
              )
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search services..."
          className="fb-input sm:w-56"
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm fb-table">
            <thead>
              <tr className="border-b bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3 text-left font-semibold w-12">
                  Thumb
                </th>
                <th className="px-4 py-3 text-left font-semibold">
                  Service Name
                </th>
                <th className="px-4 py-3 text-left font-semibold hidden sm:table-cell">
                  Type
                </th>
                <th className="px-4 py-3 text-left font-semibold">Price</th>
                <th className="px-4 py-3 text-left font-semibold hidden md:table-cell">
                  Duration
                </th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-gray-400 text-sm"
                  >
                    No services found.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr
                    key={s.id}
                    className={`hover:bg-gray-50 transition-colors ${!s.is_active ? "opacity-60" : ""}`}
                  >
                    <td data-label="Thumb" className="px-4 py-3">
                      {s.thumbnail_url ? (
                        <img
                          src={s.thumbnail_url}
                          alt=""
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                          <svg
                            className="w-5 h-5 text-gray-300"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      )}
                    </td>
                    <td data-label="Service Name" className="px-4 py-3">
                      <p className="font-medium text-gray-800">{s.title}</p>
                      {s.description && (
                        <p className="text-xs text-gray-400 truncate max-w-[200px]">
                          {s.description}
                        </p>
                      )}
                    </td>
                    <td
                      data-label="Type"
                      className="px-4 py-3 hidden sm:table-cell text-xs text-gray-500"
                    >
                      {SERVICE_TYPES.find((t) => t.value === s.type)?.label ||
                        s.type}
                    </td>
                    <td data-label="Price" className="px-4 py-3">
                      <span className="font-semibold text-primary">
                        {s.price === 0 ? "Free" : `Rs.${s.price}`}
                      </span>
                    </td>
                    <td
                      data-label="Duration"
                      className="px-4 py-3 hidden md:table-cell text-xs text-gray-500"
                    >
                      {s.duration} min
                    </td>
                    <td data-label="Status" className="px-4 py-3">
                      <span
                        className={`inline-block text-[11px] px-2 py-0.5 rounded-full font-medium ${s.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                      >
                        {s.is_active ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td data-label="Actions" className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setModal(s)}
                          title="Edit"
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-primary transition-colors"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleToggle(s)}
                          title={s.is_active ? "Disable" : "Enable"}
                          className={`p-1.5 rounded-lg transition-colors ${s.is_active ? "hover:bg-red-50 text-red-400 hover:text-red-600" : "hover:bg-green-50 text-green-500 hover:text-green-700"}`}
                        >
                          {s.is_active ? (
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t bg-gray-50 text-xs text-gray-400">
          Services are never permanently deleted. Disabled services remain in
          historical records.
        </div>
      </div>
    </div>
  );
};

export default Services;
