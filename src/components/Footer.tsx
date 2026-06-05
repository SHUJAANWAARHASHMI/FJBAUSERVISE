import { useState } from 'react';
import { ArrowUp, Phone, Mail, MapPin, Clock, Instagram, Facebook, Linkedin, Youtube, ExternalLink } from 'lucide-react';
import { translations } from '../lib/translations';
import Logo from './Logo';
import { EditableText, EditableSection, useEditorCtx } from '../lib/editorContext';

interface FooterProps {
  settings: any;
  lang: 'en' | 'de';
  setCurrentPage: (page: string) => void;
  onAdminTrigger: () => void;
}

/** TikTok icon (not in lucide) */
function TikTokIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.77a4.85 4.85 0 01-1.01-.08z"/>
    </svg>
  );
}

/** WhatsApp icon */
function WhatsAppIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

export default function Footer({ settings, lang, setCurrentPage, onAdminTrigger }: FooterProps) {
  const t = translations[lang];
  const [clickCount, setClickCount] = useState(0);
  const { isEditing, settings: editorSettings } = useEditorCtx();
  const s = isEditing ? (editorSettings ?? settings) : settings;

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const handleAdminClick = () => {
    if (isEditing) return;
    const newCount = clickCount + 1;
    if (newCount >= 8) { onAdminTrigger(); setClickCount(0); }
    else { setClickCount(newCount); setTimeout(() => setClickCount(0), 3000); }
  };

  const logoScale    = parseFloat(s?.logo_scale || '1') || 1;
  const customLogo   = s?.logo_url || '';
  const companyName  = s?.name || 'FJ BAUSERVICE';
  const description  = s?.description_de || s?.description || 'Ihr Partner für Abbruch, Entkernung und Sanierung in München und Rosenheim. Wir schaffen seit über 15 Jahren Raum für Neues – professionell, sicher und fachgerecht.';
  const phone        = s?.phone || '+49 159 06142923';
  const email        = s?.email || 'amjad.ali@fj-bauservice.com';
  const address      = s?.address_de || s?.address || 'Bahnhofstraße 9, 83022 Rosenheim';
  const hoursWd      = s?.hours_weekdays || 'Mo–Fr: 08:00–18:00';
  const hoursSa      = s?.hours_saturday || 'Sa: 09:00–14:00';
  const copyright    = s?.footer_copyright || `© ${new Date().getFullYear()} ${companyName}. Alle Rechte vorbehalten.`;

  // Social links
  const hasFacebook  = !!(s?.facebook_url);
  const hasInstagram = !!(s?.instagram_url);
  const hasLinkedin  = !!(s?.linkedin_url);
  const hasTiktok    = !!(s?.tiktok_url);
  const hasWhatsapp  = !!(s?.whatsapp_number);
  const hasAnySocial = hasFacebook || hasInstagram || hasLinkedin || hasTiktok || hasWhatsapp;

  return (
    <EditableSection id="footer" label="Footer">
      <footer className="bg-gray-50 border-t border-gray-200 pt-20 pb-10 px-6 relative overflow-hidden">

        {/* Decorative watermark */}
        <div className="absolute top-0 right-0 p-16 opacity-[0.025] text-[220px] font-black italic select-none pointer-events-none text-gray-800 leading-none">
          FJ
        </div>

        <div className="max-w-7xl mx-auto relative z-10">

          {/* ── Main grid ───────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 mb-16">

            {/* Brand column */}
            <div className="sm:col-span-2 lg:col-span-4 space-y-8">
              <button
                onClick={() => !isEditing && setCurrentPage('home')}
                className="block focus:outline-none"
                aria-label="FJ BAUSERVICE – Startseite"
              >
                <Logo iconSize={52} customLogoUrl={customLogo} logoScale={logoScale} />
              </button>

              <EditableText
                field="description_de"
                value={description}
                tag="p"
                multiline
                className="text-gray-500 text-sm leading-relaxed max-w-sm font-medium"
              />

              {/* Social links */}
              {(hasAnySocial || isEditing) && (
                <div className="flex flex-wrap gap-3">
                  {(hasFacebook || isEditing) && (
                    <a
                      href={s?.facebook_url || '#'}
                      target="_blank" rel="noopener noreferrer"
                      onClick={e => isEditing && e.preventDefault()}
                      className="w-9 h-9 rounded-sm bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-white hover:bg-primary hover:border-primary transition-all duration-300 shadow-sm"
                      aria-label="Facebook"
                    >
                      <Facebook size={15} />
                    </a>
                  )}
                  {(hasInstagram || isEditing) && (
                    <a
                      href={s?.instagram_url || '#'}
                      target="_blank" rel="noopener noreferrer"
                      onClick={e => isEditing && e.preventDefault()}
                      className="w-9 h-9 rounded-sm bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-white hover:bg-primary hover:border-primary transition-all duration-300 shadow-sm"
                      aria-label="Instagram"
                    >
                      <Instagram size={15} />
                    </a>
                  )}
                  {(hasLinkedin || isEditing) && (
                    <a
                      href={s?.linkedin_url || '#'}
                      target="_blank" rel="noopener noreferrer"
                      onClick={e => isEditing && e.preventDefault()}
                      className="w-9 h-9 rounded-sm bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-white hover:bg-primary hover:border-primary transition-all duration-300 shadow-sm"
                      aria-label="LinkedIn"
                    >
                      <Linkedin size={15} />
                    </a>
                  )}
                  {(hasTiktok || isEditing) && (
                    <a
                      href={s?.tiktok_url || '#'}
                      target="_blank" rel="noopener noreferrer"
                      onClick={e => isEditing && e.preventDefault()}
                      className="w-9 h-9 rounded-sm bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-white hover:bg-primary hover:border-primary transition-all duration-300 shadow-sm"
                      aria-label="TikTok"
                    >
                      <TikTokIcon size={15} />
                    </a>
                  )}
                  {(hasWhatsapp || isEditing) && (
                    <a
                      href={`https://wa.me/${(s?.whatsapp_number || '').replace(/\s+/g, '').replace('+', '')}`}
                      target="_blank" rel="noopener noreferrer"
                      onClick={e => isEditing && e.preventDefault()}
                      className="w-9 h-9 rounded-sm bg-white border border-gray-200 flex items-center justify-center text-green-600 hover:text-white hover:bg-green-600 hover:border-green-600 transition-all duration-300 shadow-sm"
                      aria-label="WhatsApp"
                    >
                      <WhatsAppIcon size={15} />
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Navigation column */}
            <div className="lg:col-span-2 space-y-6">
              <h4 className="text-[10px] font-black italic uppercase tracking-[0.3em] text-primary underline decoration-2 underline-offset-8 decoration-primary/30 pb-1">
                Navigation
              </h4>
              <ul className="space-y-3 text-xs font-bold uppercase tracking-widest">
                {[
                  { id: 'home',     label: t.nav.home },
                  { id: 'about',    label: t.nav.about },
                  { id: 'services', label: t.nav.services },
                  { id: 'projects', label: t.nav.projects },
                  { id: 'contact',  label: t.nav.contact },
                ].map(l => (
                  <li key={l.id}>
                    <button
                      onClick={() => !isEditing && setCurrentPage(l.id)}
                      className="text-gray-500 hover:text-gray-900 transition-colors text-left w-full group flex items-center gap-1.5"
                    >
                      <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity text-base leading-none">›</span>
                      {l.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact column */}
            <div className="lg:col-span-3 space-y-6">
              <h4 className="text-[10px] font-black italic uppercase tracking-[0.3em] text-primary underline decoration-2 underline-offset-8 decoration-primary/30 pb-1">
                {t.nav.contact}
              </h4>
              <div className="space-y-4">
                {/* Phone */}
                <div className="flex gap-3 group items-start">
                  <div className="w-8 h-8 rounded-sm bg-white border border-gray-200 flex items-center justify-center text-primary flex-shrink-0 group-hover:bg-primary group-hover:text-white transition-colors shadow-sm mt-0.5">
                    <Phone size={14} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{t.contact?.call || 'Anrufen'}</p>
                    <EditableText
                      field="phone"
                      value={phone}
                      tag="a"
                      className="text-xs font-black text-gray-800 hover:text-primary transition-colors block break-all"
                    />
                  </div>
                </div>
                {/* Email */}
                <div className="flex gap-3 group items-start">
                  <div className="w-8 h-8 rounded-sm bg-white border border-gray-200 flex items-center justify-center text-primary flex-shrink-0 group-hover:bg-primary group-hover:text-white transition-colors shadow-sm mt-0.5">
                    <Mail size={14} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{t.contact?.email || 'E-Mail'}</p>
                    <EditableText
                      field="email"
                      value={email}
                      tag="a"
                      className="text-xs font-black text-gray-800 hover:text-primary transition-colors block break-all"
                    />
                  </div>
                </div>
                {/* Address */}
                <div className="flex gap-3 group items-start">
                  <div className="w-8 h-8 rounded-sm bg-white border border-gray-200 flex items-center justify-center text-primary flex-shrink-0 group-hover:bg-primary group-hover:text-white transition-colors shadow-sm mt-0.5">
                    <MapPin size={14} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Adresse</p>
                    <EditableText
                      field="address_de"
                      value={address}
                      tag="p"
                      multiline
                      className="text-xs font-bold text-gray-700 leading-snug break-words"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Opening hours column */}
            <div className="lg:col-span-3 space-y-6">
              <h4 className="text-[10px] font-black italic uppercase tracking-[0.3em] text-primary underline decoration-2 underline-offset-8 decoration-primary/30 pb-1">
                Öffnungszeiten
              </h4>
              <div className="space-y-3">
                <div className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-sm bg-white border border-gray-200 flex items-center justify-center text-primary flex-shrink-0 shadow-sm mt-0.5">
                    <Clock size={14} />
                  </div>
                  <div className="space-y-2 min-w-0">
                    <EditableText
                      field="hours_weekdays"
                      value={hoursWd}
                      tag="p"
                      className="text-xs font-bold text-gray-700"
                    />
                    <EditableText
                      field="hours_saturday"
                      value={hoursSa}
                      tag="p"
                      className="text-xs font-bold text-gray-700"
                    />
                    {s?.hours_sunday && (
                      <EditableText
                        field="hours_sunday"
                        value={s.hours_sunday}
                        tag="p"
                        className="text-xs font-bold text-gray-700"
                      />
                    )}
                  </div>
                </div>
                {(s?.google_maps_url || isEditing) && (
                  <a
                    href={s?.google_maps_url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => isEditing && e.preventDefault()}
                    className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/70 transition-colors border-b border-primary/30 hover:border-primary pb-0.5"
                  >
                    <MapPin size={11} />
                    Auf Karte anzeigen
                    <ExternalLink size={10} />
                  </a>
                )}
              </div>
            </div>

          </div>

          {/* ── Bottom bar ──────────────────────────────────────────────────── */}
          <div className="pt-8 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4 flex-wrap">
            <p
              onClick={handleAdminClick}
              className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] cursor-default select-none"
            >
              <EditableText
                field="footer_copyright"
                value={copyright}
                tag="span"
                className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em]"
              />
            </p>
            <div className="flex flex-wrap items-center gap-6 text-[10px] font-bold uppercase tracking-widest">
              <button
                onClick={() => !isEditing && setCurrentPage('legal')}
                className="text-gray-400 hover:text-gray-700 transition-colors"
              >
                {t.footer?.impressum || 'Impressum'}
              </button>
              <button
                onClick={() => !isEditing && setCurrentPage('legal')}
                className="text-gray-400 hover:text-gray-700 transition-colors"
              >
                {t.footer?.privacy || 'Datenschutz'}
              </button>
              <button
                onClick={() => !isEditing && setCurrentPage('contact')}
                className="text-gray-400 hover:text-gray-700 transition-colors"
              >
                FAQ
              </button>
            </div>
          </div>

        </div>

        {/* Scroll to top */}
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 w-12 h-12 bg-primary text-black flex items-center justify-center rounded-sm hover:-translate-y-2 transition-transform shadow-xl z-40"
          aria-label="Nach oben scrollen"
        >
          <ArrowUp size={22} strokeWidth={3} />
        </button>
      </footer>
    </EditableSection>
  );
}
