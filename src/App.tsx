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
import FAQ from './components/FAQ';
import SiteEditor from './components/SiteEditor';
import LegalPage from './components/LegalPage';
import AboutUs from './components/AboutUs';
import { supabase } from './lib/supabase';
import { fetchLatestSettings } from './lib/cmsUtils';
import { translations } from './lib/translations';

export interface SiteSettings {
  name: string;
  slogan: string;
  slogan_en?: string;
  slogan_de?: string;
  description: string;
  description_en?: string;
  description_de?: string;
  // Hero
  hero_heading_de?: string;
  hero_heading_en?: string;
  hero_subtext_de?: string;
  hero_subtext_en?: string;
  hero_button_de?: string;
  hero_button_en?: string;
  // Stats
  stats_years?: string;
  stats_projects?: string;
  stat_label_1_de?: string;
  stat_label_2_de?: string;
  // Contact
  phone: string;
  email: string;
  address: string;
  address_de?: string;
  address_en?: string;
  whatsapp_number?: string;
  google_maps_url?: string;
  hours_weekdays?: string;
  hours_saturday?: string;
  hours_sunday?: string;
  // Images
  logo_url?: string;
  hero_image_url?: string;
  about_image_url?: string;
  cta_image_url?: string;
  contact_image_url?: string;
  footer_image_url?: string;
  og_image_url?: string;
  // CTA
  cta_title_de?: string;
  cta_title_en?: string;
  cta_subtitle_de?: string;
  cta_subtitle_en?: string;
  cta_button_de?: string;
  cta_button_en?: string;
  // Social
  facebook_url?: string;
  instagram_url?: string;
  linkedin_url?: string;
  tiktok_url?: string;
  // SEO
  seo_title_de?: string;
  seo_title_en?: string;
  seo_description_de?: string;
  seo_description_en?: string;
  seo_keywords?: string;
}

export interface Project {
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

export interface Service {
  id: string;
  title: string;
  title_de?: string;
  title_en?: string;
  description: string;
  description_de?: string;
  description_en?: string;
  icon_name?: string;
  sort_order?: number;
}

export interface Faq {
  id: string;
  question: string;
  question_de?: string;
  question_en?: string;
  answer: string;
  answer_de?: string;
  answer_en?: string;
  sort_order?: number;
}

export interface Testimonial {
  id: string;
  author: string;
  company?: string;
  text: string;
  text_de?: string;
  text_en?: string;
  rating?: number;
  avatar_url?: string;
}

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const language = 'de';
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isSiteEditorOpen, setIsSiteEditorOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [session, setSession] = useState<any>(null);

  const t = translations[language];

  // ── Auth ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Force German
  useEffect(() => {
    document.documentElement.lang = 'de';
    document.documentElement.dir = 'ltr';
  }, []);

  // ── Data Fetch ────────────────────────────────────────────────────────────
  // fetchLatestSettings() from cmsUtils always bypasses any local state cache
  // (uses a direct Supabase call with no client-side caching layer).
  const fetchData = async () => {
    try {
      const [latestSettings, projectsRes, servicesRes, faqsRes, testimonialsRes] = await Promise.all([
        fetchLatestSettings(),  // ← cache-free, guaranteed fresh row from DB
        supabase.from('projects').select('*').order('created_at', { ascending: false }),
        supabase.from('services').select('*').order('sort_order', { ascending: true }),
        supabase.from('faqs').select('*').order('sort_order', { ascending: true }),
        supabase.from('testimonials').select('*').order('created_at', { ascending: false }),
      ]);

      // Settings: use cmsUtils result (null means DB error → keep previous value)
      if (latestSettings) setSiteSettings(latestSettings);

      if (projectsRes.data) setProjects(projectsRes.data);
      // Services: use DB if available, else fall back to empty array
      if (servicesRes.data && servicesRes.data.length > 0) setServices(servicesRes.data);
      else setServices([]);
      if (faqsRes.data && faqsRes.data.length > 0) setFaqs(faqsRes.data);
      else setFaqs([]);
      if (testimonialsRes.data) setTestimonials(testimonialsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ── Scroll to top on page change ──────────────────────────────────────────
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  // ── SEO metadata from settings ────────────────────────────────────────────
  const seoTitle = siteSettings?.seo_title_de || "Abbruch, Entkernung & Kernbohrung München";
  const seoDesc  = siteSettings?.seo_description_de || "Ihr Partner für fachgerechten Abbruch, präzise Kernbohrungen und professionelle Entkernung in München und Rosenheim.";

  // ── Page Renderer ─────────────────────────────────────────────────────────
  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <>
            <SEO title={seoTitle} description={seoDesc} faq={t.faq.items} />
            <Hero settings={siteSettings} lang={language} setCurrentPage={setCurrentPage} />
            <Services lang={language} setCurrentPage={setCurrentPage} dbServices={services} />
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
                <p className="text-text-muted max-w-md">
                  Hier finden Sie eine Auswahl unserer aktuellsten Projekte und Referenzen in der Region München und Rosenheim.
                </p>
              </div>
              <ProjectGallery projects={projects.slice(0, 6)} lang={language} />
            </motion.section>
            <FAQ lang={language} dbFaqs={faqs} />
            <CTA settings={siteSettings} lang={language} setCurrentPage={setCurrentPage} />
            <Contact settings={siteSettings} lang={language} />
          </>
        );
      case 'about':
        return (
          <>
            <SEO
              title={siteSettings?.about_seo_title || 'Über Uns | FJ BAUSERVICE Rosenheim'}
              description={siteSettings?.about_seo_description || 'Erfahren Sie mehr über FJ BAUSERVICE, Ihren Fachbetrieb für Rückbau und Sanierungsvorbereitung in München & Rosenheim.'}
            />
            <AboutUs settings={siteSettings} setCurrentPage={setCurrentPage} />
          </>
        );
      case 'services':
        return (
          <div className="pt-20">
            <SEO
              title="Unsere Leistungen | Abbruch, Entkernung, Kernbohrung"
              description="Alle Leistungen von FJ BAUSERVICE im Überblick."
            />
            <Services lang={language} setCurrentPage={setCurrentPage} dbServices={services} />
          </div>
        );
      case 'projects':
        return (
          <section className="pt-40 pb-32 px-6 max-w-7xl mx-auto space-y-24">
            <SEO
              title="Referenzen | Unsere Projekte in München & Rosenheim"
              description="Sehen Sie unsere erfolgreich abgeschlossenen Projekte."
            />
            <div className="space-y-8 max-w-4xl">
              <span className="text-primary font-bold tracking-[0.4em] uppercase text-[10px] md:text-xs">Projektarchiv</span>
              <h1 className="heading-dynamic text-5xl sm:text-7xl md:text-[150px] italic leading-[0.9] md:leading-[0.8] text-text-main">
                Unsere<br /><span className="text-primary not-italic font-black">Werke.</span>
              </h1>
            </div>
            <ProjectGallery projects={projects} lang={language} />
          </section>
        );
      case 'contact':
        return (
          <>
            <SEO
              title="Kontakt | Jetzt Angebot anfordern"
              description="Kontaktieren Sie FJ BAUSERVICE für Ihre Abbruch- oder Sanierungsarbeiten."
            />
            <Contact settings={siteSettings} lang={language} />
          </>
        );
      case 'imprint':
        return <LegalPage slug="imprint" setCurrentPage={setCurrentPage} />;
      case 'data-protection':
        return <LegalPage slug="data-protection" setCurrentPage={setCurrentPage} />;
      case 'legal':
        // Legacy route — redirect to imprint
        return <LegalPage slug="imprint" setCurrentPage={setCurrentPage} />;
      default:
        return <Hero settings={siteSettings} lang={language} setCurrentPage={setCurrentPage} />;
    }
  };

  // ── Favicon is the static wrecking-ball icon in /public/favicon.png ─────────
  // The logo_url from DB is used as the navbar/footer logo, NOT as the favicon.
  // Favicon files are baked into /public at build time (favicon.ico, favicon-*.png).

  // No hard loading gate — render the shell immediately, content fills in
  // (isLoading is still tracked so child components can show skeletons if needed)

  return (
    <div className="min-h-screen bg-white transition-colors duration-500">
      <Navbar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        settings={siteSettings}
        onAdminTrigger={() => {
          if (session) setIsAdminPanelOpen(true);
          else setIsLoginOpen(true);
        }}
        lang={language}
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
          if (session) setIsAdminPanelOpen(true);
          else setIsLoginOpen(true);
        }}
      />

      <AnimatePresence>
        {isLoginOpen && !session && (
          <Login
            onClose={() => setIsLoginOpen(false)}
            onLoginStatus={(status) => {
              if (status) { setIsLoginOpen(false); setIsAdminPanelOpen(true); }
            }}
            lang={language}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAdminPanelOpen && session && !isSiteEditorOpen && (
          <AdminPanel
            onClose={async () => {
              await supabase.auth.signOut();
              setSession(null);
              setIsAdminPanelOpen(false);
            }}
            settings={siteSettings}
            projects={projects}
            services={services}
            faqs={faqs}
            testimonials={testimonials}
            refreshData={fetchData}
            lang={language}
            onOpenSiteEditor={() => setIsSiteEditorOpen(true)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSiteEditorOpen && session && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <SiteEditor
              onClose={() => {
                setIsSiteEditorOpen(false);
                fetchData();
              }}
              initialSettings={siteSettings}
              initialProjects={projects}
              initialServices={services}
              initialFaqs={faqs}
              initialTestimonials={testimonials}
              refreshData={fetchData}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
