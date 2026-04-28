import { motion } from 'motion/react';
import { translations } from '../lib/translations';

export default function CTA({ settings, lang }: { settings: any, lang: 'de' | 'en' }) {
  const t = translations[lang];
  return (
    <section className="bg-primary py-24 px-6 relative overflow-hidden">
      {/* Decorative BG text */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10 select-none pointer-events-none">
        <span className="text-[300px] font-black heading-dynamic whitespace-nowrap text-black">
          {settings?.name?.split(' ')[0] || 'POWER'}
        </span>
      </div>

      <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
        <div className="space-y-4 max-w-2xl text-center md:text-left">
          <h2 className="heading-dynamic text-black text-5xl md:text-7xl leading-none">
            {lang === 'de' ? <>Bereit für den <br />nächsten Schritt?</> : <>Ready for the <br />next step?</>}
          </h2>
          <p className="text-black/70 text-lg font-medium leading-relaxed">
            {lang === 'de' 
              ? 'Kontaktieren Sie uns noch heute für ein unverbindliches Erstgespräch und ein kostenloses Angebot.' 
              : 'Contact us today for a non-binding initial consultation and a free quote.'}
          </p>
        </div>
        
        <button className="bg-black text-white hover:bg-white hover:text-black px-12 py-6 font-bold uppercase tracking-widest text-lg border-2 border-black transition-all shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] hover:shadow-none">
          {t.nav.contact}
        </button>
      </div>
    </section>
  );
}
