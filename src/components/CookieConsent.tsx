/**
 * CookieConsent.tsx
 *
 * GDPR-compliant Cookie Consent Banner + Preferences Modal
 * Language: German only
 *
 * Renders two things:
 *  1. Bottom banner — shown on first visit
 *  2. Preferences modal — opens when user clicks "Einstellungen"
 *     or the floating "Cookie-Einstellungen" link
 *
 * STRICT ISOLATION: This component does NOT modify any other part of
 * the website. It only adds elements on top of the existing DOM via
 * a fixed/absolute overlay layer. Zero changes to layout, SEO, DB,
 * CMS, styling, or existing components.
 */

import { useState, useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Shield, BarChart2, Megaphone, ChevronDown, ChevronUp, Check, Cookie } from 'lucide-react';
import { useCookieConsent } from '../lib/useCookieConsent';

// ─── Exported hook re-export so consumers only need one import ───────────────
export { useCookieConsent };

// ─── Toggle switch ────────────────────────────────────────────────────────────
function Toggle({
  checked, onChange, disabled = false,
}: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`
        relative inline-flex h-6 w-11 shrink-0 items-center rounded-full
        transition-colors duration-200 focus:outline-none focus-visible:ring-2
        focus-visible:ring-[#ff751f] focus-visible:ring-offset-2
        ${checked ? 'bg-[#ff751f]' : 'bg-zinc-600'}
        ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <span
        className={`
          inline-block h-4 w-4 transform rounded-full bg-white shadow-md
          transition-transform duration-200
          ${checked ? 'translate-x-6' : 'translate-x-1'}
        `}
      />
    </button>
  );
}

// ─── Collapsible category row ─────────────────────────────────────────────────
function CategoryRow({
  icon, title, description, details, checked, onChange, disabled = false, alwaysActive = false,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  details: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  alwaysActive?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-zinc-700/50 rounded-lg overflow-hidden">
      <div className="flex items-center gap-3 p-4 bg-zinc-800/60">
        <span className="text-[#ff751f] shrink-0">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-white">{title}</span>
            {alwaysActive && (
              <span className="text-[10px] font-black uppercase tracking-widest text-[#ff751f] bg-[#ff751f]/10 border border-[#ff751f]/30 px-2 py-0.5 rounded-full">
                Immer aktiv
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400 mt-0.5 leading-snug">{description}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Toggle checked={checked} onChange={onChange} disabled={disabled || alwaysActive} />
          <button
            type="button"
            onClick={() => setOpen(p => !p)}
            className="p-1 text-zinc-500 hover:text-zinc-200 transition-colors"
            aria-label="Details anzeigen"
          >
            {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="px-4 py-3 text-xs text-zinc-500 leading-relaxed border-t border-zinc-700/40 bg-zinc-900/40">
              {details}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Preferences Modal ────────────────────────────────────────────────────────
function PreferencesModal({
  onClose,
  onAcceptAll,
  onRejectAll,
  onSaveCustom,
  initialAnalytics,
  initialMarketing,
  setCurrentPage,
}: {
  onClose: () => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onSaveCustom: (a: boolean, m: boolean) => void;
  initialAnalytics: boolean;
  initialMarketing: boolean;
  setCurrentPage?: (page: string) => void;
}) {
  const [analytics, setAnalytics] = useState(initialAnalytics);
  const [marketing, setMarketing] = useState(initialMarketing);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-lg bg-zinc-900 border border-zinc-700/60 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-label="Cookie-Einstellungen"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-700/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <Cookie size={18} className="text-[#ff751f]" />
            <h2 className="text-base font-black text-white uppercase tracking-wide">Cookie-Einstellungen</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-700 rounded-md transition-colors"
            aria-label="Schließen"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          <p className="text-xs text-zinc-400 leading-relaxed">
            Hier können Sie Ihre Cookie-Präferenzen verwalten. Wählen Sie aus, welche Kategorien
            von Cookies Sie akzeptieren möchten. Notwendige Cookies sind immer aktiv, da sie für
            den Betrieb der Website erforderlich sind.
          </p>

          {/* Essential */}
          <CategoryRow
            icon={<Shield size={18} />}
            title="Notwendige Cookies"
            description="Grundlegende Funktionen der Website. Können nicht deaktiviert werden."
            details="Diese Cookies sind für das ordnungsgemäße Funktionieren der Website unbedingt erforderlich. Sie ermöglichen grundlegende Funktionen wie Sicherheit, Netzwerkverwaltung und Zugänglichkeit. Sie können im Rahmen der Ihnen auf unserer Website angebotenen Dienste nicht deaktiviert werden."
            checked={true}
            onChange={() => {}}
            alwaysActive={true}
          />

          {/* Analytics */}
          <CategoryRow
            icon={<BarChart2 size={18} />}
            title="Analyse-Cookies"
            description="Helfen uns, die Nutzung der Website zu verstehen und zu verbessern."
            details="Diese Cookies ermöglichen es uns, Besuche und Zugriffsquellen zu zählen, damit wir die Leistung unserer Website messen und verbessern können. Sie helfen uns zu wissen, welche Seiten am beliebtesten und welche am wenigsten beliebt sind, und zu sehen, wie Besucher sich auf der Website bewegen. Alle von diesen Cookies gesammelten Informationen sind aggregiert."
            checked={analytics}
            onChange={setAnalytics}
          />

          {/* Marketing */}
          <CategoryRow
            icon={<Megaphone size={18} />}
            title="Marketing-Cookies"
            description="Werden für personalisierte Werbung und Retargeting verwendet."
            details="Diese Cookies können über unsere Website von unseren Werbepartnern gesetzt werden. Sie können von diesen Unternehmen verwendet werden, um ein Profil Ihrer Interessen zu erstellen und Ihnen relevante Anzeigen auf anderen Websites zu zeigen. Sie speichern keine direkten personenbezogenen Daten, basieren jedoch auf einer eindeutigen Identifizierung Ihres Browsers und Internet-Geräts."
            checked={marketing}
            onChange={setMarketing}
          />

          {/* Legal links */}
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={() => { setCurrentPage?.('imprint'); onClose(); }}
              className="text-xs text-zinc-500 hover:text-[#ff751f] underline underline-offset-2 transition-colors"
            >
              Impressum
            </button>
            <button
              type="button"
              onClick={() => { setCurrentPage?.('data-protection'); onClose(); }}
              className="text-xs text-zinc-500 hover:text-[#ff751f] underline underline-offset-2 transition-colors"
            >
              Datenschutzerklärung
            </button>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="px-5 py-4 border-t border-zinc-700/50 shrink-0 flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={onRejectAll}
            className="flex-1 px-4 py-2.5 rounded-lg border border-zinc-600 text-zinc-300 text-xs font-bold uppercase tracking-wider hover:border-zinc-400 hover:text-white transition-colors"
          >
            Nur notwendige
          </button>
          <button
            type="button"
            onClick={() => onSaveCustom(analytics, marketing)}
            className="flex-1 px-4 py-2.5 rounded-lg border border-[#ff751f]/60 text-[#ff751f] text-xs font-bold uppercase tracking-wider hover:border-[#ff751f] hover:bg-[#ff751f]/10 transition-colors"
          >
            Auswahl speichern
          </button>
          <button
            type="button"
            onClick={onAcceptAll}
            className="flex-1 px-4 py-2.5 rounded-lg bg-[#ff751f] text-black text-xs font-black uppercase tracking-wider hover:bg-[#e8661a] transition-colors flex items-center justify-center gap-1.5"
          >
            <Check size={13} />
            Alle akzeptieren
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Banner ───────────────────────────────────────────────────────────────────
function ConsentBanner({
  onAcceptAll,
  onRejectAll,
  onOpenSettings,
  setCurrentPage,
}: {
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onOpenSettings: () => void;
  setCurrentPage?: (page: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="fixed bottom-0 left-0 right-0 z-[9997] p-3 sm:p-4 md:p-5"
      role="region"
      aria-label="Cookie-Einwilligung"
    >
      <div className="max-w-5xl mx-auto bg-zinc-900 border border-zinc-700/70 rounded-xl shadow-2xl overflow-hidden">
        {/* Orange accent top line */}
        <div className="h-0.5 bg-[#ff751f]" />

        <div className="p-4 sm:p-5 md:p-6">
          <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-6">
            {/* Icon + text */}
            <div className="flex gap-3 flex-1">
              <Cookie size={20} className="text-[#ff751f] shrink-0 mt-0.5" />
              <div className="space-y-2 flex-1">
                <p className="text-sm font-black text-white uppercase tracking-wide">
                  Cookie-Einstellungen
                </p>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Wir verwenden Cookies, um unsere Website zu verbessern, Inhalte zu
                  personalisieren sowie Analyse- und Marketingfunktionen bereitzustellen.
                  Sie können selbst entscheiden, welche Cookies Sie zulassen möchten. Weitere
                  Informationen finden Sie in unserer{' '}
                  <button
                    type="button"
                    onClick={() => { setCurrentPage?.('data-protection'); }}
                    className="text-[#ff751f] hover:underline underline-offset-2 transition-colors"
                  >
                    Datenschutzerklärung
                  </button>
                  {' '}und unserem{' '}
                  <button
                    type="button"
                    onClick={() => { setCurrentPage?.('imprint'); }}
                    className="text-[#ff751f] hover:underline underline-offset-2 transition-colors"
                  >
                    Impressum
                  </button>
                  .
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row gap-2 shrink-0 md:min-w-[200px] lg:min-w-0">
              <button
                type="button"
                onClick={onAcceptAll}
                className="
                  px-5 py-2.5 rounded-lg bg-[#ff751f] text-black text-xs font-black
                  uppercase tracking-wider hover:bg-[#e8661a] transition-colors
                  flex items-center justify-center gap-1.5 whitespace-nowrap
                "
              >
                <Check size={13} />
                Alle akzeptieren
              </button>
              <button
                type="button"
                onClick={onRejectAll}
                className="
                  px-5 py-2.5 rounded-lg border border-zinc-600 text-zinc-300 text-xs font-bold
                  uppercase tracking-wider hover:border-zinc-400 hover:text-white
                  transition-colors whitespace-nowrap
                "
              >
                Nur notwendige Cookies
              </button>
              <button
                type="button"
                onClick={onOpenSettings}
                className="
                  px-5 py-2.5 rounded-lg border border-[#ff751f]/50 text-[#ff751f] text-xs font-bold
                  uppercase tracking-wider hover:border-[#ff751f] hover:bg-[#ff751f]/10
                  transition-colors whitespace-nowrap
                "
              >
                Einstellungen
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Floating re-open trigger ─────────────────────────────────────────────────
function CookieSettingsTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Cookie-Einstellungen öffnen"
      aria-label="Cookie-Einstellungen öffnen"
      className="
        fixed bottom-4 left-4 z-[9990]
        flex items-center gap-1.5
        bg-zinc-900 border border-zinc-700 text-zinc-400
        hover:text-white hover:border-zinc-500
        text-[10px] font-bold uppercase tracking-wider
        px-3 py-2 rounded-full shadow-lg
        transition-all duration-200
        hover:shadow-xl
      "
    >
      <Cookie size={12} className="text-[#ff751f]" />
      Cookie-Einstellungen
    </button>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
/**
 * Drop this component once anywhere near the root of the app.
 * It manages all consent UI internally — banner, modal, floating trigger.
 *
 * Props:
 *  - setCurrentPage: optional — lets legal links navigate to Impressum/Datenschutz
 */
export default function CookieConsent({
  setCurrentPage,
}: {
  setCurrentPage?: (page: string) => void;
}) {
  const {
    consent, showBanner, showModal,
    acceptAll, rejectAll, saveCustom,
    openModal, closeModal,
    status,
  } = useCookieConsent();

  // Don't render anything server-side or before hydration
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  return (
    <>
      {/* ── Banner ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showBanner && (
          <ConsentBanner
            onAcceptAll={acceptAll}
            onRejectAll={rejectAll}
            onOpenSettings={openModal}
            setCurrentPage={setCurrentPage}
          />
        )}
      </AnimatePresence>

      {/* ── Preferences modal ──────────────────────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <PreferencesModal
            onClose={closeModal}
            onAcceptAll={acceptAll}
            onRejectAll={rejectAll}
            onSaveCustom={saveCustom}
            initialAnalytics={consent.analytics}
            initialMarketing={consent.marketing}
            setCurrentPage={setCurrentPage}
          />
        )}
      </AnimatePresence>

      {/* ── Floating settings trigger (shown after consent is saved) ───── */}
      <AnimatePresence>
        {!showBanner && !showModal && status !== 'pending' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2, delay: 0.5 }}
          >
            <CookieSettingsTrigger onClick={openModal} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
