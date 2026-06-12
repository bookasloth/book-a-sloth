import { useState, useEffect } from "react";
import {
  getMyProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../services/api";
import { useAuth } from "../context/AuthContext";
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

const emptyForm = {
  title: "",
  description: "",
  type: "pdf",
  price: 0,
  file_url: "",
  thumbnail_url: "",
};

const Products = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dirty, setDirty] = useState(false);

  const plan = user?.plan || "explorer";
  const canCreate = plan !== "explorer";

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
    });
    setEditingId(p.id);
    setShowForm(true);
    setDirty(false);
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

      {/* Explorer upgrade gate */}
      {!canCreate && (
        <div className="fb-card p-6 mb-6 text-center border-2 border-dashed border-primary/30">
          <div className="text-3xl mb-3">📦</div>
          <h3 className="font-semibold mb-1">
            Digital Products — Creator & above
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Sell PDFs, templates, ebooks, and resources directly from your
            profile.
          </p>
          <Link to="/dashboard/upgrade" className="fb-btn fb-btn--primary">
            Upgrade to Creator — ₹999/mo
          </Link>
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
              Paste any shareable link. Guests get this link after purchase.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Cover Image URL{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="url"
              placeholder="https://..."
              className="fb-input"
              value={form.thumbnail_url}
              onChange={(e) => handleChange("thumbnail_url", e.target.value)}
            />
            {form.thumbnail_url && (
              <img
                src={form.thumbnail_url}
                alt="Preview"
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
