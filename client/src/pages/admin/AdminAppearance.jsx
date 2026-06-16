import { useState, useEffect } from "react";
import { adminGetAppearance, adminUpdateAppearance, adminUploadImage } from "../../services/api";
import toast from "react-hot-toast";

const MODES = [
  { key: "icon_text", label: "Icon + Text", hint: "Brand mark plus the “Book A Sloth” wordmark." },
  { key: "image",     label: "Image",       hint: "A single full logo lockup image." },
  { key: "festive",   label: "Festive",     hint: "Seasonal logo — switch on manually, switch back after." },
];

// Which image slot each mode uses.
const SLOT = { icon_text: "icon_url", image: "logo_image_url", festive: "festive_logo_url" };

const SLOTS = [
  { field: "icon_url",         label: "Icon mark",   note: "Square mark used in Icon + Text mode." },
  { field: "logo_image_url",   label: "Logo image",  note: "Full lockup used in Image mode." },
  { field: "festive_logo_url", label: "Festive logo", note: "Seasonal lockup used in Festive mode." },
];

const AdminAppearance = () => {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState("");

  useEffect(() => {
    adminGetAppearance()
      .then(({ data }) => setForm(data))
      .catch(() => toast.error("Failed to load appearance settings"))
      .finally(() => setLoading(false));
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleUpload = async (field, file) => {
    if (!file) return;
    setUploading(field);
    try {
      const { data } = await adminUploadImage(file, "branding");
      set(field, data.url);
      toast.success("Image uploaded");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Upload failed");
    } finally {
      setUploading("");
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await adminUpdateAppearance(form);
      setForm(data);
      toast.success("Logo settings saved");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form) return <div className="text-center py-12 text-gray-400">Loading…</div>;

  const activeUrl = form[SLOT[form.navbar_logo_mode]];

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Appearance</h1>
        <p className="text-[12px] text-gray-400 mt-0.5">Manage the navbar logo shown across the website.</p>
      </div>

      <div className="bg-white border rounded-xl p-5 space-y-6">
        {/* Mode selector */}
        <div>
          <label className="block text-sm font-medium mb-2">Active navbar logo</label>
          <div className="grid grid-cols-3 gap-2">
            {MODES.map((m) => (
              <button
                key={m.key}
                onClick={() => set("navbar_logo_mode", m.key)}
                className={`btn px-3 py-2 text-sm font-medium border ${
                  form.navbar_logo_mode === m.key
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-1.5">
            {MODES.find((m) => m.key === form.navbar_logo_mode)?.hint}
          </p>
        </div>

        {/* Live preview */}
        <div>
          <label className="block text-sm font-medium mb-2">Preview</label>
          <div className="border rounded-lg p-4 bg-gray-50 flex items-center gap-2.5 min-h-[56px]">
            {form.navbar_logo_mode === "icon_text" ? (
              <>
                {form.icon_url && <img src={form.icon_url} alt="" className="h-[26px] w-[26px] rounded block" />}
                <span className="text-[15px] font-bold text-[#1E1E1E] tracking-tight">Book A Sloth</span>
              </>
            ) : activeUrl ? (
              <img src={activeUrl} alt="Book A Sloth" className="h-7 w-auto block" />
            ) : (
              <span className="text-sm text-gray-400">No image for this mode yet — upload one below.</span>
            )}
          </div>
        </div>

        {/* Image slots */}
        <div className="space-y-4 border-t pt-4">
          {SLOTS.map(({ field, label, note }) => (
            <div key={field} className="flex items-center gap-3">
              <div className="w-16 h-12 border rounded bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
                {form[field]
                  ? <img src={form[field]} alt="" className="max-h-10 max-w-[60px] object-contain" />
                  : <span className="text-[10px] text-gray-300">none</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-gray-400 truncate">{note}</p>
              </div>
              <label className="btn btn--outline px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer whitespace-nowrap">
                {uploading === field ? "Uploading…" : "Upload"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  disabled={uploading === field}
                  onChange={(e) => handleUpload(field, e.target.files?.[0])}
                />
              </label>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-2 border-t">
          <button
            onClick={save}
            disabled={saving}
            className="btn bg-gray-900 text-white px-6 py-2.5 text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save logo settings"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminAppearance;
