// client/src/pages/admin/AdminBotSupport.jsx
// Bolt support console (SIE phase D-lite): review the knowledge_gaps queue that
// Bolt fills on every escalation / 👎, and promote a gap into a FAQ answer that
// gets served without the model next time. Closes the learning loop's human step.
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  adminListBotGaps, adminResolveBotGap,
  adminListBotFaqs, adminCreateBotFaq, adminUpdateBotFaq, adminDeleteBotFaq,
  adminBotAnalytics, adminBotGraph, adminListBotCache, adminDeleteBotCache,
  adminListEscalations, adminGetEscalation, adminReplyEscalation, adminUpdateEscalation,
} from '../../services/api';
import { PageHeader, Badge, Skeleton } from '../../components/admin/ui';

const REASON_TONE = { escalated: 'warn', thumbs_down: 'danger' };
const STATUS_TONE = { open: 'warn', replied: 'ok', closed: 'neutral' };
const fmtDate = (s) => (s ? new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '');
const fmtDateTime = (s) => (s ? new Date(s).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '');

export default function AdminBotSupport() {
  const [tab, setTab] = useState('insights');
  const [gapStatus, setGapStatus] = useState('open');
  const [gaps, setGaps] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [stats, setStats] = useState(null);
  const [topDocs, setTopDocs] = useState([]);
  const [cache, setCache] = useState([]);
  const [loading, setLoading] = useState(true);
  // FAQ editor — { pattern, answer, gapId?, editingId? }. null = closed.
  const [form, setForm] = useState(null);
  // Escalations
  const [escStatus, setEscStatus] = useState('open');
  const [escs, setEscs] = useState([]);
  const [escSel, setEscSel] = useState(null); // { escalation, transcript, replies } | null
  const [reply, setReply] = useState({ channel: 'email', body: '', busy: false });

  const loadGaps = async () => {
    setLoading(true);
    try { const { data } = await adminListBotGaps({ status: gapStatus }); setGaps(data.gaps || []); }
    catch { toast.error('Could not load gaps'); }
    finally { setLoading(false); }
  };
  const loadFaqs = async () => {
    setLoading(true);
    try { const { data } = await adminListBotFaqs(); setFaqs(data.faqs || []); }
    catch { toast.error('Could not load FAQs'); }
    finally { setLoading(false); }
  };
  const loadInsights = async () => {
    setLoading(true);
    try {
      const [a, g] = await Promise.all([adminBotAnalytics(), adminBotGraph()]);
      setStats(a.data); setTopDocs(g.data.topDocs || []);
    } catch { toast.error('Could not load insights'); }
    finally { setLoading(false); }
  };
  const loadCache = async () => {
    setLoading(true);
    try { const { data } = await adminListBotCache(); setCache(data.cache || []); }
    catch { toast.error('Could not load cache'); }
    finally { setLoading(false); }
  };

  const loadEscalations = async () => {
    setLoading(true);
    try { const { data } = await adminListEscalations({ status: escStatus }); setEscs(data.escalations || []); }
    catch { toast.error('Could not load escalations'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (tab === 'gaps') loadGaps();
    else if (tab === 'faqs') loadFaqs();
    else if (tab === 'insights') loadInsights();
    else if (tab === 'cache') loadCache();
    else if (tab === 'escalations') loadEscalations();
    /* eslint-disable-next-line */
  }, [tab, gapStatus, escStatus]);

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
      loadEscalations();
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
      loadEscalations();
    } catch { toast.error('Update failed'); }
  };

  const evictCache = async (id) => {
    if (id === 'all' && !window.confirm('Clear the entire semantic cache? It refills from traffic.')) return;
    try { await adminDeleteBotCache(id); toast.success(id === 'all' ? 'Cache cleared' : 'Removed'); loadCache(); }
    catch { toast.error('Delete failed'); }
  };

  const resolveGap = async (id, resolved) => {
    try { await adminResolveBotGap(id, { resolved }); toast.success(resolved ? 'Resolved' : 'Reopened'); loadGaps(); }
    catch { toast.error('Update failed'); }
  };

  // Promote a gap → prefill the FAQ editor and jump to the FAQs tab.
  const promote = (gap) => {
    setForm({ pattern: (gap.question || '').toLowerCase().slice(0, 120), answer: '', gapId: gap.id });
    setTab('faqs');
  };

  const saveFaq = async () => {
    const pattern = form.pattern.trim(); const answer = form.answer.trim();
    if (!pattern || !answer) { toast.error('Pattern and answer are required'); return; }
    try {
      if (form.editingId) { await adminUpdateBotFaq(form.editingId, { pattern, answer }); toast.success('FAQ updated'); }
      else { await adminCreateBotFaq({ pattern, answer, gapId: form.gapId }); toast.success('FAQ added'); }
      setForm(null); loadFaqs();
    } catch (e) { toast.error(e?.response?.data?.message || 'Save failed'); }
  };

  const toggleFaq = async (f) => {
    try { await adminUpdateBotFaq(f.id, { enabled: !f.enabled }); loadFaqs(); }
    catch { toast.error('Toggle failed'); }
  };
  const deleteFaq = async (f) => {
    if (!window.confirm(`Delete FAQ "${f.pattern}"?`)) return;
    try { await adminDeleteBotFaq(f.id); toast.success('Deleted'); loadFaqs(); }
    catch { toast.error('Delete failed'); }
  };

  return (
    <div>
      <PageHeader title="Bolt Support" subtitle="Review what Bolt couldn't answer, and turn gaps into instant FAQ answers." />

      <div className="mb-4 flex flex-wrap gap-2">
        {[
          ['insights', 'Stats', 'How Bolt performed over the last 30 days.'],
          ['escalations', 'Escalations', 'Conversations Bolt handed to a human — reply here.'],
          ['gaps', 'Needs answer', "Questions Bolt couldn't answer — your to-do list."],
          ['faqs', 'FAQs', 'Your saved answers, sent word-for-word with no AI.'],
          ['cache', 'Auto-saved', 'Past answers Bolt saved and reuses automatically.'],
        ].map(([t, label, tip]) => (
          <button key={t} onClick={() => setTab(t)} title={tip}
            className={'rounded-lg px-3 py-1.5 text-sm font-medium ' + (tab === t ? 'bg-[#FE5100] text-white' : 'border adm-border adm-t2')}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'insights' && (
        loading || !stats ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-20" />)}</div> : (
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide adm-t3">Last 30 days · {stats.answered} answers</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[
                  ['Solved without AI', `${stats.pct.deflected}%`, 'greetings + FAQs + reused', 'Share answered for free — greetings, FAQs, or reused answers. No AI cost.'],
                  ['Used AI', `${stats.pct.ai}%`, 'the goal: shrink this', 'Share that reached the paid AI model. Lower is better.'],
                  ['Reused Answers', `${stats.pct.cache}%`, `${stats.cacheSize} saved`, 'Share answered by reusing a past answer.'],
                  ['Via FAQs', `${stats.pct.faq}%`, `${stats.liveFaqs} live FAQs`, 'Share answered by your saved FAQs.'],
                  ['Sent to Human', `${stats.pct.escalation}%`, `${stats.openGaps} still unanswered`, "Share Bolt couldn't handle and passed to a human."],
                  ['Greetings', `${stats.pct.smalltalk}%`, 'hi, thanks, etc.', 'Share that were just small talk — hi / thanks.'],
                ].map(([label, val, sub, tip]) => (
                  <div key={label} title={tip} className="rounded-xl border adm-border p-3">
                    <p className="text-[11px] font-medium adm-t3">{label}</p>
                    <p className="text-2xl font-bold adm-t1">{val}</p>
                    <p className="text-[11px] adm-t3">{sub}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide adm-t3">Which docs answer the most (last 1000 answers)</p>
              {topDocs.length === 0 ? <p className="text-sm adm-t3">No cited answers yet.</p> : (
                <div className="space-y-1.5">
                  {topDocs.map((d) => {
                    const max = topDocs[0].answers || 1;
                    return (
                      <div key={d.source_file} className="flex items-center gap-2">
                        <div className="w-40 shrink-0 truncate text-xs adm-t2" title={d.source_file}>{d.source_file.replace(/^docs\/help\//, '').replace(/\.md$/, '')}</div>
                        <div className="h-4 flex-1 rounded bg-[#1E1E1E]/5">
                          <div className="h-4 rounded bg-[#FE5100]" style={{ width: `${Math.round((d.answers / max) * 100)}%` }} />
                        </div>
                        <div className="w-8 shrink-0 text-right text-xs adm-t3">{d.answers}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )
      )}

      {tab === 'escalations' && (
        escSel ? (
          <div>
            <button onClick={() => setEscSel(null)} className="mb-3 text-sm font-medium text-[#FE5100]">← Back to list</button>
            {(() => {
              const e = escSel.escalation;
              const wa = e.phone ? `https://wa.me/${String(e.phone).replace(/[^\d]/g, '')}` : null;
              return (
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
              );
            })()}
          </div>
        ) : (
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
                          <span className="ml-auto text-xs adm-t3">{fmtDate(e.created_at)}</span>
                        </div>
                        <p className="text-sm adm-t1">{e.summary || '—'}</p>
                        <p className="mt-0.5 text-xs adm-t3">{e.contact_channel || '—'} · {e.email || e.phone || 'no contact'}</p>
                      </button>
                    ))}
                  </div>
                )}
          </>
        )
      )}

      {tab === 'cache' && (
        <>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm adm-t3">{cache.length} reused answers</p>
            {cache.length > 0 && <button onClick={() => evictCache('all')} title="Delete every saved answer. Refills from traffic." className="rounded-lg border adm-border px-2.5 py-1 text-xs text-red-600">Clear all</button>}
          </div>
          {loading ? <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-12" />)}</div>
            : cache.length === 0 ? <p className="text-sm adm-t3">No reused answers yet. Fills as questions get answered (needs the Voyage key live).</p>
              : (
                <div className="space-y-2">
                  {cache.map((c) => (
                    <div key={c.id} className="rounded-xl border adm-border p-3">
                      <div className="mb-1 flex items-center gap-2">
                        <Badge tone={c.hits > 0 ? 'ok' : 'neutral'} title="How many times this saved answer was reused.">used {c.hits} time{c.hits === 1 ? '' : 's'}</Badge>
                        <span className="flex-1 truncate text-sm adm-t1" title={c.question}>{c.question}</span>
                        <button onClick={() => evictCache(c.id)} title="Delete this one saved answer." className="rounded-lg border adm-border px-2 py-0.5 text-xs text-red-600">Remove</button>
                      </div>
                      <p className="text-xs adm-t3">{c.answer.slice(0, 160)}{c.answer.length > 160 ? '…' : ''}</p>
                    </div>
                  ))}
                </div>
              )}
        </>
      )}

      {tab === 'gaps' && (
        <>
          <div className="mb-3">
            <select value={gapStatus} onChange={(e) => setGapStatus(e.target.value)}
              title="Filter: to-do, done, or all questions." className="border adm-border rounded-lg px-3 py-1.5 text-sm">
              <option value="open">To do</option>
              <option value="resolved">Done</option>
              <option value="all">All</option>
            </select>
          </div>
          {loading ? <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-14" />)}</div>
            : gaps.length === 0 ? <p className="text-sm adm-t3">Nothing here — Bolt is answering everything.</p>
              : (
                <div className="space-y-2">
                  {gaps.map((g) => (
                    <div key={g.id} className="rounded-xl border adm-border p-3">
                      <div className="mb-1 flex items-center gap-2">
                        <Badge tone={REASON_TONE[g.reason] || 'neutral'} title={g.reason === 'thumbs_down' ? 'A user marked this answer unhelpful (👎).' : "Bolt couldn't answer and passed it to a human."}>{g.reason === 'thumbs_down' ? 'Answer Disliked' : 'Bolt Gave Up'}</Badge>
                        <span className="text-xs adm-t3">{fmtDate(g.created_at)}</span>
                        {g.resolved && <Badge tone="ok" title="Marked done — off the to-do list.">Done</Badge>}
                      </div>
                      <p className="text-sm adm-t1">
                        {g.question || (g.downvoted_answer ? <span className="adm-t2">Downvoted answer: “{g.downvoted_answer.slice(0, 160)}”</span> : <span className="adm-t3">—</span>)}
                      </p>
                      <div className="mt-2 flex gap-2">
                        {g.question && (
                          <button onClick={() => promote(g)} title="Turn this question into a saved answer (FAQ)." className="rounded-lg bg-[#FE5100] px-2.5 py-1 text-xs font-medium text-white">Make FAQ</button>
                        )}
                        <button onClick={() => resolveGap(g.id, !g.resolved)} title={g.resolved ? 'Put this back on the to-do list.' : 'Mark handled — remove from the to-do list.'} className="rounded-lg border adm-border px-2.5 py-1 text-xs adm-t2">
                          {g.resolved ? 'Reopen' : 'Mark done'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
        </>
      )}

      {tab === 'faqs' && (
        <>
          <div className="mb-3">
            <button onClick={() => setForm({ pattern: '', answer: '' })} title="Write a new saved answer Bolt sends word-for-word." className="rounded-lg bg-[#FE5100] px-3 py-1.5 text-sm font-medium text-white">+ Add FAQ</button>
          </div>

          {form && (
            <div className="mb-4 rounded-xl border adm-border p-3">
              <label className="mb-1 block text-xs font-semibold adm-t2">Trigger phrase (matched as a substring of the question)</label>
              <input value={form.pattern} onChange={(e) => setForm({ ...form, pattern: e.target.value })}
                placeholder="e.g. reset password" className="mb-3 w-full rounded-lg border adm-border px-3 py-2 text-sm" />
              <label className="mb-1 block text-xs font-semibold adm-t2">Answer (markdown; served verbatim, no model)</label>
              <textarea value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} rows={4}
                placeholder="Keep prices/policy OUT — link the docs instead so it can't go stale." className="mb-3 w-full rounded-lg border adm-border px-3 py-2 text-sm" />
              <div className="flex gap-2">
                <button onClick={saveFaq} className="rounded-lg bg-[#FE5100] px-3 py-1.5 text-sm font-medium text-white">{form.editingId ? 'Save' : 'Add'}</button>
                <button onClick={() => setForm(null)} className="rounded-lg border adm-border px-3 py-1.5 text-sm adm-t2">Cancel</button>
              </div>
            </div>
          )}

          {loading ? <div className="space-y-2">{[0, 1].map((i) => <Skeleton key={i} className="h-12" />)}</div>
            : faqs.length === 0 ? <p className="text-sm adm-t3">No FAQs yet. Add one, or promote a gap.</p>
              : (
                <div className="space-y-2">
                  {faqs.map((f) => (
                    <div key={f.id} className="rounded-xl border adm-border p-3">
                      <div className="mb-1 flex items-center gap-2">
                        <code className="rounded bg-[#FFF4EC] px-1.5 py-0.5 text-xs text-[#1E1E1E]">{f.pattern}</code>
                        <Badge tone={f.enabled ? 'ok' : 'neutral'} title={f.enabled ? 'Active — Bolt uses this answer.' : 'Paused — not in use, not deleted.'}>{f.enabled ? 'live' : 'off'}</Badge>
                      </div>
                      <p className="text-sm adm-t2">{f.answer.slice(0, 200)}{f.answer.length > 200 ? '…' : ''}</p>
                      <div className="mt-2 flex gap-2">
                        <button onClick={() => setForm({ pattern: f.pattern, answer: f.answer, editingId: f.id })} title="Edit this saved answer." className="rounded-lg border adm-border px-2.5 py-1 text-xs adm-t2">Edit</button>
                        <button onClick={() => toggleFaq(f)} title={f.enabled ? 'Pause this answer without deleting it.' : 'Turn this answer back on.'} className="rounded-lg border adm-border px-2.5 py-1 text-xs adm-t2">{f.enabled ? 'Disable' : 'Enable'}</button>
                        <button onClick={() => deleteFaq(f)} title="Delete this saved answer for good." className="rounded-lg border adm-border px-2.5 py-1 text-xs text-red-600">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
        </>
      )}
    </div>
  );
}
