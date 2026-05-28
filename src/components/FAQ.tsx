import { motion } from 'motion/react';
import { translations } from '../lib/translations';
import { Plus, Minus } from 'lucide-react';
import { useState } from 'react';
import type { Faq } from '../App';

interface FAQProps {
  lang: 'de' | 'en';
  dbFaqs?: Faq[];
}

export default function FAQ({ lang, dbFaqs }: FAQProps) {
  const t = translations[lang];
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // Prefer DB FAQs if available, otherwise fall back to translations
  const items = dbFaqs && dbFaqs.length > 0
    ? dbFaqs.map(faq => ({
        q: lang === 'de' ? (faq.question_de || faq.question) : (faq.question_en || faq.question),
        a: lang === 'de' ? (faq.answer_de || faq.answer) : (faq.answer_en || faq.answer),
      }))
    : (t.faq?.items || []);

  if (!items || items.length === 0) return null;

  return (
    <section className="py-32 px-6 max-w-4xl mx-auto">
      <div className="space-y-4 text-center mb-20">
        <span className="text-primary font-bold tracking-[0.4em] uppercase text-[10px] md:text-xs">{t.faq.subtitle}</span>
        <h2 className="heading-dynamic text-4xl md:text-6xl italic text-text-main leading-tight">{t.faq.title}</h2>
      </div>

      <div className="space-y-4">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="border border-surface-border bg-surface-card overflow-hidden transition-all duration-300"
          >
            <button
              onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              className="w-full p-6 md:p-8 flex items-center justify-between text-left hover:bg-surface-dark/50 transition-colors"
            >
              <span className="text-lg md:text-xl font-bold text-text-main pr-8">{item.q}</span>
              <div className="flex-shrink-0 text-primary">
                {openIndex === idx ? <Minus size={24} /> : <Plus size={24} />}
              </div>
            </button>
            <motion.div
              initial={false}
              animate={{ height: openIndex === idx ? 'auto' : 0, opacity: openIndex === idx ? 1 : 0 }}
              className="overflow-hidden"
            >
              <div className="p-6 md:p-8 pt-0 text-text-muted text-base md:text-lg leading-relaxed font-medium border-t border-surface-border/50">
                {item.a}
              </div>
            </motion.div>
          </div>
        ))}
      </div>
    </section>
  );
}
