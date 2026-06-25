import { useState, useEffect } from "react";
import {
  getMyProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductFile,
  uploadImage,
  getPublicPlans,
} from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useFeature } from "../context/FeatureContext";
import BackButton from "../components/common/BackButton";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

const PRODUCT_TYPES = [
  { value: "pdf", label: "PDF" },
  { value: "template", label: "Template" },
  { value: "ebook", label: "eBook" },
  { value: "prompt_pack", label: "Prompt Pack" },
  { value: "resource", label: "Resource" },
  { value: "other", label: "Other" },
];

const PRODUCT_FILE_EXTS = [
  "pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx",
  "zip", "epub", "mp3", "png", "jpg",
];
const MAX_PRODUCT_FILE_BYTES = 2 * 1024 * 1024; // 2 MB

const formatBytes = (n) => {
  if (!n && n !== 0) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
};

const emptyForm = {
  title: "",
  description: "",
  type: "pdf",
  price: 0,
  file_url: "",
  thumbnail_url: "",
  product_url: "",
  file_name: "",
  file_size_bytes: null,
};

const Products = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [plans, setPlans] = useState(null); // DB subscription_plans; null = loading
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [fileUploading, setFileUploading] = useState(false);
  const [fileError, setFileError] = useState("");
  const [thumbUploading, setThumbUploading] = useState(false);
  const [thumbMode, setThumbMode] = useState("url"); // "url" | "upload"

  // Admin kill-switch gate (fail-open: on unless an admin disabled it).
  const digitalProductsOn = useFeature("digital_products");

  // Database-driven plan gate. A plan can sell digital products when its DB
  // `digital_products` allowance is non-zero (-1 = unlimited). We gate on the
  // real allowance, never on the slug — a higher tier must never be prompted to
  // "upgrade" to a lower one. `explorer` is the legacy alias for the free tier.
  const LEGACY_PLAN_ALIASES = { explorer: "starter" };
  const rawPlan = (user?.plan || "starter").toLowerCase();
  const planSlug = LEGACY_PLAN_ALIASES[rawPlan] || rawPlan;

  const sortedPlans = [...(plans || [])].sort(
    (a, b) => (a.sort_order || 0) - (b.sort_order || 0),
  );
  const myPlan = sortedPlans.find((p) => p.slug === planSlug);
  const myProductLimit = Number(myPlan?.limits?.digital_products ?? 0);
  // Fail open while plans load (null) or when the plan is unrecognised — mirrors
  // FeatureContext, so we never wrongly block someone we can't classify.
  const planIncludesProducts =
    plans === null || !myPlan ? true : myProductLimit !== 0;
  const canCreate = planIncludesProducts && digitalProductsOn;

  // Cheapest strictly-higher tier that actually includes products — names the
  // upgrade CTA. No hardcoded plan name or price (both drift over time).
  const upgradePlan = sortedPlans.find(
    (p) =>
      Number(p.limits?.digital_products ?? 0) !== 0 &&
      (p.sort_order || 0) > (myPlan?.sort_order || 0),
  );

  const fetchProducts = async () => {
    try {
      const { data } = await getMyProducts();
      setProducts(data || []);
    } catch {
      toast.error("Failed to load products");
    }
  };

  useEffect(() => {
    fetchProducts();
    getPublicPlans()
      .then(({ data }) => setPlans(data || []))
      .catch(() => setPlans([]));
  }, []);

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
    setDirty(false);
  };
  const openEdit = (p) => {
    setForm({
      title: p.title,
      description: p.description || "",
      type: p.type,
      price: p.price,
      file_url: p.file_url || "",
      thumbnail_url: p.thumbnail_url || "",
      product_url: p.product_url || "",
      file_name: p.file_name || "",
      file_size_bytes: p.file_size_bytes ?? null,
    });
    setEditingId(p.id);
    setShowForm(true);
    setDirty(false);
    setFileError("");
    setThumbMode("url");
  };
  const handleCancel = () => {
    if (dirty && !window.confirm("Discard changes?")) return;
    setShowForm(false);
    setEditingId(null);
    setDirty(false);
  };
  const handleChange = (f, v) => {
    setForm({ ...form, [f]: v });
    setDirty(true);
  };

  const handleFilePick = async (file) => {
    if (!file) return;
    setFileError("");
    const ext = file.name.toLowerCase().split(".").pop();
    if (!PRODUCT_FILE_EXTS.includes(ext)) {
      setFileError(
        "File type not supported. Allowed: PDF, DOC(X), PPT(X), XLS(X), ZIP, EPUB, MP3, PNG, JPG.",
      );
      return;
    }
    if (file.size > MAX_PRODUCT_FILE_BYTES) {
      setFileError("File must be under 2 MB.");
      return;
    }
    setFileUploading(true);
    try {
      const { data } = await uploadProductFile(file);
      setForm((f) => ({
        ...f,
        file_url: data.url,
        file_name: data.name,
        file_size_bytes: data.size,
      }));
      setDirty(true);
      toast.success("File uploaded");
    } catch (err) {
      setFileError(err.response?.data?.message || "Upload failed");
    } finally {
      setFileUploading(false);
    }
  };

  const handleThumbPick = async (file) => {
    if (!file) return;
    if (!["png", "jpg", "jpeg", "webp"].includes(file.name.toLowerCase().split(".").pop())) {
      toast.error("Thumbnail must be a PNG, JPG, or WEBP image.");
      return;
    }
    if (file.size > MAX_PRODUCT_FILE_BYTES) {
      toast.error("Image must be under 2 MB.");
      return;
    }
    setThumbUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const { data } = await uploadImage(fd, "products");
      setForm((f) => ({ ...f, thumbnail_url: data.url }));
      setDirty(true);
      toast.success("Thumbnail uploaded");
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setThumbUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        await updateProduct(editingId, form);
        toast.success("Product updated!");
      } else {
        await createProduct(form);
        toast.success("Product created!");
      }
      setForm(emptyForm);
      setShowForm(false);
      setEditingId(null);
      setDirty(false);
      fetchProducts();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to save";
      if (err.response?.data?.upgrade_required) {
        toast.error(msg, { duration: 5000 });
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await deleteProduct(id);
      toast.success("Product deleted");
      fetchProducts();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleToggle = async (p) => {
    try {
      await updateProduct(p.id, { is_active: !p.is_active });
      fetchProducts();
    } catch {
      toast.error("Failed to update");
    }
  };

  return (
    <div className="w-full max-w-4xl">
      <BackButton hasUnsavedChanges={dirty} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Digital Products</h1>
          <p className="text-gray-500 text-sm">
            Sell PDFs, templates, ebooks, and more.
          </p>
        </div>
        {!showForm && canCreate && (
          <button onClick={openCreate} className="fb-btn fb-btn--primary">
            + Add Product
          </button>
        )}
      </div>

      {/* Gate — two distinct reasons, two distinct messages:
          • kill switch OFF → products are globally unavailable; an upgrade can't
            unlock them, so show a neutral notice with NO upgrade CTA.
          • plan has no product allowance → show the upgrade CTA, naming the
            cheapest higher tier (price lives on the Upgrade page, never here). */}
      {!canCreate && (
        <div className="fb-card p-6 mb-6 text-center border-2 border-dashed border-primary/30">
          <div className="text-3xl mb-3">📦</div>
          {!digitalProductsOn ? (
            <>
              <h3 className="font-semibold mb-1">
                Digital Products are temporarily unavailable
              </h3>
              <p className="text-sm text-gray-500">
                This feature is switched off right now. It’ll be back soon — no
                plan change needed.
              </p>
            </>
          ) : (
            <>
              <h3 className="font-semibold mb-1">Unlock Digital Products</h3>
              <p className="text-sm text-gray-500 mb-4">
                Sell PDFs, templates, ebooks, and resources directly from your
                profile.
              </p>
              <Link to="/dashboard/upgrade" className="fb-btn fb-btn--primary">
                {upgradePlan
                  ? `Upgrade to ${upgradePlan.name}`
                  : "Upgrade your plan"}
              </Link>
            </>
          )}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="fb-card p-5 mb-6 space-y-4">
          <h2 className="font-semibold">
            {editingId ? "Edit Product" : "New Product"}
          </h2>

          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              required
              placeholder="e.g. UI Component Kit"
              className="fb-input"
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="What's included?"
              className="fb-input resize-none"
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select
                className="fb-input"
                value={form.type}
                onChange={(e) => handleChange("type", e.target.value)}
              >
                {PRODUCT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Price (₹) — 0 for free
              </label>
              <input
                type="number"
                min={0}
                className="fb-input"
                value={form.price}
                onChange={(e) =>
                  handleChange("price", parseFloat(e.target.value) || 0)
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Product URL{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="url"
              placeholder="https://your-store.com/product"
              className="fb-input"
              value={form.product_url}
              onChange={(e) => handleChange("product_url", e.target.value)}
            />
            <p className="text-xs text-gray-400 mt-1">
              A landing page or external store link for this product.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              File URL{" "}
              <span className="text-gray-400 font-normal">
                (Google Drive, Notion, Gumroad, Dropbox, etc.)
              </span>
            </label>
            <input
              type="url"
              placeholder="https://drive.google.com/..."
              className="fb-input"
              value={form.file_url}
              onChange={(e) => handleChange("file_url", e.target.value)}
            />
            <p className="text-xs text-gray-400 mt-1">
              Paste any shareable link — or upload a file below.
            </p>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">
            <strong>Heads up:</strong> an external <em>File URL</em> is public — anyone
            with the link can open it, and it never expires. The secure 24-hour,
            single-link, max-3-downloads protection only applies to files you
            <strong> upload below</strong> (max 2&nbsp;MB). For paid products, prefer
            uploading the file here.
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Upload File{" "}
              <span className="text-gray-400 font-normal">
                (PDF, DOC, PPT, XLS, ZIP, EPUB, MP3, PNG, JPG — max 2 MB)
              </span>
            </label>
            <input
              type="file"
              data-testid="product-file-input"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.epub,.mp3,.png,.jpg"
              className="fb-input"
              disabled={fileUploading}
              onChange={(e) => handleFilePick(e.target.files?.[0])}
            />
            {fileUploading && (
              <p className="text-xs text-primary mt-1 animate-pulse">
                Uploading…
              </p>
            )}
            {fileError && (
              <p className="text-xs text-red-500 mt-1">{fileError}</p>
            )}
            {!fileUploading && form.file_name && (
              <p className="text-xs text-gray-500 mt-1">
                {form.file_name}
                {form.file_size_bytes
                  ? ` · ${formatBytes(form.file_size_bytes)}`
                  : ""}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Cover Image{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => setThumbMode("url")}
                className={`text-xs px-3 py-1 rounded ${
                  thumbMode === "url"
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                Paste URL
              </button>
              <button
                type="button"
                onClick={() => setThumbMode("upload")}
                className={`text-xs px-3 py-1 rounded ${
                  thumbMode === "upload"
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                Upload
              </button>
            </div>

            {thumbMode === "url" ? (
              <input
                type="url"
                placeholder="Paste an image URL — https://..."
                className="fb-input"
                value={form.thumbnail_url}
                onChange={(e) => handleChange("thumbnail_url", e.target.value)}
              />
            ) : (
              <input
                type="file"
                data-testid="product-thumb-input"
                accept=".png,.jpg,.jpeg,.webp"
                className="fb-input"
                disabled={thumbUploading}
                onChange={(e) => handleThumbPick(e.target.files?.[0])}
              />
            )}
            {thumbUploading && (
              <p className="text-xs text-primary mt-1 animate-pulse">
                Uploading…
              </p>
            )}
            {form.thumbnail_url && (
              <img
                src={form.thumbnail_url}
                alt="Thumbnail preview"
                className="mt-2 h-24 w-full object-cover rounded-lg"
                onError={(e) => (e.target.style.display = "none")}
              />
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={loading}
              className="fb-btn fb-btn--primary"
            >
              {loading
                ? "Saving..."
                : editingId
                  ? "Save Changes"
                  : "Create Product"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="fb-btn fb-btn--secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {products.length === 0 && !showForm ? (
        <div className="fb-card text-center py-12">
          <p className="text-gray-400 mb-2">No products yet</p>
          {canCreate && (
            <p className="text-sm text-gray-400">
              Click "+ Add Product" to list your first digital product.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((p) => (
            <div key={p.id} className="fb-card overflow-hidden">
              <div className="flex gap-4">
                {p.thumbnail_url && (
                  <img
                    src={p.thumbnail_url}
                    alt={p.title}
                    className="w-24 h-20 object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 p-4 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium truncate">{p.title}</h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                          {p.type.replace("_", " ")}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full ${p.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}
                        >
                          {p.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      {p.description && (
                        <p className="text-sm text-gray-400 mt-0.5 line-clamp-1">
                          {p.description}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {p.purchase_count} purchase
                        {p.purchase_count !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <p className="font-semibold text-primary flex-shrink-0">
                      {p.price === 0 ? "Free" : `₹${p.price}`}
                    </p>
                  </div>
                  <div className="flex gap-3 mt-3 pt-3 border-t">
                    <button
                      onClick={() => openEdit(p)}
                      className="text-sm text-primary hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggle(p)}
                      className="text-sm text-gray-400 hover:underline"
                    >
                      {p.is_active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="text-sm text-red-500 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Products;
