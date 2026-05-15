import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';

import { translations } from '../lib/translations';

export default function Hero({ settings, lang, setCurrentPage }: { settings: any, lang: 'en' | 'de', setCurrentPage: (page: string) => void }) {
  const t = translations[lang];
  
  const currentSlogan = settings?.slogan_de || settings?.slogan || "Präziser Abbruch & Rückbau in München";
  const currentDesc = settings?.description_de || settings?.description || "Ihr zertifizierter Fachbetrieb für Entkernung, Sanierung und Kernbohrung in Rosenheim und ganz Bayern.";

  const heroImage = settings?.hero_image_url || 'https://images.unsplash.com/photo-1541913057-21998177505b?q=80&w=2070&auto=format&fit=crop';

  return (
    <section className="relative pt-32 pb-20 px-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 md:gap-8">
        {/* Main Hero Card */}
        <div className="md:col-span-2 lg:col-span-8 bg-surface-card border border-surface-border p-8 md:p-14 relative overflow-hidden group min-h-[450px] md:min-h-[550px] flex flex-col justify-end">
          {/* Background Image */}
          <div className="absolute inset-0 z-0">
            <img 
              src={heroImage} 
              alt="FJ BAUSERVICE - Professionelle Abbrucharbeiten und Rückbau München" 
              className="w-full h-full object-cover opacity-30 filter grayscale sepia-[0.2] group-hover:scale-105 transition-transform duration-1000"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          </div>

          <div className="absolute top-0 right-0 p-6">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-primary animate-pulse" />
              <span className="text-text-main text-[10px] md:text-xs font-bold uppercase tracking-[0.3em]">
                {t.hero.badge}
              </span>
            </div>
          </div>
          
          {/* Background Decorative Text */}
          <div className="absolute top-10 left-10 opacity-[0.05] select-none pointer-events-none">
            <h2 className="text-[120px] md:text-[240px] leading-none font-black uppercase italic tracking-tighter">{t.hero.trust}</h2>
          </div>

          <div className="relative z-10 space-y-6 md:space-y-10">
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="heading-dynamic text-4xl sm:text-5xl md:text-7xl lg:text-8xl max-w-2xl leading-[1.1] md:leading-[0.85] text-text-main"
            >
              {currentSlogan}
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-zinc-400 text-sm md:text-xl max-w-md font-medium border-l-2 border-primary pl-4 md:pl-6"
            >
              {currentDesc}
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <button 
                onClick={() => setCurrentPage('contact')}
                className="button-primary group/btn w-full md:w-auto justify-center shadow-[6px_6px_0px_0px_var(--shadow-color)] active:shadow-none active:translate-x-1 active:translate-y-1"
              >
                {t.nav.offer} 
                <ArrowRight className="group-hover/btn:translate-x-1 transition-transform" size={18} strokeWidth={3} />
              </button>
            </motion.div>
          </div>
        </div>

        {/* Stats Column */}
        <div className="grid md:grid-cols-2 lg:grid-cols-1 lg:col-span-4 gap-6">
          <div className="bg-surface-card border border-surface-border p-8 md:p-10 flex flex-col justify-center gap-3 group hover:border-primary transition-colors">
            <span className="text-text-main text-5xl md:text-7xl font-black font-display tracking-tighter group-hover:text-primary transition-colors">{settings?.stats_years || '15+'}</span>
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.4em] text-zinc-500 underline decoration-primary decoration-4 underline-offset-8">
              {t.hero.stats.experience}
            </span>
          </div>
          
          <div className="bg-surface-card border border-surface-border p-8 md:p-10 flex flex-col justify-center gap-3 group hover:border-primary transition-colors">
            <span className="text-text-main text-5xl md:text-7xl font-black font-display tracking-tighter group-hover:text-primary transition-colors">{settings?.stats_projects || '500+'}</span>
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.4em] text-zinc-500 underline decoration-primary decoration-4 underline-offset-8">
              {t.hero.stats.projects}
            </span>
          </div>

          <div 
            onClick={() => setCurrentPage('contact')}
            className="md:col-span-2 lg:col-span-1 bg-primary p-8 md:p-10 flex items-center justify-between group cursor-pointer hover:bg-text-main transition-all duration-500"
          >
            <div className="space-y-1">
              <span className="text-black text-2xl md:text-3xl font-black heading-dynamic leading-none block">{t.hero.stats.contact}</span>
            </div>
            <ArrowRight className="text-black group-hover:translate-x-2 transition-transform" size={40} strokeWidth={3} />
          </div>
        </div>
      </div>
    </section>
  );
}
