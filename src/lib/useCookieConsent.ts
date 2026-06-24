/**
 * useCookieConsent.ts
 *
 * GDPR-compliant cookie consent hook for Germany / EU.
 *
 * Rules:
 *  - Essential cookies: always active, no consent needed.
 *  - Analytics / Marketing: blocked until explicit opt-in.
 *  - Consent stored in localStorage under key "fj_cookie_consent".
 *  - Banner shown on first visit; hidden once any choice is saved.
 *  - Re-opening the preferences panel is supported from anywhere.
 *
 * No side-effects outside this hook. Does NOT modify cookies directly —
 * it only exposes boolean flags that the app reads before loading
 * third-party scripts.
 */

import { useState, useEffect, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface CookieConsent {
  essential: true;        // always true — cannot be disabled
  analytics: boolean;
  marketing: boolean;
}

export type ConsentStatus = 'pending' | 'accepted_all' | 'rejected' | 'custom';

export interface CookieConsentState {
  status: ConsentStatus;
  consent: CookieConsent;
  showBanner: boolean;
  showModal: boolean;
  /** Call to accept all categories */
  acceptAll: () => void;
  /** Call to reject non-essential (essential only) */
  rejectAll: () => void;
  /** Save a custom selection */
  saveCustom: (analytics: boolean, marketing: boolean) => void;
  /** Open the preferences modal (e.g. from footer link) */
  openModal: () => void;
  /** Close the modal without saving */
  closeModal: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'fj_cookie_consent';
const CONSENT_VERSION = '1'; // bump to re-ask users after policy changes

interface StoredConsent {
  version: string;
  status: ConsentStatus;
  analytics: boolean;
  marketing: boolean;
  savedAt: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function readStorage(): StoredConsent | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: StoredConsent = JSON.parse(raw);
    // If consent was saved for an older policy version, treat as pending
    if (parsed.version !== CONSENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeStorage(data: StoredConsent): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage unavailable (private browsing restriction) — silently ignore
  }
}

// ─── Hook ────────────────────────────────────────────────────────────────────
export function useCookieConsent(): CookieConsentState {
  const [status, setStatus] = useState<ConsentStatus>('pending');
  const [consent, setConsent] = useState<CookieConsent>({
    essential: true,
    analytics: false,
    marketing: false,
  });
  const [showBanner, setShowBanner] = useState(false);
  const [showModal,  setShowModal]  = useState(false);

  // On mount: read stored consent and decide whether to show banner
  useEffect(() => {
    const stored = readStorage();
    if (stored) {
      setStatus(stored.status);
      setConsent({ essential: true, analytics: stored.analytics, marketing: stored.marketing });
      setShowBanner(false);
    } else {
      // No prior consent — show banner after a short delay so page renders first
      const t = setTimeout(() => setShowBanner(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const save = useCallback((newStatus: ConsentStatus, analytics: boolean, marketing: boolean) => {
    const data: StoredConsent = {
      version: CONSENT_VERSION,
      status: newStatus,
      analytics,
      marketing,
      savedAt: new Date().toISOString(),
    };
    writeStorage(data);
    setStatus(newStatus);
    setConsent({ essential: true, analytics, marketing });
    setShowBanner(false);
    setShowModal(false);
  }, []);

  const acceptAll  = useCallback(() => save('accepted_all', true,  true),  [save]);
  const rejectAll  = useCallback(() => save('rejected',     false, false),  [save]);
  const saveCustom = useCallback((analytics: boolean, marketing: boolean) => {
    save('custom', analytics, marketing);
  }, [save]);

  const openModal  = useCallback(() => { setShowBanner(false); setShowModal(true);  }, []);
  const closeModal = useCallback(() => setShowModal(false), []);

  return { status, consent, showBanner, showModal, acceptAll, rejectAll, saveCustom, openModal, closeModal };
}
