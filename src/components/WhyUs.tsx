import { motion } from 'motion/react';
import { Zap, Clock, ShieldCheck } from 'lucide-react';
import { translations } from '../lib/translations';
import React from 'react';
import { EditableText, EditableSection, useEditorCtx } from '../lib/editorContext';

export default function WhyUs({ lang }: { lang: 'de' | 'en' }) {
  const t = translations[lang];
  const { isEditing, settings: editorSettings } = useEditorCtx();
  const s = isEditing ? editorSettings : null;
  const icons = [ShieldCheck, Zap, Clock];

  const points = t.whyUs.points.map((point, idx) => ({
    ...point,
    icon: icons[idx]
      ? React.createElement(icons[idx] as any, { className: 'text-primary', size: 32, strokeWidth: 1.5 })
      : null,
  }));

  // Use editor overrides when in editing mode
  const titleWord1 = (s?.whyus_title || t.whyUs.title).split(' ')[0];
  const titleRest  = (s?.whyus_title || t.whyUs.title).split(' ').slice(1).join(' ');
  const subtitle   = s?.whyus_subtitle || t.whyUs.subtitle;

  return (
    <EditableSection id="whyus" label="Warum Wir">
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
            {isEditing ? (
              <EditableText
                field="whyus_title"
                value={s?.whyus_title || t.whyUs.title}
                tag="h2"
                className="heading-dynamic text-5xl md:text-8xl italic leading-[1] text-gray-900 block w-full"
              />
            ) : (
              <h2 className="heading-dynamic text-5xl md:text-8xl italic leading-[1] text-gray-900">
                {titleWord1}{' '}
                <br className="hidden md:block" />
                <span className="text-primary font-black not-italic border-b-4 md:border-b-8 border-primary/20">
                  {titleRest}
                </span>
              </h2>
            )}
            <EditableText
              field="whyus_subtitle"
              value={subtitle}
              tag="p"
              multiline
              className="text-gray-500 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed"
            />
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {points.map((point, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * idx, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="bg-white border border-gray-200 p-8 md:p-12 space-y-6 group hover:bg-primary transition-all duration-500 rounded-sm shadow-sm"
              >
                <div className="w-16 h-16 bg-gray-50 rounded-sm flex items-center justify-center border border-gray-200 group-hover:bg-white group-hover:border-white transition-colors duration-500 shadow-sm">
                  {point.icon}
                </div>
                <div className="space-y-4">
                  <EditableText
                    field={`whyus_${idx + 1}_title`}
                    value={s?.[`whyus_${idx + 1}_title`] || point.title}
                    tag="h4"
                    className="text-2xl font-black uppercase tracking-tight text-gray-900 group-hover:text-black transition-colors"
                  />
                  <EditableText
                    field={`whyus_${idx + 1}_desc`}
                    value={s?.[`whyus_${idx + 1}_desc`] || point.desc}
                    tag="p"
                    multiline
                    className="text-gray-500 font-medium leading-relaxed group-hover:text-black/70 transition-colors"
                  />
                </div>
              </motion.div>
            ))}
          </div>

          {/* 100% Professionell banner */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full"
          >
            <div className="bg-primary p-10 sm:p-14 md:p-20 text-left shadow-[12px_12px_0px_0px_rgba(17,17,17,0.15)] md:shadow-[24px_24px_0px_0px_rgba(17,17,17,0.15)] max-w-full overflow-hidden border-2 border-primary">
              <div className="space-y-6 md:space-y-8">
                <EditableText
                  field="whyus_banner_heading"
                  value={s?.whyus_banner_heading || '100%\nProfessionell'}
                  tag="h3"
                  multiline
                  className="text-black text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black italic tracking-tighter uppercase leading-[0.9] block whitespace-pre-line break-words"
                >
                  100%<br />Professionell
                </EditableText>
                <EditableText
                  field="whyus_banner_sub"
                  value={s?.whyus_banner_sub || 'Zertifizierte Baudienstleistungen in Bayern'}
                  tag="p"
                  className="text-black text-[10px] sm:text-xs md:text-sm lg:text-base font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] md:tracking-[0.4em] block"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </EditableSection>
  );
}
