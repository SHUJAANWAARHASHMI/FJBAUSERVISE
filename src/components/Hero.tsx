import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { translations } from '../lib/translations';
import { EditableText, EditableSection, useEditorCtx } from '../lib/editorContext';

export default function Hero({ settings, lang, setCurrentPage }: { settings: any, lang: 'en' | 'de', setCurrentPage: (page: string) => void }) {
  const t = translations[lang];
  const { isEditing, settings: editorSettings } = useEditorCtx();
  const s = isEditing ? (editorSettings ?? settings) : settings;

  const currentSlogan = lang === 'de'
    ? (s?.hero_heading_de || s?.slogan_de || s?.slogan || 'Präziser Abbruch & Rückbau in München')
    : (s?.hero_heading_en || s?.slogan_en || s?.slogan || 'Professional Demolition in Munich');

  const currentDesc = lang === 'de'
    ? (s?.hero_subtext_de || s?.description_de || s?.description || 'Ihr zertifizierter Fachbetrieb für Entkernung, Sanierung und Kernbohrung in Rosenheim und ganz Bayern.')
    : (s?.hero_subtext_en || s?.description_en || s?.description || 'Your certified specialist for dismantling, renovation and core drilling in Bavaria.');

  const buttonText = lang === 'de'
    ? (s?.hero_button_de || t.nav.offer)
    : (s?.hero_button_en || t.nav.offer);

  const stat1Value = s?.stats_years || '15+';
  const stat2Value = s?.stats_projects || '500+';
  const stat1Label = s?.stat_label_1_de || t.hero.stats.experience;
  const stat2Label = s?.stat_label_2_de || t.hero.stats.projects;

  const heroImage = s?.hero_image_url || 'https://images.unsplash.com/photo-1541913057-21998177505b?q=80&w=2070&auto=format&fit=crop';

  return (
    <EditableSection id="hero" label="Hero">
      <section className="relative pt-32 pb-20 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 md:gap-8">

          {/* Main Hero Card */}
          <div className="md:col-span-2 lg:col-span-8 bg-gray-900 border border-gray-800 p-8 md:p-14 relative overflow-hidden group min-h-[450px] md:min-h-[550px] flex flex-col justify-end shadow-xl">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
              {isEditing ? (
                <div className="relative w-full h-full group/heroimg">
                  <img
                    src={heroImage}
                    alt="FJ BAUSERVICE - Professionelle Abbrucharbeiten"
                    className="w-full h-full object-cover opacity-40 filter grayscale"
                    referrerPolicy="no-referrer"
                  />
                  {/* upload handled by EditableSection click — see SiteEditor media panel */}
                </div>
              ) : (
                <img
                  src={heroImage}
                  alt="FJ BAUSERVICE - Professionelle Abbrucharbeiten"
                  className="w-full h-full object-cover opacity-40 filter grayscale group-hover:scale-105 transition-transform duration-1000"
                  referrerPolicy="no-referrer"
                  fetchPriority="high"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />
            </div>

            {/* Badge */}
            <div className="absolute top-0 right-0 p-6">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-primary animate-pulse" />
                <span className="text-white text-[10px] md:text-xs font-bold uppercase tracking-[0.3em]">
                  {t.hero.badge}
                </span>
              </div>
            </div>

            {/* BG text */}
            <div className="absolute top-10 left-10 opacity-[0.04] select-none pointer-events-none">
              <h2 className="text-[120px] md:text-[240px] leading-none font-black uppercase italic tracking-tighter text-white">{t.hero.trust}</h2>
            </div>

            <div className="relative z-10 space-y-6 md:space-y-10">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <EditableText
                  field={lang === 'de' ? 'hero_heading_de' : 'hero_heading_en'}
                  value={currentSlogan}
                  tag="h1"
                  className="heading-dynamic text-4xl sm:text-5xl md:text-7xl lg:text-8xl max-w-2xl leading-[1.1] md:leading-[0.85] text-white"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <EditableText
                  field={lang === 'de' ? 'hero_subtext_de' : 'hero_subtext_en'}
                  value={currentDesc}
                  tag="p"
                  multiline
                  className="text-gray-300 text-sm md:text-xl max-w-md font-medium border-l-2 border-primary pl-4 md:pl-6"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <button
                  onClick={() => !isEditing && setCurrentPage('contact')}
                  className="button-primary group/btn w-full md:w-auto justify-center shadow-[6px_6px_0px_0px_rgba(17,17,17,0.3)] active:shadow-none active:translate-x-1 active:translate-y-1"
                >
                  <EditableText
                    field={lang === 'de' ? 'hero_button_de' : 'hero_button_en'}
                    value={buttonText}
                    tag="span"
                  />
                  <ArrowRight className="group-hover/btn:translate-x-1 transition-transform" size={18} strokeWidth={3} />
                </button>
              </motion.div>
            </div>
          </div>

          {/* Stats Column */}
          <div className="grid md:grid-cols-2 lg:grid-cols-1 lg:col-span-4 gap-6">
            <div className="bg-white border border-gray-200 shadow-sm p-8 md:p-10 flex flex-col justify-center gap-3 group hover:border-primary transition-colors">
              <EditableText
                field="stats_years"
                value={stat1Value}
                tag="span"
                className="text-gray-900 text-5xl md:text-7xl font-black font-display tracking-tighter group-hover:text-primary transition-colors"
              />
              <EditableText
                field="stat_label_1_de"
                value={stat1Label}
                tag="span"
                className="text-[10px] md:text-xs font-bold uppercase tracking-[0.4em] text-gray-500 underline decoration-primary decoration-4 underline-offset-8"
              />
            </div>

            <div className="bg-white border border-gray-200 shadow-sm p-8 md:p-10 flex flex-col justify-center gap-3 group hover:border-primary transition-colors">
              <EditableText
                field="stats_projects"
                value={stat2Value}
                tag="span"
                className="text-gray-900 text-5xl md:text-7xl font-black font-display tracking-tighter group-hover:text-primary transition-colors"
              />
              <EditableText
                field="stat_label_2_de"
                value={stat2Label}
                tag="span"
                className="text-[10px] md:text-xs font-bold uppercase tracking-[0.4em] text-gray-500 underline decoration-primary decoration-4 underline-offset-8"
              />
            </div>

            <div
              onClick={() => !isEditing && setCurrentPage('contact')}
              className="md:col-span-2 lg:col-span-1 bg-primary p-8 md:p-10 flex items-center justify-between group cursor-pointer hover:bg-gray-900 transition-all duration-500"
            >
              <span className="text-black group-hover:text-white text-2xl md:text-3xl font-black heading-dynamic leading-none">
                {t.hero.stats.contact}
              </span>
              <ArrowRight className="text-black group-hover:text-white group-hover:translate-x-2 transition-all" size={40} strokeWidth={3} />
            </div>
          </div>
        </div>
      </section>
    </EditableSection>
  );
}
