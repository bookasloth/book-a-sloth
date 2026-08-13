/**
 * RibbonCut.jsx — the interaction. A golden ribbon stretched across the stage
 * with scissors resting on it. Drag the scissors along the ribbon (mouse or
 * finger); cross ~70% of its width and it snips — halves whip away, haptic buzz.
 *
 * One-shot: fires onCut() once. Keyboard/reduced-motion accessible via a plain
 * button fallback so nobody is trapped behind a drag gesture.
 */
import { useRef, useState } from 'react';
import { Scissors } from 'lucide-react';

const THRESHOLD = 0.7;

export default function RibbonCut({ onCut }) {
  const barRef = useRef(null);
  const [progress, setProgress] = useState(0); // 0..1 along the ribbon
  const [cut, setCut] = useState(false);
  const dragging = useRef(false);

  const doCut = () => {
    if (cut) return;
    setCut(true);
    setProgress(1);
    navigator.vibrate?.(60);
    onCut?.();
  };

  const moveTo = (clientX) => {
    const bar = barRef.current;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    setProgress(p);
    if (p >= THRESHOLD) doCut();
  };

  const onDown = (e) => { dragging.current = true; e.currentTarget.setPointerCapture?.(e.pointerId); };
  const onMove = (e) => { if (dragging.current) moveTo(e.clientX); };
  const onUp = () => { dragging.current = false; if (!cut) setProgress(0); }; // snap back if not cut

  return (
    <div className="w-full max-w-xl select-none text-center">
      <div
        ref={barRef}
        className={`opening-ribbon relative mx-auto h-10 w-full ${cut ? 'opening-ribbon--cut' : ''}`}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        role="slider"
        aria-label="Drag the scissors across the ribbon to cut it"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); doCut(); } }}
      >
        {/* left half */}
        <span
          className="absolute top-1/2 left-0 h-6 -translate-y-1/2 rounded-sm bg-gradient-to-b from-[#ffd76a] to-[#e0a80f] shadow"
          style={{
            width: `${(cut ? 0.5 : Math.max(progress, 0.001)) * 100}%`,
            transform: cut ? 'translateY(-50%) translateX(-60%) rotate(-8deg)' : 'translateY(-50%)',
            transition: cut ? 'transform 0.7s cubic-bezier(0.7,0,0.2,1)' : 'none',
          }}
        />
        {/* right half */}
        <span
          className="absolute top-1/2 right-0 h-6 -translate-y-1/2 rounded-sm bg-gradient-to-b from-[#ffd76a] to-[#e0a80f] shadow"
          style={{
            width: `${(cut ? 0.5 : Math.max(1 - progress, 0.001)) * 100}%`,
            transform: cut ? 'translateY(-50%) translateX(60%) rotate(8deg)' : 'translateY(-50%)',
            transition: cut ? 'transform 0.7s cubic-bezier(0.7,0,0.2,1)' : 'none',
          }}
        />
        {/* scissors follow the drag */}
        {!cut && (
          <span
            className="absolute top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-2 text-[#b8860b] shadow-lg"
            style={{ left: `calc(${progress * 100}% - 18px)` }}
          >
            <Scissors size={20} />
          </span>
        )}
      </div>

      {!cut && (
        <p className="mt-4 text-sm text-white/70">
          Drag the scissors across the ribbon to open the doors.
        </p>
      )}
    </div>
  );
}
