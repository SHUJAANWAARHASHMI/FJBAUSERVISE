import { motion } from 'motion/react';
import { Hammer, Drill, Building2, Truck, ArrowRight } from 'lucide-react';
import { translations } from '../lib/translations';

export default function Services({ lang, setCurrentPage }: { lang: 'de' | 'en', setCurrentPage?: (page: string) => void }) {
  const t = translations[lang];
  const icons = [
    <Hammer className="text-primary" size={32} />,
    <Drill className="text-primary" size={32} />,
    <Building2 className="text-primary" size={32} />,
    <Truck className="text-primary" size={32} />
  ];

  const services = t.services.items.map((item, idx) => ({
    ...item,
    icon: icons[idx]
  }));

  return (
    <section className="py-24 px-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
        <h2 className="heading-dynamic text-5xl md:text-7xl">{t.services.title}</h2>
        <button 
          onClick={() => setCurrentPage?.('contact')}
          className="flex items-center gap-2 text-primary font-bold uppercase tracking-widest hover:text-white transition-colors group"
        >
          {t.services.all} <ArrowRight className="group-hover:translate-x-2 transition-transform" size={20} />
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {services.map((service, idx) => (
          <motion.div
            key={service.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ 
              delay: idx * 0.1,
              duration: 0.5,
              ease: [0.21, 0.47, 0.32, 0.98]
            }}
            onClick={() => setCurrentPage?.('contact')}
            className="card-service flex flex-col gap-6 group hover:-translate-y-2 cursor-pointer text-left"
          >
            <div className="flex justify-between items-start">
              <span className="text-primary/30 font-black italic text-2xl">{service.id}</span>
              {service.icon}
            </div>
            <div className="space-y-3">
              <h3 className="heading-dynamic text-2xl tracking-normal">{service.title}</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">{service.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
