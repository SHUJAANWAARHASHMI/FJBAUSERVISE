import { motion } from 'motion/react';
import { Zap, Clock, ShieldCheck } from 'lucide-react';
import { translations } from '../lib/translations';
import React from 'react';

export default function WhyUs({ lang }: { lang: 'de' | 'en' }) {
  const t = translations[lang];
  const icons = [ShieldCheck, Zap, Clock];

  const points = t.whyUs.points.map((point, idx) => ({
    ...point,
    icon: icons[idx] ? React.createElement(icons[idx] as any, { className: "text-primary" }) : null
  }));

  return (
    <section className="py-24 px-6 max-w-7xl mx-auto overflow-hidden">
      <div className="grid lg:grid-cols-2 gap-20 items-center">
        <div className="space-y-12">
          <div className="space-y-6">
            <h2 className="heading-dynamic text-5xl md:text-7xl leading-tight">
              {t.whyUs.title.split(' ')[0]}<br />
              <span className="text-primary">{t.whyUs.title.split(' ').slice(1).join(' ')}</span>
            </h2>
            <p className="text-zinc-400 text-lg max-w-xl">
              {t.whyUs.subtitle}
            </p>
          </div>

          <div className="space-y-8">
            {points.map((point, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="flex gap-6"
              >
                <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center shrink-0 border border-primary/20">
                  {point.icon}
                </div>
                <div className="space-y-2">
                  <h4 className="text-xl font-bold uppercase">{point.title}</h4>
                  <p className="text-zinc-500 text-sm">{point.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bento Grid Visual */}
        <div className="grid grid-cols-2 gap-4 h-[600px]">
          <div className="bg-surface-card border border-surface-border relative overflow-hidden group">
            <img 
              src="https://picsum.photos/seed/build1/600/800?grayscale" 
              className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-110 transition-transform duration-700" 
              alt="Worker"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="space-y-4">
            <div className="bg-surface-card border border-surface-border h-1/2 relative overflow-hidden group">
              <img 
                src="https://picsum.photos/seed/build2/600/600?grayscale" 
                className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-110 transition-transform duration-700" 
                alt="Site"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="bg-primary h-[calc(50%-16px)] flex flex-col justify-end p-8 gap-2">
               <span className="text-black text-4xl font-black font-display leading-tight">100% SUSTAINABILITY</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
