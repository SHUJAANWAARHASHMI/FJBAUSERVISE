/**
 * AboutUs.tsx — Fully DB-driven About Us page
 *
 * All content is read from siteSettings (site_settings table row id=1).
 * Every field has a hardcoded default so the page renders even before
 * the client has filled in the CMS.
 *
 * Sections:
 *  1. Hero           — kicker / heading / highlight word
 *  2. Intro          — quote + rich-text company intro paragraph
 *  3. Stats          — 3 configurable stat blocks
 *  4. Mission/Vision — two rich-text blocks side-by-side
 *  5. Company Image  — about_image_url full-width editorial image
 *  6. History        — rich-text timeline / history block
 *  7. Why Choose Us  — mirrors WhyUs section (reuses SITE_SETTINGS whyus_* fields)
 *  8. Team           — heading + rich-text body
 *  9. Certifications — heading + rich-text body
 * 10. CTA            — button → contact page
 */

import { motion } from 'motion/react';
import { ShieldCheck, Zap, Clock, ArrowRight } from 'lucide-react';

interface AboutUsProps {
  settings: any;
  setCurrentPage: (page: string) => void;
}

// ─── helpers ─────────────────────────────────────────────────────────────────
const v = (settings: any, key: string, fallback: string) =>
  (settings?.[key] && String(settings[key]).trim()) ? String(settings[key]) : fallback;

// Render rich text (HTML string) or plain text safely
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
    <p className={`${className ?? ''}`}>
      {html.split('\n').map((line, i) => (
        <span key={i}>{line}{i < html.split('\n').length - 1 && <br />}</span>
      ))}
    </p>
  );
}

export default function AboutUs({ settings: s, setCurrentPage }: AboutUsProps) {
  // ── field values with defaults ────────────────────────────────────────────
  const heroKicker   = v(s, 'about_hero_kicker',   'Unsere Geschichte');
  const heroHeading  = v(s, 'about_hero_heading',  'Präzision im');
  const heroHighlight = v(s, 'about_hero_heading_highlight', 'Rückbau.');

  const quote  = v(s, 'about_quote',
    `"Wir schaffen seit über ${v(s, 'stats_years', '15')} Jahren Raum für Neues in Bayern."`);
  const intro  = v(s, 'about_intro',
    `${v(s, 'name', 'FJ Bauservice')} ist Ihr inhabergeführtes Abbruchunternehmen in München & Rosenheim. ` +
    `Wir stehen für fachgerechten Rückbau, Gebäudeentkernung und Kernbohrungen — präzise, sicher und termingetreu.`);

  const mission = v(s, 'about_mission',
    'Unsere Mission ist es, Räume für neue Möglichkeiten zu schaffen. Wir arbeiten mit modernster Technik und höchsten Sicherheitsstandards, um Ihre Projekte pünktlich und im Budget umzusetzen.');
  const vision  = v(s, 'about_vision',
    'Unsere Vision ist eine Welt, in der Abriss und Neubau Hand in Hand gehen — nachhaltig, emissionsarm und zukunftsorientiert. Wir investieren kontinuierlich in neue Technologien und in unser Team.');
  const history = v(s, 'about_history',
    '<p>Gegründet von Florian Jochum, hat sich <strong>FJ BAUSERVICE</strong> in über 15 Jahren zu einem der führenden Abbruchunternehmen in Oberbayern entwickelt.</p>' +
    '<p>Von kleinen Wohnungsentkernungen in München bis hin zu großen Industrierückbauten in der Region — unser erfahrenes Team hat bereits über 500 Projekte erfolgreich abgeschlossen.</p>' +
    '<p>Heute beschäftigen wir ein eingespieltes Team aus Fachkräften, das jeden Auftrag mit Leidenschaft und Präzision angeht.</p>');

  const stat1v = v(s, 'about_stat1_value', v(s, 'stats_years', '15+'));
  const stat1l = v(s, 'about_stat1_label', 'Jahre Erfahrung');
  const stat2v = v(s, 'about_stat2_value', v(s, 'stats_projects', '500+'));
  const stat2l = v(s, 'about_stat2_label', 'Projekte');
  const stat3v = v(s, 'about_stat3_value', '100%');
  const stat3l = v(s, 'about_stat3_label', 'Termintreue');

  const teamHeading = v(s, 'about_team_heading', 'Unser Team');
  const teamContent = v(s, 'about_team_content',
    '<p>Hinter <strong>FJ BAUSERVICE</strong> steht ein erfahrenes Team aus Abbruch-Fachkräften, die mit Leidenschaft und Präzision arbeiten. Alle Mitarbeiter sind regelmäßig geschult und zertifiziert.</p>');

  const certHeading = v(s, 'about_cert_heading', 'Zertifizierungen & Auszeichnungen');
  const certContent = v(s, 'about_cert_content',
    '<ul><li>Zertifizierter Abbruchbetrieb nach TRGS 519 (Asbest)</li><li>Mitglied im Bayerischen Baugewerbe-Verband</li><li>Zertifiziertes Fachunternehmen für Schadstoffsanierung</li><li>Regelmäßige Weiterbildungen und Sicherheitsschulungen</li></ul>');

  const ctaText   = v(s, 'about_cta_text', 'Unverbindliches Angebot einholen');
  const aboutImg  = v(s, 'about_image_url',
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=2070&auto=format&fit=crop');
  const aboutImg2 = v(s, 'about_image2_url',
    'https://images.unsplash.com/photo-1581092335878-2d9ff86ca2bf?q=80&w=2070&auto=format&fit=crop');

  // WhyUs points (from shared whyus_* fields)
  const whyPoints = [
    {
      icon: <ShieldCheck className="text-primary" size={32} strokeWidth={1.5} />,
      title: v(s, 'whyus_1_title', 'Regionale Expertise'),
      desc:  v(s, 'whyus_1_desc',  'Tief verwurzelt in München und Rosenheim kennen wir die lokalen Anforderungen.'),
    },
    {
      icon: <Zap className="text-primary" size={32} strokeWidth={1.5} />,
      title: v(s, 'whyus_2_title', 'Moderne Technik'),
      desc:  v(s, 'whyus_2_desc',  'Wir nutzen modernste Equipment für emissionsarmen Abbruch und präzise Kernbohrungen.'),
    },
    {
      icon: <Clock className="text-primary" size={32} strokeWidth={1.5} />,
      title: v(s, 'whyus_3_title', 'Zertifizierte Sicherheit'),
      desc:  v(s, 'whyus_3_desc',  'Höchste Sicherheitsstandards beim Rückbau und der Entkernung Ihrer Objekte.'),
    },
  ];

  const fade = (delay = 0) => ({
    initial: { opacity: 0, y: 28 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.75, ease: [0.16, 1, 0.3, 1], delay },
  });

  return (
    <div className="overflow-hidden">

      {/* ── 1. HERO ─────────────────────────────────────────────────────── */}
      <section className="pt-40 pb-24 px-6 max-w-7xl mx-auto">
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

      {/* ── 2. INTRO (quote + text + stats) ─────────────────────────────── */}
      <section className="pb-24 px-6 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-32 items-start">
          {/* Text column */}
          <motion.div className="space-y-10 text-text-muted text-lg md:text-xl font-medium leading-relaxed" {...fade(0.1)}>
            <p className="text-text-main text-2xl md:text-3xl font-black italic border-l-4 border-primary pl-8 py-2">
              {quote}
            </p>
            <RichContent html={intro} className="text-text-muted text-base md:text-lg font-medium leading-relaxed" />

            {/* Stats */}
            <div className="pt-8 flex flex-wrap gap-12 border-t border-surface-border">
              {[
                { value: stat1v, label: stat1l },
                { value: stat2v, label: stat2l },
                { value: stat3v, label: stat3l },
              ].map((st, i) => (
                <div key={i}>
                  <span className="block text-4xl font-black text-primary italic leading-none">{st.value}</span>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mt-2 block">{st.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Image column */}
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

      {/* ── 3. MISSION / VISION ─────────────────────────────────────────── */}
      <section className="py-24 bg-zinc-950 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8 md:gap-16">
          <motion.div className="space-y-5 p-8 md:p-12 bg-black border border-zinc-800 rounded-sm" {...fade()}>
            <span className="text-primary text-[10px] font-black uppercase tracking-[0.4em]">Mission</span>
            <h3 className="text-2xl font-black uppercase tracking-tight text-white">Unsere Mission</h3>
            <RichContent html={mission} className="text-zinc-400 text-base leading-relaxed" />
          </motion.div>
          <motion.div className="space-y-5 p-8 md:p-12 bg-black border border-zinc-800 rounded-sm" {...fade(0.15)}>
            <span className="text-primary text-[10px] font-black uppercase tracking-[0.4em]">Vision</span>
            <h3 className="text-2xl font-black uppercase tracking-tight text-white">Unsere Vision</h3>
            <RichContent html={vision} className="text-zinc-400 text-base leading-relaxed" />
          </motion.div>
        </div>
      </section>

      {/* ── 4. FULL-WIDTH IMAGE ──────────────────────────────────────────── */}
      <section className="relative h-[50vh] md:h-[65vh] overflow-hidden">
        <img
          src={aboutImg2}
          alt="FJ BAUSERVICE im Einsatz"
          className="w-full h-full object-cover brightness-50 grayscale"
          loading="lazy"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div className="text-center space-y-4 px-6" {...fade()}>
            <p className="text-white text-3xl md:text-6xl font-black italic uppercase tracking-tight leading-tight">
              100%<br />Professionell
            </p>
            <p className="text-primary text-[10px] md:text-xs font-black uppercase tracking-[0.4em]">
              Zertifizierte Baudienstleistungen in Bayern
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── 5. COMPANY HISTORY ──────────────────────────────────────────── */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <motion.div className="max-w-3xl mx-auto space-y-8" {...fade()}>
          <span className="text-primary font-bold tracking-[0.4em] uppercase text-[10px] md:text-xs">Geschichte</span>
          <h2 className="heading-dynamic text-4xl md:text-6xl font-black italic uppercase tracking-tight text-text-main">
            Unsere<br /><span className="text-primary">Geschichte.</span>
          </h2>
          <RichContent
            html={history}
            className="text-text-muted text-base md:text-lg leading-relaxed"
          />
        </motion.div>
      </section>

      {/* ── 6. WHY CHOOSE US ────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-zinc-50 dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto space-y-16">
          <motion.div className="text-center space-y-4 max-w-3xl mx-auto" {...fade()}>
            <span className="text-primary font-bold tracking-[0.4em] uppercase text-xs">Qualität & Vertrauen</span>
            <h2 className="heading-dynamic text-4xl md:text-6xl italic font-black uppercase tracking-tight text-text-main">
              {v(s, 'whyus_title', 'Warum FJ BAUSERVICE?')}
            </h2>
            <p className="text-text-muted text-lg font-medium">
              {v(s, 'whyus_subtitle', 'Präzision, Termintreue und Transparenz sind die Grundpfeiler unserer Arbeit.')}
            </p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {whyPoints.map((pt, i) => (
              <motion.div
                key={i}
                className="bg-white border border-gray-200 p-8 md:p-10 space-y-5 group hover:bg-primary transition-all duration-500 rounded-sm shadow-sm"
                {...fade(0.1 * i)}
              >
                <div className="w-14 h-14 bg-gray-50 rounded-sm flex items-center justify-center border border-gray-200 group-hover:bg-white group-hover:border-white transition-colors duration-500">
                  {pt.icon}
                </div>
                <div className="space-y-3">
                  <h4 className="text-xl font-black uppercase tracking-tight text-gray-900 group-hover:text-black transition-colors">
                    {pt.title}
                  </h4>
                  <p className="text-gray-500 font-medium leading-relaxed group-hover:text-black/70 transition-colors">
                    {pt.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. TEAM ─────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <motion.div className="max-w-3xl space-y-8" {...fade()}>
          <span className="text-primary font-bold tracking-[0.4em] uppercase text-[10px] md:text-xs">Team</span>
          <h2 className="heading-dynamic text-4xl md:text-6xl font-black italic uppercase tracking-tight text-text-main">
            {teamHeading}
          </h2>
          <RichContent html={teamContent} className="text-text-muted text-base md:text-lg leading-relaxed" />
        </motion.div>
      </section>

      {/* ── 8. CERTIFICATIONS ───────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-zinc-950">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <motion.div className="space-y-8" {...fade()}>
            <span className="text-primary font-bold tracking-[0.4em] uppercase text-[10px] md:text-xs">Qualität</span>
            <h2 className="heading-dynamic text-4xl md:text-5xl font-black italic uppercase tracking-tight text-white">
              {certHeading}
            </h2>
            <RichContent html={certContent} className="text-zinc-400 text-base leading-relaxed" />
          </motion.div>
          <motion.div className="hidden md:block" {...fade(0.2)}>
            <div className="relative">
              <div className="w-full aspect-square bg-primary/5 border border-primary/20 rounded-sm flex items-center justify-center">
                <ShieldCheck size={120} className="text-primary/30" />
              </div>
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-primary rounded-sm opacity-60" />
              <div className="absolute -bottom-4 -left-4 w-10 h-10 bg-primary rounded-sm opacity-30" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── 9. CTA ──────────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <motion.div className="max-w-7xl mx-auto text-center md:text-left space-y-8" {...fade()}>
          <div className="bg-primary p-10 md:p-16 shadow-[12px_12px_0px_rgba(17,17,17,0.15)] max-w-2xl">
            <h3 className="text-3xl md:text-5xl font-black italic uppercase text-black leading-tight mb-6">
              Bereit für Ihr<br />Bauvorhaben?
            </h3>
            <button
              onClick={() => setCurrentPage('contact')}
              className="inline-flex items-center gap-3 bg-black text-white font-black uppercase tracking-widest text-sm px-8 py-5 hover:bg-zinc-900 transition-colors"
            >
              {ctaText}
              <ArrowRight size={18} />
            </button>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
