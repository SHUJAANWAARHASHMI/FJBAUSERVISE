import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';

import { translations } from '../lib/translations';

export default function Hero({ settings, lang, setCurrentPage }: { settings: any, lang: 'en' | 'de', setCurrentPage: (page: string) => void }) {
  const t = translations[lang];
  
  const currentSlogan = lang === 'de' 
    ? (settings?.slogan_de || settings?.slogan || "Raum für Neues Schaffen") 
    : (settings?.slogan_en || settings?.slogan || 'Building New Paths');
    
  const currentDesc = lang === 'de'
    ? (settings?.description_de || settings?.description || "Ihr Partner für Abbruch und Rückbau in Deutschland.")
    : (settings?.description_en || settings?.description || 'Your partner for demolition and reconstruction in Germany.');

  const heroImage = settings?.hero_image_url || 'https://images.unsplash.com/photo-1541913057-21998177505b?q=80&w=2070&auto=format&fit=crop';

  return (
    <section className="relative pt-32 pb-20 px-6 max-w-7xl mx-auto">
      <div className="grid lg:grid-cols-12 gap-8">
        {/* Main Hero Card */}
        <div className="lg:col-span-8 bg-surface-card border border-surface-border p-10 relative overflow-hidden group min-h-[500px] flex flex-col justify-end">
          {/* Background Image */}
          <div className="absolute inset-0 z-0">
            <img 
              src={heroImage} 
              alt="Hero" 
              className="w-full h-full object-cover opacity-20 filter grayscale group-hover:scale-105 transition-transform duration-1000"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface-card via-surface-card/50 to-transparent" />
          </div>

          <div className="absolute top-0 right-0 p-4">
            <span className="bg-primary/10 text-primary border border-primary/20 px-4 py-1 text-xs font-bold uppercase tracking-wider">
              {t.hero.badge}
            </span>
          </div>
          
          {/* Background Decorative Text */}
          <div className="absolute top-10 left-10 opacity-[0.03] select-none pointer-events-none">
            <h2 className="text-[120px] md:text-[200px] leading-none font-black uppercase">{t.hero.trust}</h2>
          </div>

          <div className="relative z-10 space-y-8">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="heading-dynamic text-5xl md:text-8xl max-w-2xl leading-[1.1] md:leading-[0.9]"
            >
              {currentSlogan}
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
              <button 
                onClick={() => setCurrentPage('contact')}
                className="button-primary group/btn"
              >
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

          <div 
            onClick={() => setCurrentPage('contact')}
            className="flex-1 bg-primary p-8 flex items-center justify-between group cursor-pointer"
          >
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
