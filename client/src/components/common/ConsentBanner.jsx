// Marketing-consent banner (India DPDP / GDPR). Shown until the user accepts or
// declines. Accept → GA4/Pixel/Clarity load; decline → they never load. PostHog
// (first-party product analytics) runs regardless and is not gated here.
import { useState } from 'react';
import { analytics } from '../../services/analytics';

export default function ConsentBanner() {
  const [decided, setDecided] = useState(() => analytics.hasDecided());

  if (decided) return null;

  const choose = (granted) => {
    analytics.setConsent(granted);
    setDecided(true);
  };

  return (
    <div
      role="dialog"
      aria-label="Cookie and analytics consent"
      className="fixed z-[9999] bottom-5 right-5 max-[600px]:bottom-2.5 max-[600px]:right-2.5 max-[600px]:max-w-[90%] max-w-[380px] flex flex-col items-center gap-4 rounded-2xl bg-[whitesmoke] px-5 pt-5 pb-4 text-[#252525] shadow-[0_4px_20px_rgba(0,0,0,0.35)]"
    >
      {/* Cookie pops above the card via negative top margin */}
      <div className="-mt-16 mb-[-20px] drop-shadow">
        <img src="/cookie.svg" alt="" className="h-auto w-28" />
      </div>

      <div className="text-center leading-relaxed">
        <h4 className="mb-1.5 text-base font-semibold">This site uses cookies 🍪</h4>
        <p className="text-xs text-gray-600">
          We use cookies for analytics &amp; marketing. Essential analytics always
          run — you can decline marketing &amp; ad cookies.
        </p>
      </div>

      <div className="mt-1 flex flex-wrap justify-center gap-2.5">
        <button
          type="button"
          onClick={() => choose(true)}
          className="rounded-[4px] border-2 border-current bg-[whitesmoke] px-3.5 py-2 text-sm text-[#4caf50] transition-all duration-300 hover:bg-[#0f0f0f]"
        >
          Agree
        </button>
        <button
          type="button"
          onClick={() => choose(false)}
          className="rounded-[4px] border-2 border-current bg-[whitesmoke] px-3.5 py-2 text-sm text-[#f44336] transition-all duration-300 hover:bg-[#d32f2f] hover:text-[#0f0f0f]"
        >
          Disagree
        </button>
        <a
          href="/privacy"
          className="rounded-[4px] border-2 border-current bg-[whitesmoke] px-3.5 py-2 text-sm text-[#2196f3] no-underline transition-all duration-300 hover:bg-[#1976d2] hover:text-[#0f0f0f]"
        >
          Learn More
        </a>
      </div>
    </div>
  );
}
