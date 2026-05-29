import { motion } from 'motion/react';
import { translations } from '../lib/translations';
import { EditableText, EditableSection, useEditorCtx } from '../lib/editorContext';

export default function CTA({ settings, lang, setCurrentPage }: { settings: any, lang: 'de' | 'en', setCurrentPage: (page: string) => void }) {
  const t = translations[lang];
  const { isEditing, settings: editorSettings } = useEditorCtx();
  const s = isEditing ? (editorSettings ?? settings) : settings;

  const ctaImage = s?.cta_image_url || 'https://images.unsplash.com/photo-1590644365607-1c5a519a9a37?q=80&w=2070&auto=format&fit=crop';

  const ctaTitle    = lang === 'de' ? (s?.cta_title_de    || t.cta.title)    : (s?.cta_title_en    || t.cta.title);
  const ctaSubtitle = lang === 'de' ? (s?.cta_subtitle_de || t.cta.subtitle) : (s?.cta_subtitle_en || t.cta.subtitle);
  const ctaButton   = lang === 'de' ? (s?.cta_button_de   || t.cta.button)   : (s?.cta_button_en   || t.cta.button);

  return (
    <EditableSection id="cta" label="Call to Action">
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
            alt="FJ BAUSERVICE Rückbau"
            className="w-full h-full object-cover opacity-10 filter grayscale"
            referrerPolicy="no-referrer"
            loading="lazy"
          />
        </motion.div>

        {/* Decorative BG text */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          whileInView={{ opacity: 0.12, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 1 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none pointer-events-none z-[1]"
        >
          <span className="text-[250px] md:text-[400px] font-black heading-dynamic whitespace-nowrap text-black italic">
            {s?.name?.split(' ')[0] || 'FJ'}
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
            <EditableText
              field={lang === 'de' ? 'cta_title_de' : 'cta_title_en'}
              value={ctaTitle}
              tag="h2"
              className="heading-dynamic text-black text-5xl sm:text-6xl md:text-9xl leading-[1.1] md:leading-[0.9] italic"
            />
            <EditableText
              field={lang === 'de' ? 'cta_subtitle_de' : 'cta_subtitle_en'}
              value={ctaSubtitle}
              tag="p"
              multiline
              className="text-black/80 text-base md:text-2xl font-bold leading-relaxed max-w-2xl mx-auto"
            />
          </motion.div>

          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => !isEditing && setCurrentPage('contact')}
            className="bg-white text-black hover:bg-gray-900 hover:text-white px-16 py-8 font-black uppercase tracking-[0.3em] text-sm transition-all shadow-[10px_10px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-none active:translate-x-2 active:translate-y-2"
          >
            <EditableText
              field={lang === 'de' ? 'cta_button_de' : 'cta_button_en'}
              value={ctaButton}
              tag="span"
            />
          </motion.button>
        </div>
      </section>
    </EditableSection>
  );
}
