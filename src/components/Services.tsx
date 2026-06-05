import { motion } from 'motion/react';
import { Hammer, Drill, Building2, Truck, ArrowRight, Construction, Zap, ShieldCheck, Clock, Star, Award } from 'lucide-react';
import { translations } from '../lib/translations';
import type { Service } from '../App';
import { EditableText, EditableSection, useEditorCtx } from '../lib/editorContext';

const ICON_MAP: Record<string, React.ReactNode> = {
  Hammer:       <Hammer className="text-primary" size={32} strokeWidth={1.5} />,
  Drill:        <Drill className="text-primary" size={32} strokeWidth={1.5} />,
  Building2:    <Building2 className="text-primary" size={32} strokeWidth={1.5} />,
  Truck:        <Truck className="text-primary" size={32} strokeWidth={1.5} />,
  Construction: <Construction className="text-primary" size={32} strokeWidth={1.5} />,
  Zap:          <Zap className="text-primary" size={32} strokeWidth={1.5} />,
  ShieldCheck:  <ShieldCheck className="text-primary" size={32} strokeWidth={1.5} />,
  Clock:        <Clock className="text-primary" size={32} strokeWidth={1.5} />,
  Star:         <Star className="text-primary" size={32} strokeWidth={1.5} />,
  Award:        <Award className="text-primary" size={32} strokeWidth={1.5} />,
};

interface ServicesProps {
  lang: 'de' | 'en';
  setCurrentPage?: (page: string) => void;
  dbServices?: Service[];
}

export default function Services({ lang, setCurrentPage, dbServices }: ServicesProps) {
  const t = translations[lang];
  const { isEditing, settings: editorSettings } = useEditorCtx();
  const s = isEditing ? editorSettings : null;

  const fallbackIcons = [
    <Hammer className="text-primary" size={32} strokeWidth={1.5} />,
    <Building2 className="text-primary" size={32} strokeWidth={1.5} />,
    <Drill className="text-primary" size={32} strokeWidth={1.5} />,
    <Construction className="text-primary" size={32} strokeWidth={1.5} />,
    <Truck className="text-primary" size={32} strokeWidth={1.5} />,
  ];

  const services = dbServices && dbServices.length > 0
    ? dbServices.map((svc, idx) => ({
        id: String(idx + 1).padStart(2, '0'),
        title: lang === 'de' ? (svc.title_de || svc.title) : (svc.title_en || svc.title),
        desc:  lang === 'de' ? (svc.description_de || svc.description) : (svc.description_en || svc.description),
        icon: ICON_MAP[svc.icon_name || 'Hammer'] || fallbackIcons[idx % fallbackIcons.length],
      }))
    : t.services.items.map((item, idx) => ({
        id: item.id,
        title: item.title,
        desc: item.desc,
        icon: fallbackIcons[idx] || <Hammer className="text-primary" size={32} strokeWidth={1.5} />,
      }));

  const sectionTitle    = s?.services_title    || t.services.title;
  const sectionSubtitle = s?.services_subtitle || t.services.subtitle;

  return (
    <EditableSection id="services" label="Leistungen">
      <section className="py-24 md:py-32 px-4 sm:px-6 bg-white relative overflow-hidden">

        {/* Decorative – clipped so it never causes horizontal overflow */}
        <div
          aria-hidden="true"
          className="absolute -top-10 -right-10 text-[180px] sm:text-[260px] font-black text-gray-100 select-none pointer-events-none italic leading-none overflow-hidden"
          style={{ maxWidth: '60vw', right: 0, top: 0, overflow: 'hidden' }}
        >
          BAU
        </div>

        <div className="max-w-7xl mx-auto relative z-10">

          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-14 md:mb-20"
          >
            <div className="space-y-3 min-w-0">
              <EditableText
                field="services_subtitle"
                value={sectionSubtitle}
                tag="span"
                className="text-primary font-bold tracking-[0.4em] uppercase text-[10px] md:text-xs block"
              />
              <EditableText
                field="services_title"
                value={sectionTitle}
                tag="h2"
                className="heading-dynamic text-4xl sm:text-5xl md:text-7xl italic text-gray-900 leading-[1.05] break-words"
              />
            </div>
            <button
              onClick={() => !isEditing && setCurrentPage?.('contact')}
              className="flex items-center gap-2 text-gray-800 font-black uppercase tracking-[0.2em] text-xs whitespace-nowrap hover:text-primary transition-colors group border-b-2 border-gray-200 hover:border-primary pb-1 flex-shrink-0 self-start sm:self-auto"
            >
              {t.services.all}
              <ArrowRight className="group-hover:translate-x-1 transition-transform" size={16} strokeWidth={3} />
            </button>
          </motion.div>

          {/* Service cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-6">
            {services.map((service, idx) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ delay: idx * 0.08, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                onClick={() => !isEditing && setCurrentPage?.('contact')}
                className="bg-white border border-gray-200 hover:border-primary transition-all duration-500 relative overflow-hidden flex flex-col group hover:-translate-y-2 cursor-pointer shadow-sm hover:shadow-lg rounded-sm"
              >
                <div className="p-7 md:p-8 flex flex-col gap-6 h-full">
                  {/* Icon row */}
                  <div className="flex justify-between items-start">
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-sm group-hover:bg-primary group-hover:border-primary transition-colors duration-500 flex-shrink-0">
                      {service.icon}
                    </div>
                    <span
                      aria-hidden="true"
                      className="text-gray-100 font-black italic text-5xl leading-none group-hover:text-primary/10 transition-colors select-none pointer-events-none"
                    >
                      {service.id}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="space-y-3 flex-1 min-w-0">
                    <h3 className="heading-dynamic text-xl md:text-2xl tracking-tight leading-tight group-hover:text-primary transition-colors text-gray-900 break-words">
                      {service.title}
                    </h3>
                    <p className="text-gray-500 text-sm leading-relaxed font-medium line-clamp-4">
                      {service.desc}
                    </p>
                  </div>

                  {/* CTA row */}
                  <div className="pt-2 flex items-center gap-2 text-gray-800 font-bold text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                    Details anfragen
                    <ArrowRight size={12} strokeWidth={3} />
                  </div>
                </div>

                {/* Gradient overlay */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-br from-primary/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                />
              </motion.div>
            ))}
          </div>

        </div>
      </section>
    </EditableSection>
  );
}
