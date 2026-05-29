import { motion } from 'motion/react';
import { Hammer, Drill, Building2, Truck, ArrowRight, Construction, Zap, ShieldCheck, Clock, Star, Award } from 'lucide-react';
import { translations } from '../lib/translations';
import type { Service } from '../App';

const ICON_MAP: Record<string, React.ReactNode> = {
  Hammer:       <Hammer className="text-primary" size={40} />,
  Drill:        <Drill className="text-primary" size={40} />,
  Building2:    <Building2 className="text-primary" size={40} />,
  Truck:        <Truck className="text-primary" size={40} />,
  Construction: <Construction className="text-primary" size={40} />,
  Zap:          <Zap className="text-primary" size={40} />,
  ShieldCheck:  <ShieldCheck className="text-primary" size={40} />,
  Clock:        <Clock className="text-primary" size={40} />,
  Star:         <Star className="text-primary" size={40} />,
  Award:        <Award className="text-primary" size={40} />,
};

interface ServicesProps {
  lang: 'de' | 'en';
  setCurrentPage?: (page: string) => void;
  dbServices?: Service[];
}

export default function Services({ lang, setCurrentPage, dbServices }: ServicesProps) {
  const t = translations[lang];

  const fallbackIcons = [
    <Hammer className="text-primary" size={40} />,
    <Building2 className="text-primary" size={40} />,
    <Drill className="text-primary" size={40} />,
    <Construction className="text-primary" size={40} />,
    <Truck className="text-primary" size={40} />
  ];

  const services = dbServices && dbServices.length > 0
    ? dbServices.map((svc, idx) => ({
        id: String(idx + 1).padStart(2, '0'),
        title: lang === 'de' ? (svc.title_de || svc.title) : (svc.title_en || svc.title),
        desc:  lang === 'de' ? (svc.description_de || svc.description) : (svc.description_en || svc.description),
        icon: ICON_MAP[svc.icon_name || 'Hammer'] || fallbackIcons[idx % fallbackIcons.length]
      }))
    : t.services.items.map((item, idx) => ({
        id: item.id,
        title: item.title,
        desc: item.desc,
        icon: fallbackIcons[idx] || <Hammer className="text-primary" size={40} />
      }));

  return (
    <section className="py-32 px-6 max-w-7xl mx-auto overflow-hidden relative bg-white">
      {/* Decorative */}
      <div className="absolute -top-20 -right-20 text-[300px] font-black text-gray-100 select-none pointer-events-none italic">
        BAU
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-20"
      >
        <div className="space-y-4">
          <span className="text-primary font-bold tracking-[0.4em] uppercase text-[10px] md:text-xs">{t.services.subtitle}</span>
          <h2 className="heading-dynamic text-5xl sm:text-6xl md:text-8xl italic text-gray-900 leading-[1.1]">{t.services.title}</h2>
        </div>
        <button
          onClick={() => setCurrentPage?.('contact')}
          className="flex items-center gap-3 text-gray-800 font-black uppercase tracking-[0.2em] text-sm hover:text-primary transition-colors group border-b-2 border-gray-200 hover:border-primary pb-1"
        >
          {t.services.all} <ArrowRight className="group-hover:translate-x-2 transition-transform" size={18} strokeWidth={3} />
        </button>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {services.map((service, idx) => (
          <motion.div
            key={service.id}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ delay: idx * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => setCurrentPage?.('contact')}
            className="bg-white border border-gray-200 p-10 hover:border-primary transition-all duration-500 relative overflow-hidden flex flex-col gap-8 group hover:-translate-y-3 cursor-pointer text-left h-full shadow-sm hover:shadow-lg"
          >
            <div className="flex justify-between items-start z-10">
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-sm group-hover:bg-primary group-hover:border-primary transition-colors duration-500">
                {service.icon}
              </div>
              <span className="text-gray-100 font-black italic text-6xl absolute top-4 right-6 group-hover:text-primary/10 transition-colors pointer-events-none">
                {service.id}
              </span>
            </div>
            <div className="space-y-4 z-10">
              <h3 className="heading-dynamic text-3xl tracking-tight leading-tight group-hover:text-primary transition-colors text-gray-900">{service.title}</h3>
              <p className="text-gray-500 text-base leading-relaxed font-medium">{service.desc}</p>
            </div>
            <div className="mt-auto pt-4 flex items-center gap-2 text-gray-800 font-bold text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity z-10">
              Details anfragen <ArrowRight size={14} strokeWidth={3} />
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
