/**
 * ServiceForm — shared component for Add and Edit service pages.
 * Handles: basic info, thumbnail crop/zoom, rich text, inclusions/exclusions, FAQ builder, notes.
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { svcCreate, svcUpdate, uploadImage } from '../../services/api';
import toast from 'react-hot-toast';
import FeatureGate from '../../components/common/FeatureGate';

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
});

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
    <div className="border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary/30">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 bg-gray-50 border-b border-gray-200">
        {tools.map(t => (
          <button key={t.cmd + (t.val||'')} type="button" title={t.title}
            onMouseDown={e => { e.preventDefault(); exec(t.cmd, t.val || null); }}
            className="px-2 py-1 rounded text-xs font-medium text-gray-600 hover:bg-white hover:shadow-sm transition-all"
            dangerouslySetInnerHTML={{ __html: t.icon }}/>
        ))}
        <button type="button" title="Link" onMouseDown={e => { e.preventDefault(); handleLink(); }}
          className="px-2 py-1 rounded text-xs font-medium text-gray-600 hover:bg-white hover:shadow-sm transition-all">
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
        className="min-h-[200px] p-4 text-sm text-gray-700 focus:outline-none prose prose-sm max-w-none"
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
    <div className="min-h-[48px] border border-gray-200 rounded-xl p-2 flex flex-wrap gap-1.5 focus-within:ring-2 focus-within:ring-primary/30 bg-white cursor-text"
      onClick={() => document.getElementById(`taginput-${placeholder}`)?.focus()}>
      {value.map(tag => (
        <span key={tag} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border ${colors[color]}`}>
          {tag}
          <button type="button" onClick={() => remove(tag)} className="hover:opacity-70">×</button>
        </span>
      ))}
      <input
        id={`taginput-${placeholder}`}
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => { if (input.trim()) add(input); }}
        placeholder={value.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[120px] outline-none text-sm bg-transparent text-gray-700 placeholder-gray-400"
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
        <div key={i} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500">FAQ {i + 1}</span>
            <div className="flex gap-1">
              <button type="button" onClick={() => moveUp(i)} disabled={i === 0}
                className="p-1 rounded hover:bg-white text-gray-400 hover:text-gray-700 disabled:opacity-30 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7"/></svg>
              </button>
              <button type="button" onClick={() => moveDown(i)} disabled={i === value.length - 1}
                className="p-1 rounded hover:bg-white text-gray-400 hover:text-gray-700 disabled:opacity-30 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
              </button>
              <button type="button" onClick={() => remove(i)}
                className="p-1 rounded hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
          </div>
          <input
            type="text" value={faq.question}
            onChange={e => update(i, 'question', e.target.value)}
            placeholder="Question"
            className="fb-input mb-2 bg-white"
          />
          <textarea
            rows={3} value={faq.answer}
            onChange={e => update(i, 'answer', e.target.value)}
            placeholder="Answer"
            className="fb-input resize-none bg-white w-full"
          />
        </div>
      ))}
      <button type="button" onClick={add}
        className="flex items-center gap-2 text-sm text-primary font-medium hover:opacity-80 transition-opacity mt-1">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
        Add FAQ
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
    ctx.strokeStyle = 'rgba(99,102,241,0.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, CANVAS_W - 2, CANVAS_H - 2);
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
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
        Thumbnail <span className="text-red-500">*</span>
      </label>

      {/* Preview if no new file selected */}
      {!imgEl && (
        <div
          className="relative group cursor-pointer rounded-xl overflow-hidden border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center"
          style={{ width: '100%', aspectRatio: '16/9', maxHeight: 220 }}
          onClick={() => fileRef.current?.click()}
        >
          {preview
            ? <img src={preview} alt="" className="w-full h-full object-cover"/>
            : <div className="text-center text-gray-400 p-6">
                <svg className="w-10 h-10 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                <p className="text-sm font-medium">Click to upload thumbnail</p>
                <p className="text-xs mt-1">JPG, PNG, WEBP · Max 2MB · 16:9 recommended</p>
              </div>
          }
          {preview && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-sm font-medium">Change thumbnail</span>
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
            className="w-full rounded-xl border border-gray-200 cursor-move"
            style={{ aspectRatio: '16/9' }}
            onMouseDown={onMouse} onMouseMove={onMouse} onMouseUp={onMouse} onMouseLeave={onMouse}
            onTouchStart={onTouch} onTouchMove={onTouch} onTouchEnd={onTouch}
          />
          <div className="flex items-center gap-3">
            <label className="text-xs text-gray-500 whitespace-nowrap">Zoom</label>
            <input type="range" min={0.1} max={4} step={0.05} value={scale}
              onChange={e => setScale(parseFloat(e.target.value))}
              className="flex-1"/>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setImgEl(null)} className="fb-btn fb-btn--secondary text-sm">Cancel</button>
            <button type="button" onClick={upload} disabled={uploading}
              className="fb-btn fb-btn--primary text-sm flex-1">
              {uploading ? 'Uploading…' : 'Save Thumbnail'}
            </button>
          </div>
        </div>
      )}

      <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden"
        onChange={e => { if (e.target.files?.[0]) loadFile(e.target.files[0]); e.target.value = ''; }}/>

      {!imgEl && (
        <button type="button" onClick={() => fileRef.current?.click()}
          className="mt-2 text-xs text-primary hover:underline">{preview ? 'Replace thumbnail' : 'Choose file'}</button>
      )}
    </div>
  );
};

// ─── ServiceForm ─────────────────────────────────────────────────────────────

export default function ServiceForm({ initialData, serviceId }) {
  const navigate = useNavigate();
  const isEdit = !!serviceId;

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
      };
    }
    return empty();
  });

  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const titleLen = (form.title || '').length;
  const shortLen = (form.short_description || '').length;

  const effectiveDuration = form.duration === 0 ? parseInt(form.custom_duration) || '' : form.duration;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    if (!form.short_description.trim()) { toast.error('Short description is required'); return; }
    if (!form.price && form.price !== 0) { toast.error('Price is required'); return; }
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
        price:             parseFloat(form.price) || 0,
        duration:          effectiveDuration,
        grace_period:      form.grace_period,
        grace_period_minutes: form.grace_period,
        thumbnail_url:     form.thumbnail_url,
        long_description:  form.long_description,
        included_items:    form.included_items,
        excluded_items:    form.excluded_items,
        faqs:              form.faqs,
        important_note:    form.important_note,
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
    <form onSubmit={handleSubmit} className="w-full max-w-6xl">
      {/* Page header */}
      <div className="flex items-center gap-3 mb-6">
        <button type="button" onClick={() => navigate('/dashboard/services')}
          className="p-2 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold">{isEdit ? 'Edit Service' : 'Add New Service'}</h1>
          <p className="text-sm text-gray-400">{isEdit ? 'Update your service details' : 'Create a new service to offer to clients'}</p>
        </div>
      </div>

      {/* ── ABOVE THE FOLD: Basic info ── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-6">
        <h2 className="text-base font-bold mb-5 text-gray-800">Basic Information</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column */}
          <div className="space-y-5">
            {/* Title */}
            <div>
              <div className="flex justify-between mb-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Service Title <span className="text-red-500">*</span>
                </label>
                <span className={`text-xs ${titleLen > 55 ? 'text-red-500' : 'text-gray-400'}`}>{titleLen}/60</span>
              </div>
              <input type="text" value={form.title} maxLength={60} required
                onChange={e => set('title', e.target.value)}
                placeholder="e.g. SEO Consultancy by Shubham Datarkar"
                className="fb-input"/>
            </div>

            {/* Short description */}
            <div>
              <div className="flex justify-between mb-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Short Description <span className="text-red-500">*</span>
                </label>
                <span className={`text-xs ${shortLen > 150 ? 'text-red-500' : 'text-gray-400'}`}>{shortLen}/160</span>
              </div>
              <textarea rows={3} value={form.short_description} maxLength={160} required
                onChange={e => set('short_description', e.target.value)}
                placeholder="Used for service cards, search results and meta description"
                className="fb-input resize-none"/>
            </div>

            {/* Service Type — offline option gated; off = online only */}
            <FeatureGate flag="service_offline_type">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Service Type
                </label>
                <div className="flex gap-3">
                  {['online','offline'].map(t => (
                    <button key={t} type="button" onClick={() => set('service_type', t)}
                      className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${form.service_type === t ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                      {t === 'online' ? '🌐 Online' : '📍 Offline'}
                    </button>
                  ))}
                </div>
              </div>
            </FeatureGate>

            {/* Price */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Price <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
                <input type="number" min={0} step={1} required value={form.price}
                  onChange={e => set('price', e.target.value)}
                  placeholder="1999"
                  className="fb-input pl-7"/>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-5">
            {/* Duration */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Duration <span className="text-red-500">*</span>
              </label>
              <select value={form.duration} onChange={e => set('duration', parseInt(e.target.value))} className="fb-input">
                {DURATIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
              {form.duration === 0 && (
                <input type="number" min={1} max={480} value={form.custom_duration}
                  onChange={e => set('custom_duration', e.target.value)}
                  placeholder="Enter minutes e.g. 75"
                  className="fb-input mt-2"/>
              )}
            </div>

            {/* Grace Period */}
            <FeatureGate flag="service_grace_period">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Grace Period (buffer before/after)
                </label>
                <select value={form.grace_period} onChange={e => set('grace_period', parseInt(e.target.value))} className="fb-input">
                  {GRACE_PERIODS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                </select>
              </div>
            </FeatureGate>

            {/* Thumbnail */}
            <FeatureGate flag="service_thumbnail">
              <ThumbnailCropper
                currentUrl={form.thumbnail_url}
                onUploaded={url => set('thumbnail_url', url)}
              />
            </FeatureGate>
          </div>
        </div>
      </div>

      {/* ── BELOW THE FOLD: Two-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Left: Long Description */}
        <FeatureGate flag="service_rich_overview">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-bold mb-1 text-gray-800">Overview</h2>
            <p className="text-xs text-gray-400 mb-4">Shown on the Overview tab of your public service page</p>
            <RichEditor value={form.long_description} onChange={v => set('long_description', v)}/>
          </div>
        </FeatureGate>

        {/* Right: Inclusions, Exclusions, FAQ, Notes */}
        <div className="space-y-6">
          {/* Included / Excluded */}
          <FeatureGate flag="service_inclusions">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-base font-bold mb-1 text-gray-800">What's Included</h2>
              <p className="text-xs text-gray-400 mb-3">Press Enter or comma after each item</p>
              <TagInput value={form.included_items} onChange={v => set('included_items', v)}
                placeholder="Type and press Enter…" color="green"/>
            </div>
          </FeatureGate>

          <FeatureGate flag="service_inclusions">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-base font-bold mb-1 text-gray-800">Not Included</h2>
              <p className="text-xs text-gray-400 mb-3">Press Enter or comma after each item</p>
              <TagInput value={form.excluded_items} onChange={v => set('excluded_items', v)}
                placeholder="Type and press Enter…" color="red"/>
            </div>
          </FeatureGate>

          {/* FAQ */}
          <FeatureGate flag="service_faqs">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-base font-bold mb-1 text-gray-800">FAQs</h2>
              <p className="text-xs text-gray-400 mb-4">Optional · Add as many as you need</p>
              <FAQBuilder value={form.faqs} onChange={v => set('faqs', v)}/>
            </div>
          </FeatureGate>

          {/* Important Note */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-bold mb-1 text-gray-800">Important Notes</h2>
            <p className="text-xs text-gray-400 mb-3">Optional · Shown to clients before booking</p>
            <textarea rows={4} value={form.important_note} onChange={e => set('important_note', e.target.value)}
              placeholder="e.g. Please bring Search Console access. Calls are recorded."
              className="fb-input resize-none w-full"/>
          </div>
        </div>
      </div>

      {/* Submit bar */}
      <div className="sticky bottom-0 z-20 bg-white/95 backdrop-blur border-t border-gray-200 -mx-4 px-4 sm:-mx-6 sm:px-6 py-4 flex items-center justify-between gap-4">
        <button type="button" onClick={() => navigate('/dashboard/services')}
          className="fb-btn fb-btn--secondary">Cancel</button>
        <button type="submit" disabled={saving}
          className="fb-btn fb-btn--primary min-w-[140px]">
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Publish Service'}
        </button>
      </div>
    </form>
  );
}
