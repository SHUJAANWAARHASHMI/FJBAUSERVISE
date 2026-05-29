/**
 * SiteEditor — Full Visual Website Editor (Wix/Webflow-style)
 *
 * Architecture:
 *  - Wraps REAL frontend components (Navbar, Hero, Services, WhyUs, ProjectGallery, FAQ, CTA, Contact, Footer)
 *    inside an EditorContext.Provider so they become click-to-edit.
 *  - All components use EditableText / EditableImage / EditableSection primitives from editorContext.tsx
 *    — when isEditing=true they render contentEditable overlays; otherwise they are completely normal.
 *  - Left panel: Layers (section manager) + Styles + Media library
 *  - Right panel: Service/FAQ/Project/Testimonial item editors
 *  - Toolbar: Undo/Redo, Device preview, Save, Publish
 */

import React, {
  useState, useEffect, useRef, useCallback
} from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Save, Undo2, Redo2, Monitor, Tablet, Smartphone, EyeOff,
  Upload, Image as ImageIcon, Palette, Layers, Settings2,
  ChevronUp, ChevronDown, Trash2, Plus, CheckCircle2, AlertCircle,
  Loader2, Globe, Zap, RefreshCw,
  PanelLeftClose, PanelLeftOpen, Star,
  MousePointer2, Info
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { translations } from '../lib/translations';
import type { SiteSettings, Project, Service, Faq, Testimonial } from '../App';
import { EditorContext, type EditorContextValue } from '../lib/editorContext';

// Real frontend components — these are now editor-aware via EditorContext
import Navbar from './Navbar';
import Hero from './Hero';
import Services from './Services';
import WhyUs from './WhyUs';
import ProjectGallery from './ProjectGallery';
import FAQ from './FAQ';
import CTA from './CTA';
import Contact from './Contact';
import Footer from './Footer';

// ─── Types ────────────────────────────────────────────────────────────────────
interface SectionMeta {
  id: string;
  label: string;
  icon: string;
  visible: boolean;
  order: number;
}

interface Toast { id: string; type: 'success' | 'error' | 'info'; message: string; }

const DEFAULT_SECTIONS: SectionMeta[] = [
  { id: 'navbar',   label: 'Navigation',    icon: '🧭', visible: true, order: 0 },
  { id: 'hero',     label: 'Hero',          icon: '🦸', visible: true, order: 1 },
  { id: 'services', label: 'Leistungen',    icon: '⚡', visible: true, order: 2 },
  { id: 'whyus',    label: 'Warum Wir',     icon: '🏆', visible: true, order: 3 },
  { id: 'projects', label: 'Referenzen',    icon: '🏗️', visible: true, order: 4 },
  { id: 'faqs',     label: 'FAQs',          icon: '❓', visible: true, order: 5 },
  { id: 'cta',      label: 'Call to Action', icon: '📣', visible: true, order: 6 },
  { id: 'contact',  label: 'Kontakt',       icon: '📞', visible: true, order: 7 },
  { id: 'footer',   label: 'Footer',        icon: '🦶', visible: true, order: 8 },
];

// ─── Main SiteEditor ──────────────────────────────────────────────────────────
interface SiteEditorProps {
  onClose: () => void;
  initialSettings: any;
  initialProjects: any[];
  initialServices: any[];
  initialFaqs: any[];
  initialTestimonials: any[];
  refreshData: () => void;
}

export default function SiteEditor({
  onClose, initialSettings, initialProjects, initialServices,
  initialFaqs, initialTestimonials, refreshData
}: SiteEditorProps) {

  // ── Core state ───────────────────────────────────────────────────────────────
  const [settings, setSettings] = useState<any>(initialSettings || {});
  const [projects, setProjects] = useState<any[]>(initialProjects || []);
  const [services, setServices] = useState<any[]>(initialServices || []);
  const [faqs, setFaqs] = useState<any[]>(initialFaqs || []);
  const [testimonials, setTestimonials] = useState<any[]>(initialTestimonials || []);
  const [sections, setSections] = useState<SectionMeta[]>(DEFAULT_SECTIONS);

  // ── History (undo/redo) ──────────────────────────────────────────────────────
  const historyRef = useRef<any[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const pushHistory = useCallback((newSettings: any) => {
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current.push(JSON.parse(JSON.stringify(newSettings)));
    historyIndexRef.current = historyRef.current.length - 1;
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(false);
  }, []);

  const undo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current--;
      setSettings(JSON.parse(JSON.stringify(historyRef.current[historyIndexRef.current])));
      setCanUndo(historyIndexRef.current > 0);
      setCanRedo(true);
    }
  }, []);

  const redo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current++;
      setSettings(JSON.parse(JSON.stringify(historyRef.current[historyIndexRef.current])));
      setCanUndo(true);
      setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
    }
  }, []);

  // Push initial snapshot
  useEffect(() => {
    historyRef.current = [JSON.parse(JSON.stringify(initialSettings || {}))];
    historyIndexRef.current = 0;
  }, []);

  // ── Editor UI state ──────────────────────────────────────────────────────────
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [activePanel, setActivePanel] = useState<'layers' | 'styles' | 'media'>('layers');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mediaFiles, setMediaFiles] = useState<string[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [editingFaq, setEditingFaq] = useState<any>(null);
  const [editingTestimonial, setEditingTestimonial] = useState<any>(null);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [rightPanel, setRightPanel] = useState<string | null>(null);

  // ── Autosave debounce ────────────────────────────────────────────────────────
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Toast helper ─────────────────────────────────────────────────────────────
  const addToast = useCallback((type: Toast['type'], message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(p => [...p, { id, type, message }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  }, []);

  // ── patchSettings — updates a single key in the settings object ──────────────
  const patchSettings = useCallback((key: string, value: any) => {
    setSettings((prev: any) => {
      const next = { ...prev, [key]: value };
      pushHistory(next);
      return next;
    });
    setHasUnsaved(true);
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(async () => {
      const current = historyRef.current[historyIndexRef.current] || {};
      const { id, updated_at, created_at, ...updateData } = current;
      await supabase.from('site_settings').upsert({ id: 1, ...updateData }, { onConflict: 'id' });
    }, 2000);
  }, [pushHistory]);

  // ── Image upload ──────────────────────────────────────────────────────────────
  const uploadImage = useCallback(async (fieldKey: string, file: File): Promise<string | null> => {
    setUploadingField(fieldKey);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const filePath = `uploads/${fileName}`;
      const { error } = await supabase.storage.from('images').upload(filePath, file, { cacheControl: '3600', upsert: false });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(filePath);
      addToast('success', 'Bild hochgeladen!');
      return publicUrl;
    } catch (err: any) {
      addToast('error', 'Upload-Fehler: ' + err.message);
      return null;
    } finally {
      setUploadingField(null);
    }
  }, [addToast]);

  // ── Load media library ────────────────────────────────────────────────────────
  const loadMedia = useCallback(async () => {
    setMediaLoading(true);
    try {
      const { data: files } = await supabase.storage.from('images').list('uploads', { limit: 50, sortBy: { column: 'created_at', order: 'desc' } });
      if (files) {
        const urls = files.map(f => supabase.storage.from('images').getPublicUrl(`uploads/${f.name}`).data.publicUrl);
        setMediaFiles(urls);
      }
    } catch { /* silent */ }
    setMediaLoading(false);
  }, []);

  useEffect(() => { if (activePanel === 'media') loadMedia(); }, [activePanel]);

  // ── Save to Supabase ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { id, updated_at, created_at, ...updateData } = settings;
      const { error } = await supabase.from('site_settings').upsert({ id: 1, ...updateData }, { onConflict: 'id' });
      if (error) throw error;
      setHasUnsaved(false);
      addToast('success', 'Änderungen gespeichert!');
    } catch (err: any) {
      addToast('error', 'Fehler: ' + err.message);
    }
    setIsSaving(false);
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    await handleSave();
    await new Promise(r => setTimeout(r, 800));
    refreshData();
    addToast('success', '🚀 Website veröffentlicht!');
    setIsPublishing(false);
  };

  // ── CRUD helpers ──────────────────────────────────────────────────────────────
  const saveService = async (svc: any) => {
    if (svc.id && !svc._new) {
      const { id, created_at, ...upd } = svc;
      const { error } = await supabase.from('services').update(upd).eq('id', id);
      if (error) { addToast('error', error.message); return; }
    } else {
      const { id, _new, created_at, ...ins } = svc;
      const { error } = await supabase.from('services').insert([ins]);
      if (error) { addToast('error', error.message); return; }
    }
    addToast('success', 'Service gespeichert!');
    const { data: svcs } = await supabase.from('services').select('*').order('sort_order');
    if (svcs) setServices(svcs);
    setEditingService(null); setRightPanel(null);
  };

  const deleteService = async (id: string) => {
    await supabase.from('services').delete().eq('id', id);
    setServices(p => p.filter(s => s.id !== id));
    addToast('success', 'Gelöscht.'); setEditingService(null); setRightPanel(null);
  };

  const saveFaq = async (faq: any) => {
    if (faq.id && !faq._new) {
      const { id, created_at, ...upd } = faq;
      await supabase.from('faqs').update(upd).eq('id', id);
    } else {
      const { id, _new, created_at, ...ins } = faq;
      await supabase.from('faqs').insert([ins]);
    }
    addToast('success', 'FAQ gespeichert!');
    const { data: faqData } = await supabase.from('faqs').select('*').order('sort_order');
    if (faqData) setFaqs(faqData);
    setEditingFaq(null); setRightPanel(null);
  };

  const deleteFaq = async (id: string) => {
    await supabase.from('faqs').delete().eq('id', id);
    setFaqs(p => p.filter(f => f.id !== id));
    addToast('success', 'Gelöscht.'); setEditingFaq(null); setRightPanel(null);
  };

  const saveTestimonial = async (t: any) => {
    if (t.id && !t._new) {
      const { id, created_at, ...upd } = t;
      await supabase.from('testimonials').update(upd).eq('id', id);
    } else {
      const { id, _new, created_at, ...ins } = t;
      await supabase.from('testimonials').insert([ins]);
    }
    addToast('success', 'Testimonial gespeichert!');
    const { data: ts } = await supabase.from('testimonials').select('*');
    if (ts) setTestimonials(ts);
    setEditingTestimonial(null); setRightPanel(null);
  };

  const saveProject = async (proj: any) => {
    if (proj.id && !proj._new) {
      const { id, created_at, ...upd } = proj;
      await supabase.from('projects').update(upd).eq('id', id);
    } else {
      const { id, _new, created_at, ...ins } = proj;
      await supabase.from('projects').insert([ins]);
    }
    addToast('success', 'Projekt gespeichert!');
    const { data: ps } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    if (ps) setProjects(ps);
    setEditingProject(null); setRightPanel(null);
  };

  const deleteProject = async (id: string) => {
    await supabase.from('projects').delete().eq('id', id);
    setProjects(p => p.filter(pr => pr.id !== id));
    addToast('success', 'Gelöscht.'); setEditingProject(null); setRightPanel(null);
  };

  // ── Section reorder/toggle ────────────────────────────────────────────────────
  const moveSection = (id: string, dir: 'up' | 'down') => {
    setSections(prev => {
      const secs = [...prev].sort((a, b) => a.order - b.order);
      const idx = secs.findIndex(s => s.id === id);
      const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= secs.length) return prev;
      const tmp = secs[idx].order;
      secs[idx].order = secs[swapIdx].order;
      secs[swapIdx].order = tmp;
      return secs;
    });
  };

  const toggleSection = (id: string) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, visible: !s.visible } : s));
  };

  // ── Device width map ──────────────────────────────────────────────────────────
  const deviceWidth = { desktop: '100%', tablet: '768px', mobile: '390px' };

  // ── Keyboard shortcuts ────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) { e.preventDefault(); redo(); }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); handleSave(); }
      if (e.key === 'Escape') setSelectedSection(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);

  // ── EditorContext value ───────────────────────────────────────────────────────
  const editorContextValue: EditorContextValue = {
    isEditing: true,
    settings,
    patchSettings,
    uploadImage,
    uploadingField,
    selectedSection,
    setSelectedSection,
  };

  // ── noop handlers for real components (no navigation in editor) ───────────────
  const noop = () => {};

  // ── Sorted sections ───────────────────────────────────────────────────────────
  const sortedSections = [...sections].sort((a, b) => a.order - b.order);

  return (
    <EditorContext.Provider value={editorContextValue}>
      <div className="fixed inset-0 z-[150] flex flex-col bg-[#0e0e0e] overflow-hidden" style={{ fontFamily: "'Montserrat', sans-serif" }}>

        {/* ═══ TOP TOOLBAR ═══════════════════════════════════════════════════════ */}
        <header className="flex items-center gap-3 px-4 py-2 bg-[#111] border-b border-[#222] shrink-0 z-10">
          {/* Logo + title */}
          <div className="flex items-center gap-3 mr-2">
            <div className="w-7 h-7 bg-primary flex items-center justify-center rounded-sm shrink-0">
              <MousePointer2 size={14} className="text-black" />
            </div>
            <span className="font-black text-[11px] uppercase tracking-widest text-white hidden sm:block">Site Editor</span>
          </div>

          <div className="w-px h-6 bg-[#333]" />

          {/* Undo / Redo */}
          <button onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)"
            className="p-1.5 rounded text-zinc-500 hover:text-white disabled:opacity-30 transition-colors hover:bg-[#222]">
            <Undo2 size={16} />
          </button>
          <button onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Y)"
            className="p-1.5 rounded text-zinc-500 hover:text-white disabled:opacity-30 transition-colors hover:bg-[#222]">
            <Redo2 size={16} />
          </button>

          <div className="w-px h-6 bg-[#333]" />

          {/* Device preview */}
          <div className="flex items-center gap-1">
            {(['desktop', 'tablet', 'mobile'] as const).map(d => (
              <button key={d} onClick={() => setDevice(d)} title={d}
                className={`p-1.5 rounded transition-colors hover:bg-[#222] ${device === d ? 'text-primary bg-primary/10' : 'text-zinc-500 hover:text-white'}`}>
                {d === 'desktop' ? <Monitor size={16} /> : d === 'tablet' ? <Tablet size={16} /> : <Smartphone size={16} />}
              </button>
            ))}
          </div>

          {/* Center: URL bar */}
          <div className="flex-1 flex justify-center">
            <div className="flex items-center gap-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-sm px-3 py-1 max-w-xs w-full">
              <Globe size={12} className="text-zinc-600 shrink-0" />
              <span className="text-zinc-500 text-[11px] font-mono truncate">fj-bauservice.com</span>
              <span className={`ml-auto text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-sm ${hasUnsaved ? 'text-yellow-500 bg-yellow-500/10' : 'text-green-500 bg-green-500/10'}`}>
                {hasUnsaved ? 'Ungespeichert' : 'Gespeichert'}
              </span>
            </div>
          </div>

          {/* Right: Save + Publish + Close */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave} disabled={isSaving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider border border-[#333] text-zinc-300 hover:text-white hover:border-[#555] rounded-sm transition-colors disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              <span className="hidden sm:inline">Speichern</span>
            </button>
            <button
              onClick={handlePublish} disabled={isPublishing}
              className="flex items-center gap-1.5 px-4 py-1.5 text-[11px] font-black uppercase tracking-wider bg-primary text-black hover:bg-white rounded-sm transition-colors disabled:opacity-50"
            >
              {isPublishing ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
              <span className="hidden sm:inline">Veröffentlichen</span>
            </button>
            <button onClick={onClose}
              className="p-1.5 text-zinc-500 hover:text-white hover:bg-[#222] rounded-sm transition-colors ml-1">
              <X size={18} />
            </button>
          </div>
        </header>

        {/* ═══ MAIN AREA ═════════════════════════════════════════════════════════ */}
        <div className="flex flex-1 overflow-hidden">

          {/* ── LEFT PANEL ──────────────────────────────────────────────────── */}
          <aside className={`flex flex-col bg-[#111] border-r border-[#222] shrink-0 transition-all duration-300 ${sidebarCollapsed ? 'w-12' : 'w-64'}`}>
            {/* Panel tabs */}
            <div className="flex items-center border-b border-[#222]">
              {!sidebarCollapsed && (
                <>
                  {([
                    { id: 'layers', icon: <Layers size={14} />, label: 'Ebenen' },
                    { id: 'styles', icon: <Palette size={14} />, label: 'Stil' },
                    { id: 'media',  icon: <ImageIcon size={14} />, label: 'Medien' },
                  ] as const).map(tab => (
                    <button key={tab.id} onClick={() => setActivePanel(tab.id)}
                      className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[9px] font-black uppercase tracking-wider transition-colors ${activePanel === tab.id ? 'text-primary border-b-2 border-primary' : 'text-zinc-600 hover:text-zinc-300'}`}>
                      {tab.icon}
                      {tab.label}
                    </button>
                  ))}
                </>
              )}
              <button onClick={() => setSidebarCollapsed(p => !p)}
                className="p-2 text-zinc-600 hover:text-white transition-colors ml-auto">
                {sidebarCollapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
              </button>
            </div>

            {!sidebarCollapsed && (
              <div className="flex-1 overflow-y-auto">
                {/* LAYERS PANEL */}
                {activePanel === 'layers' && (
                  <LayersPanel
                    sections={sections}
                    selectedSection={selectedSection}
                    setSelectedSection={setSelectedSection}
                    moveSection={moveSection}
                    toggleSection={toggleSection}
                    services={services}
                    faqs={faqs}
                    testimonials={testimonials}
                    projects={projects}
                    onEditService={(svc: any) => { setEditingService({ ...svc }); setRightPanel('service-edit'); }}
                    onAddService={() => { setEditingService({ _new: true, title_de: '', title_en: '', description_de: '', description_en: '', icon_name: 'Hammer', sort_order: services.length }); setRightPanel('service-edit'); }}
                    onEditFaq={(faq: any) => { setEditingFaq({ ...faq }); setRightPanel('faq-edit'); }}
                    onAddFaq={() => { setEditingFaq({ _new: true, question_de: '', question_en: '', answer_de: '', answer_en: '', sort_order: faqs.length }); setRightPanel('faq-edit'); }}
                    onEditTestimonial={(t: any) => { setEditingTestimonial({ ...t }); setRightPanel('testimonial-edit'); }}
                    onAddTestimonial={() => { setEditingTestimonial({ _new: true, author: '', company: '', text_de: '', text_en: '', rating: 5, avatar_url: '' }); setRightPanel('testimonial-edit'); }}
                    onEditProject={(p: any) => { setEditingProject({ ...p }); setRightPanel('project-edit'); }}
                    onAddProject={() => { setEditingProject({ _new: true, title_de: '', title_en: '', category_de: '', category_en: '', description_de: '', description_en: '', image_url: '' }); setRightPanel('project-edit'); }}
                  />
                )}

                {/* STYLES PANEL */}
                {activePanel === 'styles' && (
                  <StylesPanel settings={settings} patchSettings={patchSettings} />
                )}

                {/* MEDIA PANEL */}
                {activePanel === 'media' && (
                  <MediaPanel
                    files={mediaFiles}
                    loading={mediaLoading}
                    onRefresh={loadMedia}
                    onUpload={async (file: File) => {
                      const url = await uploadImage('media_lib', file);
                      if (url) setMediaFiles(p => [url, ...p]);
                    }}
                    onSelect={(url: string) => {
                      if (selectedSection) patchSettings(selectedSection, url);
                    }}
                    isUploading={uploadingField === 'media_lib'}
                  />
                )}
              </div>
            )}
          </aside>

          {/* ── CANVAS ──────────────────────────────────────────────────────── */}
          <div className="flex-1 overflow-auto bg-[#1a1a1a] flex items-start justify-center p-6">
            <div
              className="relative bg-white transition-all duration-500 shadow-2xl"
              style={{ width: deviceWidth[device], minWidth: device !== 'desktop' ? deviceWidth[device] : undefined }}
              onClick={() => setSelectedSection(null)}
            >
              {/* Device frame indicator */}
              {device !== 'desktop' && (
                <div className="sticky top-0 z-50 bg-[#111]/80 backdrop-blur text-center text-[9px] font-black uppercase tracking-widest py-1 text-zinc-500">
                  {device === 'tablet' ? '📱 Tablet — 768px' : '📱 Mobile — 390px'}
                </div>
              )}

              {/* ── REAL WEBSITE COMPONENTS ── */}
              {/* Render each section according to visibility + order */}
              {sortedSections.map(sec => {
                if (!sec.visible) {
                  return (
                    <div key={sec.id} className="relative py-4 px-6 bg-gray-100 border border-dashed border-gray-300 my-1 flex items-center justify-center gap-2 text-gray-400 text-xs font-bold">
                      <EyeOff size={14} /> Abschnitt „{sec.label}" ist ausgeblendet
                    </div>
                  );
                }
                return (
                  <SectionWrapper key={sec.id} sec={sec}>
                    {sec.id === 'navbar' && (
                      <Navbar
                        currentPage="home"
                        setCurrentPage={noop}
                        settings={settings}
                        onAdminTrigger={noop}
                        lang="de"
                      />
                    )}
                    {sec.id === 'hero' && (
                      <Hero settings={settings} lang="de" setCurrentPage={noop} />
                    )}
                    {sec.id === 'services' && (
                      <Services lang="de" setCurrentPage={noop} dbServices={services} />
                    )}
                    {sec.id === 'whyus' && (
                      <WhyUs lang="de" />
                    )}
                    {sec.id === 'projects' && (
                      <ProjectGallery projects={projects} lang="de" />
                    )}
                    {sec.id === 'faqs' && (
                      <FAQ lang="de" dbFaqs={faqs} />
                    )}
                    {sec.id === 'cta' && (
                      <CTA settings={settings} lang="de" setCurrentPage={noop} />
                    )}
                    {sec.id === 'contact' && (
                      <Contact settings={settings} lang="de" />
                    )}
                    {sec.id === 'footer' && (
                      <Footer
                        settings={settings}
                        lang="de"
                        setCurrentPage={noop}
                        onAdminTrigger={noop}
                      />
                    )}
                  </SectionWrapper>
                );
              })}
            </div>
          </div>

          {/* ── RIGHT PANEL (item editors) ───────────────────────────────────── */}
          <AnimatePresence>
            {rightPanel && (
              <motion.aside
                initial={{ x: 320, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 320, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="w-80 bg-[#111] border-l border-[#222] overflow-y-auto flex flex-col"
              >
                {rightPanel === 'service-edit' && editingService && (
                  <ItemEditPanel
                    title={editingService._new ? 'Neuer Service' : 'Service bearbeiten'}
                    onClose={() => { setRightPanel(null); setEditingService(null); }}
                    onSave={() => saveService(editingService)}
                    onDelete={editingService._new ? undefined : () => deleteService(editingService.id)}
                    isNew={!!editingService._new}
                  >
                    <ServiceEditForm svc={editingService} onChange={setEditingService} uploadImage={uploadImage} isUploading={uploadingField} />
                  </ItemEditPanel>
                )}
                {rightPanel === 'faq-edit' && editingFaq && (
                  <ItemEditPanel
                    title={editingFaq._new ? 'Neue FAQ' : 'FAQ bearbeiten'}
                    onClose={() => { setRightPanel(null); setEditingFaq(null); }}
                    onSave={() => saveFaq(editingFaq)}
                    onDelete={editingFaq._new ? undefined : () => deleteFaq(editingFaq.id)}
                    isNew={!!editingFaq._new}
                  >
                    <FaqEditForm faq={editingFaq} onChange={setEditingFaq} />
                  </ItemEditPanel>
                )}
                {rightPanel === 'testimonial-edit' && editingTestimonial && (
                  <ItemEditPanel
                    title={editingTestimonial._new ? 'Neues Testimonial' : 'Testimonial bearbeiten'}
                    onClose={() => { setRightPanel(null); setEditingTestimonial(null); }}
                    onSave={() => saveTestimonial(editingTestimonial)}
                    onDelete={editingTestimonial._new ? undefined : () => {
                      supabase.from('testimonials').delete().eq('id', editingTestimonial.id);
                      setTestimonials(p => p.filter(t => t.id !== editingTestimonial.id));
                      setRightPanel(null); setEditingTestimonial(null); addToast('success', 'Gelöscht.');
                    }}
                    isNew={!!editingTestimonial._new}
                  >
                    <TestimonialEditForm t={editingTestimonial} onChange={setEditingTestimonial} uploadImage={uploadImage} isUploading={uploadingField} />
                  </ItemEditPanel>
                )}
                {rightPanel === 'project-edit' && editingProject && (
                  <ItemEditPanel
                    title={editingProject._new ? 'Neues Projekt' : 'Projekt bearbeiten'}
                    onClose={() => { setRightPanel(null); setEditingProject(null); }}
                    onSave={() => saveProject(editingProject)}
                    onDelete={editingProject._new ? undefined : () => deleteProject(editingProject.id)}
                    isNew={!!editingProject._new}
                  >
                    <ProjectEditForm proj={editingProject} onChange={setEditingProject} uploadImage={uploadImage} isUploading={uploadingField} />
                  </ItemEditPanel>
                )}
              </motion.aside>
            )}
          </AnimatePresence>
        </div>

        {/* ═══ TOAST CONTAINER ═══════════════════════════════════════════════════ */}
        <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 max-w-sm pointer-events-none">
          <AnimatePresence>
            {toasts.map(toast => (
              <motion.div key={toast.id}
                initial={{ opacity: 0, x: 60, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 60, scale: 0.9 }}
                className={`pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-sm shadow-2xl border text-sm font-bold ${
                  toast.type === 'success' ? 'bg-green-900/90 border-green-500/50 text-green-300' :
                  toast.type === 'error'   ? 'bg-red-900/90 border-red-500/50 text-red-300' :
                                             'bg-zinc-800/90 border-zinc-600/50 text-zinc-200'
                }`}>
                {toast.type === 'success' && <CheckCircle2 size={16} className="text-green-400 shrink-0" />}
                {toast.type === 'error'   && <AlertCircle  size={16} className="text-red-400 shrink-0" />}
                {toast.type === 'info'    && <Info         size={16} className="text-blue-400 shrink-0" />}
                {toast.message}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Keyboard hint */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-4 text-[9px] text-zinc-700 font-mono pointer-events-none select-none">
          <span>Ctrl+Z Rückgängig</span>
          <span>Ctrl+S Speichern</span>
          <span>Esc Auswahl aufheben</span>
          <span>Klicken zum Bearbeiten</span>
        </div>
      </div>
    </EditorContext.Provider>
  );
}

// ─── Section wrapper (non-editing passthrough — EditableSection inside components handles editing) ────
function SectionWrapper({ sec, children }: { sec: SectionMeta; children: React.ReactNode }) {
  // The real components have EditableSection inside them already.
  // This just provides a key-based wrapper for the canvas.
  return <div key={sec.id} data-section-id={sec.id}>{children}</div>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEFT PANEL: LAYERS
// ═══════════════════════════════════════════════════════════════════════════════
function LayersPanel({
  sections, selectedSection, setSelectedSection,
  moveSection, toggleSection,
  services, faqs, testimonials, projects,
  onEditService, onAddService,
  onEditFaq, onAddFaq,
  onEditTestimonial, onAddTestimonial,
  onEditProject, onAddProject,
}: any) {
  const sortedSecs = [...sections].sort((a: SectionMeta, b: SectionMeta) => a.order - b.order);
  return (
    <div className="p-3 space-y-4">
      {/* Sections */}
      <div className="space-y-1">
        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 px-1 pb-1">Seitenabschnitte</p>
        {sortedSecs.map((sec: SectionMeta) => (
          <div
            key={sec.id}
            onClick={() => setSelectedSection(sec.id)}
            className={`flex items-center gap-2 px-2 py-1.5 rounded-sm cursor-pointer transition-colors group ${selectedSection === sec.id ? 'bg-primary/20 text-primary' : 'hover:bg-[#1a1a1a] text-zinc-400'}`}
          >
            <span className="text-sm">{sec.icon}</span>
            <span className={`flex-1 text-[11px] font-bold uppercase tracking-wider truncate ${sec.visible ? '' : 'line-through opacity-40'}`}>{sec.label}</span>
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={e => { e.stopPropagation(); moveSection(sec.id, 'up'); }} className="p-0.5 hover:text-white"><ChevronUp size={11} /></button>
              <button onClick={e => { e.stopPropagation(); moveSection(sec.id, 'down'); }} className="p-0.5 hover:text-white"><ChevronDown size={11} /></button>
              <button onClick={e => { e.stopPropagation(); toggleSection(sec.id); }} className="p-0.5 hover:text-white">
                {sec.visible ? <EyeOff size={11} /> : <span className="text-[10px]">👁</span>}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Services */}
      <CollapsibleGroup title="Leistungen" items={services} onEdit={onEditService} onAdd={onAddService}
        renderItem={(s: any) => s.title_de || s.title || 'Unbenannt'} />

      {/* FAQs */}
      <CollapsibleGroup title="FAQs" items={faqs} onEdit={onEditFaq} onAdd={onAddFaq}
        renderItem={(f: any) => (f.question_de || f.question || '').slice(0, 30) + '…'} />

      {/* Projects */}
      <CollapsibleGroup title="Referenzen" items={projects} onEdit={onEditProject} onAdd={onAddProject}
        renderItem={(p: any) => p.title_de || p.title || 'Unbenannt'} />

      {/* Testimonials */}
      <CollapsibleGroup title="Testimonials" items={testimonials} onEdit={onEditTestimonial} onAdd={onAddTestimonial}
        renderItem={(t: any) => t.author || 'Anonym'} />
    </div>
  );
}

function CollapsibleGroup({ title, items, onEdit, onAdd, renderItem }: any) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t border-[#222] pt-3 space-y-1">
      <button onClick={() => setOpen(p => !p)}
        className="w-full flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-zinc-600 hover:text-zinc-300 transition-colors px-1">
        <span>{title} ({items?.length || 0})</span>
        {open ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
      </button>
      {open && (
        <div className="space-y-0.5">
          {(items || []).map((item: any, idx: number) => (
            <button key={idx} onClick={() => onEdit(item)}
              className="w-full text-left px-2 py-1 text-[10px] text-zinc-500 hover:text-white hover:bg-[#1a1a1a] rounded-sm transition-colors truncate">
              {renderItem(item)}
            </button>
          ))}
          <button onClick={onAdd}
            className="w-full flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold text-primary hover:text-white hover:bg-primary/20 rounded-sm transition-colors">
            <Plus size={11} /> Neu hinzufügen
          </button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEFT PANEL: STYLES
// ═══════════════════════════════════════════════════════════════════════════════
function StylesPanel({ settings: s, patchSettings }: { settings: any; patchSettings: (k: string, v: any) => void }) {
  return (
    <div className="p-3 space-y-4">
      <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Firmeninfo</p>
      {[
        ['Firmenname', 'name'],
        ['Telefon', 'phone'],
        ['E-Mail', 'email'],
        ['Adresse (DE)', 'address_de'],
        ['WhatsApp', 'whatsapp_number'],
      ].map(([label, field]) => (
        <div key={field} className="space-y-1">
          <label className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">{label}</label>
          <input
            type="text"
            value={s?.[field] || ''}
            onChange={e => patchSettings(field, e.target.value)}
            placeholder={label as string}
            className="w-full bg-[#0a0a0a] border border-[#222] p-2 rounded-sm text-xs text-white placeholder:text-zinc-700 outline-none focus:border-primary"
          />
        </div>
      ))}

      <div className="space-y-3 pt-2 border-t border-[#222]">
        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Hero-Texte</p>
        {[
          ['Hauptüberschrift (DE)', 'hero_heading_de'],
          ['Untertitel (DE)', 'hero_subtext_de'],
          ['Button-Text (DE)', 'hero_button_de'],
          ['Jahre Erfahrung', 'stats_years'],
          ['Abgeschlossene Projekte', 'stats_projects'],
        ].map(([label, field]) => (
          <div key={field} className="space-y-1">
            <label className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">{label}</label>
            <input
              type="text"
              value={s?.[field] || ''}
              onChange={e => patchSettings(field, e.target.value)}
              placeholder={label as string}
              className="w-full bg-[#0a0a0a] border border-[#222] p-2 rounded-sm text-xs text-white placeholder:text-zinc-700 outline-none focus:border-primary"
            />
          </div>
        ))}
      </div>

      <div className="space-y-3 pt-2 border-t border-[#222]">
        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600">SEO</p>
        {[
          ['Meta-Titel (DE)', 'seo_title_de'],
          ['Keywords', 'seo_keywords'],
        ].map(([label, field]) => (
          <div key={field} className="space-y-1">
            <label className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">{label}</label>
            <input
              type="text"
              value={s?.[field] || ''}
              onChange={e => patchSettings(field, e.target.value)}
              placeholder={label as string}
              className="w-full bg-[#0a0a0a] border border-[#222] p-2 rounded-sm text-xs text-white placeholder:text-zinc-700 outline-none focus:border-primary"
            />
          </div>
        ))}
        <div className="space-y-1">
          <label className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Meta-Beschreibung (DE)</label>
          <textarea
            value={s?.seo_description_de || ''}
            onChange={e => patchSettings('seo_description_de', e.target.value)}
            className="w-full bg-[#0a0a0a] border border-[#222] p-2 rounded-sm text-xs text-white placeholder:text-zinc-700 outline-none focus:border-primary resize-none"
            rows={3}
          />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEFT PANEL: MEDIA
// ═══════════════════════════════════════════════════════════════════════════════
function MediaPanel({ files, loading, onRefresh, onUpload, onSelect, isUploading }: any) {
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Medienbibliothek</p>
        <button onClick={onRefresh} className="p-1 text-zinc-600 hover:text-white transition-colors"><RefreshCw size={12} /></button>
      </div>

      <label className="cursor-pointer">
        <div className="flex items-center justify-center gap-2 border-2 border-dashed border-[#333] hover:border-primary rounded-sm p-4 text-[10px] font-black uppercase tracking-wider text-zinc-600 hover:text-primary transition-colors">
          {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          {isUploading ? 'Uploading…' : 'Bild hochladen'}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ''; }} />
      </label>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-primary" /></div>
      ) : files.length === 0 ? (
        <p className="text-[10px] text-zinc-600 text-center py-8">Noch keine Bilder hochgeladen.</p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {files.map((url: string, idx: number) => (
            <button key={idx} onClick={() => onSelect(url)}
              className="aspect-square rounded-sm overflow-hidden border border-[#333] hover:border-primary transition-colors relative group/media">
              <img src={url} alt="" className="w-full h-full object-cover opacity-70 group-hover/media:opacity-100 transition-opacity" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/media:opacity-100 transition-opacity bg-black/50 text-[9px] font-black text-white uppercase tracking-wider">
                Einfügen
              </div>
            </button>
          ))}
        </div>
      )}
      <p className="text-[9px] text-zinc-700 leading-relaxed">Wähle ein Bild aus und klicke dann auf ein Bildelement auf der Vorschau.</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// RIGHT PANEL: ITEM EDITORS
// ═══════════════════════════════════════════════════════════════════════════════
const panelInput = "w-full bg-[#0a0a0a] border border-[#222] p-2.5 rounded-sm text-xs text-white placeholder:text-zinc-700 outline-none focus:border-primary transition-colors";
const panelTextarea = `${panelInput} resize-none`;

function ItemEditPanel({ title, children, onClose, onSave, onDelete, isNew }: {
  title: string; children: React.ReactNode;
  onClose: () => void; onSave: () => void;
  onDelete?: () => void; isNew?: boolean;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#222]">
        <h4 className="text-[11px] font-black uppercase tracking-widest text-white">{title}</h4>
        <button onClick={onClose} className="p-1 text-zinc-500 hover:text-white"><X size={14} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">{children}</div>
      <div className="p-4 border-t border-[#222] flex gap-2">
        {!isNew && onDelete && (
          <button onClick={onDelete} className="p-2 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-sm border border-red-500/20 transition-colors">
            <Trash2 size={14} />
          </button>
        )}
        <button onClick={onSave} className="flex-1 flex items-center justify-center gap-2 bg-primary text-black font-black text-[11px] uppercase tracking-widest py-2.5 rounded-sm hover:bg-white transition-colors">
          <Save size={13} /> Speichern
        </button>
      </div>
    </div>
  );
}

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[9px] font-black uppercase tracking-widest text-primary">{label}</label>
      {children}
    </div>
  );
}

function ServiceEditForm({ svc, onChange, uploadImage, isUploading }: any) {
  const icons = ['Hammer', 'Drill', 'Building2', 'Truck', 'Construction', 'Zap', 'ShieldCheck', 'Clock', 'Star', 'Award'];
  return (
    <div className="space-y-4">
      <FieldLabel label="Titel (Deutsch)"><input className={panelInput} value={svc.title_de || ''} onChange={e => onChange({ ...svc, title_de: e.target.value, title: e.target.value })} placeholder="Service-Titel" /></FieldLabel>
      <FieldLabel label="Titel (Englisch)"><input className={panelInput} value={svc.title_en || ''} onChange={e => onChange({ ...svc, title_en: e.target.value })} placeholder="Service Title" /></FieldLabel>
      <FieldLabel label="Beschreibung (DE)"><textarea className={panelTextarea} rows={3} value={svc.description_de || ''} onChange={e => onChange({ ...svc, description_de: e.target.value, description: e.target.value })} placeholder="Beschreibung" /></FieldLabel>
      <FieldLabel label="Beschreibung (EN)"><textarea className={panelTextarea} rows={3} value={svc.description_en || ''} onChange={e => onChange({ ...svc, description_en: e.target.value })} placeholder="Description" /></FieldLabel>
      <FieldLabel label="Icon">
        <select className={panelInput} value={svc.icon_name || 'Hammer'} onChange={e => onChange({ ...svc, icon_name: e.target.value })}>
          {icons.map(ic => <option key={ic} value={ic}>{ic}</option>)}
        </select>
      </FieldLabel>
      <FieldLabel label="Reihenfolge"><input type="number" className={panelInput} value={svc.sort_order || 0} onChange={e => onChange({ ...svc, sort_order: parseInt(e.target.value) })} /></FieldLabel>
    </div>
  );
}

function FaqEditForm({ faq, onChange }: any) {
  return (
    <div className="space-y-4">
      <FieldLabel label="Frage (Deutsch)"><textarea className={panelTextarea} rows={2} value={faq.question_de || ''} onChange={e => onChange({ ...faq, question_de: e.target.value, question: e.target.value })} placeholder="Frage…" /></FieldLabel>
      <FieldLabel label="Frage (Englisch)"><textarea className={panelTextarea} rows={2} value={faq.question_en || ''} onChange={e => onChange({ ...faq, question_en: e.target.value })} placeholder="Question…" /></FieldLabel>
      <FieldLabel label="Antwort (Deutsch)"><textarea className={panelTextarea} rows={4} value={faq.answer_de || ''} onChange={e => onChange({ ...faq, answer_de: e.target.value, answer: e.target.value })} placeholder="Antwort…" /></FieldLabel>
      <FieldLabel label="Antwort (Englisch)"><textarea className={panelTextarea} rows={4} value={faq.answer_en || ''} onChange={e => onChange({ ...faq, answer_en: e.target.value })} placeholder="Answer…" /></FieldLabel>
      <FieldLabel label="Reihenfolge"><input type="number" className={panelInput} value={faq.sort_order || 0} onChange={e => onChange({ ...faq, sort_order: parseInt(e.target.value) })} /></FieldLabel>
    </div>
  );
}

function TestimonialEditForm({ t, onChange, uploadImage, isUploading }: any) {
  return (
    <div className="space-y-4">
      <FieldLabel label="Name"><input className={panelInput} value={t.author || ''} onChange={e => onChange({ ...t, author: e.target.value })} placeholder="Max Mustermann" /></FieldLabel>
      <FieldLabel label="Firma / Rolle"><input className={panelInput} value={t.company || ''} onChange={e => onChange({ ...t, company: e.target.value })} placeholder="Firma GmbH" /></FieldLabel>
      <FieldLabel label="Bewertung (1-5)">
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(n => (
            <button key={n} type="button" onClick={() => onChange({ ...t, rating: n })}
              className={`p-1.5 rounded transition-colors ${(t.rating || 5) >= n ? 'text-primary' : 'text-zinc-600'}`}>
              <Star size={18} fill={(t.rating || 5) >= n ? 'currentColor' : 'none'} />
            </button>
          ))}
        </div>
      </FieldLabel>
      <FieldLabel label="Text (DE)"><textarea className={panelTextarea} rows={3} value={t.text_de || ''} onChange={e => onChange({ ...t, text_de: e.target.value, text: e.target.value })} placeholder="Bewertungstext…" /></FieldLabel>
      <FieldLabel label="Text (EN)"><textarea className={panelTextarea} rows={3} value={t.text_en || ''} onChange={e => onChange({ ...t, text_en: e.target.value })} placeholder="Review text…" /></FieldLabel>
      <FieldLabel label="Avatar URL"><input className={panelInput} value={t.avatar_url || ''} onChange={e => onChange({ ...t, avatar_url: e.target.value })} placeholder="https://…" /></FieldLabel>
    </div>
  );
}

function ProjectEditForm({ proj, onChange, uploadImage, isUploading }: any) {
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-4">
      <FieldLabel label="Titel (Deutsch)"><input className={panelInput} value={proj.title_de || ''} onChange={e => onChange({ ...proj, title_de: e.target.value, title: e.target.value })} placeholder="Projekttitel" /></FieldLabel>
      <FieldLabel label="Titel (Englisch)"><input className={panelInput} value={proj.title_en || ''} onChange={e => onChange({ ...proj, title_en: e.target.value })} placeholder="Project title" /></FieldLabel>
      <FieldLabel label="Kategorie (DE)"><input className={panelInput} value={proj.category_de || ''} onChange={e => onChange({ ...proj, category_de: e.target.value, category: e.target.value })} placeholder="Abbruch" /></FieldLabel>
      <FieldLabel label="Kategorie (EN)"><input className={panelInput} value={proj.category_en || ''} onChange={e => onChange({ ...proj, category_en: e.target.value })} placeholder="Demolition" /></FieldLabel>
      <FieldLabel label="Beschreibung (DE)"><textarea className={panelTextarea} rows={3} value={proj.description_de || ''} onChange={e => onChange({ ...proj, description_de: e.target.value, description: e.target.value })} placeholder="Beschreibung…" /></FieldLabel>
      <FieldLabel label="Projektbild">
        <div className="space-y-2">
          {proj.image_url && <img src={proj.image_url} alt="" className="w-full h-24 object-cover rounded-sm opacity-80" />}
          <label className="cursor-pointer">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500 hover:text-primary border border-[#333] hover:border-primary px-3 py-2 rounded-sm transition-colors">
              {isUploading === `proj_${proj.id || 'new'}` ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
              Bild hochladen
            </div>
            <input type="file" accept="image/*" className="hidden" ref={fileRef}
              onChange={async e => {
                const f = e.target.files?.[0];
                if (f) {
                  const url = await uploadImage(`proj_${proj.id || 'new'}`, f);
                  if (url) onChange({ ...proj, image_url: url });
                }
                e.target.value = '';
              }} />
          </label>
          <input className={panelInput} value={proj.image_url || ''} onChange={e => onChange({ ...proj, image_url: e.target.value })} placeholder="Oder URL einfügen…" />
        </div>
      </FieldLabel>
    </div>
  );
}
