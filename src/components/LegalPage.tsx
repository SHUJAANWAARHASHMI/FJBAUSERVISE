/**
 * LegalPage.tsx
 * Renders Impressum or Datenschutzerklärung from the legal_pages table.
 * Falls back to static content if the DB row is empty.
 */

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { FileText, RefreshCw, AlertCircle } from 'lucide-react';
import SEO from './SEO';
import { supabase } from '../lib/supabase';

export interface LegalPageData {
  id?: string;
  slug: string;
  title: string;
  content: string;
  seo_title?: string;
  seo_description?: string;
  updated_at?: string;
}

interface LegalPageProps {
  slug: 'imprint' | 'data-protection';
  setCurrentPage?: (p: string) => void;
}

const STATIC_FALLBACK: Record<string, LegalPageData> = {
  imprint: {
    slug: 'imprint',
    title: 'Impressum',
    seo_title: 'Impressum | FJ BAUSERVICE',
    seo_description: 'Impressum und rechtliche Angaben von FJ BAUSERVICE.',
    content: `<h1>Impressum</h1>
<h2>Angaben gemäß § 5 TMG</h2>
<p><strong>FJ BAUSERVICE</strong><br>Bahnhofstraße 9<br>83022 Rosenheim</p>
<h2>Vertreten durch</h2><p>Amjad Ali</p>
<h2>Kontakt</h2>
<p>Telefon: +49 159 06142923<br>E-Mail: amjad.ali@fj-bauservice.com</p>
<p><em>Dieses Impressum wird über das CMS gepflegt. Bitte aktualisieren Sie es über AdminPanel → Rechtliches.</em></p>`,
  },
  'data-protection': {
    slug: 'data-protection',
    title: 'Datenschutzerklärung',
    seo_title: 'Datenschutzerklärung | FJ BAUSERVICE',
    seo_description: 'Datenschutzerklärung von FJ BAUSERVICE gemäß DSGVO.',
    content: `<h1>Datenschutzerklärung</h1>
<p>Diese Datenschutzerklärung informiert Sie über die Verarbeitung personenbezogener Daten auf unserer Website.</p>
<h2>Verantwortlicher</h2>
<p>FJ BAUSERVICE<br>Amjad Ali<br>Bahnhofstraße 9, 83022 Rosenheim<br>E-Mail: amjad.ali@fj-bauservice.com</p>
<p><em>Diese Seite wird über das CMS gepflegt. Bitte aktualisieren Sie sie über AdminPanel → Rechtliches.</em></p>`,
  },
};

export default function LegalPage({ slug, setCurrentPage }: LegalPageProps) {
  const [pageData, setPageData] = useState<LegalPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    supabase
      .from('legal_pages')
      .select('*')
      .eq('slug', slug)
      .single()
      .then(({ data, error: err }) => {
        if (cancelled) return;
        if (err || !data) {
          // Table might not exist yet — use static fallback
          console.warn('[LegalPage] DB fetch failed, using fallback:', err?.message);
          setPageData(STATIC_FALLBACK[slug] || null);
          if (err?.code !== 'PGRST116') setError(err?.message || 'Unknown error');
        } else {
          setPageData(data as LegalPageData);
        }
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [slug]);

  const page = pageData || STATIC_FALLBACK[slug];

  return (
    <>
      <SEO
        title={page?.seo_title || page?.title || 'Rechtliches'}
        description={page?.seo_description || 'Rechtliche Informationen von FJ BAUSERVICE.'}
      />

      <section className="pt-32 pb-20 px-6 bg-white min-h-screen">
        <div className="max-w-3xl mx-auto">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-12">
            <button
              onClick={() => setCurrentPage?.('home')}
              className="hover:text-primary transition-colors"
            >
              Startseite
            </button>
            <span>/</span>
            <span className="text-primary">
              {page?.title || (slug === 'imprint' ? 'Impressum' : 'Datenschutz')}
            </span>
          </div>

          {loading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3" />
              <div className="h-4 bg-gray-100 rounded w-full" />
              <div className="h-4 bg-gray-100 rounded w-5/6" />
              <div className="h-4 bg-gray-100 rounded w-4/6" />
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Header */}
              <div className="flex items-center gap-4 mb-10 pb-8 border-b border-gray-200">
                <div className="w-12 h-12 rounded-sm bg-primary/10 border border-primary/20 flex items-center justify-center text-primary flex-shrink-0">
                  <FileText size={22} />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-gray-900">
                    {page?.title}
                  </h1>
                  {page?.updated_at && (
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 flex items-center gap-1.5">
                      <RefreshCw size={9} />
                      Zuletzt aktualisiert: {new Date(page.updated_at).toLocaleDateString('de-DE', {
                        year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </p>
                  )}
                </div>
              </div>

              {/* Error notice */}
              {error && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-sm flex items-start gap-3">
                  <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">
                    Diese Seite konnte nicht aus der Datenbank geladen werden. Bitte führen Sie zuerst die SQL-Migration in Supabase aus.
                    Zeige statischen Inhalt als Fallback.
                  </p>
                </div>
              )}

              {/* Rich text content */}
              {page?.content ? (
                <div
                  className="
                    prose prose-gray max-w-none
                    [&_h1]:text-2xl [&_h1]:font-black [&_h1]:text-gray-900 [&_h1]:mt-8 [&_h1]:mb-4
                    [&_h2]:text-xl [&_h2]:font-black [&_h2]:text-gray-900 [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:border-b [&_h2]:border-gray-200 [&_h2]:pb-2
                    [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-gray-800 [&_h3]:mt-6 [&_h3]:mb-2
                    [&_p]:text-gray-600 [&_p]:leading-relaxed [&_p]:my-3 [&_p]:text-sm
                    [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-3 [&_ul]:text-gray-600 [&_ul]:text-sm
                    [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-3 [&_ol]:text-gray-600 [&_ol]:text-sm
                    [&_li]:my-1.5
                    [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-primary/80
                    [&_strong]:text-gray-800 [&_strong]:font-bold
                    [&_em]:text-gray-500 [&_em]:italic
                    [&_blockquote]:border-l-4 [&_blockquote]:border-primary/30 [&_blockquote]:pl-4
                    [&_blockquote]:text-gray-500 [&_blockquote]:italic [&_blockquote]:my-4 [&_blockquote]:text-sm
                    [&_br]:block [&_br]:mb-1
                  "
                  dangerouslySetInnerHTML={{ __html: page.content }}
                />
              ) : (
                <p className="text-gray-400 text-sm italic">
                  Kein Inhalt vorhanden. Bitte bearbeiten Sie diese Seite über das AdminPanel unter Rechtliches.
                </p>
              )}
            </motion.div>
          )}
        </div>
      </section>
    </>
  );
}
