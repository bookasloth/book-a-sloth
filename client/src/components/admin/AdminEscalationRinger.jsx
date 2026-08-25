// Mounted once in AdminLayout — so ANY open admin dashboard reacts. Subscribes to
// the `support:admin` station channel and, on a new escalation, rings a phone-like
// tone, pops a persistent "Open" toast, and flashes the tab title. The ring is
// synthesized with the WebAudio API (no audio asset to ship or host) and only
// plays once the browser has unlocked audio on a user gesture — otherwise the
// visual toast + title flash still fire, never a silent miss.
import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { getSupabase } from '../../services/supabaseClient';

const RING_EVERY_MS = 3000;
const RING_CAP_MS = 30000; // never ring longer than this for one escalation

export default function AdminEscalationRinger() {
  const navigate = useNavigate();
  const ctxRef = useRef(null);
  const ringTimer = useRef(null);
  const titleTimer = useRef(null);
  const capTimer = useRef(null);
  const origTitle = useRef(null);

  // Autoplay policy: an AudioContext can only make sound after a user gesture.
  // Create/resume it on the first interaction so it's unlocked by the time an
  // escalation arrives (an admin using the console has already clicked).
  useEffect(() => {
    const unlock = () => {
      try {
        if (!ctxRef.current) {
          const AC = window.AudioContext || window.webkitAudioContext;
          if (AC) ctxRef.current = new AC();
        }
        ctxRef.current?.resume?.();
      } catch { /* audio unavailable — visual only */ }
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  const beep = (ctx, at, freq) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.3, at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.4);
    osc.connect(gain).connect(ctx.destination);
    osc.start(at);
    osc.stop(at + 0.42);
  };

  // One two-tone warble (like a desk phone). No-op if audio is still locked.
  const playRing = () => {
    const ctx = ctxRef.current;
    if (!ctx || ctx.state !== 'running') return;
    const t = ctx.currentTime;
    beep(ctx, t, 480);
    beep(ctx, t + 0.5, 620);
  };

  const stopRing = () => {
    [ringTimer, titleTimer, capTimer].forEach((r) => { if (r.current) { clearInterval(r.current); clearTimeout(r.current); r.current = null; } });
    if (origTitle.current != null) { document.title = origTitle.current; origTitle.current = null; }
  };

  const startRing = () => {
    stopRing();
    playRing();
    ringTimer.current = setInterval(playRing, RING_EVERY_MS);
    // Flash the tab title so a backgrounded console still gets noticed.
    origTitle.current = document.title;
    let on = false;
    titleTimer.current = setInterval(() => {
      on = !on;
      document.title = on ? '🔴 Support needed' : (origTitle.current || 'Book A Sloth');
    }, 1000);
    capTimer.current = setTimeout(stopRing, RING_CAP_MS);
  };

  useEffect(() => {
    let cancelled = false;
    let chan = null;
    (async () => {
      const sb = await getSupabase();
      if (cancelled) return;
      chan = sb
        .channel('support:admin')
        .on('broadcast', { event: 'escalation' }, ({ payload }) => {
          startRing();
          const ref = payload?.reference || 'a customer';
          const who = payload?.participant_type === 'host' ? 'Host' : 'Guest';
          toast((tt) => (
            <span className="flex items-center gap-3">
              <span>🚨 New escalation — <b>{ref}</b> ({who})</span>
              <button
                onClick={() => { stopRing(); toast.dismiss(tt.id); navigate('/admin/support/chat'); }}
                className="rounded bg-[#FE5100] px-2 py-1 text-xs font-semibold text-white">
                Open
              </button>
            </span>
          ), { duration: RING_CAP_MS, id: `esc-${payload?.thread_id || ref}` });
        })
        .subscribe();
    })();
    return () => {
      cancelled = true;
      stopRing();
      if (chan) getSupabase().then((sb) => sb.removeChannel(chan)).catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  return null;
}
