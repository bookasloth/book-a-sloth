import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Resets scroll to the top on every route (pathname) change.
 *
 * React Router v6 does NOT restore/reset scroll between routes, so navigating
 * from a link near the bottom of one page lands the next page already scrolled
 * down (it looks like you arrive at the footer). This mounts once inside the
 * Router and fixes it app-wide.
 *
 * - Only fires on PATHNAME change — an in-page #hash link still scrolls to its
 *   anchor instead of being yanked to the top.
 * - useLayoutEffect runs before paint, so there's no visible jump.
 * - Resets window + Lenis-managed scroll height (some pages run Lenis smooth
 *   scroll; see hooks/useLenis.js).
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useLayoutEffect(() => {
    if (hash) return; // let anchor links resolve to their target
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname, hash]);

  return null;
}
