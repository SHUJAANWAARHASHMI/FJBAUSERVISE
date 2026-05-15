import { useState } from 'react';
import { ArrowUp, Facebook, Instagram, Linkedin, Phone, Mail } from 'lucide-react';
import { translations } from '../lib/translations';

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
    if (newCount >= 8) {
      onAdminTrigger();
      setClickCount(0);
    } else {
      setClickCount(newCount);
      // Optional: reset count after 3 seconds of inactivity
      setTimeout(() => setClickCount(0), 3000);
    }
  };

  return (
    <footer className="bg-surface-dark border-t border-surface-border pt-32 pb-12 px-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-20 opacity-[0.02] text-[200px] font-black italic select-none pointer-events-none">
        FJ
      </div>
      
      <div className="max-w-7xl mx-auto grid md:grid-cols-12 gap-12 mb-24 relative z-10">
        <div className="md:col-span-4 space-y-10">
          <div className="flex items-center gap-3">
            <div className="bg-primary text-black font-black w-12 h-12 flex items-center justify-center text-2xl shadow-[4px_4px_0px_0px_white]">
              {settings?.name?.substring(0, 2) || 'FJ'}
            </div>
            <span className="heading-dynamic text-2xl tracking-tight leading-none text-white">{settings?.name || 'FJ BAUSERVICE'}</span>
          </div>
          <p className="text-zinc-400 text-base leading-relaxed max-w-sm font-medium">
            Ihr Partner für Abbruch, Entkernung und Sanierung in München und Rosenheim. Wir schaffen seit über 15 Jahren Raum für Neues – professionell, sicher und fachgerecht.
          </p>
          <div className="flex gap-6">
            {[
              { Icon: Facebook, url: settings?.facebook_url || '#', label: 'Facebook' },
              { Icon: Instagram, url: settings?.instagram_url || '#', label: 'Instagram' },
              { Icon: Linkedin, url: settings?.linkedin_url || '#', label: 'LinkedIn' }
            ].map(({ Icon, url, label }, index) => (
              <a 
                key={index} 
                href={url} 
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="w-12 h-12 rounded-sm border border-surface-border flex items-center justify-center text-white hover:bg-primary hover:text-black hover:border-primary transition-all duration-300"
              >
                <Icon size={20} />
              </a>
            ))}
          </div>
        </div>

        <div className="md:col-span-2 space-y-8">
          <h4 className="text-xs font-black italic uppercase tracking-[0.3em] text-primary underline decoration-2 underline-offset-8 decoration-primary/30 pb-2">Navigation</h4>
          <ul className="space-y-4 text-xs font-bold uppercase tracking-widest">
            <li><button onClick={() => setCurrentPage('home')} className="text-zinc-400 hover:text-white transition-colors text-left w-full group"><span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">/ </span> {t.nav.home}</button></li>
            <li><button onClick={() => setCurrentPage('about')} className="text-zinc-400 hover:text-white transition-colors text-left w-full group"><span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">/ </span> {t.nav.about}</button></li>
            <li><button onClick={() => setCurrentPage('services')} className="text-zinc-400 hover:text-white transition-colors text-left w-full group"><span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">/ </span> {t.nav.services}</button></li>
            <li><button onClick={() => setCurrentPage('projects')} className="text-zinc-400 hover:text-white transition-colors text-left w-full group"><span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">/ </span> {t.nav.projects}</button></li>
            <li><button onClick={() => setCurrentPage('contact')} className="text-zinc-400 hover:text-white transition-colors text-left w-full group"><span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">/ </span> {t.nav.contact}</button></li>
          </ul>
        </div>

        <div className="md:col-span-3 space-y-8">
          <h4 className="text-xs font-black italic uppercase tracking-[0.3em] text-primary underline decoration-2 underline-offset-8 decoration-primary/30 pb-2">{t.nav.contact}</h4>
          <div className="space-y-6">
            <div className="flex gap-4 group">
              <div className="w-10 h-10 rounded-sm bg-white/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black transition-colors"><Phone size={16} /></div>
              <div>
                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{t.contact.call}</p>
                <a href={`tel:${(settings?.phone || '015906142923').replace(/\s/g, '')}`} className="text-sm font-black text-white hover:text-primary transition-colors">{settings?.phone || '+49 159 06142923'}</a>
              </div>
            </div>
            <div className="flex gap-4 group">
              <div className="w-10 h-10 rounded-sm bg-white/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black transition-colors"><Mail size={16} /></div>
              <div>
                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{t.contact.email}</p>
                <a href={`mailto:${settings?.email || 'amjad.ali@fj-bauservice.com'}`} className="text-sm font-black text-white hover:text-primary transition-colors truncate block max-w-[200px]">{settings?.email || 'amjad.ali@fj-bauservice.com'}</a>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-3 space-y-8">
          <h4 className="text-xs font-black italic uppercase tracking-[0.3em] text-primary underline decoration-2 underline-offset-8 decoration-primary/30 pb-2">Rechtliches</h4>
          <ul className="space-y-4 text-xs text-zinc-400 font-bold uppercase tracking-widest">
            <li><button onClick={() => setCurrentPage('legal')} className="hover:text-white transition-colors">{t.footer.impressum}</button></li>
            <li><button onClick={() => setCurrentPage('legal')} className="hover:text-white transition-colors">{t.footer.privacy}</button></li>
            <li><button onClick={() => setCurrentPage('contact')} className="hover:text-white transition-colors">FAQ / Fragen</button></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-10 border-t border-surface-border flex flex-col md:flex-row justify-between items-center gap-6">
        <p 
          onClick={handleAdminClick}
          className="text-zinc-600 text-[10px] font-bold uppercase tracking-[0.2em] cursor-default select-none"
        >
          © 2026 {settings?.name || 'FJ BAUSERVICE'}.
        </p>
        <div className="flex items-center gap-8">
          <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-[0.2em]">{(lang === 'de' ? settings?.address_de : settings?.address_en) || settings?.address || 'Rosenheim, DE'}</p>
          {(settings?.whatsapp_number || settings?.phone) && (
            <a 
              href={`https://wa.me/${(settings?.whatsapp_number || settings?.phone || '0159 06142923').replace(/\s+/g, '').replace('+', '')}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-primary text-[10px] font-black uppercase tracking-[0.2em]"
            >
              WHATSAPP: {settings?.whatsapp_number || settings?.phone || '0159 06142923'}
            </a>
          )}
        </div>
      </div>

      <button 
        onClick={scrollToTop}
        className="fixed bottom-8 right-8 w-12 h-12 bg-primary text-black flex items-center justify-center rounded-sm hover:-translate-y-2 transition-transform shadow-2xl z-40"
      >
        <ArrowUp size={24} strokeWidth={3} />
      </button>
    </footer>
  );
}
