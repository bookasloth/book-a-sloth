import { useEffect, useRef, useState } from 'react';
import { getHostProfile } from '../../services/api';
import { FALLBACK_HOST } from './demoData';

const DEFAULT_USERNAME = 'sndatarkar';
const TIMEOUT_MS = 2500;

// Never throws. First render returns FALLBACK_HOST so paint is never blank;
// swaps to live data only if the fetch succeeds with usable services.
export function usePresentationHost(username = DEFAULT_USERNAME) {
  const [state, setState] = useState({ host: FALLBACK_HOST, loading: true, source: 'fallback' });
  const done = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => { if (!done.current) { done.current = true; setState((s) => ({ ...s, loading: false })); } }, TIMEOUT_MS);
    getHostProfile(username)
      .then(({ data }) => {
        if (done.current) return;
        const services = Array.isArray(data?.services) ? data.services : [];
        if (!data || services.length === 0) return; // keep fallback
        done.current = true;
        setState({ host: { ...data, services }, loading: false, source: 'live' });
      })
      .catch(() => {}) // swallow: fallback stays
      .finally(() => { if (!done.current) { done.current = true; setState((s) => ({ ...s, loading: false })); } clearTimeout(timer); });
    return () => clearTimeout(timer);
  }, [username]);

  return { host: state.host, services: state.host.services || [], loading: state.loading, source: state.source };
}
