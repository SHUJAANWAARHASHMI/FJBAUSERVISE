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
import AdminPanel from './components/AdminPanel';
import { supabase } from './lib/supabase';

import { translations } from './lib/translations';

interface SiteSettings {
  name: string;
  slogan: string;
  slogan_en?: string;
  description: string;
  description_en?: string;
  phone: string;
  email: string;
  address: string;
}

interface Project {
  id: string;
  title: string;
  title_en?: string;
  category: string;
  category_en?: string;
  image_url: string;
}

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [language, setLanguage] = useState<'de' | 'en'>('de');
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);

  const t = translations[language];

  const fetchData = async () => {
    try {
      const [settingsRes, projectsRes] = await Promise.all([
        supabase.from('site_settings').select('*').single(),
        supabase.from('projects').select('*').order('created_at', { ascending: false })
      ]);

      if (settingsRes.data) setSiteSettings(settingsRes.data);
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
            <Hero settings={siteSettings} lang={language} />
            <Services lang={language} />
            <WhyUs lang={language} />
            <CTA settings={siteSettings} lang={language} />
            <Contact settings={siteSettings} lang={language} />
          </>
        );
      case 'about':
        return (
          <section className="pt-32 pb-20 px-6 max-w-7xl mx-auto space-y-12">
            <h1 className="heading-dynamic text-8xl">{t.nav.about}</h1>
            <div className="grid lg:grid-cols-2 gap-16">
              <div className="space-y-8 text-zinc-400 text-lg">
                <p>
                  {siteSettings?.name || 'FJ Bauservice'} {language === 'de' ? 'ist ein Fachunternehmen mit Sitz in Rosenheim,' : 'is a professional company based in Rosenheim,'} 
                  {language === 'de' ? 'das sich auf professionelle Abbrucharbeiten, Entkernung und Kernbohrungen spezialisiert hat.' : 'specializing in professional demolition, gutting and core drilling.'}
                </p>
                <p>
                  Unter dem Motto "{language === 'en' ? (siteSettings?.slogan_en || t.hero.stats.contact) : (siteSettings?.slogan || 'Raum für Neues schaffen')}" setzen wir Projekte mit höchster Präzision und Zuverlässigkeit um. 
                  {language === 'de' ? 'Unser Team steht für Qualität, Termintreue und saubere Ausführung bei jedem Auftrag.' : 'Our team stands for quality, punctuality and clean execution on every job.'}
                </p>
              </div>
              <div className="aspect-video bg-surface-card border border-surface-border overflow-hidden">
                <img 
                  src="https://picsum.photos/seed/team/1200/800?grayscale" 
                  alt="Team" 
                  className="w-full h-full object-cover opacity-60"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </section>
        );
      case 'services':
        return <Services lang={language} />;
      case 'projects':
        return (
          <section className="pt-32 pb-20 px-6 max-w-7xl mx-auto space-y-12">
            <div className="space-y-4">
              <h1 className="heading-dynamic text-8xl italic">{t.nav.projects}</h1>
              <p className="text-zinc-500 max-w-xl">
                {language === 'de' ? 'Ein Einblick in unsere erfolgreich abgeschlossenen Abbruch- und Rückbauprojekte.' : 'An insight into our successfully completed demolition and dismantling projects.'}
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.length > 0 ? (
                projects.map((project) => (
                  <div key={project.id} className="aspect-square bg-surface-card border border-surface-border relative group overflow-hidden">
                    <img 
                      src={project.image_url} 
                      alt={project.title}
                      className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-110 group-hover:opacity-60 transition-all duration-700"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 p-8 flex flex-col justify-end gap-2 bg-gradient-to-t from-black/80 to-transparent">
                      <span className="bg-primary text-black text-[10px] font-black px-2 py-1 uppercase w-fit">
                        {language === 'en' ? (project.category_en || project.category) : project.category}
                      </span>
                      <h3 className="heading-dynamic text-2xl">
                        {language === 'en' ? (project.title_en || project.title) : project.title}
                      </h3>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-zinc-500 italic col-span-full">{language === 'de' ? 'Keine Projekte gefunden.' : 'No projects found.'}</p>
              )}
            </div>
          </section>
        );
      case 'contact':
        return <Contact settings={siteSettings} lang={language} />;
      default:
        return <Hero settings={siteSettings} lang={language} />;
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
        onAdminTrigger={() => setIsAdminPanelOpen(true)}
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

      <Footer settings={siteSettings} lang={language} />

      <AnimatePresence>
        {isAdminPanelOpen && (
          <AdminPanel 
            onClose={() => setIsAdminPanelOpen(false)}
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


