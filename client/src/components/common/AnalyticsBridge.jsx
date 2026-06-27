// AnalyticsBridge — boots the analytics bus once and emits a page view on every
// SPA route change. Renders nothing. Mount once inside <BrowserRouter>.
//
// The bus is booted on first idle (not at mount) so the PostHog SDK download +
// init never competes with first paint. Page views fired before boot are queued by
// the PostHog adapter and flushed once it loads, so nothing is lost.
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { analytics, initAnalytics } from '../../services/analytics';
import { EVENTS } from '../../services/analytics/events';
import useIdle from '../../hooks/useIdle';

export default function AnalyticsBridge() {
  const { pathname, search } = useLocation();

  useIdle(() => initAnalytics());

  useEffect(() => {
    const path = pathname + search;
    analytics.page({ path });
    analytics.track(EVENTS.PAGE_VIEWED, { path });
  }, [pathname, search]);

  return null;
}
