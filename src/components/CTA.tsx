import { motion } from 'motion/react';
import { translations } from '../lib/translations';

export default function CTA({ settings, lang, setCurrentPage }: { settings: any, lang: 'de' | 'en', setCurrentPage: (page: string) => void }) {
  const t = translations[lang];
  const ctaImage = settings?.cta_image_url || 'https://images.unsplash.com/photo-1590644365607-1c5a519a9a37?q=80&w=2070&auto=format&fit=crop';

  return (
    <section className="bg-primary py-32 px-6 relative overflow-hidden">
      <motion.div 
        initial={{ scale: 1.1, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0 z-0"
      >
        <img 
          src={ctaImage} 
          alt="FJ BAUSERVICE - Rückbau Projekte in München" 
          className="w-full h-full object-cover opacity-10 filter grayscale brightness-50"
          referrerPolicy="no-referrer"
        />
      </motion.div>

      {/* Decorative BG text */}
      <motion.div 
        initial={{ opacity: 0, y: 100 }}
        whileInView={{ opacity: 0.15, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3, duration: 1 }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none pointer-events-none z-1"
      >
        <span className="text-[250px] md:text-[400px] font-black heading-dynamic whitespace-nowrap text-black italic">
          {settings?.name?.split(' ')[0] || 'FJ'}
        </span>
      </motion.div>

      <div className="max-w-7xl mx-auto relative z-10 flex flex-col items-center gap-12">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-6 max-w-4xl text-center"
        >
          <span className="text-black font-black uppercase tracking-[0.4em] text-[10px] md:text-xs">Bereit für den nächsten Schritt?</span>
          <h2 className="heading-dynamic text-black text-5xl sm:text-6xl md:text-9xl leading-[1.1] md:leading-[0.9] italic">
            {t.cta.title}
          </h2>
          <p className="text-black/80 text-base md:text-2xl font-bold leading-relaxed max-w-2xl mx-auto">
            {t.cta.subtitle}
          </p>
        </motion.div>
        
        <motion.button 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          onClick={() => setCurrentPage('contact')}
          className="bg-black text-white hover:bg-white hover:text-black px-16 py-8 font-black uppercase tracking-[0.3em] text-sm transition-all shadow-[10px_10px_0px_0px_white] hover:shadow-none active:translate-x-2 active:translate-y-2"
        >
          {t.cta.button}
        </motion.button>
      </div>
    </section>
  );
}
