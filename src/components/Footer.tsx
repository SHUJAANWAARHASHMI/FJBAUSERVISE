import { ArrowUp, Facebook, Instagram, Linkedin, Phone, Mail } from 'lucide-react';
import { translations } from '../lib/translations';

export default function Footer({ settings, lang }: { settings: any, lang: 'de' | 'en' }) {
  const t = translations[lang];
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <footer className="bg-surface-dark border-t border-surface-border pt-20 pb-10 px-6">
      <div className="max-w-7xl mx-auto grid md:grid-cols-12 gap-12 mb-20">
        <div className="md:col-span-4 space-y-8">
          <div className="flex items-center gap-2">
            <div className="bg-primary text-black font-black w-10 h-10 flex items-center justify-center text-xl">
              {settings?.name?.substring(0, 2) || 'FJ'}
            </div>
            <span className="heading-dynamic text-xl tracking-normal">{settings?.name || 'BAUSERVICE'}</span>
          </div>
          <p className="text-zinc-500 text-sm leading-relaxed max-w-xs">
            {lang === 'en' ? (settings?.description_en || t.contact.subtitle) : (settings?.description || 'Raum für Neues schaffen. Ihr Partner für präzise Abbrucharbeiten und Kernbohrungen in Rosenheim.')}
          </p>
          <div className="flex gap-4">
            {[
              { Icon: Facebook, key: 'facebook' },
              { Icon: Instagram, key: 'instagram' },
              { Icon: Linkedin, key: 'linkedin' }
            ].map(({ Icon, key }) => (
              <a 
                key={key} 
                href={settings?.[`${key}_url`] || '#'} 
                className="w-10 h-10 rounded-full border border-surface-border flex items-center justify-center text-white hover:bg-primary hover:text-black transition-all"
              >
                <Icon size={18} />
              </a>
            ))}
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <h4 className="text-sm font-black italic uppercase tracking-widest text-primary">{lang === 'de' ? 'Links' : 'Links'}</h4>
          <ul className="space-y-4 text-sm font-medium">
            <li><a href="#" className="text-zinc-400 hover:text-white flex items-center gap-2 transition-colors"><span>→</span> {t.nav.home}</a></li>
            <li><a href="#" className="text-zinc-400 hover:text-white flex items-center gap-2 transition-colors"><span>→</span> {t.nav.about}</a></li>
            <li><a href="#" className="text-zinc-400 hover:text-white flex items-center gap-2 transition-colors"><span>→</span> {t.nav.services}</a></li>
            <li><a href="#" className="text-zinc-400 hover:text-white flex items-center gap-2 transition-colors"><span>→</span> {t.nav.projects}</a></li>
            <li><a href="#" className="text-zinc-400 hover:text-white flex items-center gap-2 transition-colors"><span>→</span> {t.nav.contact}</a></li>
          </ul>
        </div>

        <div className="md:col-span-3 space-y-6">
          <h4 className="text-sm font-black italic uppercase tracking-widest text-primary">{t.nav.contact}</h4>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-primary"><Phone size={14} /></div>
              <div>
                <p className="text-[10px] font-bold text-zinc-600 uppercase">{t.contact.call}</p>
                <p className="text-sm font-bold">{settings?.phone || '0159 06142923'}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-primary"><Mail size={14} /></div>
              <div>
                <p className="text-[10px] font-bold text-zinc-600 uppercase">{t.contact.email}</p>
                <p className="text-sm font-bold">{settings?.email || 'amjad.ali@fj-bauservice.com'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-3 space-y-6">
          <h4 className="text-sm font-black italic uppercase tracking-widest text-primary">{lang === 'de' ? 'Rechtliches' : 'Legal'}</h4>
          <ul className="space-y-4 text-sm text-zinc-400 font-medium">
            <li><a href="#" className="hover:text-white transition-colors">Impressum</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Datenschutz (Privacy)</a></li>
            <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-10 border-t border-surface-border flex flex-col md:flex-row justify-between items-center gap-6">
        <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-[0.2em]">© 2026 FJ BAUSERVICE ROSENHEIM.</p>
        <div className="flex items-center gap-8">
          <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-[0.2em]">Rosenheim, DE</p>
          <a href="#" className="text-primary text-[10px] font-black uppercase tracking-[0.2em]">WHATSAPP: 0159 06142923</a>
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
