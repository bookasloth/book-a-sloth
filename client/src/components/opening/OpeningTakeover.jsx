/**
 * OpeningTakeover.jsx — "The Opening" overlay, homepage only.
 *
 * During the launch window the ceremony appears full-screen over the HOMEPAGE (/)
 * for everyone. It keeps re-appearing on each visit/reload of the homepage until it
 * has been shown MAX_SHOWS times on this device — regardless of whether a stone was
 * placed. Every appearance that ends (placed OR closed) counts as one show, so a
 * hesitant visitor gets nudged again instead of losing the moment after one dismissal.
 *
 * Mounted once at the app root; it self-gates to the homepage. Server /status is the
 * source of truth for the window; the result is cached in sessionStorage.
 */
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import OpeningCeremony from './OpeningCeremony';
import { getOpeningStatus } from '../../services/opening';
import '../../styles/opening.css';

const SHOWS_KEY = 'opening_shows_v1';   // count of times shown-and-dismissed on this device
const MAX_SHOWS = 10;                   // keep re-showing on the homepage until this many
const CACHE_KEY = 'opening_status_v1';
const CACHE_TTL = 5 * 60 * 1000;

const readInt = (k) => { try { return parseInt(localStorage.getItem(k), 10) || 0; } catch { return 0; } };

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

  // Homepage only, until this device has seen it MAX_SHOWS times. Recomputed each render.
  const eligible = pathname === '/' && readInt(SHOWS_KEY) < MAX_SHOWS;

  useEffect(() => {
    if (!eligible) return;
    let alive = true;
    fetchStatusCached()
      .then((s) => { if (alive && s?.open) { setStatus(s); setShow(true); } })
      .catch(() => {});
    return () => { alive = false; };
    // re-check when navigating back to the homepage
  }, [eligible, pathname]);

  if (!show || !status) return null;

  // Any dismissal — placing a stone or closing — consumes one of the MAX_SHOWS.
  const exit = () => {
    try { localStorage.setItem(SHOWS_KEY, String(readInt(SHOWS_KEY) + 1)); } catch { /* ignore */ }
    setShow(false);
  };

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-ink" role="dialog" aria-modal="true" aria-label="The Opening">
      <OpeningCeremony status={status} embedded onExit={exit} />
    </div>
  );
}
