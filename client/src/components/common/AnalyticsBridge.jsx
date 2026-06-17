// AnalyticsBridge — boots the analytics bus once and emits a page view on every
// SPA route change. Renders nothing. Mount once inside <BrowserRouter>.
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { analytics, initAnalytics } from '../../services/analytics';
import { EVENTS } from '../../services/analytics/events';

export default function AnalyticsBridge() {
  const { pathname, search } = useLocation();
  const booted = useRef(false);

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    initAnalytics();
  }, []);

  useEffect(() => {
    const path = pathname + search;
    analytics.page({ path });
    analytics.track(EVENTS.PAGE_VIEWED, { path });
  }, [pathname, search]);

  return null;
}
