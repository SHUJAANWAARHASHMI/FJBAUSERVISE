/**
 * AboutUs.tsx — DB-driven About Us page
 * Only the hero + intro + stats block is shown.
 */

import { motion } from 'motion/react';

interface AboutUsProps {
  settings: any;
  setCurrentPage: (page: string) => void;
}

const v = (settings: any, key: string, fallback: string) =>
  (settings?.[key] && String(settings[key]).trim()) ? String(settings[key]) : fallback;

function RichContent({ html, className }: { html: string; className?: string }) {
  const isHtml = /<[a-z][\s\S]*>/i.test(html);
  if (isHtml) {
    return (
      <div
        className={`prose prose-invert max-w-none ${className ?? ''}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }
  return (
    <p className={className ?? ''}>
      {html.split('\n').map((line, i, arr) => (
        <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
      ))}
    </p>
  );
}

export default function AboutUs({ settings: s, setCurrentPage: _setCurrentPage }: AboutUsProps) {
  const heroKicker      = v(s, 'about_hero_kicker',              'Unsere Geschichte');
  const heroHeading     = v(s, 'about_hero_heading',             'Präzision im');
  const heroHighlight   = v(s, 'about_hero_heading_highlight',   'Rückbau.');

  const quote = v(s, 'about_quote',
    `"Wir schaffen seit über ${v(s, 'stats_years', '5')} Jahren Raum für Neues in Bayern."`);
  const intro = v(s, 'about_intro',
    `${v(s, 'name', 'FJ Bauservice')} ist Ihr inhabergeführtes Abbruchunternehmen in München & Rosenheim. ` +
    `Wir stehen für fachgerechten Rückbau, Gebäudeentkernung und Kernbohrungen — präzise, sicher und termingetreu.`);

  const stat1v = v(s, 'about_stat1_value', '5+');
  const stat1l = v(s, 'about_stat1_label', 'Jahre Erfahrung');
  const stat2v = v(s, 'about_stat2_value', '100+');
  const stat2l = v(s, 'about_stat2_label', 'Projekte');
  const stat3v = v(s, 'about_stat3_value', '100%');
  const stat3l = v(s, 'about_stat3_label', 'Termintreue');

  const aboutImg = v(s, 'about_image_url',
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=2070&auto=format&fit=crop');

  const fade = (delay = 0) => ({
    initial: { opacity: 0, y: 28 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.75, ease: [0.16, 1, 0.3, 1], delay },
  });

  return (
    <div className="overflow-hidden">

      {/* ── HERO ── */}
      <section className="pt-40 pb-16 px-6 max-w-7xl mx-auto">
        <motion.div className="space-y-6 max-w-5xl" {...fade()}>
          <span className="text-primary font-bold tracking-[0.4em] uppercase text-[10px] md:text-xs">
            {heroKicker}
          </span>
          <h1 className="heading-dynamic text-5xl sm:text-7xl md:text-[130px] italic leading-[0.9] md:leading-[0.85] text-text-main">
            {heroHeading}
            <br />
            <span className="text-primary not-italic font-black">{heroHighlight}</span>
          </h1>
        </motion.div>
      </section>

      {/* ── INTRO + STATS ── */}
      <section className="pb-32 px-6 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-32 items-start">

          {/* Text + stats */}
          <motion.div className="space-y-10" {...fade(0.1)}>
            <p className="text-text-main text-2xl md:text-3xl font-black italic border-l-4 border-primary pl-8 py-2">
              {quote}
            </p>
            <RichContent
              html={intro}
              className="text-text-muted text-base md:text-lg font-medium leading-relaxed"
            />

            {/* Stats */}
            <div className="pt-8 flex flex-wrap gap-12 border-t border-surface-border">
              {[
                { value: stat1v, label: stat1l },
                { value: stat2v, label: stat2l },
                { value: stat3v, label: stat3l },
              ].map((st, i) => (
                <div key={i}>
                  <span className="block text-4xl font-black text-primary italic leading-none">
                    {st.value}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mt-2 block">
                    {st.label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Image */}
          <motion.div className="relative group" {...fade(0.2)}>
            <div className="aspect-[3/4] bg-surface-card border border-surface-border overflow-hidden shadow-2xl relative z-10">
              <img
                src={aboutImg}
                alt="FJ BAUSERVICE Fachbetrieb"
                className="w-full h-full object-cover opacity-60 filter grayscale brightness-75 group-hover:scale-110 transition-transform duration-1000"
                loading="lazy"
              />
            </div>
            <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-primary opacity-20 -z-10" />
          </motion.div>
        </div>
      </section>

    </div>
  );
}
