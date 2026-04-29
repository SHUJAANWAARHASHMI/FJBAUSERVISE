import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, ArrowRight } from 'lucide-react';
import { useState } from 'react';

import { translations } from '../lib/translations';

interface NavbarProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  settings: any;
  onAdminTrigger: () => void;
  lang: 'en' | 'de';
  setLang: (lang: 'en' | 'de') => void;
}

export default function Navbar({ currentPage, setCurrentPage, settings, onAdminTrigger, lang, setLang }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  const t = translations[lang];

  const handleLogoClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    
    if (newCount >= 10) { 
      onAdminTrigger();
      setClickCount(0);
    } else {
      setCurrentPage('home');
    }
  };

  const navLinks = [
    { id: 'home', label: t.nav.home },
    { id: 'about', label: t.nav.about },
    { id: 'services', label: t.nav.services },
    { id: 'projects', label: t.nav.projects },
    { id: 'contact', label: t.nav.contact },
  ];

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-surface-dark/90 backdrop-blur-md border-b border-surface-border">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <div 
          className="flex items-center gap-2 cursor-pointer group"
          onClick={handleLogoClick}
        >
          <div className="bg-primary text-black font-black w-10 h-10 flex items-center justify-center text-xl">
            {settings?.name?.substring(0, 2) || 'FJ'}
          </div>
          <span className="heading-dynamic text-xl tracking-normal group-hover:text-primary transition-colors">
            {settings?.name || 'BAUSERVICE'}
          </span>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => setCurrentPage(link.id)}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                currentPage === link.id ? 'text-primary' : 'text-zinc-400'
              }`}
            >
              {link.label}
            </button>
          ))}
          <div className="h-6 w-px bg-surface-border mx-2" />
          <div className="flex items-center gap-2 bg-surface-card p-1 rounded-sm border border-surface-border">
            <button 
              onClick={() => setLang('en')}
              className={`px-2 py-0.5 text-xs font-bold rounded-sm transition-all ${lang === 'en' ? 'bg-primary text-black' : 'text-zinc-500 hover:text-white'}`}
            >
              EN
            </button>
            <button 
              onClick={() => setLang('de')}
              className={`px-2 py-0.5 text-xs font-bold rounded-sm transition-all ${lang === 'de' ? 'bg-primary text-black' : 'text-zinc-500 hover:text-white'}`}
            >
              DE
            </button>
          </div>
          <button 
            onClick={() => setCurrentPage('contact')}
            className="button-primary ml-4"
          >
            {t.nav.offer} <ArrowRight size={16} />
          </button>
        </div>

        {/* Mobile Toggle */}
        <button 
          className="md:hidden text-white"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[45] md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 w-[80%] max-w-sm h-full bg-surface-dark border-l border-surface-border z-[55] md:hidden flex flex-col p-8 pt-24 gap-8"
            >
              <div className="flex flex-col gap-4">
                {navLinks.map((link) => (
                  <button
                    key={link.id}
                    onClick={() => {
                      setCurrentPage(link.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`text-2xl font-black uppercase tracking-tight text-left transition-colors ${
                      currentPage === link.id ? 'text-primary' : 'text-white hover:text-primary'
                    }`}
                  >
                    {link.label}
                  </button>
                ))}
              </div>

              <div className="mt-auto space-y-6">
                <div className="flex items-center gap-2 bg-surface-card p-1 rounded-sm border border-surface-border">
                  <button 
                    onClick={() => setLang('en')}
                    className={`flex-1 px-4 py-2 text-xs font-black rounded-sm transition-all ${lang === 'en' ? 'bg-primary text-black' : 'text-zinc-500'}`}
                  >
                    ENGLISH
                  </button>
                  <button 
                    onClick={() => setLang('de')}
                    className={`flex-1 px-4 py-2 text-xs font-black rounded-sm transition-all ${lang === 'de' ? 'bg-primary text-black' : 'text-zinc-500'}`}
                  >
                    GERMAN
                  </button>
                </div>

                <button 
                  onClick={() => {
                    setCurrentPage('contact');
                    setIsMobileMenuOpen(false);
                  }}
                  className="button-primary w-full justify-center py-4"
                >
                  {t.nav.offer} <ArrowRight size={20} />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}
