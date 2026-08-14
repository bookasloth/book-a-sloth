/**
 * OpeningTakeover.jsx — site-wide "The Opening" overlay.
 *
 * During the launch window, the ceremony appears full-screen over ANY public page,
 * once per device, for everyone. It stays out of auth / app / checkout flows, and
 * the "acted" flag is set only when the visitor places a stone or explicitly
 * closes it — a stray reload gives another chance.
 *
 * Mounted once at the app root. Server /status is the source of truth for the
 * window; the result is cached in sessionStorage so it's one cheap call per tab.
 */
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import OpeningCeremony from './OpeningCeremony';
import { getOpeningStatus } from '../../services/opening';
import '../../styles/opening.css';

const ACTED_KEY = 'opening_acted_v1';
const CACHE_KEY = 'opening_status_v1';
const CACHE_TTL = 5 * 60 * 1000;

// Routes where the takeover must NOT appear (auth / app / checkout / the event's own pages).
const SUPPRESS_PREFIXES = [
  '/login', '/login-as-vendor', '/forgot-password', '/reset-password', '/signin', '/signup',
  '/be-a-sloth', '/vendor-register', '/onboarding', '/auth', '/hello-sloth',
  '/dashboard', '/admin', '/super-dashboard', '/user', '/manage-booking',
  '/opening', '/inaugurators', '/og',
];
const isSuppressed = (path) => {
  if (SUPPRESS_PREFIXES.some((p) => path === p || path.startsWith(p + '/'))) return true;
  if (/^\/[^/]+\/booking\/[^/]+\/?$/.test(path)) return true; // guest booking checkout
  return false;
};

async function fetchStatusCached() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (raw) {
      const { data, at } = JSON.parse(raw);
      if (Date.now() - at < CACHE_TTL) return data;
    }
  } catch { /* ignore */ }
  const data = await getOpeningStatus();
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, at: Date.now() })); } catch { /* ignore */ }
  return data;
}

export default function OpeningTakeover() {
  const { pathname } = useLocation();
  const [status, setStatus] = useState(null);
  const [show, setShow] = useState(false);

  const acted = (() => { try { return localStorage.getItem(ACTED_KEY) === '1'; } catch { return false; } })();
  const eligible = !acted && !isSuppressed(pathname);

  useEffect(() => {
    if (!eligible) return;
    let alive = true;
    fetchStatusCached()
      .then((s) => { if (alive && s?.open) { setStatus(s); setShow(true); } })
      .catch(() => {});
    return () => { alive = false; };
    // re-check when navigating to a newly-eligible page
  }, [eligible, pathname]);

  if (!show || !status) return null;

  const exit = (reason) => {
    if (reason === 'placed' || reason === 'skip') {
      try { localStorage.setItem(ACTED_KEY, '1'); } catch { /* ignore */ }
    }
    setShow(false);
  };

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-ink" role="dialog" aria-modal="true" aria-label="The Opening">
      <OpeningCeremony status={status} embedded onExit={exit} />
    </div>
  );
}
