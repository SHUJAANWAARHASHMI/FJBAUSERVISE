import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, Plus, Trash2, LayoutDashboard, Briefcase, Mail, Loader2, Image as ImageIcon, LogOut, Pencil } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AdminPanelProps {
  onClose: () => void;
  settings: any;
  projects: any[];
  refreshData: () => void;
  lang: 'en' | 'de';
}

export default function AdminPanel({ onClose, settings, projects, refreshData, lang }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'settings' | 'projects' | 'inquiries'>('settings');
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [imageHistory, setImageHistory] = useState<string[]>([]);
  const [showDatabaseHelp, setShowDatabaseHelp] = useState(false);
  
  // Settings Form State
  const [settingsForm, setSettingsForm] = useState(settings || {});

  // Load image history from localStorage
  useEffect(() => {
    const history = localStorage.getItem('fj_image_history');
    if (history) {
      try {
        setImageHistory(JSON.parse(history));
      } catch (e) {
        console.error("Failed to parse image history", e);
      }
    }
  }, []);

  const addToHistory = (url: string) => {
    setImageHistory(prev => {
      const newHistory = [url, ...prev.filter(u => u !== url)].slice(0, 12);
      localStorage.setItem('fj_image_history', JSON.stringify(newHistory));
      return newHistory;
    });
  };

  // Update form sync
  useEffect(() => {
    if (settings) {
      // Clean up null values to empty strings to avoid React warnings
      const cleaned = { ...settings };
      Object.keys(cleaned).forEach(key => {
        if (cleaned[key] === null) cleaned[key] = '';
      });
      setSettingsForm(cleaned);
    }
  }, [settings]);
  
  // Project Form State
  const initialProjectState = { 
    title: '', 
    title_en: '', 
    title_de: '',
    category: '', 
    category_en: '', 
    category_de: '',
    image_url: '',
    description: '',
    description_en: '',
    description_de: ''
  };
  const [projectForm, setProjectForm] = useState(initialProjectState);

  useEffect(() => {
    fetchInquiries();
  }, []);

  async function fetchInquiries() {
    const { data } = await supabase.from('contact_inquiries').select('*').order('created_at', { ascending: false });
    if (data) setInquiries(data);
  }

  const handleImageUpload = async (field: string, e: React.ChangeEvent<HTMLInputElement>, isProject = false) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(field);
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `uploads/${fileName}`; // Changed to a folder within the bucket

        // Upload to Supabase Storage
        const bucketName = 'images';
        const { error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error("Storage upload error details:", uploadError);
          if (uploadError.message.includes('bucket not found')) {
            throw new Error(lang === 'de' 
              ? 'Bucket "images" nicht gefunden. Erstellen Sie einen öffentlichen Bucket namens "images" in Supabase Storage.' 
              : 'Bucket "images" not found. Create a PUBLIC bucket named "images" in Supabase Storage.');
          }
          if (uploadError.message.toLowerCase().includes('policy') || uploadError.message.toLowerCase().includes('permission denied')) {
            throw new Error(lang === 'de'
              ? 'Berechtigungsfehler! Sie müssen die "INSERT"-Policy für den Bucket "images" in Supabase hinzufügen.'
              : 'Permission denied! You MUST add an "INSERT" policy for the "images" bucket in Supabase Storage.');
          }
          throw uploadError;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath);

        if (isProject) {
          setProjectForm(prev => ({ ...prev, [field]: publicUrl }));
        } else {
          setSettingsForm((prev: any) => ({ ...prev, [field]: publicUrl }));
        }
        addToHistory(publicUrl);
        
        // Clear input so same file can be uploaded again if needed
        e.target.value = '';
      } catch (error: any) {
        console.error("Full upload error:", error);
        alert((lang === 'de' ? 'Upload-Fehler: ' : 'Upload error: ') + error.message);
      } finally {
        setIsUploading(null);
      }
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Clean up data to only include valid columns
    const { id, updated_at, created_at, ...updateData } = settingsForm;
    
    const { error } = await supabase
      .from('site_settings')
      .upsert({ id: 1, ...updateData }, { onConflict: 'id' });
    
    if (error) {
      console.error("Settings save error:", error);
      if (error.message.includes('column') || error.code === 'PGRST204') {
        const schemaError = error.code === 'PGRST204' || error.message.includes('cache');
        alert((lang === 'de' ? 'DATENBANK-FEHLER: ' : 'DATABASE ERROR: ') + 
          (schemaError 
            ? (lang === 'de' ? 'Schema-Cache veraltet. Bitte klicken Sie in den Supabase-Einstellungen auf "Reload Schema".' : 'Schema cache is stale. Please click "Reload Schema" in your Supabase API Settings.')
            : (lang === 'de' ? 'Spalten fehlen in der Tabelle "site_settings".' : 'Columns missing in "site_settings" table.')));
        setShowDatabaseHelp(true);
      } else {
        alert((lang === 'de' ? 'Fehler beim Speichern: ' : 'Error saving: ') + error.message);
      }
    } else {
      alert(lang === 'de' ? 'Einstellungen erfolgreich gespeichert!' : 'Settings saved successfully!');
      refreshData();
    }
    setIsSaving(false);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Ensure title/category are populated if localized ones are filled
    const finalProject = {
      ...projectForm,
      title: projectForm.title || projectForm.title_de || projectForm.title_en || 'Untitled',
      category: projectForm.category || projectForm.category_de || projectForm.category_en || 'Misc',
      description: projectForm.description || projectForm.description_de || projectForm.description_en || ''
    };

    if (editingProject) {
      const { id, created_at, ...updateData } = finalProject;
      const { error } = await supabase.from('projects').update(updateData).eq('id', editingProject.id);
      if (error) {
        console.error("Update error:", error);
        if (error.message.includes('column') || error.code === 'PGRST204') {
          alert((lang === 'de' ? 'DATENBANK-FEHLER: ' : 'DATABASE ERROR: ') + 
            (lang === 'de' ? 'Spalten fehlen! Bitte führen Sie das SQL-Setup im Supabase Dashboard aus (siehe Anleitung oben).' : 'Columns missing! Please run the SQL setup in your Supabase Dashboard (see instructions above).'));
        } else {
          alert((lang === 'de' ? 'Fehler beim Aktualisieren: ' : 'Error updating: ') + error.message);
        }
      } else {
        alert(lang === 'de' ? 'Projekt erfolgreich aktualisiert!' : 'Project updated successfully!');
        setEditingProject(null);
        setProjectForm(initialProjectState);
        refreshData();
      }
    } else {
      // Ensure no id or created_at for new insertion
      const { id, created_at, ...insertData } = finalProject;
      const { error } = await supabase.from('projects').insert([insertData]);
      if (error) {
        console.error("Insert error:", error);
        if (error.message.includes('column') || error.code === 'PGRST204') {
          alert((lang === 'de' ? 'DATENBANK-FEHLER: ' : 'DATABASE ERROR: ') + 
            (lang === 'de' ? 'Spalten fehlen! Bitte führen Sie das SQL-Setup im Supabase Dashboard aus (siehe Anleitung oben).' : 'Columns missing! Please run the SQL setup in your Supabase Dashboard (see instructions above).'));
        } else {
          alert((lang === 'de' ? 'Fehler beim Hinzufügen: ' : 'Error adding: ') + error.message);
        }
      } else {
        setProjectForm(initialProjectState);
        refreshData();
        alert(lang === 'de' ? 'Projekt erfolgreich hinzugefügt!' : 'Project added successfully!');
      }
    }
    setIsSaving(false);
  };

  const startEditProject = (project: any) => {
    const cleaned = { ...project };
    Object.keys(cleaned).forEach(key => {
      if (cleaned[key] === null) cleaned[key] = '';
    });
    setEditingProject(project);
    setProjectForm(cleaned);
    setActiveTab('projects');
  };

  const cancelEdit = () => {
    setEditingProject(null);
    setProjectForm(initialProjectState);
  };

  const selectFromHistory = (url: string, field: string, isProject: boolean) => {
    if (isProject) {
      setProjectForm(prev => ({ ...prev, [field]: url }));
    } else {
      setSettingsForm((prev: any) => ({ ...prev, [field]: url }));
    }
  };

  const renderImageHistory = (field: string, isProject: boolean) => (
    imageHistory.length > 0 && (
      <div className="space-y-2 mt-4">
        <label className="text-[9px] uppercase tracking-tighter text-zinc-600 font-black">
          {lang === 'de' ? 'Kürzlich hochgeladen' : 'Recent Uploads'}
        </label>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {imageHistory.map((url, i) => (
            <button
              key={i}
              type="button"
              onClick={() => selectFromHistory(url, field, isProject)}
              className="w-12 h-12 bg-zinc-900 border border-surface-border rounded-sm overflow-hidden shrink-0 hover:border-primary transition-all relative group"
            >
              <img src={url} alt="" className="w-full h-full object-cover opacity-50 group-hover:opacity-100" />
            </button>
          ))}
        </div>
      </div>
    )
  );

  const handleDeleteProject = async (project: any) => {
    if (!confirm(lang === 'de' ? 'Projekt wirklich löschen?' : 'Really delete this project?')) return;
    
    // Try to delete from storage if it's our own image
    if (project.image_url && project.image_url.includes('supabase.co')) {
      const pathMatches = project.image_url.split('/public/images/');
      if (pathMatches.length > 1) {
        try {
          await supabase.storage.from('images').remove([pathMatches[1]]);
        } catch (e) {
          console.warn("Storage deletion failed, continuing with record deletion:", e);
        }
      }
    }

    const { error } = await supabase.from('projects').delete().eq('id', project.id);
    if (error) {
      alert("Error deleting: " + error.message);
    } else {
      refreshData();
    }
  };

  const handleDeleteInquiry = async (id: string) => {
    await supabase.from('contact_inquiries').delete().eq('id', id);
    fetchInquiries();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onClose();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-10"
    >
      <div className="bg-surface-card border border-surface-border w-full max-w-6xl h-full max-h-[850px] flex flex-col md:flex-row overflow-hidden shadow-2xl">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-surface-dark border-r border-surface-border p-6 flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <h2 className="heading-dynamic text-primary text-2xl">C-PANEL</h2>
            <button onClick={onClose} className="md:hidden text-zinc-500 hover:text-white"><X /></button>
          </div>
          
          <nav className="flex flex-col gap-2">
            {[
              { id: 'settings', label: lang === 'de' ? 'Webseiten-Info' : 'Site Info', icon: <LayoutDashboard size={18} /> },
              { id: 'projects', label: lang === 'de' ? 'Projekte' : 'Projects', icon: <Briefcase size={18} /> },
              { id: 'inquiries', label: lang === 'de' ? 'Anfragen' : 'Inquiries', icon: <Mail size={18} /> },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); cancelEdit(); }}
                className={`flex items-center gap-3 px-4 py-3 rounded-sm font-bold uppercase text-xs tracking-widest transition-all ${
                  activeTab === tab.id ? 'bg-primary text-black' : 'text-zinc-500 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 rounded-sm font-bold uppercase text-xs tracking-widest text-red-500 hover:bg-red-500/10 transition-all mt-4 border border-red-500/20"
            >
              <LogOut size={18} /> {lang === 'de' ? 'Abmelden' : 'Logout'}
            </button>
          </nav>

          <button onClick={onClose} className="mt-auto flex items-center gap-2 text-zinc-500 hover:text-white text-xs font-bold uppercase tracking-widest">
            <X size={16} /> {lang === 'de' ? 'Schließen' : 'Close'}
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 md:p-12">
          
          {activeTab === 'settings' && (
            <div className="space-y-12">
              <div className="space-y-2">
                <h3 className="heading-dynamic text-4xl">{lang === 'de' ? 'Webseiten-Einstellungen' : 'Website Settings'}</h3>
                <p className="text-zinc-500 text-sm">{lang === 'de' ? 'Verwalten Sie die globalen Inhalte und Bilder Ihrer Webseite.' : 'Manage global content and images of your website.'}</p>
              </div>

              <form onSubmit={handleUpdateSettings} className="space-y-12">
                {/* Content Section */}
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-primary">{lang === 'de' ? 'Firmenname' : 'Company Name'}</label>
                    <input 
                      type="text" value={settingsForm.name || ''} 
                      onChange={e => setSettingsForm({...settingsForm, name: e.target.value})}
                      className="w-full bg-surface-dark border border-surface-border p-4 rounded-sm focus:border-primary outline-none transition-colors" 
                    />
                  </div>
                  <div className="hidden md:block" />
                  
                  <div className="space-y-4">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-primary">{lang === 'de' ? 'Slogan (DE)' : 'Slogan (DE)'}</label>
                    <input 
                      type="text" value={settingsForm.slogan_de || settingsForm.slogan || ''} 
                      onChange={e => setSettingsForm({...settingsForm, slogan_de: e.target.value, slogan: e.target.value})}
                      className="w-full bg-surface-dark border border-surface-border p-4 rounded-sm focus:border-primary outline-none transition-colors" 
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-primary">{lang === 'de' ? 'Slogan (EN)' : 'Slogan (EN)'}</label>
                    <input 
                      type="text" value={settingsForm.slogan_en || ''} 
                      onChange={e => setSettingsForm({...settingsForm, slogan_en: e.target.value})}
                      className="w-full bg-surface-dark border border-surface-border p-4 rounded-sm focus:border-primary outline-none transition-colors" 
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-primary">{lang === 'de' ? 'Beschreibung (DE)' : 'Description (DE)'}</label>
                    <textarea 
                      rows={3} value={settingsForm.description_de || settingsForm.description || ''} 
                      onChange={e => setSettingsForm({...settingsForm, description_de: e.target.value, description: e.target.value})}
                      className="w-full bg-surface-dark border border-surface-border p-4 rounded-sm focus:border-primary outline-none transition-colors resize-none" 
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-primary">{lang === 'de' ? 'Beschreibung (EN)' : 'Description (EN)'}</label>
                    <textarea 
                      rows={3} value={settingsForm.description_en || ''} 
                      onChange={e => setSettingsForm({...settingsForm, description_en: e.target.value})}
                      className="w-full bg-surface-dark border border-surface-border p-4 rounded-sm focus:border-primary outline-none transition-colors resize-none" 
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-primary">{lang === 'de' ? 'Telefon' : 'Phone'}</label>
                    <input 
                      type="text" value={settingsForm.phone || ''} 
                      onChange={e => setSettingsForm({...settingsForm, phone: e.target.value})}
                      className="w-full bg-surface-dark border border-surface-border p-4 rounded-sm focus:border-primary outline-none transition-colors" 
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-primary">{lang === 'de' ? 'Email' : 'Email'}</label>
                    <input 
                      type="email" value={settingsForm.email || ''} 
                      onChange={e => setSettingsForm({...settingsForm, email: e.target.value})}
                      className="w-full bg-surface-dark border border-surface-border p-4 rounded-sm focus:border-primary outline-none transition-colors" 
                    />
                  </div>
                </div>

                <div className="space-y-8 bg-black/40 p-8 border border-surface-border rounded-sm">
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary">{lang === 'de' ? 'Statistiken' : 'Statistics'}</h4>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500">{lang === 'de' ? 'Jahre Erfahrung' : 'Years Experience'}</label>
                      <input 
                        type="text" value={settingsForm.stats_years || ''} 
                        onChange={e => setSettingsForm({...settingsForm, stats_years: e.target.value})}
                        placeholder="15+"
                        className="w-full bg-surface-dark border border-surface-border p-4 rounded-sm focus:border-primary outline-none text-sm" 
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500">{lang === 'de' ? 'Abgeschlossene Projekte' : 'Completed Projects'}</label>
                      <input 
                        type="text" value={settingsForm.stats_projects || ''} 
                        onChange={e => setSettingsForm({...settingsForm, stats_projects: e.target.value})}
                        placeholder="500+"
                        className="w-full bg-surface-dark border border-surface-border p-4 rounded-sm focus:border-primary outline-none text-sm" 
                      />
                    </div>
                  </div>
                </div>

                {/* Image Section */}
                <div className="space-y-8 bg-black/40 p-8 border border-surface-border rounded-sm">
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary">{lang === 'de' ? 'Seiten-Bilder' : 'Site Images'}</h4>
                  <div className="grid md:grid-cols-2 gap-8">
                    {[
                      { id: 'hero_image_url', label: lang === 'de' ? 'Hero Hintergrund' : 'Hero Background' },
                      { id: 'about_image_url', label: lang === 'de' ? 'Über Uns Bild' : 'About Us Image' },
                      { id: 'cta_image_url', label: lang === 'de' ? 'CTA Hintergrund' : 'CTA Background' },
                      { id: 'contact_image_url', label: lang === 'de' ? 'Kontakt Bild' : 'Contact Image' },
                    ].map(img => (
                      <div key={img.id} className="space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500">{img.label}</label>
                          <label className="cursor-pointer text-[10px] text-primary hover:underline font-bold flex items-center gap-1">
                            {isUploading === img.id ? <Loader2 size={12} className="animate-spin" /> : <ImageIcon size={12} />} 
                            {isUploading === img.id ? (lang === 'de' ? 'Hochladen...' : 'Uploading...') : (lang === 'de' ? 'Hochladen' : 'Upload')}
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(img.id, e)} disabled={!!isUploading} />
                          </label>
                        </div>
                        <input 
                          type="text" value={settingsForm[img.id] || ''} 
                          onChange={e => setSettingsForm({...settingsForm, [img.id]: e.target.value})}
                          placeholder="https://..."
                          className="w-full bg-surface-dark border border-surface-border p-3 rounded-sm focus:border-primary outline-none text-xs" 
                        />
                        {settingsForm[img.id] && (
                          <div className="aspect-video w-full bg-zinc-900 rounded-sm overflow-hidden border border-surface-border">
                            <img src={settingsForm[img.id]} alt="" className="w-full h-full object-cover opacity-50" />
                          </div>
                        )}
                        {renderImageHistory(img.id, false)}
                      </div>
                    ))}
                  </div>
                </div>
                
                <button 
                  type="submit" disabled={isSaving || !!isUploading}
                  className="w-full button-primary justify-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                  {lang === 'de' ? 'Einstellungen speichern' : 'Save Settings'}
                </button>

                {/* Optional SQL Fix Help */}
                <div className="mt-12 border-t border-surface-border pt-8">
                  <button 
                    type="button" 
                    onClick={() => setShowDatabaseHelp(!showDatabaseHelp)}
                    className="text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:text-primary transition-colors flex items-center gap-2"
                  >
                    <LayoutDashboard size={14} />
                    {showDatabaseHelp 
                      ? (lang === 'de' ? 'Setup-Passwort verbergen' : 'Hide Database Setup') 
                      : (lang === 'de' ? 'Troubleshooting: Datenbank-Setup anzeigen' : 'Troubleshooting: Show Database Setup')}
                  </button>

                  <AnimatePresence>
                    {showDatabaseHelp && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-6 p-6 bg-primary/5 border border-primary/20 rounded-sm space-y-4">
                          <p className="text-[10px] text-zinc-500 leading-relaxed font-bold border-b border-primary/20 pb-2 mb-2">
                            {lang === 'de' 
                              ? 'WICHTIG: Nach dem Ausführen des SQLs müssen Sie in Supabase unter "Settings -> API" auf "Reload Schema" klicken!'
                              : 'IMPORTANT: After running this SQL, you MUST click "Reload Schema" in Supabase under "Settings -> API"!'}
                          </p>
                          <p className="text-[10px] text-zinc-500 leading-relaxed italic">
                            {lang === 'de' 
                              ? 'Kopieren Sie diesen Code und führen Sie ihn im Supabase SQL Editor aus:'
                              : 'Copy this code and run it in your Supabase SQL Editor:'}
                          </p>
                          <pre className="text-[9px] bg-zinc-950 p-4 overflow-x-auto text-zinc-300 font-mono border border-zinc-900 leading-tight select-all">
{`-- 1. Ensure all required columns exist
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS hero_image_url text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS about_image_url text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS cta_image_url text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS contact_image_url text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS stats_years text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS stats_projects text;

-- 2. Fix potential "NOT NULL" constraint errors (makes slogan/name optional)
ALTER TABLE site_settings ALTER COLUMN slogan DROP NOT NULL;
ALTER TABLE site_settings ALTER COLUMN name DROP NOT NULL;

-- 3. Ensure an initial settings record exists for ID 1
-- This uses placeholders for any other required columns you might have
INSERT INTO site_settings (id, name, slogan) 
VALUES (1, 'FJ Bauservice', 'Ihr Partner für Bauvorhaben') 
ON CONFLICT (id) DO NOTHING;

-- 4. Enable RLS and public access if not already done
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access" ON site_settings;
CREATE POLICY "Allow public access" ON site_settings FOR ALL USING (true);`}
                          </pre>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'projects' && (
            <div className="space-y-12">
              <div className="space-y-2">
                <h3 className="heading-dynamic text-4xl">{lang === 'de' ? 'Projekt-Verwaltung' : 'Project Management'}</h3>
                <p className="text-zinc-500 text-sm">{lang === 'de' ? 'Neue Projekte hinzufügen oder bestehende bearbeiten.' : 'Add new projects or edit existing ones.'}</p>
              </div>

              {/* Project Form */}
              <div className="bg-surface-dark border border-surface-border p-8 rounded-sm">
                <h4 className="text-xs font-black uppercase tracking-[0.2em] mb-6 text-primary">
                  {editingProject ? (lang === 'de' ? 'Projekt bearbeiten' : 'Edit Project') : (lang === 'de' ? 'Neues Projekt' : 'New Project')}
                </h4>
                <form onSubmit={handleSaveProject} className="grid md:grid-cols-2 gap-x-6 gap-y-4">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-tighter text-zinc-500">{lang === 'de' ? 'Titel (DE)' : 'Title (DE)'}</label>
                    <input 
                      placeholder="Titel (DE)" type="text" required
                      value={projectForm.title_de || projectForm.title || ''} onChange={e => setProjectForm({...projectForm, title_de: e.target.value, title: e.target.value})}
                      className="w-full bg-surface-card border border-surface-border p-3 outline-none focus:border-primary transition-colors text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-tighter text-zinc-500">Title (EN)</label>
                    <input 
                      placeholder="Title (EN)" type="text" required
                      value={projectForm.title_en || ''} onChange={e => setProjectForm({...projectForm, title_en: e.target.value})}
                      className="w-full bg-surface-card border border-surface-border p-3 outline-none focus:border-primary transition-colors text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-tighter text-zinc-500">{lang === 'de' ? 'Kategorie (DE)' : 'Category (DE)'}</label>
                    <input 
                      placeholder="Kategorie (DE)" type="text" required
                      value={projectForm.category_de || projectForm.category || ''} onChange={e => setProjectForm({...projectForm, category_de: e.target.value, category: e.target.value})}
                      className="w-full bg-surface-card border border-surface-border p-3 outline-none focus:border-primary transition-colors text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-tighter text-zinc-500">Category (EN)</label>
                    <input 
                      placeholder="Category (EN)" type="text" required
                      value={projectForm.category_en || ''} onChange={e => setProjectForm({...projectForm, category_en: e.target.value})}
                      className="w-full bg-surface-card border border-surface-border p-3 outline-none focus:border-primary transition-colors text-sm"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[9px] uppercase tracking-tighter text-zinc-500">{lang === 'de' ? 'Beschreibung (DE)' : 'Description (DE)'}</label>
                    <textarea 
                      placeholder="Beschreibung (DE)" rows={2}
                      value={projectForm.description_de || projectForm.description || ''} onChange={e => setProjectForm({...projectForm, description_de: e.target.value, description: e.target.value})}
                      className="w-full bg-surface-card border border-surface-border p-3 outline-none focus:border-primary transition-colors text-sm resize-none"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[9px] uppercase tracking-tighter text-zinc-500">Description (EN)</label>
                    <textarea 
                      placeholder="Description (EN)" rows={2}
                      value={projectForm.description_en || ''} onChange={e => setProjectForm({...projectForm, description_en: e.target.value})}
                      className="w-full bg-surface-card border border-surface-border p-3 outline-none focus:border-primary transition-colors text-sm resize-none"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[9px] uppercase tracking-tighter text-zinc-500">{lang === 'de' ? 'Projekt-Bild' : 'Project Image'}</label>
                      <label className="cursor-pointer text-[10px] text-primary hover:underline font-bold flex items-center gap-1">
                        {isUploading === 'image_url' ? <Loader2 size={12} className="animate-spin" /> : <ImageIcon size={12} />} 
                        {isUploading === 'image_url' ? (lang === 'de' ? 'Hochladen...' : 'Uploading...') : (lang === 'de' ? 'Hochladen' : 'Upload')}
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload('image_url', e, true)} disabled={!!isUploading} />
                      </label>
                    </div>
                    <input 
                      placeholder="https://..." type="text" required
                      value={projectForm.image_url || ''} onChange={e => setProjectForm({...projectForm, image_url: e.target.value})}
                      className="w-full bg-surface-card border border-surface-border p-3 outline-none focus:border-primary transition-colors text-sm"
                    />
                    {renderImageHistory('image_url', true)}
                  </div>

                  <div className="md:col-span-2 flex gap-4 mt-2">
                    <button type="submit" disabled={isSaving || !!isUploading} className="button-primary flex-1 justify-center disabled:opacity-50">
                      {isSaving ? <Loader2 className="animate-spin" /> : (editingProject ? <Save size={20} /> : <Plus size={20} />)}
                      {editingProject ? (lang === 'de' ? 'Speichern' : 'Save Changes') : (lang === 'de' ? 'Hinzufügen' : 'Add Project')}
                    </button>
                    {editingProject && (
                      <button type="button" onClick={cancelEdit} className="px-6 border border-surface-border text-zinc-500 hover:text-white transition-colors uppercase text-xs font-black tracking-widest">
                        {lang === 'de' ? 'Abbrechen' : 'Cancel'}
                      </button>
                    )}
                  </div>
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
                      <h5 className="font-bold truncate text-sm">
                        {lang === 'de' ? (project.title_de || project.title) : (project.title_en || project.title)}
                      </h5>
                      <p className="text-[10px] text-zinc-500 uppercase font-black">
                        {lang === 'de' ? (project.category_de || project.category) : (project.category_en || project.category)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => startEditProject(project)}
                        className="text-zinc-600 hover:text-primary transition-colors p-2"
                        title={lang === 'de' ? 'Bearbeiten' : 'Edit'}
                      >
                        <Pencil size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteProject(project)}
                        className="text-zinc-600 hover:text-red-500 transition-colors p-2"
                        title={lang === 'de' ? 'Löschen' : 'Delete'}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'inquiries' && (
            <div className="space-y-10">
              <div className="space-y-2">
                <h3 className="heading-dynamic text-4xl">{lang === 'de' ? 'Kontaktanfragen' : 'Inquiries'}</h3>
                <p className="text-zinc-500 text-sm">{lang === 'de' ? 'Alle Nachrichten über das Kontaktformular.' : 'All messages from the contact form.'}</p>
              </div>

              <div className="space-y-4">
                {inquiries.length > 0 ? inquiries.map(inquiry => (
                  <div key={inquiry.id} className="bg-surface-dark border border-surface-border p-6 rounded-sm space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-bold text-lg">{inquiry.subject || 'No Subject'}</h5>
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
                    {lang === 'de' ? 'Keine Anfragen vorhanden.' : 'No inquiries found.'}
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
