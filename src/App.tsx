/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Services from './components/Services';
import WhyUs from './components/WhyUs';
import CTA from './components/CTA';
import Contact from './components/Contact';
import Footer from './components/Footer';
import ProjectGallery from './components/ProjectGallery';
import AdminPanel from './components/AdminPanel';
import Login from './components/Login';
import SEO from './components/SEO';
import { supabase } from './lib/supabase';

import { translations } from './lib/translations';

interface SiteSettings {
  name: string;
  slogan: string;
  slogan_en?: string;
  slogan_de?: string;
  description: string;
  description_en?: string;
  description_de?: string;
  phone: string;
  email: string;
  address: string;
  hero_image_url?: string;
  about_image_url?: string;
  cta_image_url?: string;
  contact_image_url?: string;
  stats_years?: string;
  stats_projects?: string;
}

interface Project {
  id: string;
  title: string;
  title_en?: string;
  title_de?: string;
  category: string;
  category_en?: string;
  category_de?: string;
  image_url: string;
  description?: string;
  description_en?: string;
  description_de?: string;
}

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const language = 'de';
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [session, setSession] = useState<any>(null);

  const t = translations[language];

  // Handle Authentication
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Force language to German
  useEffect(() => {
    document.documentElement.lang = 'de';
    document.documentElement.dir = 'ltr';
  }, []);

  const fetchData = async () => {
    try {
      const [settingsRes, projectsRes] = await Promise.all([
        supabase.from('site_settings').select('*').limit(1),
        supabase.from('projects').select('*').order('created_at', { ascending: false })
      ]);

      if (settingsRes.data && settingsRes.data.length > 0) {
        setSiteSettings(settingsRes.data[0]);
      }
      if (projectsRes.data) setProjects(projectsRes.data);
    } catch (error) {
      console.error('Error fetching data from Supabase:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const [isDarkMode, setIsDarkMode] = useState(true);

  // Smooth scroll to top on page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <>
            <SEO 
              title="Abbruch, Entkernung & Kernbohrung München" 
              description="Ihr Partner für fachgerechten Abbruch, präzise Kernbohrungen und professionelle Entkernung in München und Rosenheim. Jetzt kostenloses Angebot anfordern!" 
            />
            <Hero settings={siteSettings} lang={language} setCurrentPage={setCurrentPage} />
            <Services lang={language} setCurrentPage={setCurrentPage} />
            <WhyUs lang={language} />
            <motion.section 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="py-24 px-6 max-w-7xl mx-auto space-y-16"
            >
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <h2 className="heading-dynamic text-4xl sm:text-5xl md:text-7xl">{t.nav.projects}</h2>
                <p className="text-zinc-500 max-w-md">
                  Hier finden Sie eine Auswahl unserer aktuellsten Projekte und Referenzen in der Region München und Rosenheim.
                </p>
              </div>
              <ProjectGallery projects={projects.slice(0, 6)} lang={language} />
            </motion.section>
            <CTA settings={siteSettings} lang={language} setCurrentPage={setCurrentPage} />
            <Contact settings={siteSettings} lang={language} />
          </>
        );
      case 'about':
        return (
          <>
            <SEO 
              title="Über Uns | FJ BAUSERVICE Rosenheim" 
              description="Erfahren Sie mehr über FJ BAUSERVICE, Ihren Fachbetrieb für Rückbau und Sanierungsvorbereitung. Qualität und Termintreue seit Jahren." 
            />
            <section className="pt-40 pb-32 px-6 max-w-7xl mx-auto space-y-24">
              <div className="space-y-8 max-w-4xl">
                 <span className="text-primary font-bold tracking-[0.4em] uppercase text-[10px] md:text-xs">Unsere Geschichte</span>
                 <h1 className="heading-dynamic text-5xl sm:text-7xl md:text-[150px] italic leading-[0.9] md:leading-[0.8] text-text-main">Präzision im<br /><span className="text-primary not-italic font-black">Rückbau.</span></h1>
              </div>

              <div className="grid lg:grid-cols-2 gap-16 lg:gap-32 items-start">
                <div className="space-y-10 text-zinc-500 text-lg md:text-xl font-medium leading-relaxed">
                  <p className="text-text-main text-2xl md:text-3xl font-black italic border-l-4 border-primary pl-8 py-2">
                    "Wir schaffen seit über 15 Jahren Raum für Neues in Bayern."
                  </p>
                  <p>
                    {siteSettings?.name || 'FJ Bauservice'} ist ein inhabergeführter Fachbetrieb mit Sitz in Rosenheim. Wir sind spezialisiert auf komplexe Rückbau-Herausforderungen, präzise Kernbohrungen und fachgerechte Entkernung im gesamten Raum München und Oberbayern.
                  </p>
                  <p>
                    Unser Anspruch ist absolute Termintreue und eine saubere, sichere Baustelle. Wir verstehen uns als Partner von Architekten, Bauherren und Kommunen, die Wert auf höchste Qualität und professionelle Abwicklung legen.
                  </p>
                  <div className="pt-8 flex flex-wrap gap-12 border-t border-surface-border">
                    <div>
                      <span className="block text-4xl font-black text-primary italic leading-none">15+</span>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mt-2 block">Jahre Erfahrung</span>
                    </div>
                    <div>
                      <span className="block text-4xl font-black text-primary italic leading-none">500+</span>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mt-2 block">Projekte</span>
                    </div>
                    <div>
                      <span className="block text-4xl font-black text-primary italic leading-none">100%</span>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mt-2 block">Termintreue</span>
                    </div>
                  </div>
                </div>
                <div className="relative group">
                  <div className="aspect-[3/4] bg-surface-card border border-surface-border overflow-hidden shadow-2xl relative z-10">
                    <img 
                      src={siteSettings?.about_image_url || "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=2070&auto=format&fit=crop"} 
                      alt="FJ BAUSERVICE Fachbetrieb am Bau" 
                      className="w-full h-full object-cover opacity-60 filter grayscale brightness-75 group-hover:scale-110 transition-transform duration-1000"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-primary opacity-20 -z-10 group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-primary/20 -z-10 animate-pulse" />
                </div>
              </div>

              <div className="pt-12 text-center md:text-left">
                  <button onClick={() => setCurrentPage('contact')} className="button-primary px-16 py-8 transition-all hover:shadow-[10px_10px_0px_0px_white] active:translate-y-2">
                    Unverbindliches Angebot einholen
                  </button>
              </div>
            </section>
          </>
        );
      case 'services':
        return (
          <div className="pt-20">
            <SEO 
              title="Unsere Leistungen | Abbruch, Entkernung, Kernbohrung" 
              description="Alle Leistungen von FJ BAUSERVICE im Überblick: Professioneller Abbruch, Entkernung, Sanierung und Kernbohrung in München und Rosenheim." 
            />
            <Services lang={language} setCurrentPage={setCurrentPage} />
          </div>
        );
      case 'projects':
        return (
          <section className="pt-40 pb-32 px-6 max-w-7xl mx-auto space-y-24">
            <SEO 
              title="Referenzen | Unsere Projekte in München & Rosenheim" 
              description="Sehen Sie unsere erfolgreich abgeschlossenen Abbruch- und Rückbauprojekte. Qualität und Professionalität in jedem Schritt." 
            />
            <div className="space-y-8 max-w-4xl">
              <span className="text-primary font-bold tracking-[0.4em] uppercase text-[10px] md:text-xs">Projektarchiv</span>
              <h1 className="heading-dynamic text-5xl sm:text-7xl md:text-[150px] italic leading-[0.9] md:leading-[0.8] text-text-main">Unsere<br /><span className="text-primary not-italic font-black">Werke.</span></h1>
              <p className="text-zinc-500 max-w-2xl text-base md:text-lg font-medium leading-relaxed">
                Ein Einblick in unsere erfolgreich abgeschlossenen Abbruch- und Rückbauprojekte für gewerbliche und private Kunden in ganz Bayern.
              </p>
            </div>
            <ProjectGallery projects={projects} lang={language} />
          </section>
        );
      case 'contact':
        return (
          <>
            <SEO 
              title="Kontakt | Jetzt Angebot für Abbruch anfordern" 
              description="Kontaktieren Sie FJ BAUSERVICE für Ihre Abbruch- oder Sanierungsarbeiten. Wir beraten Sie kostenlos vor Ort in München und Rosenheim." 
            />
            <Contact settings={siteSettings} lang={language} />
          </>
        );
      case 'legal':
        return (
          <section className="pt-32 pb-20 px-6 max-w-4xl mx-auto space-y-12">
            <SEO 
              title="Impressum & Datenschutz | FJ BAUSERVICE" 
              description="Rechtliche Informationen und Datenschutzbestimmungen von FJ BAUSERVICE." 
            />
            <h1 className="heading-dynamic text-6xl">Rechtliches</h1>
            <div className="prose prose-invert max-w-none space-y-8 text-zinc-500">
              <div>
                <h2 className="text-xl font-bold text-text-main uppercase">{t.footer.impressum}</h2>
                <div className="mt-4 p-6 bg-surface-card border border-surface-border whitespace-pre-wrap leading-relaxed">
                  {siteSettings?.name || 'FJ Bauservice'}{'\n'}
                  {(language === 'de' ? siteSettings?.address_de : siteSettings?.address_en) || siteSettings?.address || 'Bahnhofstraße 9, 83022 Rosenheim'}{'\n'}
                  {language === 'de' ? 'Vertreten durch' : 'Represented by'}: Amjad Ali{'\n'}
                  {language === 'de' ? 'Kontakt' : 'Contact'}: {siteSettings?.email || 'amjad.ali@fj-bauservice.com'}
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold text-text-main uppercase">{t.footer.privacy}</h2>
                <p>
                  {language === 'de' 
                    ? 'Der Schutz Ihrer persönlichen Daten ist uns ein besonderes Anliegen. Wir verarbeiten Ihre Daten ausschließlich auf Grundlage der gesetzlichen Bestimmungen (DSGVO).'
                    : 'The protection of your personal data is a special concern for us. We process your data exclusively on the basis of the legal provisions (GDPR).'}
                </p>
              </div>
            </div>
          </section>
        );
      default:
        return <Hero settings={siteSettings} lang={language} setCurrentPage={setCurrentPage} />;
    }
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen ${!isDarkMode ? 'theme-light' : ''} bg-surface-dark flex items-center justify-center`}>
        <div className="heading-dynamic text-4xl animate-pulse text-zinc-800 tracking-[0.2em]">LOADING</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${!isDarkMode ? 'theme-light' : ''} bg-surface-dark transition-colors duration-500`}>
      <Navbar 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage} 
        settings={siteSettings} 
        onAdminTrigger={() => {
          if (session) {
            setIsAdminPanelOpen(true);
          } else {
            setIsLoginOpen(true);
          }
        }}
        lang={language}
        isDarkMode={isDarkMode}
        toggleTheme={() => setIsDarkMode(!isDarkMode)}
      />
      
      <main>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer 
        settings={siteSettings} 
        lang={language} 
        setCurrentPage={setCurrentPage} 
        onAdminTrigger={() => {
          if (session) {
            setIsAdminPanelOpen(true);
          } else {
            setIsLoginOpen(true);
          }
        }}
      />

      <AnimatePresence>
        {isLoginOpen && !session && (
          <Login 
            onClose={() => setIsLoginOpen(false)}
            onLoginStatus={(status) => {
              if (status) {
                setIsLoginOpen(false);
                setIsAdminPanelOpen(true);
              }
            }}
            lang={language}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAdminPanelOpen && session && (
          <AdminPanel 
            onClose={async () => {
              await supabase.auth.signOut();
              setSession(null);
              setIsAdminPanelOpen(false);
            }}
            settings={siteSettings}
            projects={projects}
            refreshData={fetchData}
            lang={language}
          />
        )}
      </AnimatePresence>
    </div>
  );
}


