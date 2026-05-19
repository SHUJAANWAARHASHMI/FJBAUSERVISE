
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { translations } from '../lib/translations';

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

interface ProjectGalleryProps {
  projects: Project[];
  lang: 'en' | 'de';
}

export default function ProjectGallery({ projects, lang }: ProjectGalleryProps) {
  const t = translations[lang];
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Extract unique categories from projects
  const categories = useMemo(() => {
    const cats = new Set<string>();
    projects.forEach(project => {
      const cat = project.category_de || project.category;
      if (cat) cats.add(cat);
    });
    return Array.from(cats);
  }, [projects]);

  const filteredProjects = useMemo(() => {
    if (activeCategory === 'all') return projects;
    return projects.filter(project => {
      const cat = project.category_de || project.category;
      return cat === activeCategory;
    });
  }, [projects, activeCategory]);

  return (
    <div className="space-y-16">
      {/* Category Filter */}
      <div className="flex flex-wrap gap-4 border-b border-surface-border pb-10">
        <button
          id="filter-all"
          onClick={() => setActiveCategory('all')}
          className={`px-8 py-3 text-xs font-black uppercase tracking-[0.3em] transition-all duration-500 border relative overflow-hidden group ${
            activeCategory === 'all'
              ? 'bg-primary text-black border-primary'
              : 'bg-transparent text-text-muted hover:text-text-main border-surface-border'
          }`}
        >
          <span className="relative z-10">{t.services.all}</span>
        </button>
        {categories.map((category) => (
          <button
            id={`filter-${category.toLowerCase().replace(/\s+/g, '-')}`}
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-8 py-3 text-xs font-black uppercase tracking-[0.3em] transition-all duration-500 border relative overflow-hidden group ${
              activeCategory === category
                ? 'bg-primary text-black border-primary'
                : 'bg-transparent text-text-muted hover:text-text-main border-surface-border'
            }`}
          >
            <span className="relative z-10">{category}</span>
          </button>
        ))}
      </div>

      {/* Projects Grid */}
      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
        className="grid md:grid-cols-2 lg:grid-cols-3 gap-10"
      >
        <AnimatePresence mode="popLayout">
          {filteredProjects.length > 0 ? (
            filteredProjects.map((project, idx) => (
              <motion.div
                layout
                id={`project-${project.id}`}
                key={project.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ 
                  duration: 0.8, 
                  delay: idx * 0.05,
                  ease: [0.16, 1, 0.3, 1] 
                }}
                className="aspect-[4/5] bg-surface-card border border-surface-border relative group overflow-hidden shadow-2xl"
              >
                <img
                  src={project.image_url}
                  alt={`${project.title_de || project.title} - FJ BAUSERVICE Referenz - Abbruch München`}
                  className="absolute inset-0 w-full h-full object-cover opacity-40 filter grayscale brightness-75 group-hover:scale-110 group-hover:opacity-60 transition-all duration-1000"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
                
                <div className="absolute inset-0 p-10 flex flex-col justify-end gap-6 bg-gradient-to-t from-surface-dark via-surface-dark/40 to-transparent">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-[2px] bg-primary" />
                    <span className="text-primary text-[10px] font-black uppercase tracking-[0.4em]">
                      {project.category_de || project.category}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <h3 className="heading-dynamic text-4xl leading-[0.9] italic text-text-main group-hover:text-primary transition-colors duration-500">
                      {project.title_de || project.title}
                    </h3>
                    <p className="text-text-muted text-sm font-medium line-clamp-3 opacity-0 group-hover:opacity-100 transition-all duration-700 translate-y-4 group-hover:translate-y-0">
                      {project.description_de || project.description}
                    </p>
                  </div>
                </div>
                
                <div className="absolute top-8 right-8 w-12 h-12 border border-surface-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                   <div className="w-1.5 h-1.5 bg-primary rounded-full animate-ping" />
                </div>
              </motion.div>
            ))
          ) : (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-text-muted font-black italic col-span-full py-32 text-center uppercase tracking-[0.4em] text-xs"
            >
              Keine Referenzen in dieser Kategorie gefunden.
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
