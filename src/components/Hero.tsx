import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';

import { translations } from '../lib/translations';

export default function Hero({ settings, lang }: { settings: any, lang: 'de' | 'en' }) {
  const t = translations[lang];
  const currentSlogan = lang === 'en' ? (settings?.slogan_en || t.hero.stats.contact) : (settings?.slogan || 'Raum für Neues Schaffen');
  const [line1, line2, line3] = currentSlogan.split(' ');
  const currentDesc = lang === 'en' ? (settings?.description_en || t.contact.subtitle) : (settings?.description || 'Ihr Partner für Abbruch und Rückbau in Deutschland.');

  return (
    <section className="relative pt-32 pb-20 px-6 max-w-7xl mx-auto">
      <div className="grid lg:grid-cols-12 gap-8">
        {/* Main Hero Card */}
        <div className="lg:col-span-8 bg-surface-card border border-surface-border p-10 relative overflow-hidden group min-h-[500px] flex flex-col justify-end">
          <div className="absolute top-0 right-0 p-4">
            <span className="bg-primary/10 text-primary border border-primary/20 px-4 py-1 text-xs font-bold uppercase tracking-wider">
              {t.hero.badge}
            </span>
          </div>
          
          {/* Background Decorative Text */}
          <div className="absolute top-10 left-10 opacity-[0.03] select-none pointer-events-none">
            <h2 className="text-[200px] leading-none font-black uppercase">{t.hero.trust}</h2>
          </div>

          <div className="relative z-10 space-y-8">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="heading-dynamic text-6xl md:text-8xl max-w-2xl leading-[0.9]"
            >
              {line1} <br />
              <span className="text-white/50">{line2}</span> <br />
              {line3}
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-zinc-400 text-lg max-w-md"
            >
              {currentDesc}
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <button className="button-primary group/btn">
                {t.nav.offer} 
                <ArrowRight className="group-hover/btn:translate-x-1 transition-transform" size={20} />
              </button>
            </motion.div>
          </div>
        </div>

        {/* Stats Column */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="flex-1 bg-surface-card border border-surface-border p-8 flex flex-col justify-center gap-2">
            <span className="text-primary text-5xl font-black font-display tracking-tighter">15+</span>
            <span className="text-sm font-bold uppercase tracking-widest text-zinc-500">{t.hero.stats.experience}</span>
          </div>
          
          <div className="flex-1 bg-surface-card border border-surface-border p-8 flex flex-col justify-center gap-2">
            <span className="text-primary text-5xl font-black font-display tracking-tighter">500+</span>
            <span className="text-sm font-bold uppercase tracking-widest text-zinc-500">{t.hero.stats.projects}</span>
          </div>

          <div className="flex-1 bg-primary p-8 flex items-center justify-between group cursor-pointer">
            <div className="space-y-1">
              <span className="text-black text-2xl font-black heading-dynamic leading-none block">{t.hero.stats.contact}</span>
            </div>
            <ArrowRight className="text-black group-hover:translate-x-2 transition-transform" size={32} />
          </div>
        </div>
      </div>
    </section>
  );
}
