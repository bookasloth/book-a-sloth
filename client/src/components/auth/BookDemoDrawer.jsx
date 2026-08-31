import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { sendBeASlothOtp, submitBeASlothLead } from '../../services/api';

// "Book a Demo" panel for /be-a-sloth. Slides UP from the bottom of the signup
// card and fills it exactly (rendered as an absolute overlay inside the card,
// which is position:relative + overflow-hidden). Captures a verified inbound lead:
// Name + Phone + Profession, phone confirmed by WhatsApp OTP. On success the server
// creates a CRM lead (source 'website') via the shared ingestion layer — the same
// pipeline as Meta Lead Ads. No account is created here; sales works the lead.
const EMPTY = { name: '', phone: '', profession: '', company_hp: '' };

const inputCls =
  'w-full rounded-[6px] border border-black/10 bg-white px-3.5 py-2.5 text-sm text-ink ' +
  'outline-none transition-colors focus:border-primary-cta focus:ring-2 focus:ring-primary-cta/20';

export default function BookDemoDrawer({ open, onClose }) {
  const [step, setStep] = useState('form');   // 'form' | 'otp' | 'done'
  const [form, setForm] = useState(EMPTY);
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);

  const close = useCallback(() => { if (!busy) onClose(); }, [busy, onClose]);

  // Reset after the slide-out finishes so it isn't visible mid-animation.
  useEffect(() => {
    if (open) return undefined;
    const t = setTimeout(() => { setStep('form'); setForm(EMPTY); setOtp(''); }, 300);
    return () => clearTimeout(t);
  }, [open]);

  // Esc closes the panel.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close]);

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.profession.trim()) {
      toast.error('Please fill in all fields.');
      return;
    }
    setBusy(true);
    try {
      await sendBeASlothOtp({ phone: form.phone, name: form.name, profession: form.profession });
      setStep('otp');
      toast.success('Code sent on WhatsApp');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send the code. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (otp.trim().length < 4) {
      toast.error('Enter the code we sent on WhatsApp.');
      return;
    }
    setBusy(true);
    try {
      await submitBeASlothLead({
        name: form.name, phone: form.phone, profession: form.profession,
        otp: otp.trim(), company_hp: form.company_hp,
      });
      setStep('done');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not verify. Check the code and try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Book a demo"
      aria-hidden={!open}
      className={`absolute inset-0 z-20 flex flex-col bg-white text-left transition-transform duration-300 ease-out ${
        open ? 'translate-y-0' : 'pointer-events-none translate-y-full'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between border-b border-black/5 px-6 py-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-cta">Book a demo</p>
          <h2 className="mt-0.5 font-heading text-lg font-bold tracking-tight text-ink">
            See Book A Sloth in action
          </h2>
        </div>
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="rounded-[6px] p-1.5 text-gray-400 transition-colors hover:bg-black/5 hover:text-ink"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {step === 'form' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <p className="text-sm leading-relaxed text-gray-500">
              Leave your details and our team will walk you through a personalised demo.
            </p>

            <div>
              <label htmlFor="bd-name" className="mb-1.5 block text-xs font-semibold text-gray-600">Your name</label>
              <input id="bd-name" type="text" autoComplete="name" value={form.name} onChange={update('name')} className={inputCls} placeholder="e.g. Aditi Sharma" />
            </div>

            <div>
              <label htmlFor="bd-phone" className="mb-1.5 block text-xs font-semibold text-gray-600">WhatsApp number</label>
              <input id="bd-phone" type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={update('phone')} className={inputCls} placeholder="10-digit mobile number" />
              <p className="mt-1 text-[11px] text-gray-400">We’ll send a verification code on WhatsApp.</p>
            </div>

            <div>
              <label htmlFor="bd-profession" className="mb-1.5 block text-xs font-semibold text-gray-600">What do you do?</label>
              <input id="bd-profession" type="text" value={form.profession} onChange={update('profession')} className={inputCls} placeholder="e.g. Coach, tutor, consultant" />
            </div>

            {/* Honeypot — humans never see or fill it; server drops non-empty. */}
            <input
              type="text" tabIndex={-1} autoComplete="off" value={form.company_hp} onChange={update('company_hp')}
              name="company_hp" aria-hidden="true"
              className="h-0 w-0 opacity-0" style={{ position: 'absolute', left: '-9999px' }}
            />

            <button
              type="submit"
              disabled={busy}
              className="btn mt-2 flex w-full items-center justify-center gap-2 rounded-[6px] border-2 border-primary-cta bg-primary-cta py-3 text-sm font-semibold text-white transition-colors hover:bg-black hover:text-primary-cta disabled:opacity-50"
            >
              {busy ? 'Sending code…' : 'Book A Demo'}
            </button>

            {/* Secondary, low-emphasis: try the real product live (opens in a new tab). */}
            <a
              href="https://bookasloth.com/sndatarkar/booking/book-a-sloth-app-online-demo-30-min-advisory-session"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 block w-full text-center text-xs font-medium text-gray-400 underline decoration-gray-300 underline-offset-2 transition-colors hover:text-ink"
            >
              Experience live booking →
            </a>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerify} className="space-y-4">
            <p className="text-sm leading-relaxed text-gray-500">
              Enter the code we sent on WhatsApp to <span className="font-semibold text-ink">{form.phone}</span>.
            </p>

            <div>
              <label htmlFor="bd-otp" className="mb-1.5 block text-xs font-semibold text-gray-600">Verification code</label>
              <input
                id="bd-otp" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6}
                value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className={`${inputCls} tracking-[0.4em]`} placeholder="6-digit code" autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={busy}
              className="btn flex w-full items-center justify-center gap-2 rounded-[6px] border-2 border-primary-cta bg-primary-cta py-3 text-sm font-semibold text-white transition-colors hover:bg-black hover:text-primary-cta disabled:opacity-50"
            >
              {busy ? 'Verifying…' : 'Verify & book demo'}
            </button>

            <button
              type="button"
              onClick={() => { setStep('form'); setOtp(''); }}
              disabled={busy}
              className="w-full text-center text-xs font-medium text-gray-400 hover:text-ink disabled:opacity-50"
            >
              ← Change details
            </button>
          </form>
        )}

        {step === 'done' && (
          <div className="flex h-full flex-col items-center justify-center py-6 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-c-emerald/10 text-c-emerald">
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
            </span>
            <h3 className="mt-4 font-heading text-lg font-bold text-ink">You’re on the list!</h3>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-gray-500">
              Thanks, {form.name.split(' ')[0] || 'there'}. Our team will reach out on WhatsApp to set up your demo.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="btn mt-6 rounded-[6px] border-2 border-ink bg-ink px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
