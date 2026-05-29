import { useState } from 'react';
import { ArrowUp, Phone, Mail } from 'lucide-react';
import { translations } from '../lib/translations';
import Logo from './Logo';

interface FooterProps {
  settings: any;
  lang: 'en' | 'de';
  setCurrentPage: (page: string) => void;
  onAdminTrigger: () => void;
}

export default function Footer({ settings, lang, setCurrentPage, onAdminTrigger }: FooterProps) {
  const t = translations[lang];
  const [clickCount, setClickCount] = useState(0);
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const handleAdminClick = () => {
    const newCount = clickCount + 1;
    if (newCount >= 8) { onAdminTrigger(); setClickCount(0); }
    else { setClickCount(newCount); setTimeout(() => setClickCount(0), 3000); }
  };

  const logoScale = parseFloat(settings?.logo_scale || '1') || 1;
  const customLogo = settings?.logo_url || '';

  return (
    <footer className="bg-gray-50 border-t border-gray-200 pt-32 pb-12 px-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-20 opacity-[0.03] text-[200px] font-black italic select-none pointer-events-none text-gray-800">
        FJ
      </div>

      <div className="max-w-7xl mx-auto grid md:grid-cols-12 gap-12 mb-24 relative z-10">
        {/* Brand col */}
        <div className="md:col-span-4 space-y-10">
          <div className="flex items-center cursor-pointer group" onClick={() => setCurrentPage('home')}>
            <Logo iconSize={52} customLogoUrl={customLogo} logoScale={logoScale} />
          </div>
          <p className="text-gray-500 text-base leading-relaxed max-w-sm font-medium">
            {settings?.description_de || settings?.description ||
              'Ihr Partner für Abbruch, Entkernung und Sanierung in München und Rosenheim. Wir schaffen seit über 15 Jahren Raum für Neues – professionell, sicher und fachgerecht.'}
          </p>
        </div>

        {/* Nav col */}
        <div className="md:col-span-2 space-y-8">
          <h4 className="text-xs font-black italic uppercase tracking-[0.3em] text-primary underline decoration-2 underline-offset-8 decoration-primary/30 pb-2">Navigation</h4>
          <ul className="space-y-4 text-xs font-bold uppercase tracking-widest">
            {[
              { id: 'home',     label: t.nav.home },
              { id: 'about',    label: t.nav.about },
              { id: 'services', label: t.nav.services },
              { id: 'projects', label: t.nav.projects },
              { id: 'contact',  label: t.nav.contact },
            ].map(l => (
              <li key={l.id}>
                <button
                  onClick={() => setCurrentPage(l.id)}
                  className="text-gray-500 hover:text-gray-900 transition-colors text-left w-full group"
                >
                  <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">/ </span>
                  {l.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact col */}
        <div className="md:col-span-3 space-y-8">
          <h4 className="text-xs font-black italic uppercase tracking-[0.3em] text-primary underline decoration-2 underline-offset-8 decoration-primary/30 pb-2">{t.nav.contact}</h4>
          <div className="space-y-6">
            <div className="flex gap-4 group">
              <div className="w-10 h-10 rounded-sm bg-white border border-gray-200 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-colors shadow-sm">
                <Phone size={16} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.contact.call}</p>
                <a href={`tel:${(settings?.phone || '015906142923').replace(/\s/g, '')}`} className="text-sm font-black text-gray-800 hover:text-primary transition-colors">
                  {settings?.phone || '+49 159 06142923'}
                </a>
              </div>
            </div>
            <div className="flex gap-4 group">
              <div className="w-10 h-10 rounded-sm bg-white border border-gray-200 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-colors shadow-sm">
                <Mail size={16} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.contact.email}</p>
                <a href={`mailto:${settings?.email || 'amjad.ali@fj-bauservice.com'}`} className="text-sm font-black text-gray-800 hover:text-primary transition-colors truncate block max-w-[200px]">
                  {settings?.email || 'amjad.ali@fj-bauservice.com'}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Service areas */}
        <div className="md:col-span-3 space-y-8">
          <h4 className="text-xs font-black italic uppercase tracking-[0.3em] text-primary underline decoration-2 underline-offset-8 decoration-primary/30 pb-2">Service-Gebiete</h4>
          <ul className="grid grid-cols-2 gap-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">
            {['München','Rosenheim','Miesbach','Wasserburg','Holzkirchen','Bad Aibling','Starnberg','Dachau'].map(city => (
              <li key={city} className="flex items-center gap-2">
                <span className="w-1 h-1 bg-primary flex-shrink-0" />
                {city}
              </li>
            ))}
          </ul>
        </div>

        {/* Legal col */}
        <div className="md:col-span-3 space-y-8">
          <h4 className="text-xs font-black italic uppercase tracking-[0.3em] text-primary underline decoration-2 underline-offset-8 decoration-primary/30 pb-2">Rechtliches</h4>
          <ul className="space-y-4 text-xs text-gray-500 font-bold uppercase tracking-widest">
            <li><button onClick={() => setCurrentPage('legal')} className="hover:text-gray-800 transition-colors">{t.footer.impressum}</button></li>
            <li><button onClick={() => setCurrentPage('legal')} className="hover:text-gray-800 transition-colors">{t.footer.privacy}</button></li>
            <li><button onClick={() => setCurrentPage('contact')} className="hover:text-gray-800 transition-colors">FAQ / Fragen</button></li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="max-w-7xl mx-auto pt-10 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-6">
        <p
          onClick={handleAdminClick}
          className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] cursor-default select-none"
        >
          © 2026 {settings?.name || 'FJ BAUSERVICE'}.
        </p>
        <div className="flex items-center gap-8">
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em]">
            {settings?.address_de || settings?.address || 'Rosenheim, DE'}
          </p>
          {(settings?.whatsapp_number || settings?.phone) && (
            <a
              href={`https://wa.me/${(settings?.whatsapp_number || settings?.phone || '').replace(/\s+/g, '').replace('+', '')}`}
              target="_blank" rel="noopener noreferrer"
              className="text-primary text-[10px] font-black uppercase tracking-[0.2em]"
            >
              WHATSAPP: {settings?.whatsapp_number || settings?.phone}
            </a>
          )}
        </div>
      </div>

      <button
        onClick={scrollToTop}
        className="fixed bottom-8 right-8 w-12 h-12 bg-primary text-black flex items-center justify-center rounded-sm hover:-translate-y-2 transition-transform shadow-xl z-40"
      >
        <ArrowUp size={24} strokeWidth={3} />
      </button>
    </footer>
  );
}
