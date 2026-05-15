import { motion } from 'motion/react';
import { Zap, Clock, ShieldCheck } from 'lucide-react';
import { translations } from '../lib/translations';
import React from 'react';

export default function WhyUs({ lang }: { lang: 'de' | 'en' }) {
  const t = translations[lang];
  const icons = [ShieldCheck, Zap, Clock];

  const points = t.whyUs.points.map((point, idx) => ({
    ...point,
    icon: icons[idx] ? React.createElement(icons[idx] as any, { className: "text-primary", size: 32, strokeWidth: 1.5 }) : null
  }));

  return (
    <section className="py-24 md:py-32 px-6 max-w-7xl mx-auto overflow-hidden">
      <div className="space-y-16 md:space-y-24">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center space-y-6 md:space-y-8 max-w-4xl mx-auto"
        >
          <span className="text-primary font-bold tracking-[0.4em] uppercase text-xs">Qualität & Vertrauen</span>
          <h2 className="heading-dynamic text-5xl md:text-8xl italic leading-[1] text-white">
            {t.whyUs.title.split(' ')[0]} <br className="hidden md:block" />
            <span className="text-primary font-black not-italic border-b-4 md:border-b-8 border-primary/20">
              {t.whyUs.title.split(' ').slice(1).join(' ')}
            </span>
          </h2>
          <p className="text-zinc-400 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
            {t.whyUs.subtitle}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {points.map((point, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ 
                delay: 0.1 * idx,
                duration: 0.8,
                ease: [0.16, 1, 0.3, 1]
              }}
              className="bg-white/5 border border-white/10 p-8 md:p-12 space-y-6 group hover:bg-primary transition-all duration-500 rounded-sm"
            >
              <div className="w-16 h-16 bg-white/5 rounded-sm flex items-center justify-center border border-white/10 group-hover:bg-white group-hover:border-white transition-colors duration-500">
                {point.icon}
              </div>
              <div className="space-y-4">
                <h4 className="text-2xl font-black uppercase tracking-tight text-white group-hover:text-black transition-colors">
                  {point.title}
                </h4>
                <p className="text-zinc-500 font-medium leading-relaxed group-hover:text-black/80 transition-colors">
                  {point.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* 100% Professionell Highlight Box */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full px-2 md:px-0 md:pr-10"
        >
          <div className="bg-primary p-6 md:p-20 flex flex-col lg:flex-row items-center justify-between gap-10 shadow-[8px_8px_0px_0px_white] md:shadow-[20px_20px_0px_0px_white] max-w-full overflow-hidden lg:overflow-visible">
            <div className="space-y-4 text-center lg:text-left w-full lg:w-auto">
              <span className="text-black text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-black font-display leading-[0.85] md:leading-[0.8] uppercase italic tracking-tighter block whitespace-normal break-words">
                100%<br />Professionell
              </span>
              <span className="text-black text-[10px] md:text-sm font-black uppercase tracking-[0.2em] md:tracking-[0.4em] block">
                zertifizierte Baudienstleistungen in Bayern
              </span>
            </div>
            <div className="hidden lg:block h-32 w-px bg-black/20" />
            <div className="grid grid-cols-2 gap-8 md:gap-16 w-full lg:w-auto">
              <div className="text-center lg:text-left">
                <span className="block text-4xl md:text-6xl font-black text-black italic">500+</span>
                <span className="text-[10px] font-black uppercase tracking-[0.1em] text-black/60">Projekte</span>
              </div>
              <div className="text-center lg:text-left">
                <span className="block text-4xl md:text-6xl font-black text-black italic">15+</span>
                <span className="text-[10px] font-black uppercase tracking-[0.1em] text-black/60">Jahre</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
