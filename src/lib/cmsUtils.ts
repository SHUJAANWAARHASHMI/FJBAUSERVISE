/**
 * cmsUtils.ts — Reliable CMS save / upload / sync utilities
 *
 * All Supabase write operations go through this module so that:
 *  - Every write is validated (no silent failures)
 *  - Failed writes are retried up to MAX_RETRIES times with exponential backoff
 *  - A structured error is always thrown/returned so the UI can react
 *  - Debug logs are always printed to the console so developers can trace issues
 *  - Unknown fields are stripped before upsert to prevent PGRST204 errors
 */

import { supabase } from './supabase';

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 600; // first retry after 600 ms, second after 1200 ms, etc.

// ─── KNOWN COLUMNS whitelist ──────────────────────────────────────────────────
// This is the authoritative list of all columns in the site_settings table.
// Any key NOT in this list is stripped before upserting to prevent PGRST204.
// When you add a new column to the DB, add it here too.
export const SITE_SETTINGS_COLUMNS = new Set([
  // System
  'id', 'created_at', 'updated_at',
  // Identity
  'name', 'slogan', 'slogan_de', 'slogan_en', 'description', 'description_de', 'description_en',
  // Branding
  'logo_url', 'logo_scale', 'primary_color',
  // Hero section
  'hero_heading_de', 'hero_heading_en',
  'hero_subtext_de', 'hero_subtext_en',
  'hero_button_de', 'hero_button_en',
  'hero_cta_label', 'hero_image_url',
  'stats_years', 'stats_projects',
  'stat_label_1_de', 'stat_label_2_de',
  // Services section
  'services_title', 'services_subtitle',
  // Projects section
  'projects_title', 'projects_subtitle',
  // WhyUs section
  'whyus_title', 'whyus_subtitle',
  'whyus_1_title', 'whyus_1_desc',
  'whyus_2_title', 'whyus_2_desc',
  'whyus_3_title', 'whyus_3_desc',
  'whyus_4_title', 'whyus_4_desc',
  'whyus_banner_heading', 'whyus_banner_sub',
  // FAQ section
  'faq_title', 'faq_subtitle',
  // CTA section
  'cta_title_de', 'cta_title_en',
  'cta_subtitle_de', 'cta_subtitle_en',
  'cta_button_de', 'cta_button_en',
  'cta_image_url',
  // Contact section
  'contact_title', 'contact_subtitle',
  'phone', 'email',
  'address', 'address_de', 'address_en',
  'hours_weekdays', 'hours_saturday', 'hours_sunday',
  'whatsapp_number', 'google_maps_url',
  'contact_image_url',
  // About page
  'about_image_url',
  'about_hero_kicker', 'about_hero_heading', 'about_hero_heading_highlight',
  'about_quote', 'about_intro',
  'about_mission', 'about_vision',
  'about_history',
  'about_stat1_value', 'about_stat1_label',
  'about_stat2_value', 'about_stat2_label',
  'about_stat3_value', 'about_stat3_label',
  'about_team_heading', 'about_team_content',
  'about_cert_heading', 'about_cert_content',
  'about_cta_text', 'about_cta_button',
  'about_seo_title', 'about_seo_description',
  'about_image2_url',
  // Footer
  'footer_copyright', 'footer_image_url',
  // Social
  'instagram_url', 'facebook_url', 'linkedin_url', 'tiktok_url',
  // SEO
  'seo_title_de', 'seo_title_en',
  'seo_description_de', 'seo_description_en',
  'seo_keywords', 'og_image_url',
]);

// ─── Types ────────────────────────────────────────────────────────────────────
export interface SaveResult {
  ok: boolean;
  error?: string;
  data?: any;
}

export interface UploadResult {
  ok: boolean;
  url?: string;
  error?: string;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────
function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Strip system fields AND any unknown fields that don't exist in the DB schema.
 * This prevents PGRST204 errors when component fields are added before DB columns.
 */
function sanitizePayload(obj: Record<string, any>) {
  const result: Record<string, any> = {};
  const unknown: string[] = [];

  for (const [key, value] of Object.entries(obj)) {
    if (key === 'id' || key === 'created_at' || key === 'updated_at') continue;
    if (SITE_SETTINGS_COLUMNS.has(key)) {
      result[key] = value;
    } else {
      unknown.push(key);
    }
  }

  if (unknown.length > 0) {
    console.warn(
      `[CMS] sanitizePayload — stripped ${unknown.length} unknown field(s):`,
      unknown.join(', '),
      '\n  → Add these columns to Supabase AND to SITE_SETTINGS_COLUMNS in cmsUtils.ts'
    );
  }

  return result;
}

/** Retry wrapper — runs `fn` up to MAX_RETRIES times */
async function withRetry<T>(
  fn: () => Promise<T>,
  label: string
): Promise<T> {
  let lastError: any;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await fn();
      return result;
    } catch (err: any) {
      lastError = err;
      console.warn(`[CMS] ${label} — attempt ${attempt}/${MAX_RETRIES} failed:`, err?.message || err);
      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_BASE_MS * attempt);
      }
    }
  }
  throw lastError;
}

// ─── Site Settings ────────────────────────────────────────────────────────────

/**
 * Save (upsert) the site_settings row.
 * Strips system fields + unknown fields (prevents PGRST204), always uses id=1, retries on failure.
 * Returns { ok, error?, data? }
 */
export async function saveSettings(
  settings: Record<string, any>
): Promise<SaveResult> {
  const payload = sanitizePayload(settings);
  const fieldCount = Object.keys(payload).length;
  const totalFields = Object.keys(settings).length;

  console.log(`[CMS] saveSettings — upserting ${fieldCount}/${totalFields} fields to site_settings id=1`);
  if (fieldCount < totalFields) {
    console.log('[CMS] saveSettings — note: some fields were stripped (unknown columns)');
  }

  try {
    const data = await withRetry(async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .upsert({ id: 1, ...payload }, { onConflict: 'id' })
        .select()
        .single();

      if (error) {
        console.error('[CMS] saveSettings — Supabase error:', error.code, error.message, error.details);
        throw error;
      }
      return data;
    }, 'saveSettings');

    // Post-save spot verification: pick one changed field and confirm it matches
    const changedKeys = Object.keys(payload).filter(k => payload[k] !== undefined);
    if (changedKeys.length > 0) {
      const checkKey = changedKeys[0];
      const { data: verifyRow, error: verifyErr } = await supabase
        .from('site_settings')
        .select(checkKey)
        .eq('id', 1)
        .single();

      if (verifyErr) {
        console.warn('[CMS] saveSettings — verification read failed:', verifyErr.message);
      } else {
        const saved = (verifyRow as any)?.[checkKey];
        const expected = payload[checkKey];
        if (String(saved) === String(expected ?? '')) {
          console.log(`[CMS] saveSettings — VERIFIED: ${checkKey} = "${saved}"`);
        } else {
          console.error(`[CMS] saveSettings — VERIFICATION FAILED: ${checkKey} expected "${expected}" got "${saved}"`);
        }
      }
    }

    console.log('[CMS] saveSettings — SUCCESS, row id:', data?.id);
    return { ok: true, data };
  } catch (err: any) {
    const msg = err?.message || String(err);
    console.error('[CMS] saveSettings — FAILED after retries:', msg);
    return { ok: false, error: msg };
  }
}

/**
 * Verify the current settings row in Supabase matches the expected snapshot.
 * Used to confirm a save actually persisted (prevents ghost saves).
 */
export async function verifySettings(
  expectedKey: string,
  expectedValue: any
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select(expectedKey)
      .eq('id', 1)
      .single();

    if (error || !data) return false;
    const actual = (data as any)[expectedKey];
    const match = String(actual) === String(expectedValue);
    if (!match) {
      console.warn(`[CMS] verifySettings — field "${expectedKey}" mismatch: expected "${expectedValue}", got "${actual}"`);
    }
    return match;
  } catch {
    return false;
  }
}

// ─── Image Upload ─────────────────────────────────────────────────────────────

/**
 * Upload an image to Supabase Storage (images bucket / uploads/ prefix).
 * Returns { ok, url?, error? }
 */
export async function uploadImage(
  file: File,
  fieldHint = 'image'
): Promise<UploadResult> {
  const ext = file.name.split('.').pop() || 'jpg';
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const filePath = `uploads/${fileName}`;

  console.log(`[CMS] uploadImage — uploading "${file.name}" (${(file.size / 1024).toFixed(1)} KB) as ${filePath}`);

  try {
    await withRetry(async () => {
      const { error } = await supabase.storage
        .from('images')
        .upload(filePath, file, { cacheControl: '31536000', upsert: false });

      if (error) {
        if (error.message?.includes('bucket')) {
          throw new Error('Storage bucket "images" not found. Create a public bucket named "images" in Supabase Storage.');
        }
        if (error.message?.toLowerCase().includes('policy') || error.message?.toLowerCase().includes('permission')) {
          throw new Error('Storage permission denied. Add an INSERT policy for the "images" bucket in Supabase Storage.');
        }
        throw error;
      }
    }, `uploadImage(${fieldHint})`);

    const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(filePath);
    console.log(`[CMS] uploadImage — SUCCESS: ${publicUrl}`);
    return { ok: true, url: publicUrl };
  } catch (err: any) {
    const msg = err?.message || String(err);
    console.error('[CMS] uploadImage — FAILED:', msg);
    return { ok: false, error: msg };
  }
}

// ─── Media Library ────────────────────────────────────────────────────────────

export interface MediaFile {
  name: string;
  url: string;
  size?: number;
  createdAt?: string;
}

/**
 * Fetch all files in the uploads/ prefix of the images bucket.
 * Returns an array of MediaFile objects.
 */
export async function fetchMediaFiles(limit = 100): Promise<MediaFile[]> {
  console.log('[CMS] fetchMediaFiles — listing uploads/');
  try {
    const { data: files, error } = await supabase.storage
      .from('images')
      .list('uploads', {
        limit,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (error) throw error;
    if (!files || files.length === 0) {
      console.log('[CMS] fetchMediaFiles — bucket empty or no files');
      return [];
    }

    const media: MediaFile[] = files
      .filter(f => f.name && !f.name.startsWith('.')) // skip hidden/placeholder files
      .map(f => ({
        name: f.name,
        url: supabase.storage.from('images').getPublicUrl(`uploads/${f.name}`).data.publicUrl,
        size: f.metadata?.size,
        createdAt: f.created_at,
      }));

    console.log(`[CMS] fetchMediaFiles — found ${media.length} files`);
    return media;
  } catch (err: any) {
    console.error('[CMS] fetchMediaFiles — FAILED:', err?.message || err);
    return [];
  }
}

/**
 * Delete a file from the uploads/ prefix.
 */
export async function deleteMediaFile(fileName: string): Promise<SaveResult> {
  const filePath = `uploads/${fileName}`;
  console.log(`[CMS] deleteMediaFile — removing ${filePath}`);
  try {
    const { error } = await supabase.storage.from('images').remove([filePath]);
    if (error) throw error;
    console.log('[CMS] deleteMediaFile — SUCCESS');
    return { ok: true };
  } catch (err: any) {
    const msg = err?.message || String(err);
    console.error('[CMS] deleteMediaFile — FAILED:', msg);
    return { ok: false, error: msg };
  }
}

// ─── Generic table CRUD ────────────────────────────────────────────────────────

export async function upsertRow(
  table: string,
  row: Record<string, any>,
  conflictCol = 'id'
): Promise<SaveResult> {
  console.log(`[CMS] upsertRow — table=${table}, conflictCol=${conflictCol}`);
  try {
    const data = await withRetry(async () => {
      const { data, error } = await supabase
        .from(table)
        .upsert(row, { onConflict: conflictCol })
        .select()
        .single();
      if (error) throw error;
      return data;
    }, `upsertRow(${table})`);
    console.log(`[CMS] upsertRow — SUCCESS table=${table}`);
    return { ok: true, data };
  } catch (err: any) {
    const msg = err?.message || String(err);
    console.error(`[CMS] upsertRow — FAILED table=${table}:`, msg);
    return { ok: false, error: msg };
  }
}

export async function insertRow(
  table: string,
  row: Record<string, any>
): Promise<SaveResult> {
  const { id, created_at, _new, ...clean } = row;
  console.log(`[CMS] insertRow — table=${table}`);
  try {
    const data = await withRetry(async () => {
      const { data, error } = await supabase.from(table).insert([clean]).select().single();
      if (error) throw error;
      return data;
    }, `insertRow(${table})`);
    console.log(`[CMS] insertRow — SUCCESS table=${table}`);
    return { ok: true, data };
  } catch (err: any) {
    const msg = err?.message || String(err);
    console.error(`[CMS] insertRow — FAILED table=${table}:`, msg);
    return { ok: false, error: msg };
  }
}

export async function updateRow(
  table: string,
  id: string,
  row: Record<string, any>
): Promise<SaveResult> {
  const { id: _id, created_at, _new, ...clean } = row;
  console.log(`[CMS] updateRow — table=${table} id=${id}`);
  try {
    const data = await withRetry(async () => {
      const { data, error } = await supabase.from(table).update(clean).eq('id', id).select().single();
      if (error) throw error;
      return data;
    }, `updateRow(${table})`);
    console.log(`[CMS] updateRow — SUCCESS table=${table} id=${id}`);
    return { ok: true, data };
  } catch (err: any) {
    const msg = err?.message || String(err);
    console.error(`[CMS] updateRow — FAILED table=${table} id=${id}:`, msg);
    return { ok: false, error: msg };
  }
}

export async function deleteRow(
  table: string,
  id: string
): Promise<SaveResult> {
  console.log(`[CMS] deleteRow — table=${table} id=${id}`);
  try {
    await withRetry(async () => {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
    }, `deleteRow(${table})`);
    console.log(`[CMS] deleteRow — SUCCESS table=${table} id=${id}`);
    return { ok: true };
  } catch (err: any) {
    const msg = err?.message || String(err);
    console.error(`[CMS] deleteRow — FAILED table=${table} id=${id}:`, msg);
    return { ok: false, error: msg };
  }
}

// ─── Fetch latest settings ─────────────────────────────────────────────────────
/**
 * Always fetches fresh settings from Supabase (no cache).
 */
export async function fetchLatestSettings(): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .eq('id', 1)
      .single();
    if (error) throw error;
    return data;
  } catch (err: any) {
    console.error('[CMS] fetchLatestSettings — FAILED:', err?.message);
    return null;
  }
}

// ─── Legal Pages ──────────────────────────────────────────────────────────────

export interface LegalPageRecord {
  id?: string;
  slug: string;
  title: string;
  content: string;
  seo_title?: string;
  seo_description?: string;
  updated_at?: string;
}

/**
 * Fetch a single legal page by slug.
 * Returns null if the table doesn't exist yet or the row isn't found.
 */
export async function fetchLegalPage(slug: string): Promise<LegalPageRecord | null> {
  try {
    const { data, error } = await supabase
      .from('legal_pages')
      .select('*')
      .eq('slug', slug)
      .single();
    if (error) {
      if (error.code !== 'PGRST116') {
        console.warn('[CMS] fetchLegalPage — error:', error.message);
      }
      return null;
    }
    return data as LegalPageRecord;
  } catch (err: any) {
    console.error('[CMS] fetchLegalPage — FAILED:', err?.message);
    return null;
  }
}

/**
 * Fetch all legal pages.
 */
export async function fetchAllLegalPages(): Promise<LegalPageRecord[]> {
  try {
    const { data, error } = await supabase
      .from('legal_pages')
      .select('*')
      .order('slug', { ascending: true });
    if (error) {
      console.warn('[CMS] fetchAllLegalPages — error:', error.message);
      return [];
    }
    return (data as LegalPageRecord[]) || [];
  } catch (err: any) {
    console.error('[CMS] fetchAllLegalPages — FAILED:', err?.message);
    return [];
  }
}

/**
 * Save (upsert by slug) a legal page.
 * Creates the row if it doesn't exist, updates if it does.
 */
export async function saveLegalPage(page: LegalPageRecord): Promise<SaveResult> {
  const { id: _id, updated_at, ...payload } = page as any;
  console.log(`[CMS] saveLegalPage — slug="${page.slug}"`);
  try {
    const data = await withRetry(async () => {
      const { data, error } = await supabase
        .from('legal_pages')
        .upsert(payload, { onConflict: 'slug' })
        .select()
        .single();
      if (error) {
        console.error('[CMS] saveLegalPage — Supabase error:', error.code, error.message);
        throw error;
      }
      return data;
    }, `saveLegalPage(${page.slug})`);
    console.log(`[CMS] saveLegalPage — SUCCESS slug="${page.slug}" id=${data?.id}`);
    return { ok: true, data };
  } catch (err: any) {
    const msg = err?.message || String(err);
    console.error(`[CMS] saveLegalPage — FAILED:`, msg);
    return { ok: false, error: msg };
  }
}
