/**
 * AdminCampaignComposer — visual email composer with live preview.
 *
 * Left: campaign meta (name/subject/preview/sender/segment) + a block editor.
 * Right: device-toggled iframe showing the ACTUAL compiled email HTML (server
 * compiles the same block model that gets sent — the preview is real, not a mock).
 *
 * Phase 2: compose + preview + save draft. Test-send and the send/confirm flow
 * arrive in Phase 4; recipient list + manual/single audience in Phase 3.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { adminCampSegments, adminCampSegPreview, adminCampPreview, adminCampCreate, adminUploadImage } from '../../services/api';
import { Card, Btn } from '../../components/admin/ui';

// Palette: block type → factory for a fresh block.
const NEW_BLOCK = {
  heading: () => ({ type: 'heading', text: 'Heading', level: 2, align: 'left' }),
  text:    () => ({ type: 'text', text: 'Write something to your audience…', align: 'left' }),
  image:   () => ({ type: 'image', src: '', href: '', alt: '', width: 600 }),
  button:  () => ({ type: 'button', label: 'View', href: 'https://bookasloth.com', align: 'left' }),
  divider: () => ({ type: 'divider' }),
  spacer:  () => ({ type: 'spacer', size: 16 }),
};
const PALETTE = ['heading', 'text', 'image', 'button', 'divider', 'spacer'];

const Field = ({ label, children }) => (
  <div><label className="block text-xs font-semibold adm-t3 mb-1">{label}</label>{children}</div>
);
const AlignPicker = ({ value, onChange }) => (
  <select className="fb-input text-sm" value={value || 'left'} onChange={(e) => onChange(e.target.value)}>
    <option value="left">Left</option><option value="center">Center</option><option value="right">Right</option>
  </select>
);

const BlockEditor = ({ block, onChange, onUpload }) => {
  const set = (patch) => onChange({ ...block, ...patch });
  switch (block.type) {
    case 'heading':
      return (
        <div className="space-y-2">
          <input className="fb-input text-sm" value={block.text} onChange={(e) => set({ text: e.target.value })} placeholder="Heading text" />
          <div className="grid grid-cols-2 gap-2">
            <select className="fb-input text-sm" value={block.level} onChange={(e) => set({ level: +e.target.value })}>
              <option value={1}>Large</option><option value={2}>Medium</option><option value={3}>Small</option>
            </select>
            <AlignPicker value={block.align} onChange={(align) => set({ align })} />
          </div>
        </div>
      );
    case 'text':
      return (
        <div className="space-y-2">
          <textarea className="fb-input text-sm font-sans" rows={4} value={block.text} onChange={(e) => set({ text: e.target.value })} placeholder="Body text — {{first_name}} is personalized per recipient" />
          <AlignPicker value={block.align} onChange={(align) => set({ align })} />
        </div>
      );
    case 'image':
      return (
        <div className="space-y-2">
          {block.src ? <img src={block.src} alt="" className="max-h-28 rounded border adm-border" /> : null}
          <div className="flex gap-2 items-center">
            <label className="text-xs adm-t2 cursor-pointer underline">
              Upload
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0], (url) => set({ src: url }))} />
            </label>
            <input className="fb-input text-sm flex-1" value={block.src} onChange={(e) => set({ src: e.target.value })} placeholder="or paste https:// image URL" />
          </div>
          <input className="fb-input text-sm" value={block.href} onChange={(e) => set({ href: e.target.value })} placeholder="Link URL (optional)" />
          <div className="grid grid-cols-2 gap-2">
            <input className="fb-input text-sm" value={block.alt} onChange={(e) => set({ alt: e.target.value })} placeholder="Alt text" />
            <input className="fb-input text-sm" type="number" value={block.width} onChange={(e) => set({ width: +e.target.value })} placeholder="Width px" />
          </div>
        </div>
      );
    case 'button':
      return (
        <div className="space-y-2">
          <input className="fb-input text-sm" value={block.label} onChange={(e) => set({ label: e.target.value })} placeholder="Button label" />
          <input className="fb-input text-sm" value={block.href} onChange={(e) => set({ href: e.target.value })} placeholder="Button URL" />
          <AlignPicker value={block.align} onChange={(align) => set({ align })} />
        </div>
      );
    case 'spacer':
      return <input className="fb-input text-sm" type="number" value={block.size} onChange={(e) => set({ size: +e.target.value })} placeholder="Height px" />;
    case 'divider':
      return <p className="text-xs adm-t3">Horizontal divider.</p>;
    default:
      return null;
  }
};

const AdminCampaignComposer = ({ onClose }) => {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [previewText, setPreviewText] = useState('');
  const [audience, setAudience] = useState('customer'); // shell: customer|vendor
  const [segmentId, setSegmentId] = useState('');
  const [segments, setSegments] = useState([]);
  const [count, setCount] = useState(null);
  const [blocks, setBlocks] = useState([NEW_BLOCK.heading(), NEW_BLOCK.text()]);
  const [device, setDevice] = useState('desktop');
  const [html, setHtml] = useState('');
  const [saving, setSaving] = useState(false);
  const [previewErr, setPreviewErr] = useState(false);

  useEffect(() => { adminCampSegments().then((r) => setSegments(r.data)).catch(() => {}); }, []);

  const previewCount = async (segId) => {
    const seg = segments.find((s) => s.id === segId);
    if (!seg) return setCount(null);
    try { const r = await adminCampSegPreview(seg.definition, 'email'); setCount(r.data.count); } catch { setCount(null); }
  };

  // Debounced live preview: server compiles the exact block model we'll send.
  const timer = useRef(null);
  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        const r = await adminCampPreview({ design_json: { blocks }, subject, preview_text: previewText, audience });
        setHtml(r.data.html); setPreviewErr(false);
      } catch { setPreviewErr(true); }
    }, 500);
    return () => clearTimeout(timer.current);
  }, [blocks, subject, previewText, audience]);

  const upload = useCallback(async (file, done) => {
    try { const r = await adminUploadImage(file, 'email'); done(r.data.url); toast.success('Image uploaded'); }
    catch { toast.error('Upload failed'); }
  }, []);

  const addBlock = (type) => setBlocks((b) => [...b, NEW_BLOCK[type]()]);
  const patchBlock = (i, nb) => setBlocks((b) => b.map((x, j) => (j === i ? nb : x)));
  const removeBlock = (i) => setBlocks((b) => b.filter((_, j) => j !== i));
  const move = (i, d) => setBlocks((b) => {
    const j = i + d; if (j < 0 || j >= b.length) return b;
    const copy = [...b]; [copy[i], copy[j]] = [copy[j], copy[i]]; return copy;
  });

  const saveDraft = async () => {
    if (!name.trim()) return toast.error('Campaign name is required');
    if (!subject.trim()) return toast.error('Subject is required');
    if (!blocks.length) return toast.error('Add at least one content block');
    setSaving(true);
    try {
      await adminCampCreate({
        name, channel: 'email', segment_id: segmentId || null, audience_type: 'segment',
        subject, preview_text: previewText, sender_key: 'shubham',
        design_json: { blocks }, throttle_per_min: 120,
      });
      toast.success('Draft saved');
      onClose?.();
    } catch (e) { toast.error(e?.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-semibold adm-t1">Create Email</h1>
          <p className="text-xs adm-t3">From Shubham · Founder &lt;shubham@bookasloth.in&gt;</p>
        </div>
        <div className="flex gap-2">
          <Btn variant="outline" size="sm" onClick={onClose}>Cancel</Btn>
          <Btn size="sm" onClick={saveDraft} disabled={saving}>{saving ? 'Saving…' : 'Save draft'}</Btn>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ── Editor ── */}
        <div className="space-y-3">
          <Card className="space-y-3">
            <Field label="Campaign name (internal)"><input className="fb-input text-sm" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. August host update" /></Field>
            <Field label="Subject"><input className="fb-input text-sm" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Inbox subject line" /></Field>
            <Field label="Preview text (inbox preheader)"><input className="fb-input text-sm" value={previewText} onChange={(e) => setPreviewText(e.target.value)} placeholder="Shown after the subject in most inboxes" /></Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Layout">
                <select className="fb-input text-sm" value={audience} onChange={(e) => setAudience(e.target.value)}>
                  <option value="customer">Guest (branded footer)</option>
                  <option value="vendor">Host (minimal footer)</option>
                </select>
              </Field>
              <Field label="Audience (segment)">
                <select className="fb-input text-sm" value={segmentId} onChange={(e) => { setSegmentId(e.target.value); previewCount(e.target.value); }}>
                  <option value="">Select later…</option>
                  {segments.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </Field>
            </div>
            {count !== null && <p className="text-[11px] adm-t2">≈ {count} consented email recipients</p>}
          </Card>

          <Card className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold adm-t1">Content blocks</p>
              <div className="flex flex-wrap gap-1">
                {PALETTE.map((t) => <button key={t} onClick={() => addBlock(t)} className="text-[11px] px-2 py-1 rounded border adm-border adm-hoverable capitalize adm-t2">+ {t}</button>)}
              </div>
            </div>
            {blocks.map((b, i) => (
              <div key={i} className="border adm-border rounded-lg p-2.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wide adm-t3 capitalize">{b.type}</span>
                  <div className="flex gap-1 text-xs adm-t3">
                    <button onClick={() => move(i, -1)} disabled={i === 0} className="px-1 disabled:opacity-30">↑</button>
                    <button onClick={() => move(i, 1)} disabled={i === blocks.length - 1} className="px-1 disabled:opacity-30">↓</button>
                    <button onClick={() => removeBlock(i)} className="px-1 text-red-500">✕</button>
                  </div>
                </div>
                <BlockEditor block={b} onChange={(nb) => patchBlock(i, nb)} onUpload={upload} />
              </div>
            ))}
            {blocks.length === 0 && <p className="text-xs adm-t3 py-3 text-center">No blocks yet — add one above.</p>}
          </Card>
        </div>

        {/* ── Preview ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold adm-t1">Live preview</p>
            <div className="flex gap-1">
              {['desktop', 'mobile'].map((d) => (
                <button key={d} onClick={() => setDevice(d)}
                  className={`text-[11px] px-2.5 py-1 rounded border capitalize ${device === d ? 'bg-indigo-600 text-white border-indigo-600' : 'adm-border adm-t2 adm-hoverable'}`}>{d}</button>
              ))}
            </div>
          </div>
          <div className="adm-card rounded-xl p-3 flex justify-center overflow-auto" style={{ minHeight: 480 }}>
            {previewErr
              ? <p className="text-xs text-red-500 self-center">Preview failed to render.</p>
              : (
                <iframe title="Email preview" srcDoc={html} sandbox=""
                  style={{ width: device === 'mobile' ? 375 : '100%', maxWidth: device === 'mobile' ? 375 : 640, height: 620, border: '1px solid var(--adm-border,#edf0f2)', borderRadius: 8, background: '#fff' }} />
              )}
          </div>
          <p className="text-[11px] adm-t3 mt-2">Approximate — real inboxes (Gmail, Outlook, Apple Mail) vary slightly. Send a test before launching.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminCampaignComposer;
