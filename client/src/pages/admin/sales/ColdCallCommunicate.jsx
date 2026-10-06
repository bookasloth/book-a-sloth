// The follow-up window: WhatsApp + email side by side for one lead. Opens after a
// call is saved (pre-picked for the outcome) or from the Communicate button.
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Btn, Badge } from '../../../components/admin/ui';
import { crmColdCallSend, crmUpdateTemplate } from '../../../services/api';
import { Chips } from './ccUi';
import { MESSAGE_SETS, previewText, sendResultMessage, formatPhone, outcomeLabel } from './coldCallUtils';

const VALID_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const whenText = (iso) => (iso ? new Date(iso).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '');

function Column({ title, tpl, on, setOn, disabledReason, category, setCategory, templates, channel, children, preview, onApprove }) {
  const options = MESSAGE_SETS.filter((m) => templates.some((t) => t.channel === channel && t.category === m.category));
  const pending = channel === 'whatsapp' && tpl && !tpl.is_active;
  return (
    <section className="flex-1 min-w-[280px] rounded-2xl border adm-border p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <label className="flex items-center gap-2.5 font-bold adm-t1 text-[15px]">
          <input type="checkbox" className="!w-[18px] !h-[18px] !min-h-0 !p-0 accent-[#FE5100] shrink-0" checked={on} disabled={!!disabledReason}
            onChange={(e) => setOn(e.target.checked)} />
          {title}
        </label>
        {pending ? <span className="flex items-center gap-1"><Badge tone="warn">Waiting for Meta approval</Badge><Btn size="sm" variant="ghost" onClick={() => onApprove(tpl)}>Mark approved</Btn></span>
          : tpl ? <Badge tone="ok">{channel === 'whatsapp' ? 'Approved' : 'Ready'}</Badge> : <Badge tone="neutral">No template</Badge>}
      </div>
      {children}
      <label className="block">
        <span className="text-[11px] font-semibold uppercase tracking-wide adm-t3">Message</span>
        <select className="fb-input text-sm w-full mt-1" value={category} onChange={(e) => setCategory(e.target.value)} aria-label={`${title} message`}>
          {options.map((m) => <option key={m.category} value={m.category}>{m.label}</option>)}
        </select>
      </label>
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wide adm-t3 mb-1">Preview</div>
        {tpl ? (
          <div className={`rounded-xl p-3 text-[13px] leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto ${channel === 'whatsapp' ? 'bg-[#e7f8e1] text-[#111827]' : 'adm-card adm-t2'}`}>
            {preview}
          </div>
        ) : <div className="text-[12.5px] adm-t3">No {title} template for this message.</div>}
      </div>
      {disabledReason && <div className="text-[12px] text-amber-600">{disabledReason}</div>}
    </section>
  );
}

export default function ColdCallCommunicate({ lead, templates, initialCategory, callbackAt, savedOutcome, afterSave, onClose, onDone, onTemplatesChanged }) {
  const [emailCat, setEmailCat] = useState(initialCategory);
  const [waCat, setWaCat] = useState(initialCategory);
  const [toEmail, setToEmail] = useState(lead.email || '');
  const emailTpl = templates.find((t) => t.channel === 'email' && t.category === emailCat);
  const waTpl = templates.find((t) => t.channel === 'whatsapp' && t.category === waCat);
  const emailOk = VALID_EMAIL.test(toEmail.trim());
  const waOk = /\d{10}/.test(String(lead.whatsapp_phone || lead.phone || '').replace(/\D/g, ''));
  const [sendEmail, setSendEmail] = useState(!!(emailTpl?.is_active && emailOk));
  const [sendWa, setSendWa] = useState(!!(waTpl?.is_active && waOk));
  const [busy, setBusy] = useState(false);

  const pickAll = (cat) => {
    setEmailCat(cat); setWaCat(cat);
    const e = templates.find((t) => t.channel === 'email' && t.category === cat);
    const w = templates.find((t) => t.channel === 'whatsapp' && t.category === cat);
    setSendEmail(!!(e?.is_active && emailOk)); setSendWa(!!(w?.is_active && waOk));
  };

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const business = lead.business_name || lead.name || '';
  const ctx = { business, callbackTime: whenText(callbackAt) };
  const count = (sendEmail ? 1 : 0) + (sendWa ? 1 : 0);

  const approve = async (tpl) => {
    try { await crmUpdateTemplate(tpl.id, { is_active: true }); toast.success('Marked approved'); onTemplatesChanged?.(); }
    catch (e) { toast.error(e.response?.data?.message || 'Could not update template'); }
  };

  const send = async (thenNext) => {
    if (!count || busy) return;
    setBusy(true);
    try {
      const { data } = await crmColdCallSend(lead.id, {
        email: sendEmail ? { category: emailCat } : null,
        whatsapp: sendWa ? { category: waCat } : null,
        callbackAt: callbackAt || null,
        toEmail: sendEmail && toEmail.trim() !== (lead.email || '') ? toEmail.trim() : undefined,
      });
      for (const [ch, r] of Object.entries(data?.sends || {})) {
        const m = sendResultMessage(ch, r);
        if (m.kind === 'success') toast.success(m.text); else if (m.kind === 'info') toast(m.text); else toast.error(m.text);
      }
      onDone(thenNext);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not send');
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/45 p-4 overflow-y-auto" role="dialog" aria-modal="true" aria-label="Send follow-up">
      <div className="adm-card rounded-2xl w-full max-w-[1080px] my-8 shadow-2xl">
        <div className="flex items-start justify-between gap-4 p-5 border-b adm-border">
          <div className="min-w-0">
            {savedOutcome && <div className="flex flex-wrap gap-2 mb-2"><Badge tone="ok">✓ Call saved</Badge><Badge tone="warn">Outcome: {outcomeLabel(savedOutcome)}</Badge></div>}
            <h2 className="text-[20px] font-bold adm-t1" style={{ fontFamily: "'Plus Jakarta Sans',Poppins,sans-serif" }}>Send follow-up to {business || 'this lead'}</h2>
            <p className="text-[13px] adm-t3">{savedOutcome ? 'The message for this outcome is already picked. Change it or untick a channel, then send.' : 'Pick a message for each channel and send.'}</p>
          </div>
          <Btn size="sm" variant="ghost" onClick={onClose} aria-label="Close">✕</Btn>
        </div>

        <div className="px-5 pt-4 flex flex-wrap items-center gap-3">
          <span className="text-[12.5px] adm-t3">Message for:</span>
          <Chips label="Message set" value={emailCat === waCat ? emailCat : ''} onChange={pickAll}
            options={MESSAGE_SETS.map((m) => ({ value: m.category, label: m.label }))} />
        </div>

        <div className="flex flex-wrap gap-4 p-5">
          <Column title="WhatsApp" channel="whatsapp" tpl={waTpl} templates={templates} on={sendWa} setOn={setSendWa}
            category={waCat} setCategory={setWaCat} onApprove={approve}
            disabledReason={!waOk ? 'No valid WhatsApp number' : waTpl && !waTpl.is_active ? 'Sends once you mark this template approved' : !waTpl ? 'No template' : ''}
            preview={previewText(waTpl?.body, ctx)}>
            <div className="text-[13px] adm-t2">To: <span className="font-semibold adm-t1">{formatPhone(lead.whatsapp_phone || lead.phone)}</span></div>
          </Column>
          <Column title="Email" channel="email" tpl={emailTpl} templates={templates} on={sendEmail} setOn={setSendEmail}
            category={emailCat} setCategory={setEmailCat} onApprove={approve}
            disabledReason={!emailOk ? 'Type their email to send (it is saved to the lead)' : !emailTpl ? 'No template' : ''}
            preview={emailTpl ? `${previewText(emailTpl.subject, ctx)}\n\n${previewText(emailTpl.body, ctx)}` : ''}>
            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-wide adm-t3">To</span>
              <input className="fb-input text-sm w-full mt-1" type="email" placeholder="name@business.com" value={toEmail}
                onChange={(e) => { setToEmail(e.target.value); if (VALID_EMAIL.test(e.target.value.trim()) && emailTpl?.is_active) setSendEmail(true); }} />
            </label>
            <div className="text-[12px] adm-t3">From: Shubham (founder)</div>
          </Column>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-t adm-border">
          <span className="text-[12px] adm-t3">Goes out now (you just spoke, so quiet hours don't apply). Logged on the lead.</span>
          <div className="flex flex-wrap gap-2">
            <Btn variant="outline" onClick={() => onDone(afterSave)}>{afterSave ? 'Skip & next lead' : 'Cancel'}</Btn>
            {afterSave && <Btn variant="outline" disabled={!count || busy} onClick={() => send(false)}>Send only</Btn>}
            <Btn disabled={!count || busy} onClick={() => send(afterSave)}>
              {busy ? 'Sending…' : `Send${count ? ` ${count}` : ''}${afterSave ? ' & next lead →' : ''}`}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}
