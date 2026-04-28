import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, Plus, Trash2, LayoutDashboard, Briefcase, Mail, Loader2, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AdminPanelProps {
  onClose: () => void;
  settings: any;
  projects: any[];
  refreshData: () => void;
  lang: 'de' | 'en';
}

export default function AdminPanel({ onClose, settings, projects, refreshData, lang }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'settings' | 'projects' | 'inquiries'>('settings');
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  
  // Settings Form State
  const [settingsForm, setSettingsForm] = useState(settings || {});

  // Update form sync
  useEffect(() => {
    if (settings) setSettingsForm(settings);
  }, [settings]);
  
  // Project Form State
  const [newProject, setNewProject] = useState({ 
    title: '', 
    title_en: '', 
    category: '', 
    category_en: '', 
    image_url: '' 
  });

  useEffect(() => {
    fetchInquiries();
  }, []);

  async function fetchInquiries() {
    const { data } = await supabase.from('contact_inquiries').select('*').order('created_at', { ascending: false });
    if (data) setInquiries(data);
  }

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Clean up data to only include valid columns
    const { id, updated_at, created_at, ...updateData } = settingsForm;
    
    console.log('Updating settings with:', updateData);

    // Using upsert ensures the row is created if it somehow doesn't exist
    const { error } = await supabase
      .from('site_settings')
      .upsert({ id: 1, ...updateData }, { onConflict: 'id' });
    
    if (error) {
      console.error('Supabase update error:', error);
      alert((lang === 'de' ? 'Fehler beim Aktualisieren: ' : 'Error updating: ') + error.message);
    } else {
      alert(lang === 'de' ? 'Einstellungen erfolgreich gespeichert!' : 'Settings saved successfully!');
      refreshData();
    }
    setIsSaving(false);
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const { error } = await supabase.from('projects').insert([newProject]);
    if (error) {
      alert((lang === 'de' ? 'Fehler beim Hinzufügen: ' : 'Error adding: ') + error.message);
    } else {
      setNewProject({ title: '', title_en: '', category: '', category_en: '', image_url: '' });
      refreshData();
      alert(lang === 'de' ? 'Projekt hinzugefügt!' : 'Project added!');
    }
    setIsSaving(false);
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Projekt wirklich löschen?')) return;
    await supabase.from('projects').delete().eq('id', id);
    refreshData();
  };

  const handleDeleteInquiry = async (id: string) => {
    await supabase.from('contact_inquiries').delete().eq('id', id);
    fetchInquiries();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-10"
    >
      <div className="bg-surface-card border border-surface-border w-full max-w-6xl h-full max-h-[800px] flex flex-col md:flex-row overflow-hidden shadow-2xl">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-surface-dark border-r border-surface-border p-6 flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <h2 className="heading-dynamic text-primary text-2xl">C-PANEL</h2>
            <button onClick={onClose} className="md:hidden text-zinc-500 hover:text-white"><X /></button>
          </div>
          
          <nav className="flex flex-col gap-2">
            {[
              { id: 'settings', label: lang === 'de' ? 'Website Info' : 'Site Info', icon: <LayoutDashboard size={18} /> },
              { id: 'projects', label: lang === 'de' ? 'Projekte' : 'Projects', icon: <Briefcase size={18} /> },
              { id: 'inquiries', label: lang === 'de' ? 'Anfragen' : 'Inquiries', icon: <Mail size={18} /> },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-3 px-4 py-3 rounded-sm font-bold uppercase text-xs tracking-widest transition-all ${
                  activeTab === tab.id ? 'bg-primary text-black' : 'text-zinc-500 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </nav>

          <button onClick={onClose} className="mt-auto flex items-center gap-2 text-zinc-500 hover:text-white text-xs font-bold uppercase tracking-widest">
            <X size={16} /> {lang === 'de' ? 'Schließen' : 'Close'}
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 md:p-12">
          
          {activeTab === 'settings' && (
            <div className="space-y-10">
              <div className="space-y-2">
                <h3 className="heading-dynamic text-4xl">{lang === 'de' ? 'Website Informationen' : 'Website Information'}</h3>
                <p className="text-zinc-500 text-sm">{lang === 'de' ? 'Verwalten Sie die globalen Inhalte Ihrer Website.' : 'Manage global content of your website.'}</p>
              </div>

              <form onSubmit={handleUpdateSettings} className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-primary">Firmenname</label>
                  <input 
                    type="text" value={settingsForm.name || ''} 
                    onChange={e => setSettingsForm({...settingsForm, name: e.target.value})}
                    className="w-full bg-surface-dark border border-surface-border p-4 rounded-sm focus:border-primary outline-none transition-colors" 
                  />
                </div>
                <div className="space-y-4" /> {/* Spacer */}
                
                <div className="space-y-4">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-primary">Slogan (DE)</label>
                  <input 
                    type="text" value={settingsForm.slogan || ''} 
                    onChange={e => setSettingsForm({...settingsForm, slogan: e.target.value})}
                    className="w-full bg-surface-dark border border-surface-border p-4 rounded-sm focus:border-primary outline-none transition-colors" 
                  />
                </div>
                <div className="space-y-4">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-primary">Slogan (EN)</label>
                  <input 
                    type="text" value={settingsForm.slogan_en || ''} 
                    onChange={e => setSettingsForm({...settingsForm, slogan_en: e.target.value})}
                    className="w-full bg-surface-dark border border-surface-border p-4 rounded-sm focus:border-primary outline-none transition-colors" 
                  />
                </div>

                <div className="space-y-4">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-primary">Beschreibung (DE)</label>
                  <textarea 
                    rows={3} value={settingsForm.description || ''} 
                    onChange={e => setSettingsForm({...settingsForm, description: e.target.value})}
                    className="w-full bg-surface-dark border border-surface-border p-4 rounded-sm focus:border-primary outline-none transition-colors resize-none" 
                  />
                </div>
                <div className="space-y-4">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-primary">Beschreibung (EN)</label>
                  <textarea 
                    rows={3} value={settingsForm.description_en || ''} 
                    onChange={e => setSettingsForm({...settingsForm, description_en: e.target.value})}
                    className="w-full bg-surface-dark border border-surface-border p-4 rounded-sm focus:border-primary outline-none transition-colors resize-none" 
                  />
                </div>

                <div className="space-y-4">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-primary">Telefon</label>
                  <input 
                    type="text" value={settingsForm.phone || ''} 
                    onChange={e => setSettingsForm({...settingsForm, phone: e.target.value})}
                    className="w-full bg-surface-dark border border-surface-border p-4 rounded-sm focus:border-primary outline-none transition-colors" 
                  />
                </div>
                <div className="space-y-4">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-primary">Email</label>
                  <input 
                    type="email" value={settingsForm.email || ''} 
                    onChange={e => setSettingsForm({...settingsForm, email: e.target.value})}
                    className="w-full bg-surface-dark border border-surface-border p-4 rounded-sm focus:border-primary outline-none transition-colors" 
                  />
                </div>
                
                <button 
                  type="submit" disabled={isSaving}
                  className="md:col-span-2 button-primary justify-center gap-2"
                >
                  {isSaving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                  {lang === 'de' ? 'Einstellungen speichern' : 'Save Settings'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'projects' && (
            <div className="space-y-12">
              <div className="space-y-2">
                <h3 className="heading-dynamic text-4xl">{lang === 'de' ? 'Projekt Management' : 'Project Management'}</h3>
                <p className="text-zinc-500 text-sm">{lang === 'de' ? 'Fügen Sie neue Projekte hinzu oder löschen Sie bestehende.' : 'Add new projects or delete existing ones.'}</p>
              </div>

              {/* Add Project Form */}
              <div className="bg-surface-dark border border-surface-border p-8 rounded-sm">
                <h4 className="text-xs font-black uppercase tracking-[0.2em] mb-6 text-primary">{lang === 'de' ? 'Neues Projekt hinzufügen' : 'Add New Project'}</h4>
                <form onSubmit={handleAddProject} className="grid md:grid-cols-2 gap-6">
                  <input 
                    placeholder={lang === 'de' ? "Titel (DE)" : "Title (DE)"} type="text" required
                    value={newProject.title} onChange={e => setNewProject({...newProject, title: e.target.value})}
                    className="bg-surface-card border border-surface-border p-4 outline-none focus:border-primary transition-colors text-sm"
                  />
                   <input 
                    placeholder={lang === 'de' ? "Titel (EN)" : "Title (EN)"} type="text" required
                    value={newProject.title_en} onChange={e => setNewProject({...newProject, title_en: e.target.value})}
                    className="bg-surface-card border border-surface-border p-4 outline-none focus:border-primary transition-colors text-sm"
                  />
                  <input 
                    placeholder={lang === 'de' ? "Kategorie (DE)" : "Category (DE)"} type="text" required
                    value={newProject.category} onChange={e => setNewProject({...newProject, category: e.target.value})}
                    className="bg-surface-card border border-surface-border p-4 outline-none focus:border-primary transition-colors text-sm"
                  />
                   <input 
                    placeholder={lang === 'de' ? "Kategorie (EN)" : "Category (EN)"} type="text" required
                    value={newProject.category_en} onChange={e => setNewProject({...newProject, category_en: e.target.value})}
                    className="bg-surface-card border border-surface-border p-4 outline-none focus:border-primary transition-colors text-sm"
                  />
                  <input 
                    placeholder="Bild URL (https://...)" type="text" required
                    value={newProject.image_url} onChange={e => setNewProject({...newProject, image_url: e.target.value})}
                    className="bg-surface-card border border-surface-border p-4 outline-none focus:border-primary transition-colors text-sm md:col-span-2"
                  />
                  <button type="submit" disabled={isSaving} className="button-primary md:col-span-2 justify-center">
                    <Plus size={20} /> {lang === 'de' ? 'Projekt Speichern' : 'Save Project'}
                  </button>
                </form>
              </div>

              {/* Project List */}
              <div className="grid sm:grid-cols-2 gap-4">
                {projects.map(project => (
                  <div key={project.id} className="bg-surface-dark border border-surface-border p-4 flex items-center gap-4 group">
                    <div className="w-16 h-16 bg-zinc-800 rounded-sm overflow-hidden shrink-0">
                      <img src={project.image_url} alt="" className="w-full h-full object-cover opacity-60" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-bold truncate text-sm">{project.title} / {project.title_en}</h5>
                      <p className="text-[10px] text-zinc-500 uppercase font-black">{project.category}</p>
                    </div>
                    <button 
                      onClick={() => handleDeleteProject(project.id)}
                      className="text-zinc-600 hover:text-red-500 transition-colors p-2"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'inquiries' && (
            <div className="space-y-10">
              <div className="space-y-2">
                <h3 className="heading-dynamic text-4xl">Kontakt Anfragen</h3>
                <p className="text-zinc-500 text-sm">Alle über das Website-Formular eingegangenen Nachrichten.</p>
              </div>

              <div className="space-y-4">
                {inquiries.length > 0 ? inquiries.map(inquiry => (
                  <div key={inquiry.id} className="bg-surface-dark border border-surface-border p-6 rounded-sm space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-bold text-lg">{inquiry.subject || 'Kein Betreff'}</h5>
                        <p className="text-xs text-primary font-bold uppercase tracking-wider">{inquiry.name} ({inquiry.email})</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] text-zinc-600 font-mono">{new Date(inquiry.created_at).toLocaleString()}</span>
                        <button onClick={() => handleDeleteInquiry(inquiry.id)} className="text-zinc-600 hover:text-red-500"><Trash2 size={16} /></button>
                      </div>
                    </div>
                    <p className="text-zinc-400 text-sm leading-relaxed whitespace-pre-wrap">{inquiry.message}</p>
                  </div>
                )) : (
                  <div className="text-center py-20 border border-dashed border-surface-border rounded-sm text-zinc-600 font-bold uppercase text-xs">
                    Keine Anfragen vorhanden.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
