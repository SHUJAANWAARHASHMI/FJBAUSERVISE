
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
      const cat = lang === 'en' ? (project.category_en || project.category) : (project.category_de || project.category);
      if (cat) cats.add(cat);
    });
    return Array.from(cats);
  }, [projects, lang]);

  const filteredProjects = useMemo(() => {
    if (activeCategory === 'all') return projects;
    return projects.filter(project => {
      const cat = lang === 'en' ? (project.category_en || project.category) : (project.category_de || project.category);
      return cat === activeCategory;
    });
  }, [projects, activeCategory, lang]);

  return (
    <div className="space-y-12">
      {/* Category Filter */}
      <div className="flex flex-wrap gap-4 border-b border-surface-border pb-8">
        <button
          id="filter-all"
          onClick={() => setActiveCategory('all')}
          className={`px-6 py-2 text-xs font-black uppercase tracking-[0.2em] transition-all duration-300 ${
            activeCategory === 'all'
              ? 'bg-primary text-black'
              : 'bg-surface-card text-zinc-500 hover:text-white border border-surface-border'
          }`}
        >
          {t.services.all}
        </button>
        {categories.map((category) => (
          <button
            id={`filter-${category.toLowerCase().replace(/\s+/g, '-')}`}
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-6 py-2 text-xs font-black uppercase tracking-[0.2em] transition-all duration-300 ${
              activeCategory === category
                ? 'bg-primary text-black'
                : 'bg-surface-card text-zinc-500 hover:text-white border border-surface-border'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Projects Grid */}
      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
        className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
      >
        <AnimatePresence mode="popLayout">
          {filteredProjects.length > 0 ? (
            filteredProjects.map((project, idx) => (
              <motion.div
                layout
                id={`project-${project.id}`}
                key={project.id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ 
                  duration: 0.6, 
                  delay: idx * 0.1,
                  ease: [0.16, 1, 0.3, 1] 
                }}
                className="aspect-square bg-surface-card border border-surface-border relative group overflow-hidden"
              >
                <img
                  src={project.image_url}
                  alt={project.title}
                  className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-110 group-hover:opacity-60 transition-all duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 p-10 flex flex-col justify-end gap-3 bg-gradient-to-t from-black/90 via-black/20 to-transparent">
                  <span className="bg-primary text-black text-[10px] font-black px-3 py-1.5 uppercase w-fit tracking-wider shadow-lg">
                    {lang === 'en' ? (project.category_en || project.category) : (project.category_de || project.category)}
                  </span>
                  <div className="space-y-1">
                    <h3 className="heading-dynamic text-3xl leading-tight">
                      {lang === 'en' ? (project.title_en || project.title) : (project.title_de || project.title)}
                    </h3>
                    <p className="text-zinc-500 text-sm line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      {lang === 'en' ? (project.description_en || project.description) : (project.description_de || project.description)}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-zinc-500 italic col-span-full py-20 text-center uppercase tracking-widest text-sm"
            >
              {lang === 'de' ? 'Keine Projekte in dieser Kategorie gefunden.' : 'No projects found in this category.'}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
