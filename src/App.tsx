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
  const [language, setLanguage] = useState<'en' | 'de'>(
    (localStorage.getItem('lang') as 'en' | 'de') || 'de'
  );
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

  // Persist language
  useEffect(() => {
    localStorage.setItem('lang', language);
    document.documentElement.lang = language;
    document.documentElement.dir = 'ltr'; // German and English are both LTR
  }, [language]);

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

  // Smooth scroll to top on page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <>
            <Hero settings={siteSettings} lang={language} setCurrentPage={setCurrentPage} />
            <Services lang={language} setCurrentPage={setCurrentPage} />
            <WhyUs lang={language} />
            <section className="py-24 px-6 max-w-7xl mx-auto space-y-16">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <h2 className="heading-dynamic text-5xl md:text-7xl">{t.nav.projects}</h2>
                <p className="text-zinc-500 max-w-md">
                  {language === 'de' ? 'Hier finden Sie eine Auswahl unserer aktuellsten Projekte und Referenzen.' : 'Here you can find a selection of our most recent projects and references.'}
                </p>
              </div>
              <ProjectGallery projects={projects.slice(0, 6)} lang={language} />
            </section>
            <CTA settings={siteSettings} lang={language} setCurrentPage={setCurrentPage} />
            <Contact settings={siteSettings} lang={language} />
          </>
        );
      case 'about':
        return (
          <section className="pt-32 pb-20 px-6 max-w-7xl mx-auto space-y-12">
            <h1 className="heading-dynamic text-5xl md:text-8xl tracking-tight leading-none">{t.nav.about}</h1>
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
              <div className="space-y-6 md:space-y-8 text-zinc-400 text-base md:text-lg">
                <p>
                  {siteSettings?.name || 'FJ Bauservice'} 
                  {language === 'de' 
                    ? ' ist ein professionelles Unternehmen mit Sitz in Rosenheim, das sich auf professionellen Abbruch, Entkernung und Kernbohrungen spezialisiert hat.'
                    : ' is a professional company based in Rosenheim, specializing in professional demolition, gutting and core drilling.'}
                </p>
                <p>
                  {language === 'de' ? 'Unter dem Motto' : 'Under the motto'} "{language === 'en' ? (siteSettings?.slogan_en || t.nav.offer) : (siteSettings?.slogan_de || siteSettings?.slogan || 'Raum für Neues schaffen')}" 
                  {language === 'de' 
                    ? ' führen wir Projekte mit höchster Präzision und Zuverlässigkeit aus. Unser Team steht für Qualität, Termintreue und saubere Ausführung bei jedem Auftrag.'
                    : ' we execute projects with the highest precision and reliability. Our team stands for quality, punctuality and clean execution on every job.'}
                </p>
              </div>
              <div className="aspect-[16/10] bg-surface-card border border-surface-border overflow-hidden">
                <img 
                  src={siteSettings?.about_image_url || "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=2070&auto=format&fit=crop"} 
                  alt="Team" 
                  className="w-full h-full object-cover opacity-60"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            <div className="pt-8">
                <button onClick={() => setCurrentPage('contact')} className="button-primary w-full md:w-auto justify-center">
                  {t.nav.offer}
                </button>
            </div>
          </section>
        );
      case 'services':
        return (
          <div className="pt-10">
            <Services lang={language} setCurrentPage={setCurrentPage} />
          </div>
        );
      case 'projects':
        return (
          <section className="pt-32 pb-20 px-6 max-w-7xl mx-auto space-y-12">
            <div className="space-y-4">
              <h1 className="heading-dynamic text-5xl md:text-8xl italic leading-none">{t.nav.projects}</h1>
              <p className="text-zinc-500 max-w-xl text-sm md:text-base">
                {language === 'de' ? 'Ein Einblick in unsere erfolgreich abgeschlossenen Abbruch- und Rückbauprojekte.' : 'An insight into our successfully completed demolition and dismantling projects.'}
              </p>
            </div>
            <ProjectGallery projects={projects} lang={language} />
          </section>
        );
      case 'contact':
        return <Contact settings={siteSettings} lang={language} />;
      case 'legal':
        return (
          <section className="pt-32 pb-20 px-6 max-w-4xl mx-auto space-y-12">
            <h1 className="heading-dynamic text-6xl">Legal Information</h1>
            <div className="prose prose-invert max-w-none space-y-8 text-zinc-400">
              <div>
                <h2 className="text-xl font-bold text-white uppercase">{t.footer.impressum}</h2>
                <div className="mt-4 p-6 bg-surface-card border border-surface-border whitespace-pre-wrap">
                  {siteSettings?.name || 'FJ Bauservice'}{'\n'}
                  {siteSettings?.address || 'Bahnhofstraße 9, 83022 Rosenheim'}{'\n'}
                  {language === 'de' ? 'Vertreten durch' : 'Represented by'}: Amjad Ali{'\n'}
                  {language === 'de' ? 'Kontakt' : 'Contact'}: {siteSettings?.email || 'amjad.ali@fj-bauservice.com'}
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white uppercase">{t.footer.privacy}</h2>
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
      <div className="min-h-screen bg-surface-dark flex items-center justify-center">
        <div className="heading-dynamic text-4xl animate-pulse text-zinc-800 tracking-[0.2em]">LOADING</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
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
        setLang={setLanguage}
      />
      
      <main>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer settings={siteSettings} lang={language} setCurrentPage={setCurrentPage} />

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


