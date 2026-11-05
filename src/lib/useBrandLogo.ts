import { useCallback, useEffect, useMemo, useState } from 'react';

/**
 * Resolves which logo to render in the header/footer so the FINAL logo is shown
 * from the very first paint (no default-SVG -> uploaded-logo swap, no resize).
 *
 * Until the CMS settings have loaded we use, in order:
 *   1. the last logo seen on this device (localStorage), then
 *   2. the bundled current company logo (DEFAULT_LOGO).
 * Once settings arrive the live values win and are cached for the next visit.
 * The default SVG is only used if the CMS really has no uploaded logo.
 */

// Same file/scale/ratio that the CMS currently serves (site_settings.logo_url).
export const DEFAULT_LOGO = {
  url: 'https://qlvainogsjashyaryjao.supabase.co/storage/v1/object/public/images/uploads/1780054539457-1dc75u7voig.png',
  scale: 2.9,
  ratio: 2, // 1500x750
};

const KEY = 'fj_brand_logo_v1';

interface Cached { url: string; scale: number; ratio: number }

function readCache(): Cached | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const c = JSON.parse(raw);
    if (typeof c?.url === 'string' && c.scale > 0 && c.ratio > 0) return c;
  } catch { /* ignore */ }
  return null;
}

function writeCache(c: Cached) {
  try { localStorage.setItem(KEY, JSON.stringify(c)); } catch { /* ignore */ }
}

export function useBrandLogo(settings: any) {
  const cached = useMemo(readCache, []);
  const [measuredRatio, setMeasuredRatio] = useState<{ url: string; ratio: number } | null>(null);

  const loaded = !!settings;
  const url: string = loaded ? (settings.logo_url || '') : (cached?.url ?? DEFAULT_LOGO.url);
  const scale: number = loaded
    ? (parseFloat(settings.logo_scale || '1') || 1)
    : (cached?.scale ?? DEFAULT_LOGO.scale);

  const knownRatio =
    measuredRatio && measuredRatio.url === url
      ? measuredRatio.ratio
      : cached && cached.url === url
        ? cached.ratio
        : url === DEFAULT_LOGO.url ? DEFAULT_LOGO.ratio : 2;

  // Persist the live values for the next visit.
  useEffect(() => {
    if (loaded && url) writeCache({ url, scale, ratio: knownRatio });
  }, [loaded, url, scale, knownRatio]);

  const onImageLoad = useCallback((w: number, h: number) => {
    if (w > 0 && h > 0) setMeasuredRatio({ url, ratio: w / h });
  }, [url]);

  return { url, scale, ratio: knownRatio, onImageLoad };
}
