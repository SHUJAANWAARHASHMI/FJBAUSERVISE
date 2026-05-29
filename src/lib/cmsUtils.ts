/**
 * cmsUtils.ts — Reliable CMS save / upload / sync utilities
 *
 * All Supabase write operations go through this module so that:
 *  - Every write is validated (no silent failures)
 *  - Failed writes are retried up to MAX_RETRIES times with exponential backoff
 *  - A structured error is always thrown/returned so the UI can react
 *  - Debug logs are always printed to the console so developers can trace issues
 */

import { supabase } from './supabase';

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 600; // first retry after 600 ms, second after 1200 ms, etc.

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

function stripSystemFields(obj: Record<string, any>) {
  const { id, created_at, updated_at, ...rest } = obj;
  return rest;
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
 * Strips system fields, always uses id=1, retries on failure.
 * Returns { ok, error?, data? }
 */
export async function saveSettings(
  settings: Record<string, any>
): Promise<SaveResult> {
  const payload = stripSystemFields(settings);
  console.log('[CMS] saveSettings — writing', Object.keys(payload).length, 'fields to site_settings row id=1');

  try {
    const data = await withRetry(async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .upsert({ id: 1, ...payload }, { onConflict: 'id' })
        .select()
        .single();

      if (error) throw error;
      return data;
    }, 'saveSettings');

    console.log('[CMS] saveSettings — SUCCESS, returned row:', data?.id);
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
