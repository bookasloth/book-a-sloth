// Escalations — conversations Bolt handed to a human. List + detail (transcript,
// replies, email/note reply, wa.me link, close/reopen). Logic unchanged from the
// old tab; now its own routed page.
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { adminListEscalations, adminGetEscalation, adminReplyEscalation, adminUpdateEscalation } from '../../../services/api';
import { Badge, Skeleton } from '../../../components/admin/ui';

const STATUS_TONE = { open: 'warn', replied: 'ok', closed: 'neutral' };
const RATING_EMOJI = { 1: '😠', 2: '😕', 3: '😐', 4: '🙂', 5: '🤩' };
const fmtDate = (s) => (s ? new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '');
const fmtDateTime = (s) => (s ? new Date(s).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '');

export default function EscalationsPage() {
  const [escStatus, setEscStatus] = useState('open');
  const [escs, setEscs] = useState([]);
  const [escSel, setEscSel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState({ channel: 'email', body: '', busy: false });

  const load = async () => {
    setLoading(true);
    try { const { data } = await adminListEscalations({ status: escStatus }); setEscs(data.escalations || []); }
    catch { toast.error('Could not load escalations'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [escStatus]);

  const openEscalation = async (id) => {
    setReply({ channel: 'email', body: '', busy: false });
    try { const { data } = await adminGetEscalation(id); setEscSel(data); }
    catch { toast.error('Could not open escalation'); }
  };

  const sendReply = async () => {
    const body = reply.body.trim();
    if (!body || reply.busy) return;
    setReply((r) => ({ ...r, busy: true }));
    try {
      await adminReplyEscalation(escSel.escalation.id, { channel: reply.channel, body });
      toast.success(reply.channel === 'email' ? 'Email sent' : 'Note saved');
      await openEscalation(escSel.escalation.id);
      load();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Reply failed');
      setReply((r) => ({ ...r, busy: false }));
    }
  };

  const setEscalationStatus = async (status) => {
    try {
      await adminUpdateEscalation(escSel.escalation.id, { status });
      toast.success(`Marked ${status}`);
      setEscSel((s) => ({ ...s, escalation: { ...s.escalation, status } }));
      load();
    } catch { toast.error('Update failed'); }
  };

  if (escSel) {
    const e = escSel.escalation;
    const wa = e.phone ? `https://wa.me/${String(e.phone).replace(/[^\d]/g, '')}` : null;
    return (
      <div>
        <button onClick={() => setEscSel(null)} className="mb-3 text-sm font-medium text-[#FE5100]">← Back to list</button>
        <div className="space-y-4">
          <div className="rounded-xl border adm-border p-3">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <code className="rounded bg-[#FFF4EC] px-1.5 py-0.5 text-sm font-semibold text-[#1E1E1E]">{e.reference}</code>
              <Badge tone={STATUS_TONE[e.status] || 'neutral'}>{e.status}</Badge>
              {e.contact_verified && <Badge tone="ok">verified</Badge>}
              <span className="text-xs adm-t3">{fmtDateTime(e.created_at)}</span>
            </div>
            <p className="mb-2 text-sm font-semibold adm-t1">{e.summary || '—'}</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs adm-t2">
              <div><span className="adm-t3">Who:</span> {e.logged_in ? `${e.name || '—'} · ${e.is_host ? 'Host' : 'Guest'}` : 'Anonymous'}</div>
              <div><span className="adm-t3">Channel:</span> {e.contact_channel || '—'}</div>
              <div><span className="adm-t3">Email:</span> {e.email || '—'}</div>
              <div><span className="adm-t3">Phone:</span> {e.phone || '—'}</div>
              <div><span className="adm-t3">Reason:</span> {e.reason || '—'}</div>
              <div><span className="adm-t3">Rating:</span> {e.rating ? `${RATING_EMOJI[e.rating]} ${e.rating}/5` : '—'}</div>
              <div className="truncate"><span className="adm-t3">Page:</span> {e.page_url || '—'}</div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="rounded-lg border adm-border px-2.5 py-1 text-xs font-medium text-[#25D366]">Reply on WhatsApp ↗</a>}
              {e.status !== 'closed' && <button onClick={() => setEscalationStatus('closed')} className="rounded-lg border adm-border px-2.5 py-1 text-xs adm-t2">Mark closed</button>}
              {e.status === 'closed' && <button onClick={() => setEscalationStatus('open')} className="rounded-lg border adm-border px-2.5 py-1 text-xs adm-t2">Reopen</button>}
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide adm-t3">Transcript</p>
            <div className="space-y-1.5">
              {escSel.transcript.length === 0 ? <p className="text-sm adm-t3">No transcript stored.</p> :
                escSel.transcript.map((m, i) => (
                  <div key={i} className={'rounded-lg p-2 text-xs ' + (m.role === 'user' ? 'bg-[#FFF4EC]' : 'border adm-border')}>
                    <span className="font-semibold adm-t2">{m.role === 'user' ? 'Visitor' : 'Bolt'}:</span> <span className="adm-t1">{m.content}</span>
                  </div>
                ))}
            </div>
          </div>

          {escSel.replies.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide adm-t3">Replies</p>
              <div className="space-y-1.5">
                {escSel.replies.map((r) => (
                  <div key={r.id} className="rounded-lg border adm-border p-2 text-xs">
                    <div className="mb-0.5 flex items-center gap-2 adm-t3">
                      <Badge tone={r.channel === 'note' ? 'neutral' : 'ok'}>{r.channel}{r.delivered ? ' · sent' : ''}</Badge>
                      <span>{r.sent_by || '—'}</span><span>·</span><span>{fmtDateTime(r.created_at)}</span>
                    </div>
                    <p className="adm-t1 whitespace-pre-wrap">{r.body}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl border adm-border p-3">
            <div className="mb-2 flex gap-2">
              {['email', 'note'].map((ch) => (
                <button key={ch} onClick={() => setReply((r) => ({ ...r, channel: ch }))} disabled={ch === 'email' && !e.email}
                  className={'rounded-lg px-2.5 py-1 text-xs font-medium ' + (reply.channel === ch ? 'bg-[#FE5100] text-white' : 'border adm-border adm-t2') + (ch === 'email' && !e.email ? ' opacity-40' : '')}>
                  {ch === 'email' ? 'Email reply' : 'Internal note'}
                </button>
              ))}
            </div>
            <textarea value={reply.body} onChange={(ev) => setReply((r) => ({ ...r, body: ev.target.value }))} rows={3}
              placeholder={reply.channel === 'email' ? `Reply to ${e.email || 'the visitor'}…` : 'Log an internal note (not sent to the visitor)…'}
              className="mb-2 w-full rounded-lg border adm-border px-3 py-2 text-sm" />
            <button onClick={sendReply} disabled={reply.busy || !reply.body.trim()}
              className="rounded-lg bg-[#FE5100] px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40">
              {reply.busy ? 'Sending…' : reply.channel === 'email' ? 'Send email' : 'Save note'}
            </button>
            {reply.channel === 'email' && !e.email && <p className="mt-1 text-xs adm-t3">No verified email — use WhatsApp or a note.</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-3">
        <select value={escStatus} onChange={(ev) => setEscStatus(ev.target.value)} className="border adm-border rounded-lg px-3 py-1.5 text-sm">
          <option value="open">Open</option>
          <option value="replied">Replied</option>
          <option value="closed">Closed</option>
          <option value="all">All</option>
        </select>
      </div>
      {loading ? <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-16" />)}</div>
        : escs.length === 0 ? <p className="text-sm adm-t3">No escalations — Bolt is handling everything.</p>
          : (
            <div className="space-y-2">
              {escs.map((e) => (
                <button key={e.id} onClick={() => openEscalation(e.id)} className="block w-full rounded-xl border adm-border p-3 text-left hover:border-[#FE5100]">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <code className="rounded bg-[#FFF4EC] px-1.5 py-0.5 text-xs font-semibold text-[#1E1E1E]">{e.reference}</code>
                    <Badge tone={STATUS_TONE[e.status] || 'neutral'}>{e.status}</Badge>
                    <span className="text-xs adm-t3">{e.logged_in ? (e.is_host ? 'Host' : 'Guest') : 'Anon'}</span>
                    {e.contact_verified && <Badge tone="ok">verified</Badge>}
                    {e.rating && <span className="text-xs" title={`Rated ${e.rating}/5`}>{RATING_EMOJI[e.rating]} {e.rating}/5</span>}
                    <span className="ml-auto text-xs adm-t3">{fmtDate(e.created_at)}</span>
                  </div>
                  <p className="text-sm adm-t1">{e.summary || '—'}</p>
                  <p className="mt-0.5 text-xs adm-t3">{e.contact_channel || '—'} · {e.email || e.phone || 'no contact'}</p>
                </button>
              ))}
            </div>
          )}
    </>
  );
}
