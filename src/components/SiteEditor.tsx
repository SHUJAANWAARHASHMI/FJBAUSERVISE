/**
 * SiteEditor — Full Visual Website Editor (Wix/Webflow-style)
 * Renders the live website inside an editor shell with:
 *  - Click-to-edit overlays on every element
 *  - Inline text editing (contentEditable)
 *  - Image replacement via browse/upload
 *  - Section manager (show/hide/reorder)
 *  - Device preview (mobile/tablet/desktop)
 *  - Undo / Redo history
 *  - Autosave to Supabase
 *  - Publish button
 *  - Color & spacing controls
 *  - Media library panel
 */

import React, {
  useState, useEffect, useRef, useCallback, createContext, useContext
} from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Save, Undo2, Redo2, Monitor, Tablet, Smartphone, Eye, EyeOff,
  Upload, Image as ImageIcon, Type, Palette, Layers, Settings2,
  ChevronUp, ChevronDown, Trash2, Plus, CheckCircle2, AlertCircle,
  Loader2, Info, GripVertical, RefreshCw, Globe, Zap, Check,
  AlignLeft, Bold, Italic, Link, List, ArrowRight, Maximize2,
  PanelLeftClose, PanelLeftOpen, LayoutGrid, BookOpen, Star, HelpCircle,
  Phone, Mail, MapPin, Pencil, Copy, SlidersHorizontal, MousePointer2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { translations } from '../lib/translations';
import type { SiteSettings, Project, Service, Faq, Testimonial } from '../App';
import {
  Hammer, Drill, Building2, Truck, Construction, ShieldCheck, Clock, Award
} from 'lucide-react';

// ─── Editor Context ────────────────────────────────────────────────────────────
interface EditorCtx {
  isEditing: boolean;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  data: EditorData;
  updateField: (path: string, value: any) => void;
  uploadImage: (field: string, file: File) => Promise<string | null>;
  isUploading: string | null;
}

const EditorContext = createContext<EditorCtx>({
  isEditing: false,
  selectedId: null,
  setSelectedId: () => {},
  data: {} as EditorData,
  updateField: () => {},
  uploadImage: async () => null,
  isUploading: null,
});

const useEditor = () => useContext(EditorContext);

// ─── Types ─────────────────────────────────────────────────────────────────────
interface EditorData {
  settings: any;
  projects: any[];
  services: any[];
  faqs: any[];
  testimonials: any[];
  sections: SectionMeta[];
}

interface SectionMeta {
  id: string;
  label: string;
  icon: string;
  visible: boolean;
  order: number;
}

interface Toast { id: string; type: 'success' | 'error' | 'info'; message: string; }

const DEFAULT_SECTIONS: SectionMeta[] = [
  { id: 'hero',         label: 'Hero',          icon: '🦸', visible: true, order: 0 },
  { id: 'services',     label: 'Leistungen',    icon: '⚡', visible: true, order: 1 },
  { id: 'whyus',        label: 'Warum Wir',     icon: '🏆', visible: true, order: 2 },
  { id: 'projects',     label: 'Referenzen',    icon: '🏗️', visible: true, order: 3 },
  { id: 'faqs',         label: 'FAQs',          icon: '❓', visible: true, order: 4 },
  { id: 'cta',          label: 'Call to Action', icon: '📣', visible: true, order: 5 },
  { id: 'contact',      label: 'Kontakt',        icon: '📞', visible: true, order: 6 },
];

const ICON_MAP: Record<string, React.ReactNode> = {
  Hammer:       <Hammer className="text-primary" size={32} />,
  Drill:        <Drill className="text-primary" size={32} />,
  Building2:    <Building2 className="text-primary" size={32} />,
  Truck:        <Truck className="text-primary" size={32} />,
  Construction: <Construction className="text-primary" size={32} />,
  Zap:          <Zap className="text-primary" size={32} />,
  ShieldCheck:  <ShieldCheck className="text-primary" size={32} />,
  Clock:        <Clock className="text-primary" size={32} />,
  Star:         <Star className="text-primary" size={32} />,
  Award:        <Award className="text-primary" size={32} />,
};

// ─── Main SiteEditor Component ─────────────────────────────────────────────────
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
  // ── Core state ──────────────────────────────────────────────────────────────
  const [data, setData] = useState<EditorData>({
    settings: initialSettings || {},
    projects: initialProjects || [],
    services: initialServices || [],
    faqs: initialFaqs || [],
    testimonials: initialTestimonials || [],
    sections: DEFAULT_SECTIONS,
  });

  // ── History (undo/redo) ─────────────────────────────────────────────────────
  const historyRef = useRef<EditorData[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const pushHistory = useCallback((newData: EditorData) => {
    const hist = historyRef.current;
    // Truncate forward history
    historyRef.current = hist.slice(0, historyIndexRef.current + 1);
    historyRef.current.push(JSON.parse(JSON.stringify(newData)));
    historyIndexRef.current = historyRef.current.length - 1;
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(false);
  }, []);

  const undo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current--;
      setData(JSON.parse(JSON.stringify(historyRef.current[historyIndexRef.current])));
      setCanUndo(historyIndexRef.current > 0);
      setCanRedo(true);
    }
  }, []);

  const redo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current++;
      setData(JSON.parse(JSON.stringify(historyRef.current[historyIndexRef.current])));
      setCanUndo(true);
      setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
    }
  }, []);

  // Push initial snapshot
  useEffect(() => {
    historyRef.current = [JSON.parse(JSON.stringify(data))];
    historyIndexRef.current = 0;
  }, []);

  // ── Editor UI state ─────────────────────────────────────────────────────────
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [activePanel, setActivePanel] = useState<'layers' | 'styles' | 'media' | null>('layers');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isUploading, setIsUploading] = useState<string | null>(null);
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
  const [rightPanel, setRightPanel] = useState<string | null>(null); // 'service-edit' | 'faq-edit' | etc

  // ── Autosave debounce ───────────────────────────────────────────────────────
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Toast helper ────────────────────────────────────────────────────────────
  const addToast = useCallback((type: Toast['type'], message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(p => [...p, { id, type, message }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  }, []);

  // ── Field updater (dot-path aware) ──────────────────────────────────────────
  const updateField = useCallback((path: string, value: any) => {
    setData(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const parts = path.split('.');
      let obj: any = next;
      for (let i = 0; i < parts.length - 1; i++) {
        if (obj[parts[i]] === undefined) obj[parts[i]] = {};
        obj = obj[parts[i]];
      }
      obj[parts[parts.length - 1]] = value;
      pushHistory(next);
      return next;
    });
    setHasUnsaved(true);

    // Autosave after 2s idle
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => handleAutoSave(), 2000);
  }, []);

  // ── Image upload ────────────────────────────────────────────────────────────
  const uploadImage = useCallback(async (field: string, file: File): Promise<string | null> => {
    setIsUploading(field);
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
      setIsUploading(null);
    }
  }, []);

  // ── Load media library ──────────────────────────────────────────────────────
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

  // ── Save to Supabase ────────────────────────────────────────────────────────
  const handleAutoSave = useCallback(async () => {
    // Only save settings on autosave to avoid disruption
    const { id, updated_at, created_at, ...updateData } = data.settings;
    await supabase.from('site_settings').upsert({ id: 1, ...updateData }, { onConflict: 'id' });
  }, [data]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { id, updated_at, created_at, ...updateData } = data.settings;
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

  // ── Service save ────────────────────────────────────────────────────────────
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
    if (svcs) setData(p => ({ ...p, services: svcs }));
    setEditingService(null); setRightPanel(null);
  };

  const deleteService = async (id: string) => {
    await supabase.from('services').delete().eq('id', id);
    setData(p => ({ ...p, services: p.services.filter(s => s.id !== id) }));
    addToast('success', 'Gelöscht.'); setEditingService(null); setRightPanel(null);
  };

  // ── FAQ save ────────────────────────────────────────────────────────────────
  const saveFaq = async (faq: any) => {
    if (faq.id && !faq._new) {
      const { id, created_at, ...upd } = faq;
      await supabase.from('faqs').update(upd).eq('id', id);
    } else {
      const { id, _new, created_at, ...ins } = faq;
      await supabase.from('faqs').insert([ins]);
    }
    addToast('success', 'FAQ gespeichert!');
    const { data: faqs } = await supabase.from('faqs').select('*').order('sort_order');
    if (faqs) setData(p => ({ ...p, faqs }));
    setEditingFaq(null); setRightPanel(null);
  };

  const deleteFaq = async (id: string) => {
    await supabase.from('faqs').delete().eq('id', id);
    setData(p => ({ ...p, faqs: p.faqs.filter(f => f.id !== id) }));
    addToast('success', 'Gelöscht.');  setEditingFaq(null); setRightPanel(null);
  };

  // ── Testimonial save ────────────────────────────────────────────────────────
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
    if (ts) setData(p => ({ ...p, testimonials: ts }));
    setEditingTestimonial(null); setRightPanel(null);
  };

  // ── Project save ────────────────────────────────────────────────────────────
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
    if (ps) setData(p => ({ ...p, projects: ps }));
    setEditingProject(null); setRightPanel(null);
  };

  const deleteProject = async (id: string) => {
    await supabase.from('projects').delete().eq('id', id);
    setData(p => ({ ...p, projects: p.projects.filter(pr => pr.id !== id) }));
    addToast('success', 'Gelöscht.'); setEditingProject(null); setRightPanel(null);
  };

  // ── Section reorder ─────────────────────────────────────────────────────────
  const moveSection = (id: string, dir: 'up' | 'down') => {
    setData(prev => {
      const secs = [...prev.sections].sort((a, b) => a.order - b.order);
      const idx = secs.findIndex(s => s.id === id);
      const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= secs.length) return prev;
      const tmpOrder = secs[idx].order;
      secs[idx].order = secs[swapIdx].order;
      secs[swapIdx].order = tmpOrder;
      return { ...prev, sections: secs };
    });
  };

  const toggleSection = (id: string) => {
    setData(prev => ({
      ...prev,
      sections: prev.sections.map(s => s.id === id ? { ...s, visible: !s.visible } : s)
    }));
  };

  // ── Device width map ────────────────────────────────────────────────────────
  const deviceWidth = { desktop: '100%', tablet: '768px', mobile: '390px' };

  // ── Keyboard shortcuts ──────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) { e.preventDefault(); redo(); }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); handleSave(); }
      if (e.key === 'Escape') { setSelectedId(null); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);

  // ── Context value ───────────────────────────────────────────────────────────
  const editorCtx: EditorCtx = { isEditing: true, selectedId, setSelectedId, data, updateField, uploadImage, isUploading };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <EditorContext.Provider value={editorCtx}>
      <div className="fixed inset-0 z-[150] flex flex-col bg-[#0e0e0e] overflow-hidden" style={{ fontFamily: "'Montserrat', sans-serif" }}>

        {/* ═══ TOP TOOLBAR ═══════════════════════════════════════════════════════ */}
        <header className="flex items-center gap-3 px-4 py-2 bg-[#111] border-b border-[#222] shrink-0 z-10">
          {/* Left: Logo + title */}
          <div className="flex items-center gap-3 mr-2">
            <div className="w-7 h-7 bg-primary flex items-center justify-center rounded-sm shrink-0">
              <MousePointer2 size={14} className="text-black" />
            </div>
            <span className="font-black text-[11px] uppercase tracking-widest text-white hidden sm:block">Site Editor</span>
          </div>

          {/* Divider */}
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

          {/* Divider */}
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
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider border border-[#333] text-zinc-300 hover:text-white hover:border-[#555] rounded-sm transition-colors disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              <span className="hidden sm:inline">Speichern</span>
            </button>
            <button
              onClick={handlePublish}
              disabled={isPublishing}
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
                    sections={data.sections}
                    selectedId={selectedId}
                    setSelectedId={setSelectedId}
                    moveSection={moveSection}
                    toggleSection={toggleSection}
                    services={data.services}
                    faqs={data.faqs}
                    testimonials={data.testimonials}
                    projects={data.projects}
                    onEditService={(svc) => { setEditingService({...svc}); setRightPanel('service-edit'); }}
                    onAddService={() => { setEditingService({ _new: true, title_de: '', title_en: '', description_de: '', description_en: '', icon_name: 'Hammer', sort_order: data.services.length }); setRightPanel('service-edit'); }}
                    onEditFaq={(faq) => { setEditingFaq({...faq}); setRightPanel('faq-edit'); }}
                    onAddFaq={() => { setEditingFaq({ _new: true, question_de: '', question_en: '', answer_de: '', answer_en: '', sort_order: data.faqs.length }); setRightPanel('faq-edit'); }}
                    onEditTestimonial={(t) => { setEditingTestimonial({...t}); setRightPanel('testimonial-edit'); }}
                    onAddTestimonial={() => { setEditingTestimonial({ _new: true, author: '', company: '', text_de: '', text_en: '', rating: 5, avatar_url: '' }); setRightPanel('testimonial-edit'); }}
                    onEditProject={(p) => { setEditingProject({...p}); setRightPanel('project-edit'); }}
                    onAddProject={() => { setEditingProject({ _new: true, title_de: '', title_en: '', category_de: '', category_en: '', description_de: '', description_en: '', image_url: '' }); setRightPanel('project-edit'); }}
                  />
                )}

                {/* STYLES PANEL */}
                {activePanel === 'styles' && (
                  <StylesPanel data={data} updateField={updateField} />
                )}

                {/* MEDIA PANEL */}
                {activePanel === 'media' && (
                  <MediaPanel
                    files={mediaFiles}
                    loading={mediaLoading}
                    onRefresh={loadMedia}
                    onUpload={async (file) => {
                      const url = await uploadImage('media_lib', file);
                      if (url) { setMediaFiles(p => [url, ...p]); }
                    }}
                    onSelect={(url) => {
                      if (selectedId) {
                        updateField(`settings.${selectedId}`, url);
                      }
                    }}
                    isUploading={isUploading === 'media_lib'}
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
            >
              {/* Device frame indicator */}
              {device !== 'desktop' && (
                <div className="sticky top-0 z-50 bg-[#111]/80 backdrop-blur text-center text-[9px] font-black uppercase tracking-widest py-1 text-zinc-500">
                  {device === 'tablet' ? '📱 Tablet — 768px' : '📱 Mobile — 390px'}
                </div>
              )}

              {/* ── LIVE WEBSITE SECTIONS ── */}
              <EditorCanvas data={data} updateField={updateField} uploadImage={uploadImage} isUploading={isUploading} selectedId={selectedId} setSelectedId={setSelectedId} />
            </div>
          </div>

          {/* ── RIGHT PANEL (context editor) ────────────────────────────────── */}
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
                    <ServiceEditForm svc={editingService} onChange={setEditingService} uploadImage={uploadImage} isUploading={isUploading} />
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
                    onDelete={editingTestimonial._new ? undefined : () => { supabase.from('testimonials').delete().eq('id', editingTestimonial.id); setData(p => ({...p, testimonials: p.testimonials.filter(t => t.id !== editingTestimonial.id)})); setRightPanel(null); setEditingTestimonial(null); addToast('success','Gelöscht.'); }}
                    isNew={!!editingTestimonial._new}
                  >
                    <TestimonialEditForm t={editingTestimonial} onChange={setEditingTestimonial} uploadImage={uploadImage} isUploading={isUploading} />
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
                    <ProjectEditForm proj={editingProject} onChange={setEditingProject} uploadImage={uploadImage} isUploading={isUploading} />
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

        {/* ═══ KEYBOARD SHORTCUT HINT ════════════════════════════════════════════ */}
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

// ═══════════════════════════════════════════════════════════════════════════════
// EDITOR CANVAS — the live website rendered with editable overlays
// ═══════════════════════════════════════════════════════════════════════════════
function EditorCanvas({ data, updateField, uploadImage, isUploading, selectedId, setSelectedId }: {
  data: EditorData;
  updateField: (path: string, value: any) => void;
  uploadImage: (field: string, file: File) => Promise<string | null>;
  isUploading: string | null;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
}) {
  const s = data.settings;
  const sortedSections = [...data.sections].sort((a, b) => a.order - b.order);

  return (
    <div className="relative" onClick={() => setSelectedId(null)}>
      {/* NAVBAR */}
      <EditableSection id="navbar" label="Navigation" selectedId={selectedId} setSelectedId={setSelectedId}>
        <EditorNavbar settings={s} updateField={updateField} uploadImage={uploadImage} isUploading={isUploading} selectedId={selectedId} setSelectedId={setSelectedId} />
      </EditableSection>

      {/* DYNAMIC SECTIONS */}
      {sortedSections.map(sec => {
        if (!sec.visible) return (
          <div key={sec.id} className="relative py-4 px-6 bg-gray-100 border border-dashed border-gray-300 my-1 flex items-center justify-center gap-2 text-gray-400 text-xs font-bold">
            <EyeOff size={14} /> Abschnitt "{sec.label}" ist ausgeblendet
          </div>
        );

        return (
          <EditableSection key={sec.id} id={sec.id} label={sec.label} selectedId={selectedId} setSelectedId={setSelectedId}>
            {sec.id === 'hero'     && <EditorHero     settings={s} updateField={updateField} uploadImage={uploadImage} isUploading={isUploading} selectedId={selectedId} setSelectedId={setSelectedId} />}
            {sec.id === 'services' && <EditorServices settings={s} services={data.services} updateField={updateField} selectedId={selectedId} setSelectedId={setSelectedId} />}
            {sec.id === 'whyus'    && <EditorWhyUs    settings={s} updateField={updateField} selectedId={selectedId} setSelectedId={setSelectedId} />}
            {sec.id === 'projects' && <EditorProjects settings={s} projects={data.projects} updateField={updateField} selectedId={selectedId} setSelectedId={setSelectedId} />}
            {sec.id === 'faqs'     && <EditorFAQ      settings={s} faqs={data.faqs}         updateField={updateField} selectedId={selectedId} setSelectedId={setSelectedId} />}
            {sec.id === 'cta'      && <EditorCTA      settings={s} updateField={updateField} uploadImage={uploadImage} isUploading={isUploading} selectedId={selectedId} setSelectedId={setSelectedId} />}
            {sec.id === 'contact'  && <EditorContact  settings={s} updateField={updateField} selectedId={selectedId} setSelectedId={setSelectedId} />}
          </EditableSection>
        );
      })}

      {/* FOOTER */}
      <EditableSection id="footer" label="Footer" selectedId={selectedId} setSelectedId={setSelectedId}>
        <EditorFooter settings={s} updateField={updateField} selectedId={selectedId} setSelectedId={setSelectedId} />
      </EditableSection>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EDITABLE WRAPPERS
// ═══════════════════════════════════════════════════════════════════════════════

/** Section wrapper — shows label badge + highlight on hover */
function EditableSection({ id, label, children, selectedId, setSelectedId }: {
  id: string; label: string; children: React.ReactNode;
  selectedId: string | null; setSelectedId: (id: string | null) => void;
}) {
  const isSelected = selectedId === id;
  return (
    <div
      className={`relative group/sec transition-all ${isSelected ? 'outline outline-2 outline-primary outline-offset-0' : 'hover:outline hover:outline-1 hover:outline-primary/40 hover:outline-offset-0'}`}
      onClick={e => { e.stopPropagation(); setSelectedId(id); }}
    >
      {/* Section label badge */}
      <div className={`absolute top-0 left-0 z-30 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover/sec:opacity-100'}`}>
        <div className="bg-primary text-black text-[9px] font-black uppercase tracking-widest px-2 py-0.5 flex items-center gap-1">
          <Layers size={9} /> {label}
        </div>
      </div>
      {children}
    </div>
  );
}

/** Inline editable text — contentEditable */
function EditableText({ value, fieldPath, updateField, className, tag = 'div', placeholder, multiline = false }: {
  value: string; fieldPath: string; updateField: (path: string, value: any) => void;
  className?: string; tag?: 'div' | 'span' | 'h1' | 'h2' | 'h3' | 'p' | 'button';
  placeholder?: string; multiline?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const [focused, setFocused] = useState(false);

  const Tag = tag as any;

  const handleBlur = () => {
    setFocused(false);
    const text = ref.current?.innerText || '';
    if (text !== value) updateField(fieldPath, text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!multiline && e.key === 'Enter') { e.preventDefault(); ref.current?.blur(); }
  };

  // Sync value when not focused
  useEffect(() => {
    if (!focused && ref.current && ref.current.innerText !== value) {
      ref.current.innerText = value || '';
    }
  }, [value, focused]);

  return (
    <Tag
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onFocus={() => setFocused(true)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onClick={(e: React.MouseEvent) => e.stopPropagation()}
      data-placeholder={placeholder || 'Hier klicken zum Bearbeiten…'}
      className={`
        cursor-text outline-none relative
        focus:ring-2 focus:ring-primary focus:ring-offset-1
        empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 empty:before:pointer-events-none
        ${focused ? 'bg-primary/5 rounded' : 'hover:bg-primary/3 rounded'}
        ${className || ''}
      `}
    >
      {value}
    </Tag>
  );
}

/** Inline editable image — click or drag to replace */
function EditableImage({ value, fieldPath, uploadImage, isUploading, className, style, alt, objectFit = 'cover' }: {
  value: string; fieldPath: string;
  uploadImage: (field: string, file: File) => Promise<string | null>;
  isUploading: string | null;
  className?: string; style?: React.CSSProperties;
  alt?: string; objectFit?: 'cover' | 'contain';
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = async (file: File) => {
    const url = await uploadImage(fieldPath, file);
    if (url) {
      // We need to call updateField here — pass it up
      const event = new CustomEvent('editor-image-update', { detail: { fieldPath, url }, bubbles: true });
      fileRef.current?.dispatchEvent(event);
    }
  };

  return (
    <div
      className={`relative group/img cursor-pointer ${className || ''}`}
      style={style}
      onDragOver={e => { e.preventDefault(); e.stopPropagation(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); e.stopPropagation(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f?.type.startsWith('image/')) handleFile(f); }}
      onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}
    >
      {value ? (
        <img src={value} alt={alt || ''} className={`w-full h-full`} style={{ objectFit }} />
      ) : (
        <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
          <ImageIcon size={32} />
        </div>
      )}

      {/* Overlay */}
      <div className={`absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50 transition-opacity ${dragging || isUploading === fieldPath ? 'opacity-100' : 'opacity-0 group-hover/img:opacity-100'}`}>
        {isUploading === fieldPath ? (
          <Loader2 size={24} className="text-white animate-spin" />
        ) : (
          <>
            <Upload size={20} className="text-white" />
            <span className="text-white text-[10px] font-black uppercase tracking-wider text-center px-2">
              {dragging ? 'Loslassen' : 'Klicken / Ziehen'}
            </span>
          </>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION RENDERERS (live website, editable)
// ═══════════════════════════════════════════════════════════════════════════════

function EditorNavbar({ settings: s, updateField, uploadImage, isUploading, selectedId, setSelectedId }: any) {
  const logoScale = parseFloat(s?.logo_scale || '1') || 1;
  return (
    <nav className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
      {/* Logo */}
      <div className="flex items-center gap-3 group/logo" onClick={e => e.stopPropagation()}>
        {s?.logo_url ? (
          <EditableImage
            value={s.logo_url}
            fieldPath="logo_url"
            uploadImage={uploadImage}
            isUploading={isUploading}
            className="rounded"
            style={{ width: `${Math.round(40 * logoScale)}px`, height: `${Math.round(40 * logoScale)}px`, flexShrink: 0 }}
            objectFit="contain"
            alt="Logo"
          />
        ) : (
          <div className="w-8 h-8 bg-primary flex items-center justify-center">
            <span className="text-black font-black text-xs">FJ</span>
          </div>
        )}
        <EditableText
          value={s?.name || 'FJ BAUSERVICE'}
          fieldPath="settings.name"
          updateField={updateField}
          className="font-black text-sm uppercase tracking-widest text-gray-900"
          tag="span"
          placeholder="Firmenname"
        />
      </div>
      {/* Nav links */}
      <div className="hidden md:flex items-center gap-8 text-[11px] font-black uppercase tracking-widest text-gray-500">
        {['Home', 'Leistungen', 'Referenzen', 'Über uns', 'Kontakt'].map(item => (
          <span key={item} className="hover:text-primary cursor-default transition-colors">{item}</span>
        ))}
      </div>
      {/* CTA */}
      <div className="flex items-center gap-3">
        {s?.phone && <span className="hidden lg:flex items-center gap-1.5 text-[11px] font-bold text-gray-500"><Phone size={12} />{s.phone}</span>}
        <button className="bg-primary text-black font-black text-[10px] uppercase tracking-widest px-4 py-2 hover:bg-gray-900 hover:text-white transition-colors">
          Angebot
        </button>
      </div>
    </nav>
  );
}

// Wrap image updates from EditableImage into updateField
function useImageUpdater(updateField: (path: string, value: any) => void) {
  useEffect(() => {
    const handler = (e: Event) => {
      const { fieldPath, url } = (e as CustomEvent).detail;
      updateField(`settings.${fieldPath}`, url);
    };
    document.addEventListener('editor-image-update', handler);
    return () => document.removeEventListener('editor-image-update', handler);
  }, [updateField]);
}

function EditorHero({ settings: s, updateField, uploadImage, isUploading, selectedId, setSelectedId }: any) {
  useImageUpdater(updateField);
  const heroImage = s?.hero_image_url || 'https://images.unsplash.com/photo-1541913057-21998177505b?q=80&w=2070&auto=format&fit=crop';
  return (
    <section className="relative pt-24 pb-16 px-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Main Hero Card */}
        <div className="md:col-span-8 bg-gray-900 relative overflow-hidden min-h-[420px] flex flex-col justify-end shadow-xl group/hero">
          {/* Background Image */}
          <EditableImage
            value={heroImage}
            fieldPath="hero_image_url"
            uploadImage={uploadImage}
            isUploading={isUploading}
            className="absolute inset-0 w-full h-full opacity-40 filter grayscale"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
            objectFit="cover"
            alt="Hero Background"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent pointer-events-none" />

          <div className="relative z-10 p-10 space-y-6" onClick={e => e.stopPropagation()}>
            <EditableText
              value={s?.hero_heading_de || s?.slogan || 'Präziser Abbruch & Rückbau'}
              fieldPath="settings.hero_heading_de"
              updateField={updateField}
              className="text-4xl md:text-6xl font-black italic text-white leading-tight"
              tag="h1"
              placeholder="Hero Überschrift"
            />
            <EditableText
              value={s?.hero_subtext_de || s?.description || 'Ihr zertifizierter Fachbetrieb für Entkernung und Kernbohrung in Bayern.'}
              fieldPath="settings.hero_subtext_de"
              updateField={updateField}
              className="text-gray-300 text-base max-w-md border-l-2 border-primary pl-4"
              tag="p"
              placeholder="Hero Beschreibung"
              multiline
            />
            <button className="bg-primary text-black font-black text-xs uppercase tracking-widest px-8 py-4 hover:bg-white transition-colors flex items-center gap-2 w-fit">
              <EditableText
                value={s?.hero_button_de || 'Angebot anfordern'}
                fieldPath="settings.hero_button_de"
                updateField={updateField}
                className="text-inherit"
                tag="span"
                placeholder="Button Text"
              />
              <ArrowRight size={16} strokeWidth={3} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="md:col-span-4 flex flex-col gap-6" onClick={e => e.stopPropagation()}>
          <div className="bg-white border border-gray-200 shadow-sm p-8 flex flex-col gap-3 hover:border-primary transition-colors">
            <EditableText
              value={s?.stats_years || '15+'}
              fieldPath="settings.stats_years"
              updateField={updateField}
              className="text-6xl font-black text-gray-900 leading-none"
              tag="span"
              placeholder="15+"
            />
            <EditableText
              value={s?.stat_label_1_de || 'Jahre Facherfahrung'}
              fieldPath="settings.stat_label_1_de"
              updateField={updateField}
              className="text-[10px] font-bold uppercase tracking-[0.4em] text-gray-500"
              tag="span"
              placeholder="Label"
            />
          </div>
          <div className="bg-white border border-gray-200 shadow-sm p-8 flex flex-col gap-3 hover:border-primary transition-colors">
            <EditableText
              value={s?.stats_projects || '500+'}
              fieldPath="settings.stats_projects"
              updateField={updateField}
              className="text-6xl font-black text-gray-900 leading-none"
              tag="span"
              placeholder="500+"
            />
            <EditableText
              value={s?.stat_label_2_de || 'Referenzprojekte'}
              fieldPath="settings.stat_label_2_de"
              updateField={updateField}
              className="text-[10px] font-bold uppercase tracking-[0.4em] text-gray-500"
              tag="span"
              placeholder="Label"
            />
          </div>
          <div className="bg-primary p-8 flex items-center justify-between cursor-pointer hover:bg-gray-900 transition-colors group/cta">
            <EditableText
              value={s?.hero_cta_label || 'Jetzt Kontakt aufnehmen'}
              fieldPath="settings.hero_cta_label"
              updateField={updateField}
              className="text-black group-hover/cta:text-white text-xl font-black"
              tag="span"
              placeholder="CTA Label"
            />
            <ArrowRight className="text-black group-hover/cta:text-white" size={32} strokeWidth={3} />
          </div>
        </div>
      </div>
    </section>
  );
}

function EditorServices({ settings: s, services, updateField, selectedId, setSelectedId }: any) {
  const fallbackIcons = [<Hammer className="text-primary" size={32} />, <Building2 className="text-primary" size={32} />, <Drill className="text-primary" size={32} />, <Construction className="text-primary" size={32} />, <Truck className="text-primary" size={32} />];
  return (
    <section className="py-20 px-6 max-w-7xl mx-auto">
      <div className="mb-12" onClick={e => e.stopPropagation()}>
        <EditableText value={s?.services_subtitle || 'Unsere Kernkompetenzen'} fieldPath="settings.services_subtitle" updateField={updateField} className="text-primary font-bold tracking-[0.4em] uppercase text-[10px] block mb-3" tag="span" />
        <EditableText value={s?.services_title || 'Leistungen'} fieldPath="settings.services_title" updateField={updateField} className="text-5xl md:text-7xl font-black italic text-gray-900" tag="h2" />
      </div>
      {services.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 py-16 text-center text-gray-400 text-sm font-bold">
          Keine Services — füge welche über das Ebenen-Panel hinzu
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((svc: any, idx: number) => (
            <div key={svc.id || idx} className="bg-white border border-gray-200 p-8 flex flex-col gap-5 hover:border-primary transition-colors shadow-sm relative group/svc">
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-sm w-fit">
                {ICON_MAP[svc.icon_name || 'Hammer'] || fallbackIcons[idx % fallbackIcons.length]}
              </div>
              <div className="space-y-2" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-black text-gray-900">{svc.title_de || svc.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{svc.description_de || svc.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function EditorWhyUs({ settings: s, updateField, selectedId, setSelectedId }: any) {
  const items = [
    { icon: '🏅', title: s?.whyus_1_title || 'Qualität', desc: s?.whyus_1_desc || 'Höchste Standards bei jedem Projekt.' },
    { icon: '⏱️', title: s?.whyus_2_title || 'Termintreue', desc: s?.whyus_2_desc || 'Pünktliche Fertigstellung garantiert.' },
    { icon: '🛡️', title: s?.whyus_3_title || 'Sicherheit', desc: s?.whyus_3_desc || 'Alle Sicherheitsvorschriften werden eingehalten.' },
    { icon: '💡', title: s?.whyus_4_title || 'Erfahrung', desc: s?.whyus_4_desc || 'Über 15 Jahre Branchenerfahrung.' },
  ];
  const paths = [
    ['whyus_1_title','whyus_1_desc'],['whyus_2_title','whyus_2_desc'],
    ['whyus_3_title','whyus_3_desc'],['whyus_4_title','whyus_4_desc'],
  ];
  return (
    <section className="py-20 px-6 max-w-7xl mx-auto">
      <div className="mb-12 text-center" onClick={e => e.stopPropagation()}>
        <EditableText value={s?.whyus_title || 'Warum FJ Bauservice?'} fieldPath="settings.whyus_title" updateField={updateField} className="text-4xl md:text-6xl font-black italic text-gray-900" tag="h2" />
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {items.map((item, i) => (
          <div key={i} className="bg-white border border-gray-200 p-8 shadow-sm hover:border-primary transition-colors text-center">
            <div className="text-4xl mb-4">{item.icon}</div>
            <div onClick={e => e.stopPropagation()}>
              <EditableText value={item.title} fieldPath={`settings.${paths[i][0]}`} updateField={updateField} className="font-black text-gray-900 mb-2 block" tag="span" />
              <EditableText value={item.desc} fieldPath={`settings.${paths[i][1]}`} updateField={updateField} className="text-gray-500 text-sm leading-relaxed" tag="p" multiline />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function EditorProjects({ settings: s, projects, updateField, selectedId, setSelectedId }: any) {
  return (
    <section className="py-20 px-6 max-w-7xl mx-auto">
      <div className="mb-12" onClick={e => e.stopPropagation()}>
        <EditableText value={s?.projects_title || 'Unsere Referenzen'} fieldPath="settings.projects_title" updateField={updateField} className="text-4xl md:text-6xl font-black italic text-gray-900" tag="h2" />
        <EditableText value={s?.projects_subtitle || 'Eine Auswahl unserer erfolgreich abgeschlossenen Projekte.'} fieldPath="settings.projects_subtitle" updateField={updateField} className="text-gray-500 mt-3 max-w-lg" tag="p" multiline />
      </div>
      {projects.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 py-16 text-center text-gray-400 text-sm font-bold">
          Keine Projekte — füge welche über das Ebenen-Panel hinzu
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.slice(0, 6).map((proj: any) => (
            <div key={proj.id} className="aspect-[4/3] relative overflow-hidden shadow-lg group/proj border border-gray-200">
              <img src={proj.image_url} alt={proj.title_de || proj.title} className="w-full h-full object-cover opacity-50 group-hover/proj:scale-110 transition-transform duration-700 filter grayscale" />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <p className="text-primary text-[10px] font-black uppercase tracking-widest">{proj.category_de || proj.category}</p>
                <h3 className="text-white font-black text-lg mt-1">{proj.title_de || proj.title}</h3>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function EditorFAQ({ settings: s, faqs, updateField, selectedId, setSelectedId }: any) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  return (
    <section className="py-20 px-6 max-w-7xl mx-auto">
      <div className="mb-12" onClick={e => e.stopPropagation()}>
        <EditableText value={s?.faq_title || 'Häufig gestellte Fragen'} fieldPath="settings.faq_title" updateField={updateField} className="text-4xl md:text-6xl font-black italic text-gray-900" tag="h2" />
      </div>
      {faqs.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 py-16 text-center text-gray-400 text-sm font-bold">
          Keine FAQs — füge welche über das Ebenen-Panel hinzu
        </div>
      ) : (
        <div className="space-y-3 max-w-3xl">
          {faqs.map((faq: any, idx: number) => (
            <div key={faq.id || idx} className="border border-gray-200 bg-white shadow-sm overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
                onClick={e => { e.stopPropagation(); setOpenIdx(openIdx === idx ? null : idx); }}
              >
                <span className="font-black text-gray-900 pr-4">{faq.question_de || faq.question}</span>
                {openIdx === idx ? <ChevronUp size={16} className="text-primary shrink-0" /> : <ChevronDown size={16} className="text-gray-400 shrink-0" />}
              </button>
              {openIdx === idx && (
                <div className="px-6 pb-6 text-gray-500 text-sm leading-relaxed border-t border-gray-100 pt-4">
                  {faq.answer_de || faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function EditorCTA({ settings: s, updateField, uploadImage, isUploading, selectedId, setSelectedId }: any) {
  useImageUpdater(updateField);
  return (
    <section className="relative py-24 overflow-hidden">
      {s?.cta_image_url && (
        <img src={s.cta_image_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20 filter grayscale pointer-events-none" />
      )}
      <div className="absolute inset-0 bg-gray-900 pointer-events-none" style={{ opacity: s?.cta_image_url ? 0.85 : 1 }} />
      <div className="relative z-10 px-6 max-w-4xl mx-auto text-center space-y-8" onClick={e => e.stopPropagation()}>
        <EditableText
          value={s?.cta_title_de || 'Bereit für Ihr nächstes Projekt?'}
          fieldPath="settings.cta_title_de"
          updateField={updateField}
          className="text-4xl md:text-6xl font-black italic text-white"
          tag="h2"
        />
        <EditableText
          value={s?.cta_subtitle_de || 'Kontaktieren Sie uns für ein unverbindliches Angebot.'}
          fieldPath="settings.cta_subtitle_de"
          updateField={updateField}
          className="text-gray-300 text-lg max-w-xl mx-auto"
          tag="p"
          multiline
        />
        <div className="flex flex-wrap gap-4 justify-center items-center">
          <button className="bg-primary text-black font-black text-sm uppercase tracking-widest px-10 py-5 hover:bg-white transition-colors">
            <EditableText
              value={s?.cta_button_de || 'Jetzt Angebot anfordern'}
              fieldPath="settings.cta_button_de"
              updateField={updateField}
              className=""
              tag="span"
              placeholder="Button Text"
            />
          </button>
        </div>
      </div>
    </section>
  );
}

function EditorContact({ settings: s, updateField, selectedId, setSelectedId }: any) {
  return (
    <section className="py-20 px-6 max-w-7xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-16">
        <div className="space-y-8" onClick={e => e.stopPropagation()}>
          <div>
            <EditableText value={s?.contact_title || 'Kontakt aufnehmen'} fieldPath="settings.contact_title" updateField={updateField} className="text-4xl md:text-5xl font-black italic text-gray-900" tag="h2" />
            <EditableText value={s?.contact_subtitle || 'Wir freuen uns auf Ihre Anfrage.'} fieldPath="settings.contact_subtitle" updateField={updateField} className="text-gray-500 mt-3" tag="p" multiline />
          </div>
          <div className="space-y-4">
            {[
              { icon: <Phone size={16} />, field: 'phone', label: 'Telefon', placeholder: '+49 159 …' },
              { icon: <Mail size={16} />, field: 'email', label: 'E-Mail', placeholder: 'info@…' },
              { icon: <MapPin size={16} />, field: 'address_de', label: 'Adresse', placeholder: 'Straße, PLZ Ort' },
            ].map(({ icon, field, label, placeholder }) => (
              <div key={field} className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-sm flex items-center justify-center text-primary shrink-0">{icon}</div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{label}</p>
                  <EditableText value={(s as any)?.[field] || ''} fieldPath={`settings.${field}`} updateField={updateField} className="font-bold text-gray-900 text-sm" tag="span" placeholder={placeholder} />
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Contact form preview */}
        <div className="bg-gray-50 border border-gray-200 p-8 space-y-4">
          <h3 className="font-black text-gray-900">Nachricht senden</h3>
          {['Ihr Name', 'Ihre E-Mail', 'Ihre Nachricht'].map(ph => (
            ph === 'Ihre Nachricht'
              ? <textarea key={ph} placeholder={ph} className="w-full bg-white border border-gray-200 p-3 text-sm text-gray-400 placeholder-gray-400 outline-none resize-none" rows={4} disabled />
              : <input key={ph} placeholder={ph} className="w-full bg-white border border-gray-200 p-3 text-sm text-gray-400 placeholder-gray-400 outline-none" disabled />
          ))}
          <button className="w-full bg-primary text-black font-black text-xs uppercase tracking-widest py-4 hover:bg-gray-900 hover:text-white transition-colors">Absenden</button>
        </div>
      </div>
    </section>
  );
}

function EditorFooter({ settings: s, updateField, selectedId, setSelectedId }: any) {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 px-8 py-12">
      <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-12">
        <div onClick={e => e.stopPropagation()}>
          <EditableText value={s?.name || 'FJ BAUSERVICE'} fieldPath="settings.name" updateField={updateField} className="font-black text-lg uppercase tracking-widest text-gray-900 mb-3 block" tag="span" />
          <EditableText value={s?.slogan_de || s?.slogan || 'Raum für Neues schaffen'} fieldPath="settings.slogan_de" updateField={updateField} className="text-gray-500 text-sm" tag="p" multiline />
        </div>
        <div onClick={e => e.stopPropagation()}>
          <p className="font-black text-[10px] uppercase tracking-widest text-gray-400 mb-4">Kontakt</p>
          <div className="space-y-2 text-sm text-gray-600">
            <EditableText value={s?.phone || ''} fieldPath="settings.phone" updateField={updateField} className="block" tag="span" placeholder="Telefon" />
            <EditableText value={s?.email || ''} fieldPath="settings.email" updateField={updateField} className="block" tag="span" placeholder="E-Mail" />
          </div>
        </div>
        <div onClick={e => e.stopPropagation()}>
          <p className="font-black text-[10px] uppercase tracking-widest text-gray-400 mb-4">Adresse</p>
          <EditableText value={s?.address_de || s?.address || ''} fieldPath="settings.address_de" updateField={updateField} className="text-sm text-gray-600" tag="p" multiline />
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-gray-200 flex justify-between items-center text-[11px] text-gray-400">
        <EditableText value={s?.footer_copyright || `© ${new Date().getFullYear()} ${s?.name || 'FJ BAUSERVICE'} — Alle Rechte vorbehalten`} fieldPath="settings.footer_copyright" updateField={updateField} className="" tag="span" placeholder="Copyright Text" />
      </div>
    </footer>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEFT PANELS
// ═══════════════════════════════════════════════════════════════════════════════

function LayersPanel({ sections, selectedId, setSelectedId, moveSection, toggleSection,
  services, faqs, testimonials, projects,
  onEditService, onAddService, onEditFaq, onAddFaq, onEditTestimonial, onAddTestimonial, onEditProject, onAddProject
}: any) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const sorted = [...sections].sort((a: any, b: any) => a.order - b.order);

  return (
    <div className="p-3 space-y-1">
      <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 px-1 py-2">Seiten-Ebenen</p>

      {/* Static nav */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-sm cursor-pointer transition-colors text-[11px] font-bold ${selectedId === 'navbar' ? 'bg-primary/20 text-primary' : 'text-zinc-400 hover:text-white hover:bg-[#1a1a1a]'}`}
        onClick={() => setSelectedId('navbar')}>
        <Globe size={12} /> Navigation
      </div>

      {/* Dynamic sections */}
      {sorted.map((sec: any) => (
        <div key={sec.id}>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-sm cursor-pointer transition-colors group/layer ${selectedId === sec.id ? 'bg-primary/20 text-primary' : sec.visible ? 'text-zinc-400 hover:text-white hover:bg-[#1a1a1a]' : 'text-zinc-700'}`}
            onClick={() => { setSelectedId(sec.id); setExpanded(expanded === sec.id ? null : sec.id); }}>
            <span className="text-[11px]">{sec.icon}</span>
            <span className={`flex-1 text-[11px] font-bold ${!sec.visible ? 'line-through opacity-50' : ''}`}>{sec.label}</span>
            <div className="flex items-center gap-0.5 opacity-0 group-hover/layer:opacity-100 transition-opacity">
              <button onClick={e => { e.stopPropagation(); moveSection(sec.id, 'up'); }} className="p-0.5 hover:text-white"><ChevronUp size={11} /></button>
              <button onClick={e => { e.stopPropagation(); moveSection(sec.id, 'down'); }} className="p-0.5 hover:text-white"><ChevronDown size={11} /></button>
              <button onClick={e => { e.stopPropagation(); toggleSection(sec.id); }} className={`p-0.5 ${sec.visible ? 'hover:text-yellow-400' : 'text-yellow-500'}`}>
                {sec.visible ? <Eye size={11} /> : <EyeOff size={11} />}
              </button>
            </div>
            <ChevronDown size={11} className={`shrink-0 transition-transform ${expanded === sec.id ? 'rotate-180' : ''}`} />
          </div>

          {/* Expandable sub-items */}
          {expanded === sec.id && (
            <div className="ml-4 mt-1 mb-1 space-y-0.5 border-l border-[#2a2a2a] pl-3">
              {sec.id === 'services' && (
                <>
                  {services.map((svc: any) => (
                    <button key={svc.id} onClick={() => onEditService(svc)}
                      className="w-full text-left px-2 py-1.5 text-[10px] text-zinc-500 hover:text-white hover:bg-[#1a1a1a] rounded-sm flex items-center gap-2">
                      <Pencil size={10} />{svc.title_de || svc.title || 'Service'}
                    </button>
                  ))}
                  <button onClick={onAddService} className="w-full text-left px-2 py-1.5 text-[10px] text-primary hover:bg-primary/10 rounded-sm flex items-center gap-2">
                    <Plus size={10} /> Service hinzufügen
                  </button>
                </>
              )}
              {sec.id === 'faqs' && (
                <>
                  {faqs.map((faq: any) => (
                    <button key={faq.id} onClick={() => onEditFaq(faq)}
                      className="w-full text-left px-2 py-1.5 text-[10px] text-zinc-500 hover:text-white hover:bg-[#1a1a1a] rounded-sm flex items-center gap-2 truncate">
                      <Pencil size={10} /><span className="truncate">{faq.question_de || faq.question || 'FAQ'}</span>
                    </button>
                  ))}
                  <button onClick={onAddFaq} className="w-full text-left px-2 py-1.5 text-[10px] text-primary hover:bg-primary/10 rounded-sm flex items-center gap-2">
                    <Plus size={10} /> FAQ hinzufügen
                  </button>
                </>
              )}
              {sec.id === 'hero' && (
                <div className="space-y-0.5">
                  {[['Überschrift','hero_heading_de'],['Beschreibung','hero_subtext_de'],['Button','hero_button_de'],['Bild','hero_image_url']].map(([label, field]) => (
                    <div key={field} className="px-2 py-1 text-[10px] text-zinc-600 flex items-center gap-2">
                      {field.includes('image') ? <ImageIcon size={10} /> : <Type size={10} />}
                      {label}
                    </div>
                  ))}
                </div>
              )}
              {sec.id === 'projects' && (
                <>
                  {projects.map((proj: any) => (
                    <button key={proj.id} onClick={() => onEditProject(proj)}
                      className="w-full text-left px-2 py-1.5 text-[10px] text-zinc-500 hover:text-white hover:bg-[#1a1a1a] rounded-sm flex items-center gap-2 truncate">
                      <Pencil size={10} /><span className="truncate">{proj.title_de || proj.title || 'Projekt'}</span>
                    </button>
                  ))}
                  <button onClick={onAddProject} className="w-full text-left px-2 py-1.5 text-[10px] text-primary hover:bg-primary/10 rounded-sm flex items-center gap-2">
                    <Plus size={10} /> Projekt hinzufügen
                  </button>
                </>
              )}
              {sec.id === 'contact' && (
                <div className="space-y-0.5">
                  {[['Telefon','phone'],['E-Mail','email'],['Adresse','address_de'],['Titel','contact_title']].map(([label, field]) => (
                    <div key={field} className="px-2 py-1 text-[10px] text-zinc-600 flex items-center gap-2">
                      <Phone size={10} />{label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Static footer */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-sm cursor-pointer transition-colors text-[11px] font-bold ${selectedId === 'footer' ? 'bg-primary/20 text-primary' : 'text-zinc-400 hover:text-white hover:bg-[#1a1a1a]'}`}
        onClick={() => setSelectedId('footer')}>
        <LayoutGrid size={12} /> Footer
      </div>

      <div className="pt-4 border-t border-[#222] space-y-1.5">
        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-700 px-1">Tipp</p>
        <p className="text-[10px] text-zinc-600 px-1 leading-relaxed">Klicke direkt auf Text oder Bilder auf der Vorschau rechts, um zu bearbeiten.</p>
      </div>
    </div>
  );
}

function StylesPanel({ data, updateField }: any) {
  const s = data.settings;
  return (
    <div className="p-4 space-y-6">
      <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Globale Stile</p>

      {/* Primary color */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-primary">Primärfarbe</label>
        <div className="flex items-center gap-3">
          <input type="color" value={s?.primary_color || '#ff751f'}
            onChange={e => {
              updateField('settings.primary_color', e.target.value);
              document.documentElement.style.setProperty('--color-primary', e.target.value);
            }}
            className="w-10 h-10 cursor-pointer rounded border border-[#333] bg-transparent" />
          <span className="text-xs text-zinc-400 font-mono">{s?.primary_color || '#ff751f'}</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {['#ff751f','#2563eb','#16a34a','#dc2626','#7c3aed','#0891b2','#d97706','#111111'].map(c => (
            <button key={c} onClick={() => { updateField('settings.primary_color', c); document.documentElement.style.setProperty('--color-primary', c); }}
              className="w-7 h-7 rounded-sm border-2 hover:scale-110 transition-transform"
              style={{ backgroundColor: c, borderColor: s?.primary_color === c ? '#fff' : 'transparent' }} />
          ))}
        </div>
      </div>

      {/* Logo scale */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center justify-between">
          Logo Größe <span className="text-white">{parseFloat(s?.logo_scale || '1').toFixed(1)}×</span>
        </label>
        <input type="range" min="0.5" max="3" step="0.1"
          value={parseFloat(s?.logo_scale || '1') || 1}
          onChange={e => updateField('settings.logo_scale', e.target.value)}
          className="w-full accent-primary" />
      </div>

      {/* Section headings */}
      <div className="space-y-3 pt-2 border-t border-[#222]">
        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Abschnitts-Titel</p>
        {[
          ['Services-Titel', 'services_title'],
          ['Projekte-Titel', 'projects_title'],
          ['FAQ-Titel', 'faq_title'],
          ['Warum-Wir-Titel', 'whyus_title'],
        ].map(([label, field]) => (
          <div key={field} className="space-y-1">
            <label className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">{label}</label>
            <input
              type="text"
              value={(s as any)?.[field] || ''}
              onChange={e => updateField(`settings.${field}`, e.target.value)}
              placeholder={label}
              className="w-full bg-[#0a0a0a] border border-[#222] p-2 rounded-sm text-xs text-white placeholder:text-zinc-700 outline-none focus:border-primary"
            />
          </div>
        ))}
      </div>

      {/* SEO */}
      <div className="space-y-3 pt-2 border-t border-[#222]">
        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600">SEO</p>
        {[
          ['Meta-Titel (DE)', 'seo_title_de'],
          ['Meta-Beschreibung (DE)', 'seo_description_de'],
          ['Keywords', 'seo_keywords'],
        ].map(([label, field]) => (
          <div key={field} className="space-y-1">
            <label className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">{label}</label>
            {field === 'seo_description_de' ? (
              <textarea value={(s as any)?.[field] || ''} onChange={e => updateField(`settings.${field}`, e.target.value)} placeholder={label}
                className="w-full bg-[#0a0a0a] border border-[#222] p-2 rounded-sm text-xs text-white placeholder:text-zinc-700 outline-none focus:border-primary resize-none" rows={3} />
            ) : (
              <input type="text" value={(s as any)?.[field] || ''} onChange={e => updateField(`settings.${field}`, e.target.value)} placeholder={label}
                className="w-full bg-[#0a0a0a] border border-[#222] p-2 rounded-sm text-xs text-white placeholder:text-zinc-700 outline-none focus:border-primary" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function MediaPanel({ files, loading, onRefresh, onUpload, onSelect, isUploading }: any) {
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Medienbibliothek</p>
        <button onClick={onRefresh} className="p-1 text-zinc-600 hover:text-white transition-colors"><RefreshCw size={12} /></button>
      </div>

      {/* Upload */}
      <label className="cursor-pointer">
        <div className="flex items-center justify-center gap-2 border-2 border-dashed border-[#333] hover:border-primary rounded-sm p-4 text-[10px] font-black uppercase tracking-wider text-zinc-600 hover:text-primary transition-colors">
          {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          {isUploading ? 'Uploading…' : 'Bild hochladen'}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ''; }} />
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
      <p className="text-[9px] text-zinc-700 leading-relaxed">Wähle ein Bild aus und klicke dann auf ein Bildelement auf der Vorschau, um es einzufügen.</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// RIGHT PANEL ITEM EDITORS
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

function ServiceEditForm({ svc, onChange, uploadImage, isUploading }: any) {
  const icons = ['Hammer','Drill','Building2','Truck','Construction','Zap','ShieldCheck','Clock','Star','Award'];
  return (
    <div className="space-y-4">
      <FieldLabel label="Titel (Deutsch)"><input className={panelInput} value={svc.title_de || ''} onChange={e => onChange({...svc, title_de: e.target.value, title: e.target.value})} placeholder="Service-Titel" /></FieldLabel>
      <FieldLabel label="Titel (Englisch)"><input className={panelInput} value={svc.title_en || ''} onChange={e => onChange({...svc, title_en: e.target.value})} placeholder="Service Title" /></FieldLabel>
      <FieldLabel label="Beschreibung (DE)"><textarea className={panelTextarea} rows={3} value={svc.description_de || ''} onChange={e => onChange({...svc, description_de: e.target.value, description: e.target.value})} placeholder="Beschreibung" /></FieldLabel>
      <FieldLabel label="Beschreibung (EN)"><textarea className={panelTextarea} rows={3} value={svc.description_en || ''} onChange={e => onChange({...svc, description_en: e.target.value})} placeholder="Description" /></FieldLabel>
      <FieldLabel label="Icon">
        <select className={panelInput} value={svc.icon_name || 'Hammer'} onChange={e => onChange({...svc, icon_name: e.target.value})}>
          {icons.map(ic => <option key={ic} value={ic}>{ic}</option>)}
        </select>
      </FieldLabel>
      <FieldLabel label="Reihenfolge"><input type="number" className={panelInput} value={svc.sort_order || 0} onChange={e => onChange({...svc, sort_order: parseInt(e.target.value)})} /></FieldLabel>
    </div>
  );
}

function FaqEditForm({ faq, onChange }: any) {
  return (
    <div className="space-y-4">
      <FieldLabel label="Frage (Deutsch)"><textarea className={panelTextarea} rows={2} value={faq.question_de || ''} onChange={e => onChange({...faq, question_de: e.target.value, question: e.target.value})} placeholder="Frage…" /></FieldLabel>
      <FieldLabel label="Frage (Englisch)"><textarea className={panelTextarea} rows={2} value={faq.question_en || ''} onChange={e => onChange({...faq, question_en: e.target.value})} placeholder="Question…" /></FieldLabel>
      <FieldLabel label="Antwort (Deutsch)"><textarea className={panelTextarea} rows={4} value={faq.answer_de || ''} onChange={e => onChange({...faq, answer_de: e.target.value, answer: e.target.value})} placeholder="Antwort…" /></FieldLabel>
      <FieldLabel label="Antwort (Englisch)"><textarea className={panelTextarea} rows={4} value={faq.answer_en || ''} onChange={e => onChange({...faq, answer_en: e.target.value})} placeholder="Answer…" /></FieldLabel>
      <FieldLabel label="Reihenfolge"><input type="number" className={panelInput} value={faq.sort_order || 0} onChange={e => onChange({...faq, sort_order: parseInt(e.target.value)})} /></FieldLabel>
    </div>
  );
}

function TestimonialEditForm({ t, onChange, uploadImage, isUploading }: any) {
  return (
    <div className="space-y-4">
      <FieldLabel label="Name"><input className={panelInput} value={t.author || ''} onChange={e => onChange({...t, author: e.target.value})} placeholder="Max Mustermann" /></FieldLabel>
      <FieldLabel label="Firma / Rolle"><input className={panelInput} value={t.company || ''} onChange={e => onChange({...t, company: e.target.value})} placeholder="Firma GmbH" /></FieldLabel>
      <FieldLabel label="Bewertung (1-5)">
        <div className="flex gap-2">
          {[1,2,3,4,5].map(n => (
            <button key={n} type="button" onClick={() => onChange({...t, rating: n})}
              className={`p-1.5 rounded transition-colors ${(t.rating || 5) >= n ? 'text-primary' : 'text-zinc-600'}`}>
              <Star size={18} fill={(t.rating || 5) >= n ? 'currentColor' : 'none'} />
            </button>
          ))}
        </div>
      </FieldLabel>
      <FieldLabel label="Text (DE)"><textarea className={panelTextarea} rows={3} value={t.text_de || ''} onChange={e => onChange({...t, text_de: e.target.value, text: e.target.value})} placeholder="Bewertungstext…" /></FieldLabel>
      <FieldLabel label="Text (EN)"><textarea className={panelTextarea} rows={3} value={t.text_en || ''} onChange={e => onChange({...t, text_en: e.target.value})} placeholder="Review text…" /></FieldLabel>
      <FieldLabel label="Avatar URL"><input className={panelInput} value={t.avatar_url || ''} onChange={e => onChange({...t, avatar_url: e.target.value})} placeholder="https://…" /></FieldLabel>
    </div>
  );
}

function ProjectEditForm({ proj, onChange, uploadImage, isUploading }: any) {
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-4">
      <FieldLabel label="Titel (Deutsch)"><input className={panelInput} value={proj.title_de || ''} onChange={e => onChange({...proj, title_de: e.target.value, title: e.target.value})} placeholder="Projekttitel" /></FieldLabel>
      <FieldLabel label="Titel (Englisch)"><input className={panelInput} value={proj.title_en || ''} onChange={e => onChange({...proj, title_en: e.target.value})} placeholder="Project title" /></FieldLabel>
      <FieldLabel label="Kategorie (DE)"><input className={panelInput} value={proj.category_de || ''} onChange={e => onChange({...proj, category_de: e.target.value, category: e.target.value})} placeholder="Abbruch" /></FieldLabel>
      <FieldLabel label="Kategorie (EN)"><input className={panelInput} value={proj.category_en || ''} onChange={e => onChange({...proj, category_en: e.target.value})} placeholder="Demolition" /></FieldLabel>
      <FieldLabel label="Beschreibung (DE)"><textarea className={panelTextarea} rows={3} value={proj.description_de || ''} onChange={e => onChange({...proj, description_de: e.target.value, description: e.target.value})} placeholder="Beschreibung…" /></FieldLabel>
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
                  if (url) onChange({...proj, image_url: url});
                }
                e.target.value = '';
              }} />
          </label>
          <input className={panelInput} value={proj.image_url || ''} onChange={e => onChange({...proj, image_url: e.target.value})} placeholder="Oder URL einfügen…" />
        </div>
      </FieldLabel>
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
