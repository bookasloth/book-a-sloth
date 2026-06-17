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
      className="fixed bottom-0 inset-x-0 z-[9999] bg-white border-t border-gray-200 shadow-lg"
    >
      <div className="max-w-4xl mx-auto px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
        <p className="text-sm text-gray-700 flex-1">
          We use cookies for analytics and to improve marketing. Essential product
          analytics always run; you can decline marketing & ad cookies.{' '}
          <a href="/privacy" className="text-[#FE5100] underline">Learn more</a>.
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={() => choose(false)}
            className="px-4 py-2 text-sm rounded-[4px] border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => choose(true)}
            className="px-4 py-2 text-sm rounded-[4px] bg-[#FE5100] text-white hover:opacity-90"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
