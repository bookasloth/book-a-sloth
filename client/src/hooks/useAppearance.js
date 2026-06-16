import { useEffect, useState } from "react";
import { getAppearance } from "../services/api";

/**
 * useAppearance — active navbar logo config (mode + image URLs).
 *
 * Reads a cached value from localStorage for an instant, flash-free first paint,
 * then revalidates from GET /api/appearance in the background. Falls back to
 * sensible defaults so the navbar always has something to render even offline.
 */

const CACHE_KEY = "bas_appearance";

const DEFAULTS = {
  navbar_logo_mode: "icon_text",
  icon_url: "https://company-assets.bookasloth.in/images/email/sloth-icon-sqr.png",
  logo_image_url: "",
  festive_logo_url: "",
};

const readCache = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch (_) {
    return DEFAULTS;
  }
};

export default function useAppearance() {
  const [appearance, setAppearance] = useState(readCache);

  useEffect(() => {
    let alive = true;
    getAppearance()
      .then(({ data }) => {
        if (!alive || !data) return;
        const next = { ...DEFAULTS, ...data };
        setAppearance(next);
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(next));
        } catch (_) { /* ignore quota / private mode */ }
      })
      .catch(() => { /* keep cached/defaults */ });
    return () => { alive = false; };
  }, []);

  return appearance;
}

export { DEFAULTS };
