/**
 * ServiceForm — shared component for Add and Edit service pages.
 * Handles: basic info, thumbnail crop/zoom, rich text, inclusions/exclusions, FAQ builder, notes.
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus } from 'lucide-react';
import { svcCreate, svcUpdate, uploadImage, hostGetCategories, listServiceCategories, hostSuggestServiceCategory, aiGenerateListing } from '../../services/api';
import toast from 'react-hot-toast';
import FeatureGate from '../../components/common/FeatureGate';
import { PageHeader, Card, Button, Input, Select, Textarea, cn } from '../../components/dashboard/ui';
import { BOLT_ENABLED } from '../../config/aiListing';
import { useAuth } from '../../context/AuthContext';

// ─── Constants ───────────────────────────────────────────────────────────────

const DURATIONS = [
  { value: 15,   label: '15 Minutes' },
  { value: 30,   label: '30 Minutes' },
  { value: 45,   label: '45 Minutes' },
  { value: 60,   label: '60 Minutes' },
  { value: 90,   label: '90 Minutes' },
  { value: 120,  label: '120 Minutes' },
  { value: 0,    label: 'Custom' },
];
const GRACE_PERIODS = [
  { value: 0,  label: '0 Minutes' },
  { value: 5,  label: '5 Minutes' },
  { value: 10, label: '10 Minutes' },
  { value: 15, label: '15 Minutes' },
  { value: 30, label: '30 Minutes' },
];

const empty = () => ({
  title: '',
  short_description: '',
  service_type: 'online',
  price: '',
  duration: 30,
  custom_duration: '',
  grace_period: 0,
  thumbnail_url: '',
  long_description: '',
  included_items: [],
  excluded_items: [],
  faqs: [],
  important_note: '',
  category: '',
});

const fieldLabel = "mb-1 block text-sm font-medium text-gray-700";

// ─── Tiny Rich Text Editor ────────────────────────────────────────────────────

const RichEditor = ({ value, onChange }) => {
  const ref = useRef(null);
  const isComposing = useRef(false);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || '';
    }
  }, []); // only on mount

  const exec = (cmd, val = null) => {
    document.execCommand(cmd, false, val);
    ref.current?.focus();
    onChange(ref.current?.innerHTML || '');
  };

  const tools = [
    { icon: '<b>B</b>',  title: 'Bold',          cmd: 'bold' },
    { icon: '<i>I</i>',  title: 'Italic',        cmd: 'italic' },
    { icon: '<u>U</u>',  title: 'Underline',     cmd: 'underline' },
    { icon: 'H2',        title: 'Heading 2',     cmd: 'formatBlock', val: 'h2' },
    { icon: 'H3',        title: 'Heading 3',     cmd: 'formatBlock', val: 'h3' },
    { icon: '¶',         title: 'Paragraph',     cmd: 'formatBlock', val: 'p' },
    { icon: '≡',         title: 'Bullet List',   cmd: 'insertUnorderedList' },
    { icon: '1.',        title: 'Ordered List',  cmd: 'insertOrderedList' },
  ];

  const handleLink = () => {
    const sel = window.getSelection()?.toString();
    if (!sel) { toast('Select some text first'); return; }
    const url = window.prompt('URL:');
    if (url) exec('createLink', url);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 focus-within:ring-2 focus-within:ring-primary/30">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 border-b border-gray-200 bg-gray-50 p-2">
        {tools.map(t => (
          <button key={t.cmd + (t.val||'')} type="button" title={t.title}
            onMouseDown={e => { e.preventDefault(); exec(t.cmd, t.val || null); }}
            className="rounded px-2 py-1 text-xs font-medium text-gray-600 transition-all hover:bg-white hover:shadow-sm"
            dangerouslySetInnerHTML={{ __html: t.icon }}/>
        ))}
        <button type="button" title="Link" onMouseDown={e => { e.preventDefault(); handleLink(); }}
          className="rounded px-2 py-1 text-xs font-medium text-gray-600 transition-all hover:bg-white hover:shadow-sm">
          🔗
        </button>
      </div>
      {/* Editable area */}
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onCompositionStart={() => { isComposing.current = true; }}
        onCompositionEnd={() => { isComposing.current = false; onChange(ref.current?.innerHTML || ''); }}
        onInput={() => { if (!isComposing.current) onChange(ref.current?.innerHTML || ''); }}
        className="prose prose-sm min-h-[200px] max-w-none p-4 text-sm text-gray-700 focus:outline-none"
        style={{ lineHeight: 1.7 }}
        data-placeholder="Write a detailed overview of your service…"
      />
      <style>{`[contenteditable]:empty:before{content:attr(data-placeholder);color:#9ca3af;pointer-events:none;}`}</style>
    </div>
  );
};

// ─── Tag Input (inclusions / exclusions) ─────────────────────────────────────

const TagInput = ({ value, onChange, placeholder, color = 'green' }) => {
  const [input, setInput] = useState('');
  const inputRef = useRef(null);
  const colors = {
    green: 'bg-green-50 text-green-800 border-green-200',
    red:   'bg-red-50 text-red-800 border-red-200',
  };

  const add = (raw) => {
    const tag = raw.trim();
    if (tag && !value.includes(tag)) onChange([...value, tag]);
    setInput('');
  };

  const remove = (tag) => onChange(value.filter(t => t !== tag));

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(input); }
    if (e.key === 'Backspace' && !input && value.length) remove(value[value.length - 1]);
  };

  return (
    <div className="flex min-h-[48px] cursor-text flex-wrap gap-1.5 rounded-xl border border-gray-200 bg-white p-2 focus-within:ring-2 focus-within:ring-primary/30"
      onClick={() => inputRef.current?.focus()}>
      {value.map(tag => (
        <span key={tag} className={cn('inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium', colors[color])}>
          {tag}
          <button type="button" onClick={() => remove(tag)} className="hover:opacity-70">×</button>
        </span>
      ))}
      <input
        ref={inputRef}
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => { if (input.trim()) add(input); }}
        placeholder={value.length === 0 ? placeholder : ''}
        className="min-w-[120px] flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder-gray-400"
      />
    </div>
  );
};

// ─── FAQ Builder ──────────────────────────────────────────────────────────────

const FAQBuilder = ({ value, onChange }) => {
  const add = () => onChange([...value, { question: '', answer: '' }]);
  const remove = (i) => onChange(value.filter((_, idx) => idx !== i));
  const update = (i, key, val) => {
    const next = [...value];
    next[i] = { ...next[i], [key]: val };
    onChange(next);
  };
  const moveUp = (i) => {
    if (i === 0) return;
    const next = [...value];
    [next[i-1], next[i]] = [next[i], next[i-1]];
    onChange(next);
  };
  const moveDown = (i) => {
    if (i === value.length - 1) return;
    const next = [...value];
    [next[i], next[i+1]] = [next[i+1], next[i]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {value.map((faq, i) => (
        <div key={i} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">FAQ {i + 1}</span>
            <div className="flex gap-1">
              <button type="button" onClick={() => moveUp(i)} disabled={i === 0}
                className="rounded p-1 text-gray-400 transition-colors hover:bg-white hover:text-gray-700 disabled:opacity-30">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7"/></svg>
              </button>
              <button type="button" onClick={() => moveDown(i)} disabled={i === value.length - 1}
                className="rounded p-1 text-gray-400 transition-colors hover:bg-white hover:text-gray-700 disabled:opacity-30">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
              </button>
              <button type="button" onClick={() => remove(i)}
                className="rounded p-1 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
          </div>
          <Input type="text" value={faq.question} onChange={e => update(i, 'question', e.target.value)} placeholder="Question" className="mb-2 bg-white" />
          <Textarea rows={3} value={faq.answer} onChange={e => update(i, 'answer', e.target.value)} placeholder="Answer" className="bg-white" />
        </div>
      ))}
      <button type="button" onClick={add} className="mt-1 flex items-center gap-2 text-sm font-medium text-primary transition-opacity hover:opacity-80">
        <Plus className="h-4 w-4" /> Add FAQ
      </button>
    </div>
  );
};

// ─── Thumbnail Cropper (inline, no modal) ────────────────────────────────────

const ThumbnailCropper = ({ currentUrl, onUploaded }) => {
  const canvasRef = useRef(null);
  const fileRef   = useRef(null);
  const [imgEl, setImgEl]       = useState(null);
  const [scale, setScale]       = useState(1);
  const [offset, setOffset]     = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview]   = useState(currentUrl || '');

  const CANVAS_W = 480;
  const CANVAS_H = 270; // 16:9

  const draw = useCallback(() => {
    if (!imgEl || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.drawImage(imgEl, offset.x, offset.y, imgEl.naturalWidth * scale, imgEl.naturalHeight * scale);
    // NOTE: crop-guide border is CSS on the <canvas> element, NOT stroked here —
    // a canvas stroke bakes into the exported JPEG (permanent border on uploads).
  }, [imgEl, scale, offset]);

  useEffect(() => { draw(); }, [draw]);

  const loadFile = (file) => {
    const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!ALLOWED.includes(file.type)) { toast.error('Only JPG, PNG, WEBP allowed'); return; }
    if (file.size > 2 * 1024 * 1024)  { toast.error('Max 2MB'); return; }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const fit = Math.max(CANVAS_W / img.naturalWidth, CANVAS_H / img.naturalHeight);
      setScale(fit);
      setOffset({ x: (CANVAS_W - img.naturalWidth * fit) / 2, y: (CANVAS_H - img.naturalHeight * fit) / 2 });
      setImgEl(img);
    };
    img.src = url;
  };

  const onMouse = (e) => {
    if (e.type === 'mousedown') { setDragging(true); setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y }); }
    if (e.type === 'mousemove' && dragging) setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    if (e.type === 'mouseup' || e.type === 'mouseleave') setDragging(false);
  };

  // Touch support
  const onTouch = (e) => {
    const t = e.touches[0];
    if (e.type === 'touchstart') { setDragging(true); setDragStart({ x: t.clientX - offset.x, y: t.clientY - offset.y }); }
    if (e.type === 'touchmove' && dragging) { e.preventDefault(); setOffset({ x: t.clientX - dragStart.x, y: t.clientY - dragStart.y }); }
    if (e.type === 'touchend') setDragging(false);
  };

  const upload = async () => {
    if (!canvasRef.current) return;
    setUploading(true);
    try {
      // Use backend /api/upload/image which runs as service role — no RLS issues
      const blob = await new Promise(res => canvasRef.current.toBlob(res, 'image/jpeg', 0.88));
      const file = new File([blob], `thumb-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const formData = new FormData();
      formData.append('image', file);
      const { data } = await uploadImage(formData, 'services');
      setPreview(data.url);
      onUploaded(data.url);
      setImgEl(null);
      toast.success('Thumbnail saved!');
    } catch (err) {
      toast.error('Upload failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className={fieldLabel}>Thumbnail <span className="text-red-500">*</span></label>

      {/* Preview if no new file selected */}
      {!imgEl && (
        <div
          className="group relative flex cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-gray-50"
          style={{ width: '100%', aspectRatio: '16/9', maxHeight: 220 }}
          onClick={() => fileRef.current?.click()}
        >
          {preview
            ? <img src={preview} alt="" className="h-full w-full object-cover"/>
            : <div className="p-6 text-center text-gray-400">
                <svg className="mx-auto mb-2 h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                <p className="text-sm font-medium">Click to upload thumbnail</p>
                <p className="mt-1 text-xs">JPG, PNG, WEBP · Max 2MB · 16:9 recommended</p>
              </div>
          }
          {preview && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              <span className="text-sm font-medium text-white">Change thumbnail</span>
            </div>
          )}
        </div>
      )}

      {/* Cropper canvas */}
      {imgEl && (
        <div className="space-y-3">
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            className="w-full cursor-move rounded-xl border border-gray-200"
            style={{ aspectRatio: '16/9' }}
            onMouseDown={onMouse} onMouseMove={onMouse} onMouseUp={onMouse} onMouseLeave={onMouse}
            onTouchStart={onTouch} onTouchMove={onTouch} onTouchEnd={onTouch}
          />
          <div className="flex items-center gap-3">
            <label className="whitespace-nowrap text-xs text-gray-500">Zoom</label>
            <input type="range" min={0.1} max={4} step={0.05} value={scale} onChange={e => setScale(parseFloat(e.target.value))} className="flex-1"/>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setImgEl(null)}>Cancel</Button>
            <Button type="button" size="sm" className="flex-1" onClick={upload} disabled={uploading}>{uploading ? 'Uploading…' : 'Save Thumbnail'}</Button>
          </div>
        </div>
      )}

      <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden"
        onChange={e => { if (e.target.files?.[0]) loadFile(e.target.files[0]); e.target.value = ''; }}/>

      {!imgEl && (
        <button type="button" onClick={() => fileRef.current?.click()} className="mt-2 text-xs text-primary hover:underline">
          {preview ? 'Replace thumbnail' : 'Choose file'}
        </button>
      )}
    </div>
  );
};

const SuggestSubcategoryModal = ({ primary, onClose }) => {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    const v = name.trim();
    if (v.length < 2) return toast.error('Enter a subcategory name');
    setSaving(true);
    try {
      await hostSuggestServiceCategory({ primary_category: primary, name: v });
      toast.success('Sent for approval');
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not submit');
    } finally { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
        <h3 className="text-base font-bold text-gray-900 mb-1">Suggest a subcategory</h3>
        <p className="text-[12px] text-gray-500 mb-3">An admin will review it before it goes live.</p>
        <input autoFocus value={name} onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="e.g. Wedding Photography"
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#FE5100] focus:outline-none" />
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100">Cancel</button>
          <button onClick={submit} disabled={saving}
            className="rounded-lg bg-[#FE5100] px-4 py-2 text-sm font-semibold text-white hover:bg-[#e04800] disabled:opacity-50">
            {saving ? 'Sending…' : 'Send for approval'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── ServiceForm ─────────────────────────────────────────────────────────────

export default function ServiceForm({ initialData, serviceId }) {
  const navigate = useNavigate();
  const isEdit = !!serviceId;
  const { user } = useAuth() || {};
  // Interim fee-only mode: paid listings are disabled (no Razorpay Route yet), so
  // hide the price field and force ₹0. Fail-safe true. Server enforces this too.
  const feeOnly = user?.fee_only_mode ?? true;

  const [form, setForm] = useState(() => {
    if (initialData) {
      return {
        title:             initialData.title || '',
        short_description: initialData.short_description || initialData.description || '',
        service_type:      initialData.meeting_mode || initialData.service_type || 'online',
        price:             initialData.price ?? '',
        duration:          DURATIONS.find(d => d.value === initialData.duration) ? initialData.duration : 0,
        custom_duration:   DURATIONS.find(d => d.value === initialData.duration) ? '' : String(initialData.duration || ''),
        grace_period:      initialData.grace_period_minutes ?? initialData.grace_period ?? 0,
        thumbnail_url:     initialData.thumbnail_url || '',
        long_description:  initialData.long_description || '',
        included_items:    Array.isArray(initialData.included_items) ? initialData.included_items : [],
        excluded_items:    Array.isArray(initialData.excluded_items) ? initialData.excluded_items : [],
        faqs:              Array.isArray(initialData.faqs) ? initialData.faqs : [],
        important_note:    initialData.important_note || '',
        category:          initialData.category || '',
      };
    }
    return empty();
  });

  const [saving, setSaving] = useState(false);
  const [svcCats, setSvcCats] = useState([]);   // [{ id, name, slug }] for the host's profession
  const [primaryCat, setPrimaryCat]     = useState(null);
  const [allowSuggest, setAllowSuggest] = useState(false);
  const [suggestOpen, setSuggestOpen]   = useState(false);

  useEffect(() => {
    let alive = true;
    // Service categories are scoped to the host's primary profession. Fetch the
    // host's primary_category, then its active service-category list. Failures
    // resolve to an empty picker (category stays optional) rather than blocking.
    hostGetCategories()
      .then((h) => {
        const primary = h.data?.primary_category || null;
        return Promise.all([
          primary,
          listServiceCategories(primary).catch(() => ({ data: { categories: [] } })),
        ]);
      })
      .then(([primary, sc]) => {
        if (!alive) return;
        const list = sc.data?.categories || [];
        setSvcCats(list);
        setPrimaryCat(primary);
        setAllowSuggest(Boolean(sc.data?.allow_suggestions));
        // Default to the existing value (edit) or the first available category.
        setForm((f) => (f.category ? f : { ...f, category: initialData?.category || list[0]?.slug || '' }));
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // ── "Write with Bolt" — AI listing generation (Task 7) ──────────────────
  // Populates fields from a server-side AI draft. Host input stays intact:
  // this only fires on demand and merges into existing form state.
  const [aiLoading, setAiLoading] = useState(false);
  const [aiFields, setAiFields]   = useState(() => new Set());
  const [aiSession, setAiSession] = useState(null);
  const [aiError, setAiError]     = useState('');
  const [aiTweak, setAiTweak]     = useState('');

  const runBolt = async (regenerate = false) => {
    if (!BOLT_ENABLED || !form.title.trim() || aiLoading) return;
    setAiLoading(true); setAiError('');
    try {
      const body = { title: form.title, category: form.category || undefined, price: form.price || undefined, duration: form.duration || undefined };
      if (regenerate && aiSession) { body.session_id = aiSession; if (aiTweak.trim()) body.tweak = aiTweak.trim(); }
      const { data } = await aiGenerateListing(body);
      setForm(f => ({ ...f, ...data.fields }));
      setAiFields(new Set(Object.keys(data.fields)));
      setAiSession(data.session_id);
    } catch (e) {
      setAiError(e?.response?.data?.message || 'AI writing failed. You can fill the form manually.');
    } finally { setAiLoading(false); }
  };

  const titleLen = (form.title || '').length;
  const shortLen = (form.short_description || '').length;

  const effectiveDuration = form.duration === 0 ? parseInt(form.custom_duration) || '' : form.duration;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    if (!form.short_description.trim()) { toast.error('Short description is required'); return; }
    if (!feeOnly && !form.price && form.price !== 0) { toast.error('Price is required'); return; }
    if (!form.thumbnail_url) { toast.error('Thumbnail is required'); return; }
    if (!effectiveDuration || effectiveDuration < 1) { toast.error('Duration is required'); return; }

    setSaving(true);
    try {
      const payload = {
        title:             form.title.trim(),
        short_description: form.short_description.trim(),
        description:       form.short_description.trim(), // legacy compat
        service_type:      form.service_type,
        meeting_mode:      form.service_type,
        price:             feeOnly ? 0 : (parseFloat(form.price) || 0),
        duration:          effectiveDuration,
        grace_period:      form.grace_period,
        grace_period_minutes: form.grace_period,
        thumbnail_url:     form.thumbnail_url,
        long_description:  form.long_description,
        included_items:    form.included_items,
        excluded_items:    form.excluded_items,
        faqs:              form.faqs,
        important_note:    form.important_note,
        category:          form.category || null,
      };

      if (isEdit) {
        await svcUpdate(serviceId, payload);
        toast.success('Service updated!');
      } else {
        await svcCreate(payload);
        toast.success('Service created!');
      }
      navigate('/dashboard/services');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Page header */}
      <button type="button" onClick={() => navigate('/dashboard/services')}
        className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-800">
        <ChevronLeft className="h-4 w-4" /> Back to services
      </button>
      <PageHeader
        title={isEdit ? 'Edit Service' : 'Add New Service'}
        subtitle={isEdit ? 'Update your service details' : 'Create a new service to offer to clients'}
      />

      {/* ── ABOVE THE FOLD: Basic info ── */}
      <Card padded={false} className="mb-6 p-6">
        <h2 className="mb-5 text-base font-bold text-gray-800">Basic Information</h2>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left column */}
          <div className="space-y-5">
            {/* Title */}
            <div>
              <div className="mb-1 flex flex-wrap items-center justify-between gap-1">
                <label className="block text-sm font-medium text-gray-700">Service Title <span className="text-red-500">*</span></label>
                <div className="flex items-center gap-2">
                  <span className={cn('text-xs', titleLen > 55 ? 'text-red-500' : 'text-gray-400')}>{titleLen}/60</span>
                  <button type="button" onClick={() => runBolt(false)}
                    disabled={!BOLT_ENABLED || !form.title.trim() || aiLoading}
                    title={!BOLT_ENABLED ? 'AI writing — available soon' : undefined}
                    className={cn(
                      'inline-flex items-center gap-1 text-xs font-semibold text-[color:var(--accent)] disabled:opacity-40',
                      !BOLT_ENABLED && 'grayscale opacity-60 cursor-not-allowed',
                    )}>
                    {!BOLT_ENABLED ? '✨ Write with Bolt · soon' : (aiLoading ? 'Bolt is writing…' : '✨ Write with Bolt')}
                  </button>
                </div>
              </div>
              <Input type="text" value={form.title} maxLength={60} required onChange={e => set('title', e.target.value)} placeholder="e.g. SEO Consultancy by Shubham Datarkar" />
              {aiError && <p className="mt-1 text-xs text-red-500">{aiError}</p>}
              {aiFields.size > 0 && !aiError && !aiLoading && (
                <p className="mt-1 text-xs text-green-600">
                  ✨ Bolt filled {aiFields.size} field{aiFields.size === 1 ? '' : 's'} — review and edit before saving.
                </p>
              )}
              {aiSession && !aiLoading && (
                <div className="mt-2 flex items-center gap-2">
                  <input value={aiTweak} onChange={e => setAiTweak(e.target.value)} placeholder="make it more… (optional)"
                    className="flex-1 rounded border border-gray-300 px-2 py-1 text-xs" />
                  <button type="button" onClick={() => runBolt(true)} disabled={aiLoading}
                    className="text-xs font-semibold text-[color:var(--accent)] disabled:opacity-40">
                    Regenerate
                  </button>
                </div>
              )}
            </div>

            {/* Short description */}
            <div>
              <div className="mb-1 flex justify-between">
                <label className="block text-sm font-medium text-gray-700">Short Description <span className="text-red-500">*</span></label>
                <span className={cn('text-xs', shortLen > 150 ? 'text-red-500' : 'text-gray-400')}>{shortLen}/160</span>
              </div>
              <Textarea rows={3} value={form.short_description} maxLength={160} required onChange={e => set('short_description', e.target.value)} placeholder="Used for service cards, search results and meta description" />
            </div>

            {/* Service Type + Category — compact side-by-side dropdowns.
                Service Type: offline option gated; off = online only.
                Category: scoped to the host's primary profession. */}
            <div className="flex flex-col gap-5 sm:flex-row sm:gap-4">
              <FeatureGate flag="service_offline_type">
                <div className="flex-1">
                  <label className={fieldLabel}>Service Type</label>
                  <Select value={form.service_type} onChange={e => set('service_type', e.target.value)}>
                    <option value="online">🌐 Online</option>
                    <option value="offline">📍 Offline</option>
                  </Select>
                </div>
              </FeatureGate>

              {svcCats.length > 0 && (
                <div className="flex-1">
                  <label className={fieldLabel}>Category <span className="text-red-500">*</span></label>
                  <Select value={form.category} onChange={e => set('category', e.target.value)}>
                    {svcCats.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                  </Select>
                  {allowSuggest && (
                    <button type="button" onClick={() => setSuggestOpen(true)}
                      className="mt-1.5 text-[12px] font-medium text-[#FE5100] hover:underline">
                      + Suggest new subcategory
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Price */}
            <div>
              <label className={fieldLabel}>Price</label>
              {feeOnly ? (
                <div className="rounded-xl border-2 border-gray-100 bg-gray-50 px-3 py-2.5 text-sm text-gray-500">
                  Paid pricing is currently unavailable. Your service is listed as{' '}
                  <span className="font-semibold text-ink">Free</span> — guests pay only Book A Sloth&rsquo;s
                  booking fee at checkout.
                </div>
              ) : (
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-medium text-gray-500">₹</span>
                  <Input type="number" min={0} step={1} required value={form.price} onChange={e => set('price', e.target.value)} placeholder="1999" className="pl-7" />
                </div>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-5">
            {/* Duration */}
            <div>
              <label className={fieldLabel}>Duration <span className="text-red-500">*</span></label>
              <Select value={form.duration} onChange={e => set('duration', parseInt(e.target.value))}>
                {DURATIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </Select>
              {form.duration === 0 && (
                <Input type="number" min={1} max={480} value={form.custom_duration} onChange={e => set('custom_duration', e.target.value)} placeholder="Enter minutes e.g. 75" className="mt-2" />
              )}
            </div>

            {/* Grace Period */}
            <FeatureGate flag="service_grace_period">
              <div>
                <label className={fieldLabel}>Grace Period (buffer before/after)</label>
                <Select value={form.grace_period} onChange={e => set('grace_period', parseInt(e.target.value))}>
                  {GRACE_PERIODS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                </Select>
              </div>
            </FeatureGate>

            {/* Thumbnail */}
            <FeatureGate flag="service_thumbnail">
              <ThumbnailCropper currentUrl={form.thumbnail_url} onUploaded={url => set('thumbnail_url', url)} />
            </FeatureGate>
          </div>
        </div>
      </Card>

      {/* ── BELOW THE FOLD: balanced two-column layout. Columns stretch to equal
          height; FAQ sits directly below Overview on the left. ── */}
      <div className="mb-6 grid grid-cols-1 items-stretch gap-6 lg:grid-cols-2">
        {/* Left: Overview, then FAQ directly below it */}
        <div className="flex flex-col gap-6">
          <FeatureGate flag="service_rich_overview">
            <Card padded={false} className="p-6">
              <h2 className="mb-1 text-base font-bold text-gray-800">Overview</h2>
              <p className="mb-4 text-xs text-gray-400">Shown on the Overview tab of your public service page</p>
              <RichEditor value={form.long_description} onChange={v => set('long_description', v)}/>
            </Card>
          </FeatureGate>

          {/* FAQ — directly below Overview */}
          <FeatureGate flag="service_faqs">
            <Card padded={false} className="p-6">
              <h2 className="mb-1 text-base font-bold text-gray-800">FAQs</h2>
              <p className="mb-4 text-xs text-gray-400">Optional · Add as many as you need</p>
              <FAQBuilder value={form.faqs} onChange={v => set('faqs', v)}/>
            </Card>
          </FeatureGate>
        </div>

        {/* Right: Inclusions, Exclusions, Notes */}
        <div className="flex flex-col gap-6">
          <FeatureGate flag="service_inclusions">
            <Card padded={false} className="p-6">
              <h2 className="mb-1 text-base font-bold text-gray-800">What's Included</h2>
              <p className="mb-3 text-xs text-gray-400">Press Enter or comma after each item</p>
              <TagInput value={form.included_items} onChange={v => set('included_items', v)} placeholder="Type and press Enter…" color="green"/>
            </Card>
          </FeatureGate>

          <FeatureGate flag="service_inclusions">
            <Card padded={false} className="p-6">
              <h2 className="mb-1 text-base font-bold text-gray-800">Not Included</h2>
              <p className="mb-3 text-xs text-gray-400">Press Enter or comma after each item</p>
              <TagInput value={form.excluded_items} onChange={v => set('excluded_items', v)} placeholder="Type and press Enter…" color="red"/>
            </Card>
          </FeatureGate>

          {/* Important Note */}
          <Card padded={false} className="flex-1 p-6">
            <h2 className="mb-1 text-base font-bold text-gray-800">Important Notes</h2>
            <p className="mb-3 text-xs text-gray-400">Optional · Shown to clients before booking</p>
            <Textarea rows={4} value={form.important_note} onChange={e => set('important_note', e.target.value)} placeholder="e.g. Please bring Search Console access. Calls are recorded." />
          </Card>
        </div>
      </div>

      {/* Submit bar */}
      <div className="sticky bottom-0 z-20 -mx-4 flex items-center justify-between gap-4 border-t border-gray-200 bg-white/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6">
        <Button type="button" variant="secondary" onClick={() => navigate('/dashboard/services')}>Cancel</Button>
        <Button type="submit" disabled={saving} className="min-w-[140px]">
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Publish Service'}
        </Button>
      </div>

      {suggestOpen && <SuggestSubcategoryModal primary={primaryCat} onClose={() => setSuggestOpen(false)} />}
    </form>
  );
}
