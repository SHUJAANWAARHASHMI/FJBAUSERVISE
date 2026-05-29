import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, ArrowRight } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { translations } from '../lib/translations';
import Logo from './Logo';

interface NavbarProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  settings: any;
  onAdminTrigger: () => void;
  lang: 'en' | 'de';
}

export default function Navbar({ currentPage, setCurrentPage, settings, onAdminTrigger, lang }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const t = translations[lang];

  const handleLogoClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    setCurrentPage('home');
    if (currentPage === 'home') window.scrollTo({ top: 0, behavior: 'smooth' });
    if (newCount >= 10) { onAdminTrigger(); setClickCount(0); }
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    clickTimerRef.current = setTimeout(() => setClickCount(0), 3000);
  };

  const navLinks = [
    { id: 'home',     label: t.nav.home },
    { id: 'about',    label: t.nav.about },
    { id: 'services', label: t.nav.services },
    { id: 'projects', label: t.nav.projects },
    { id: 'contact',  label: t.nav.contact },
  ];

  const logoScale = parseFloat(settings?.logo_scale || '1') || 1;
  const customLogo = settings?.logo_url || '';

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 border-b ${
      isScrolled
        ? 'bg-white/95 backdrop-blur-md h-16 border-gray-200 shadow-sm'
        : 'bg-white h-24 border-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between gap-6">

        {/* Logo */}
        <div className="flex items-center cursor-pointer group shrink-0" onClick={handleLogoClick}>
          <Logo
            iconSize={isScrolled ? 42 : 52}
            customLogoUrl={customLogo}
            logoScale={logoScale}
          />
        </div>

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center gap-5 xl:gap-10 shrink-0">
          {navLinks.map(link => (
            <button
              key={link.id}
              onClick={() => setCurrentPage(link.id)}
              className={`text-xs font-bold uppercase tracking-widest transition-all hover:text-primary relative group ${
                currentPage === link.id ? 'text-primary' : 'text-gray-500'
              }`}
            >
              {link.label}
              <span className={`absolute -bottom-1 left-0 h-0.5 bg-primary transition-all duration-300 ${currentPage === link.id ? 'w-full' : 'w-0 group-hover:w-full'}`} />
            </button>
          ))}
          <div className="h-4 w-px bg-gray-200 mx-2" />
          <button onClick={() => setCurrentPage('contact')} className="button-primary px-8">
            {t.nav.offer} <ArrowRight size={14} strokeWidth={3} />
          </button>
        </div>

        {/* Mobile Toggle */}
        <div className="flex items-center gap-4 lg:hidden">
          <button className="text-gray-800" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[45] lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 w-[80%] max-w-sm h-full bg-white border-l border-gray-200 shadow-2xl z-[55] lg:hidden flex flex-col p-8 pt-24 gap-8"
            >
              <div className="flex flex-col gap-4">
                {navLinks.map(link => (
                  <button
                    key={link.id}
                    onClick={() => { setCurrentPage(link.id); setIsMobileMenuOpen(false); }}
                    className={`text-2xl font-black uppercase tracking-tight text-left transition-colors ${
                      currentPage === link.id ? 'text-primary' : 'text-gray-800 hover:text-primary'
                    }`}
                  >
                    {link.label}
                  </button>
                ))}
              </div>
              <div className="mt-auto space-y-6">
                <button
                  onClick={() => { setCurrentPage('contact'); setIsMobileMenuOpen(false); }}
                  className="button-primary w-full justify-center py-5"
                >
                  {t.nav.offer} <ArrowRight size={20} strokeWidth={3} />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}
