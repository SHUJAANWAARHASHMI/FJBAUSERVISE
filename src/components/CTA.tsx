import { motion } from 'motion/react';
import { translations } from '../lib/translations';

export default function CTA({ settings, lang }: { settings: any, lang: 'de' | 'en' }) {
  const t = translations[lang];
  const ctaImage = settings?.cta_image_url || 'https://images.unsplash.com/photo-1590644365607-1c5a519a9a37?q=80&w=2070&auto=format&fit=crop';

  return (
    <section className="bg-primary py-24 px-6 relative overflow-hidden">
      {/* Background Image overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={ctaImage} 
          alt="CTA Background" 
          className="w-full h-full object-cover opacity-10 filter grayscale brightness-50"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Decorative BG text */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10 select-none pointer-events-none z-1">
        <span className="text-[200px] md:text-[300px] font-black heading-dynamic whitespace-nowrap text-black">
          {settings?.name?.split(' ')[0] || 'FJ'}
        </span>
      </div>

      <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
        <div className="space-y-4 max-w-2xl text-center md:text-left">
          <h2 className="heading-dynamic text-black text-5xl md:text-7xl leading-none">
            {t.cta.title}
          </h2>
          <p className="text-black/70 text-lg font-medium leading-relaxed">
            {t.cta.subtitle}
          </p>
        </div>
        
        <button className="bg-black text-white hover:bg-white hover:text-black px-12 py-6 font-bold uppercase tracking-widest text-lg border-2 border-black transition-all shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] hover:shadow-none">
          {t.cta.button}
        </button>
      </div>
    </section>
  );
}
