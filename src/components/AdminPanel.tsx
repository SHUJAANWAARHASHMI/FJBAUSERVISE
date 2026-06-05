import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Save, Plus, Trash2, LayoutDashboard, Briefcase, Mail,
  Loader2, Image as ImageIcon, LogOut, Pencil, ChevronDown, ChevronUp,
  Globe, MessageSquare, HelpCircle, Settings, Database,
  CheckCircle2, AlertCircle, Eye, EyeOff, GripVertical, Upload,
  FileText, Star, Phone, MapPin, Search, BarChart2, Palette,
  RefreshCw, Download, Shield, Users, Home, Award, Copy, Check,
  ExternalLink, Info, Layers, Zap, MousePointer2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  saveSettings as cmsSaveSettings,
  insertRow, updateRow, deleteRow,
  fetchMediaFiles, deleteMediaFile,
  uploadImage as cmsUploadImage,
  type MediaFile,
} from '../lib/cmsUtils';

// ─── Types ───────────────────────────────────────────────────────────────────
interface AdminPanelProps {
  onClose: () => void;
  settings: any;
  projects: any[];
  services: any[];
  faqs: any[];
  testimonials: any[];
  refreshData: () => void;
  lang: 'en' | 'de';
  onOpenSiteEditor?: () => void;
}

type TabId = 'dashboard' | 'hero' | 'services' | 'projects' | 'faqs' | 'testimonials' | 'contact' | 'inquiries' | 'media' | 'data';
type SaveState = 'idle' | 'saving' | 'saved' | 'error';

interface Toast { id: string; type: 'success' | 'error' | 'info'; message: string; }

// ─── Toast Component ─────────────────────────────────────────────────────────
function ToastContainer({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 max-w-sm">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 60, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.9 }}
            className={`flex items-center gap-3 px-5 py-4 rounded-sm shadow-2xl border text-sm font-bold ${
              toast.type === 'success' ? 'bg-green-900/90 border-green-500/50 text-green-300' :
              toast.type === 'error'   ? 'bg-red-900/90 border-red-500/50 text-red-300' :
                                        'bg-zinc-800/90 border-zinc-600/50 text-zinc-200'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 size={18} className="shrink-0 text-green-400" />}
            {toast.type === 'error'   && <AlertCircle  size={18} className="shrink-0 text-red-400" />}
            {toast.type === 'info'    && <Info          size={18} className="shrink-0 text-blue-400" />}
            <span className="flex-1">{toast.message}</span>
            <button onClick={() => removeToast(toast.id)} className="ml-2 opacity-60 hover:opacity-100">
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── Section Header ──────────────────────────────────────────────────────────
function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex items-start gap-4 pb-6 border-b border-white/10">
      <div className="p-3 bg-primary/10 border border-primary/20 rounded-sm text-primary shrink-0">{icon}</div>
      <div>
        <h3 className="heading-dynamic text-2xl md:text-3xl">{title}</h3>
        <p className="text-zinc-500 text-sm mt-1">{subtitle}</p>
      </div>
    </div>
  );
}

// ─── Field Component ─────────────────────────────────────────────────────────
function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-primary">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-[10px] text-zinc-600 italic leading-tight">{hint}</p>}
    </div>
  );
}

// ─── Input / Textarea Styles ──────────────────────────────────────────────────
const inputCls = "w-full bg-[#0a0a0a] border border-[#222] p-3 rounded-sm focus:border-primary outline-none transition-colors text-sm text-white placeholder:text-zinc-700";
const textareaCls = `${inputCls} resize-none`;

// ─── Image Upload Field ───────────────────────────────────────────────────────
function ImageUploadField({
  label, value, fieldKey, isUploading, onUpload, onChange, onDrop, hint
}: {
  label: string; value: string; fieldKey: string; isUploading: string | null;
  onUpload: (field: string, file: File) => void;
  onChange: (val: string) => void;
  onDrop?: (field: string, file: File) => void;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onDrop ? onDrop(fieldKey, file) : onUpload(fieldKey, file);
    }
  };

  return (
    <Field label={label} hint={hint}>
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-sm p-4 transition-all ${
          dragging ? 'border-primary bg-primary/5' : 'border-[#222] hover:border-[#444]'
        }`}
      >
        {value ? (
          <div className="relative group">
            <img src={value} alt="" className="w-full h-40 object-cover rounded-sm opacity-80" />
            <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 rounded-sm">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="p-2 bg-primary text-black rounded-sm hover:bg-white transition-colors"
              >
                {isUploading === fieldKey ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              </button>
              <button
                type="button"
                onClick={() => onChange('')}
                className="p-2 bg-red-600 text-white rounded-sm hover:bg-red-500 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center gap-3 py-8 cursor-pointer"
            onClick={() => inputRef.current?.click()}
          >
            {isUploading === fieldKey ? (
              <Loader2 size={28} className="animate-spin text-primary" />
            ) : (
              <Upload size={28} className="text-zinc-600" />
            )}
            <div className="text-center">
              <p className="text-xs font-bold text-zinc-400">
                {isUploading === fieldKey ? 'Uploading...' : 'Drag & drop or click to upload'}
              </p>
              <p className="text-[10px] text-zinc-600 mt-1">PNG, JPG, WebP up to 10MB</p>
            </div>
          </div>
        )}
        <input ref={inputRef} type="file" className="hidden" accept="image/*"
          onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(fieldKey, f); e.target.value = ''; }}
          disabled={!!isUploading} />
      </div>
      <div className="flex gap-2 items-center mt-2">
        <input type="text" value={value} onChange={e => onChange(e.target.value)}
          placeholder="Or paste image URL..." className={`${inputCls} text-xs`} />
      </div>
    </Field>
  );
}

// ─── Bilingual Input ──────────────────────────────────────────────────────────
function BilingualInput({
  labelDe, labelEn, valueDe, valueEn,
  onChangeDe, onChangeEn, textarea = false, rows = 3, required = false
}: {
  labelDe: string; labelEn: string; valueDe: string; valueEn: string;
  onChangeDe: (v: string) => void; onChangeEn: (v: string) => void;
  textarea?: boolean; rows?: number; required?: boolean;
}) {
  const [tab, setTab] = useState<'de' | 'en'>('de');
  const Tag = textarea ? 'textarea' : 'input';
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button type="button" onClick={() => setTab('de')}
          className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-sm transition-colors ${tab === 'de' ? 'bg-primary text-black' : 'bg-[#111] text-zinc-500 hover:text-white'}`}>
          🇩🇪 DE
        </button>
        <button type="button" onClick={() => setTab('en')}
          className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-sm transition-colors ${tab === 'en' ? 'bg-primary text-black' : 'bg-[#111] text-zinc-500 hover:text-white'}`}>
          🇺🇸 EN
        </button>
      </div>
      {tab === 'de' ? (
        <div className="space-y-1">
          <label className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">{labelDe}{required && ' *'}</label>
          <Tag
            value={valueDe} onChange={e => onChangeDe((e.target as any).value)}
            className={textarea ? textareaCls : inputCls} rows={textarea ? rows : undefined}
            required={required}
          />
        </div>
      ) : (
        <div className="space-y-1">
          <label className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">{labelEn}</label>
          <Tag
            value={valueEn} onChange={e => onChangeEn((e.target as any).value)}
            className={textarea ? textareaCls : inputCls} rows={textarea ? rows : undefined}
          />
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN ADMIN PANEL
// ═════════════════════════════════════════════════════════════════════════════
export default function AdminPanel({
  onClose, settings, projects: initialProjects, services: initialServices,
  faqs: initialFaqs, testimonials: initialTestimonials, refreshData, lang,
  onOpenSiteEditor
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isUploading, setIsUploading] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [crudSaveState, setCrudSaveState] = useState<SaveState>('idle');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data states
  const [settingsForm, setSettingsForm] = useState<any>(settings || {});
  const [projects, setProjects] = useState<any[]>(initialProjects || []);
  const [services, setServices] = useState<any[]>(initialServices || []);
  const [faqs, setFaqs] = useState<any[]>(initialFaqs || []);
  const [testimonials, setTestimonials] = useState<any[]>(initialTestimonials || []);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loadingInquiries, setLoadingInquiries] = useState(false);

  // Modal states
  const [editingProject, setEditingProject] = useState<any>(null);
  const [editingService, setEditingService] = useState<any>(null);
  const [editingFaq, setEditingFaq] = useState<any>(null);
  const [editingTestimonial, setEditingTestimonial] = useState<any>(null);

  // Stats for dashboard
  const [stats, setStats] = useState({ projects: 0, services: 0, faqs: 0, testimonials: 0, inquiries: 0 });

  const addToast = useCallback((type: Toast['type'], message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(p => [...p, { id, type, message }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(p => p.filter(t => t.id !== id));
  }, []);

  // Sync settings form
  useEffect(() => {
    if (settings) {
      const cleaned: any = {};
      Object.keys(settings).forEach(k => { cleaned[k] = settings[k] ?? ''; });
      setSettingsForm(cleaned);
    }
  }, [settings]);

  useEffect(() => { setProjects(initialProjects || []); }, [initialProjects]);
  useEffect(() => { setServices(initialServices || []); }, [initialServices]);
  useEffect(() => { setFaqs(initialFaqs || []); }, [initialFaqs]);
  useEffect(() => { setTestimonials(initialTestimonials || []); }, [initialTestimonials]);

  // Fetch inquiries
  const fetchInquiries = useCallback(async () => {
    setLoadingInquiries(true);
    const { data } = await supabase.from('contact_inquiries').select('*').order('created_at', { ascending: false });
    if (data) { setInquiries(data); setStats(p => ({ ...p, inquiries: data.length })); }
    setLoadingInquiries(false);
  }, []);

  useEffect(() => {
    if (activeTab === 'inquiries') fetchInquiries();
  }, [activeTab, fetchInquiries]);

  // Load stats
  useEffect(() => {
    setStats({
      projects: projects.length,
      services: services.length,
      faqs: faqs.length,
      testimonials: testimonials.length,
      inquiries: 0
    });
  }, [projects, services, faqs, testimonials]);

  // ── Image Upload ────────────────────────────────────────────────────────────
  const handleImageUpload = async (field: string, file: File): Promise<string | null> => {
    setIsUploading(field);
    try {
      const result = await cmsUploadImage(file, field);
      if (!result.ok || !result.url) throw new Error(result.error || 'Upload failed');
      addToast('success', 'Image uploaded successfully!');
      return result.url;
    } catch (err: any) {
      addToast('error', 'Upload error: ' + err.message);
      return null;
    } finally {
      setIsUploading(null);
    }
  };

  const uploadAndSetSettings = async (field: string, file: File) => {
    const url = await handleImageUpload(field, file);
    if (url) setSettingsForm((p: any) => ({ ...p, [field]: url }));
  };

  // ── Save Settings ──────────────────────────────────────────────────────────
  // settingsFormRef always mirrors latest settingsForm — fixes stale-closure in CTRL+S
  const settingsFormRef = useRef<any>(settingsForm);
  useEffect(() => { settingsFormRef.current = settingsForm; });

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveState('saving');
    try {
      // Read from ref to always get the latest form values (not stale closure)
      const result = await cmsSaveSettings(settingsFormRef.current);
      if (!result.ok) throw new Error(result.error || 'Unknown error');
      setSaveState('saved');
      addToast('success', '✅ Einstellungen gespeichert!');
      refreshData();
      setTimeout(() => setSaveState('idle'), 3000);
    } catch (err: any) {
      setSaveState('error');
      addToast('error', '❌ Speichern fehlgeschlagen: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // handleSaveSettingsRef: always calls the latest handleSaveSettings (for CTRL+S timer)
  const handleSaveSettingsRef = useRef(handleSaveSettings);
  useEffect(() => { handleSaveSettingsRef.current = handleSaveSettings; });

  // CTRL+S handler for settings forms
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        if (activeTab === 'hero' || activeTab === 'contact') {
          e.preventDefault();
          // Use ref so we always call the latest version, never a stale closure
          handleSaveSettingsRef.current(new Event('submit') as any);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab]); // no settingsForm dep — handled via ref

  // ── Projects CRUD ───────────────────────────────────────────────────────────
  const blankProject = { title: '', title_de: '', title_en: '', category: '', category_de: '', category_en: '', image_url: '', description: '', description_de: '', description_en: '' };
  const [projectForm, setProjectForm] = useState(blankProject);

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setCrudSaveState('saving');
    try {
      const data = {
        ...projectForm,
        title: projectForm.title_de || projectForm.title || 'Untitled',
        category: projectForm.category_de || projectForm.category || 'General',
        description: projectForm.description_de || projectForm.description || ''
      };
      let result;
      if (editingProject) {
        result = await updateRow('projects', editingProject.id, data);
      } else {
        result = await insertRow('projects', data);
      }
      if (!result.ok) throw new Error(result.error || 'Unknown error');
      setCrudSaveState('saved');
      addToast('success', editingProject ? '✅ Project updated!' : '✅ Project added!');
      setEditingProject(null);
      setProjectForm(blankProject);
      refreshData();
      setTimeout(() => setCrudSaveState('idle'), 3000);
    } catch (err: any) {
      setCrudSaveState('error');
      addToast('error', '❌ Error: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteProject = async (project: any) => {
    if (!confirm('Delete this project?')) return;
    const result = await deleteRow('projects', project.id);
    if (result.ok) { addToast('success', 'Project deleted.'); refreshData(); }
    else addToast('error', 'Delete failed: ' + result.error);
  };

  // ── Services CRUD ───────────────────────────────────────────────────────────
  const blankService = { title: '', title_de: '', title_en: '', description: '', description_de: '', description_en: '', icon_name: 'Hammer', sort_order: 0 };
  const [serviceForm, setServiceForm] = useState(blankService);

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setCrudSaveState('saving');
    try {
      const data = { ...serviceForm, title: serviceForm.title_de || serviceForm.title || 'Service', description: serviceForm.description_de || serviceForm.description || '' };
      let result;
      if (editingService) {
        result = await updateRow('services', editingService.id, data);
      } else {
        result = await insertRow('services', data);
      }
      if (!result.ok) throw new Error(result.error || 'Unknown error');
      setCrudSaveState('saved');
      addToast('success', editingService ? '✅ Service updated!' : '✅ Service added!');
      setEditingService(null);
      setServiceForm(blankService);
      refreshData();
      setTimeout(() => setCrudSaveState('idle'), 3000);
    } catch (err: any) {
      setCrudSaveState('error');
      addToast('error', '❌ Error: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteService = async (id: string) => {
    if (!confirm('Delete this service?')) return;
    const result = await deleteRow('services', id);
    if (result.ok) { addToast('success', 'Service deleted.'); refreshData(); }
    else addToast('error', 'Delete failed: ' + result.error);
  };

  // ── FAQs CRUD ───────────────────────────────────────────────────────────────
  const blankFaq = { question: '', question_de: '', question_en: '', answer: '', answer_de: '', answer_en: '', sort_order: 0 };
  const [faqForm, setFaqForm] = useState(blankFaq);

  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setCrudSaveState('saving');
    try {
      const data = { ...faqForm, question: faqForm.question_de || faqForm.question || '?', answer: faqForm.answer_de || faqForm.answer || '' };
      let result;
      if (editingFaq) {
        result = await updateRow('faqs', editingFaq.id, data);
      } else {
        result = await insertRow('faqs', data);
      }
      if (!result.ok) throw new Error(result.error || 'Unknown error');
      setCrudSaveState('saved');
      addToast('success', editingFaq ? '✅ FAQ updated!' : '✅ FAQ added!');
      setEditingFaq(null);
      setFaqForm(blankFaq);
      refreshData();
      setTimeout(() => setCrudSaveState('idle'), 3000);
    } catch (err: any) {
      setCrudSaveState('error');
      addToast('error', '❌ Error: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteFaq = async (id: string) => {
    if (!confirm('Delete this FAQ?')) return;
    const result = await deleteRow('faqs', id);
    if (result.ok) { addToast('success', 'FAQ deleted.'); refreshData(); }
    else addToast('error', 'Delete failed: ' + result.error);
  };

  // ── Testimonials CRUD ───────────────────────────────────────────────────────
  const blankTestimonial = { author: '', company: '', text: '', text_de: '', text_en: '', rating: 5, avatar_url: '' };
  const [testimonialForm, setTestimonialForm] = useState<any>(blankTestimonial);

  const handleSaveTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setCrudSaveState('saving');
    try {
      const data = { ...testimonialForm, text: testimonialForm.text_de || testimonialForm.text || '' };
      let result;
      if (editingTestimonial) {
        result = await updateRow('testimonials', editingTestimonial.id, data);
      } else {
        result = await insertRow('testimonials', data);
      }
      if (!result.ok) throw new Error(result.error || 'Unknown error');
      setCrudSaveState('saved');
      addToast('success', editingTestimonial ? '✅ Testimonial updated!' : '✅ Testimonial added!');
      setEditingTestimonial(null);
      setTestimonialForm(blankTestimonial);
      refreshData();
      setTimeout(() => setCrudSaveState('idle'), 3000);
    } catch (err: any) {
      setCrudSaveState('error');
      addToast('error', '❌ Error: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteTestimonial = async (id: string) => {
    if (!confirm('Delete this testimonial?')) return;
    const result = await deleteRow('testimonials', id);
    if (result.ok) { addToast('success', 'Testimonial deleted.'); refreshData(); }
    else addToast('error', 'Delete failed: ' + result.error);
  };

  // ── Media Library ───────────────────────────────────────────────────────────
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);

  const loadMediaFiles = useCallback(async () => {
    setLoadingMedia(true);
    setMediaError(null);
    try {
      const files = await fetchMediaFiles(200);
      setMediaFiles(files);
    } catch (err: any) {
      setMediaError(err.message);
    } finally {
      setLoadingMedia(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'media') loadMediaFiles();
  }, [activeTab, loadMediaFiles]);

  const handleDeleteMedia = async (fileName: string) => {
    if (!confirm(`Delete "${fileName}"?`)) return;
    const result = await deleteMediaFile(fileName);
    if (result.ok) {
      addToast('success', 'File deleted.');
      setMediaFiles(prev => prev.filter(f => f.name !== fileName));
    } else {
      addToast('error', 'Delete failed: ' + result.error);
    }
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setIsUploading('media_upload');
    try {
      const result = await cmsUploadImage(file, 'media');
      if (!result.ok || !result.url) throw new Error(result.error || 'Upload failed');
      addToast('success', '✅ File uploaded successfully!');
      await loadMediaFiles();
    } catch (err: any) {
      addToast('error', '❌ Upload error: ' + err.message);
    } finally {
      setIsUploading(null);
    }
  };

  // ── Inquiry Management ──────────────────────────────────────────────────────
  const deleteInquiry = async (id: string) => {
    if (!confirm('Delete this inquiry?')) return;
    await supabase.from('contact_inquiries').delete().eq('id', id);
    fetchInquiries();
    addToast('success', 'Inquiry deleted.');
  };

  // ── Data Export / Import ────────────────────────────────────────────────────
  const handleExport = async () => {
    setIsSaving(true);
    const [s, p, i, sv, f, t] = await Promise.all([
      supabase.from('site_settings').select('*'),
      supabase.from('projects').select('*'),
      supabase.from('contact_inquiries').select('*'),
      supabase.from('services').select('*'),
      supabase.from('faqs').select('*'),
      supabase.from('testimonials').select('*')
    ]);
    const backup = { version: '2.0', timestamp: new Date().toISOString(), site_settings: s.data || [], projects: p.data || [], services: sv.data || [], faqs: f.data || [], testimonials: t.data || [], contact_inquiries: i.data || [] };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `fj-bauservice-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    addToast('success', 'Backup downloaded!');
    setIsSaving(false);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm('WARNING: This will overwrite your database. Continue?')) { e.target.value = ''; return; }
    setIsSaving(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const content = JSON.parse(ev.target?.result as string);
        if (content.site_settings?.length > 0) {
          const { id, updated_at, created_at, ...sd } = content.site_settings[0];
          await supabase.from('site_settings').upsert({ id: 1, ...sd });
        }
        await supabase.from('projects').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (content.projects?.length) await supabase.from('projects').insert(content.projects.map(({ id, created_at, ...d }: any) => d));
        if (content.services?.length) {
          await supabase.from('services').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          await supabase.from('services').insert(content.services.map(({ id, created_at, ...d }: any) => d));
        }
        if (content.faqs?.length) {
          await supabase.from('faqs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          await supabase.from('faqs').insert(content.faqs.map(({ id, created_at, ...d }: any) => d));
        }
        if (content.testimonials?.length) {
          await supabase.from('testimonials').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          await supabase.from('testimonials').insert(content.testimonials.map(({ id, created_at, ...d }: any) => d));
        }
        addToast('success', 'Data restored successfully!');
        refreshData();
      } catch (err: any) { addToast('error', 'Import error: ' + err.message); }
      finally { setIsSaving(false); e.target.value = ''; }
    };
    reader.readAsText(file);
  };

  // ── Logout ──────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    await supabase.auth.signOut();
    onClose();
  };

  // ── Navigation ──────────────────────────────────────────────────────────────
  const tabs = [
    { id: 'dashboard',    label: 'Dashboard',    icon: <LayoutDashboard size={16} /> },
    { id: 'hero',         label: 'Hero & Branding', icon: <Home size={16} /> },
    { id: 'services',     label: 'Services',     icon: <Zap size={16} /> },
    { id: 'projects',     label: 'Projects',     icon: <Briefcase size={16} /> },
    { id: 'faqs',         label: 'FAQs',         icon: <HelpCircle size={16} /> },
    { id: 'testimonials', label: 'Testimonials', icon: <Star size={16} /> },
    { id: 'contact',      label: 'Contact & SEO', icon: <Globe size={16} /> },
    { id: 'media',        label: 'Media Library', icon: <ImageIcon size={16} /> },
    { id: 'inquiries',    label: 'Inquiries',    icon: <Mail size={16} /> },
    { id: 'data',         label: 'Backup & Data', icon: <Database size={16} /> },
  ] as const;

  const iconMap: Record<string, string> = {
    Hammer: '🔨', Drill: '🔩', Building2: '🏢', Truck: '🚛', Construction: '🏗️', Zap: '⚡', ShieldCheck: '🛡️', Clock: '⏱️', Star: '⭐', Award: '🏆'
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/97 backdrop-blur-2xl flex overflow-hidden"
        style={{ fontFamily: "'Montserrat', sans-serif" }}
      >
        {/* ── Sidebar ── */}
        <aside className={`
          fixed md:relative inset-y-0 left-0 z-50 
          w-72 bg-[#080808] border-r border-[#1a1a1a] flex flex-col shrink-0 
          transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          {/* Brand */}
          <div className="p-6 border-b border-[#1a1a1a]">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary flex items-center justify-center rounded-sm">
                    <Settings size={16} className="text-black" />
                  </div>
                  <span className="font-black text-lg uppercase tracking-widest text-white">C·PANEL</span>
                </div>
                <p className="text-[10px] text-zinc-600 mt-1 font-bold uppercase tracking-widest">FJ Bauservice CMS</p>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="md:hidden text-zinc-600 hover:text-white">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-none">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as TabId); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-sm text-left transition-all group ${
                  activeTab === tab.id
                    ? 'bg-primary text-black font-black'
                    : 'text-zinc-500 hover:text-white hover:bg-[#111] font-bold'
                }`}
              >
                <span className={activeTab === tab.id ? 'text-black' : 'text-zinc-600 group-hover:text-primary'}>
                  {tab.icon}
                </span>
                <span className="text-[11px] uppercase tracking-widest">{tab.label}</span>
                {tab.id === 'inquiries' && stats.inquiries > 0 && (
                  <span className="ml-auto bg-primary text-black text-[9px] font-black px-2 py-0.5 rounded-full">
                    {stats.inquiries}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Bottom */}
          <div className="p-4 border-t border-[#1a1a1a] space-y-2">
            <a
              href="/"
              target="_blank"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-sm text-zinc-500 hover:text-white hover:bg-[#111] transition-all font-bold text-[11px] uppercase tracking-widest"
            >
              <ExternalLink size={16} className="text-zinc-600" />
              View Website
            </a>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-sm text-red-500/80 hover:text-red-400 hover:bg-red-500/10 transition-all font-bold text-[11px] uppercase tracking-widest border border-red-500/20"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* ── Main Content ── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar */}
          <header className="flex items-center justify-between px-6 py-4 border-b border-[#1a1a1a] bg-[#080808] shrink-0">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 text-zinc-500 hover:text-white"
              >
                <Layers size={20} />
              </button>
              <div>
                <h2 className="font-black uppercase tracking-widest text-white text-sm">
                  {tabs.find(t => t.id === activeTab)?.label}
                </h2>
                <p className="text-[10px] text-zinc-600">
                  {new Date().toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-sm px-3 py-1.5">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-green-400 uppercase tracking-widest">Live</span>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-zinc-500 hover:text-white hover:bg-[#111] rounded-sm transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 overflow-y-auto p-6 md:p-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >

                {/* ──────── DASHBOARD ──────── */}
                {activeTab === 'dashboard' && (
                  <div className="space-y-10">
                    <SectionHeader
                      icon={<LayoutDashboard size={20} />}
                      title="Dashboard"
                      subtitle="Overview of your website content and recent activity."
                    />

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: 'Projects', value: stats.projects, icon: <Briefcase size={20} />, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
                        { label: 'Services', value: stats.services, icon: <Zap size={20} />, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
                        { label: 'FAQs', value: stats.faqs, icon: <HelpCircle size={20} />, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
                        { label: 'Testimonials', value: stats.testimonials, icon: <Star size={20} />, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
                      ].map(s => (
                        <div key={s.label} className={`border rounded-sm p-6 ${s.bg}`}>
                          <div className={`${s.color} mb-3`}>{s.icon}</div>
                          <div className="text-3xl font-black text-white">{s.value}</div>
                          <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-1">{s.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Site Editor Banner */}
                    <div
                      onClick={onOpenSiteEditor}
                      className="cursor-pointer flex items-center gap-5 p-6 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border border-primary/30 rounded-sm hover:border-primary/60 hover:from-primary/30 transition-all group"
                    >
                      <div className="w-14 h-14 bg-primary flex items-center justify-center rounded-sm shrink-0 group-hover:scale-110 transition-transform">
                        <MousePointer2 size={28} className="text-black" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-black text-xl text-white group-hover:text-primary transition-colors">Visual Site Editor</h3>
                        <p className="text-zinc-400 text-sm mt-1">Live-Vorschau — klicke direkt auf Texte, Bilder und Abschnitte um sie sofort zu bearbeiten. Wie Wix, nur für deine Website.</p>
                      </div>
                      <div className="shrink-0">
                        <div className="bg-primary text-black font-black text-[11px] uppercase tracking-widest px-4 py-2 rounded-sm group-hover:bg-white transition-colors">
                          Öffnen →
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4">Quick Actions</h4>
                      <div className="grid md:grid-cols-3 gap-4">
                        {[
                          { label: 'Edit Hero Section', tab: 'hero' as TabId, icon: <Home size={18} />, desc: 'Update headline, images, stats' },
                          { label: 'Add New Project', tab: 'projects' as TabId, icon: <Plus size={18} />, desc: 'Upload project with images' },
                          { label: 'Manage FAQs', tab: 'faqs' as TabId, icon: <HelpCircle size={18} />, desc: 'Add or edit FAQ items' },
                          { label: 'View Inquiries', tab: 'inquiries' as TabId, icon: <Mail size={18} />, desc: 'See contact form messages' },
                          { label: 'SEO Settings', tab: 'contact' as TabId, icon: <Search size={18} />, desc: 'Update meta tags & SEO' },
                          { label: 'Backup Data', tab: 'data' as TabId, icon: <Download size={18} />, desc: 'Export all website data' },
                        ].map(a => (
                          <button
                            key={a.tab}
                            onClick={() => setActiveTab(a.tab)}
                            className="flex items-start gap-4 p-5 bg-[#0d0d0d] border border-[#1a1a1a] rounded-sm hover:border-primary/50 hover:bg-[#111] transition-all text-left group"
                          >
                            <div className="p-2 bg-primary/10 border border-primary/20 rounded-sm text-primary group-hover:bg-primary group-hover:text-black transition-colors shrink-0">
                              {a.icon}
                            </div>
                            <div>
                              <div className="text-sm font-black text-white">{a.label}</div>
                              <div className="text-[10px] text-zinc-600 mt-0.5">{a.desc}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* SQL Setup Box */}
                    <div className="border border-primary/20 bg-primary/5 rounded-sm p-6 space-y-4">
                      <div className="flex items-center gap-3">
                        <Database size={18} className="text-primary" />
                        <h4 className="font-black text-sm uppercase tracking-widest text-primary">Database Setup Required</h4>
                      </div>
                      <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-sm space-y-3">
                        <p className="text-xs text-red-300 font-bold leading-relaxed">⚠️ STEP 1: Run this Quick Fix SQL in Supabase SQL Editor</p>
                        <QuickFixSqlBox />
                        <p className="text-[10px] text-zinc-500">
                          <strong className="text-zinc-300">STEP 2:</strong> Go to Supabase → Settings → API → click <strong className="text-zinc-300">Reload Schema Cache</strong>
                        </p>
                      </div>
                      <p className="text-xs text-zinc-500 leading-relaxed">
                        Or run the complete setup SQL below to create all tables and columns:
                      </p>
                      <SqlSetupBox />
                    </div>
                  </div>
                )}

                {/* ──────── HERO & BRANDING ──────── */}
                {activeTab === 'hero' && (
                  <form onSubmit={handleSaveSettings} className="space-y-10">
                    <SectionHeader
                      icon={<Home size={20} />}
                      title="Hero & Branding"
                      subtitle="Control your website's main headline, logo, images, and brand identity."
                    />

                    {/* Company Identity */}
                    <div className="grid md:grid-cols-2 gap-6 p-6 bg-[#0d0d0d] border border-[#1a1a1a] rounded-sm">
                      <div className="md:col-span-2">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-4">🏢 Company Identity</h4>
                      </div>
                      <Field label="Company Name" required>
                        <input type="text" value={settingsForm.name || ''} onChange={e => setSettingsForm((p: any) => ({ ...p, name: e.target.value }))} className={inputCls} placeholder="FJ BAUSERVICE" />
                      </Field>

                      {/* ── Logo Upload + Scale ── */}
                      <div className="md:col-span-2 p-5 border border-[#222] rounded-sm bg-[#080808] space-y-5">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-primary">🖼️ Company Logo</span>
                          <span className="text-[10px] text-zinc-600 ml-1">— Upload from computer or paste URL</span>
                        </div>

                        {/* Preview + Upload row */}
                        <div className="flex flex-col sm:flex-row gap-5 items-start">
                          {/* Preview box */}
                          <div className="shrink-0 w-36 h-28 border-2 border-dashed border-[#333] rounded-sm flex items-center justify-center bg-[#0a0a0a] overflow-hidden relative group">
                            {settingsForm.logo_url ? (
                              <>
                                <img
                                  src={settingsForm.logo_url}
                                  alt="Logo preview"
                                  style={{ transform: `scale(${parseFloat(settingsForm.logo_scale || '1') || 1})`, transformOrigin: 'center', transition: 'transform 0.3s' }}
                                  className="max-w-full max-h-full object-contain"
                                />
                                <button
                                  type="button"
                                  onClick={() => setSettingsForm((p: any) => ({ ...p, logo_url: '' }))}
                                  className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </>
                            ) : (
                              <span className="text-zinc-700 text-[10px] font-bold uppercase tracking-wider text-center px-2">No logo<br/>yet</span>
                            )}
                          </div>

                          {/* Upload controls */}
                          <div className="flex-1 space-y-3">
                            {/* Browse button */}
                            <label className="cursor-pointer">
                              <div className="flex items-center gap-2 px-4 py-2.5 bg-primary text-black font-black text-[11px] uppercase tracking-widest rounded-sm hover:bg-white transition-colors w-fit">
                                {isUploading === 'logo_url' ? (
                                  <><Loader2 size={14} className="animate-spin" /> Uploading...</>
                                ) : (
                                  <><Upload size={14} /> Browse &amp; Upload Logo</>
                                )}
                              </div>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                disabled={!!isUploading}
                                onChange={async e => {
                                  const f = e.target.files?.[0];
                                  if (f) await uploadAndSetSettings('logo_url', f);
                                  e.target.value = '';
                                }}
                              />
                            </label>

                            {/* Or paste URL */}
                            <input
                              type="text"
                              value={settingsForm.logo_url || ''}
                              onChange={e => setSettingsForm((p: any) => ({ ...p, logo_url: e.target.value }))}
                              className={`${inputCls} text-xs`}
                              placeholder="Or paste logo URL here..."
                            />
                          </div>
                        </div>

                        {/* Scale Slider */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black uppercase tracking-widest text-primary">Logo Size Scale</label>
                            <span className="text-[11px] font-black text-white bg-primary/20 border border-primary/40 px-2 py-0.5 rounded-sm">
                              {parseFloat(settingsForm.logo_scale || '1').toFixed(1)}×
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0.5"
                            max="3"
                            step="0.1"
                            value={parseFloat(settingsForm.logo_scale || '1') || 1}
                            onChange={e => setSettingsForm((p: any) => ({ ...p, logo_scale: e.target.value }))}
                            className="w-full accent-primary cursor-pointer"
                          />
                          <div className="flex justify-between text-[9px] text-zinc-600 font-bold">
                            <span>0.5× (Small)</span>
                            <span>1.0× (Default)</span>
                            <span>2.0× (Large)</span>
                            <span>3.0× (XL)</span>
                          </div>
                          <p className="text-[10px] text-zinc-600 italic">Adjust the logo display size in the navbar and footer. Preview updates instantly above.</p>
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <BilingualInput
                          labelDe="Slogan (Deutsch)" labelEn="Slogan (English)"
                          valueDe={settingsForm.slogan_de || settingsForm.slogan || ''} valueEn={settingsForm.slogan_en || ''}
                          onChangeDe={v => setSettingsForm((p: any) => ({ ...p, slogan_de: v, slogan: v }))}
                          onChangeEn={v => setSettingsForm((p: any) => ({ ...p, slogan_en: v }))}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <BilingualInput
                          labelDe="Beschreibung (Deutsch)" labelEn="Description (English)"
                          valueDe={settingsForm.description_de || settingsForm.description || ''} valueEn={settingsForm.description_en || ''}
                          onChangeDe={v => setSettingsForm((p: any) => ({ ...p, description_de: v, description: v }))}
                          onChangeEn={v => setSettingsForm((p: any) => ({ ...p, description_en: v }))}
                          textarea rows={3}
                        />
                      </div>
                    </div>

                    {/* Hero Section */}
                    <div className="p-6 bg-[#0d0d0d] border border-[#1a1a1a] rounded-sm space-y-6">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">🦸 Hero Section Text</h4>
                      <div className="grid md:grid-cols-2 gap-6">
                        <BilingualInput
                          labelDe="Hero Überschrift (DE)" labelEn="Hero Headline (EN)"
                          valueDe={settingsForm.hero_heading_de || ''} valueEn={settingsForm.hero_heading_en || ''}
                          onChangeDe={v => setSettingsForm((p: any) => ({ ...p, hero_heading_de: v }))}
                          onChangeEn={v => setSettingsForm((p: any) => ({ ...p, hero_heading_en: v }))}
                        />
                        <BilingualInput
                          labelDe="Hero Untertitel (DE)" labelEn="Hero Subtext (EN)"
                          valueDe={settingsForm.hero_subtext_de || ''} valueEn={settingsForm.hero_subtext_en || ''}
                          onChangeDe={v => setSettingsForm((p: any) => ({ ...p, hero_subtext_de: v }))}
                          onChangeEn={v => setSettingsForm((p: any) => ({ ...p, hero_subtext_en: v }))}
                          textarea rows={2}
                        />
                        <Field label="Hero Button Text (DE)">
                          <input type="text" value={settingsForm.hero_button_de || ''} onChange={e => setSettingsForm((p: any) => ({ ...p, hero_button_de: e.target.value }))} className={inputCls} placeholder="Angebot anfordern" />
                        </Field>
                        <Field label="Hero Button Text (EN)">
                          <input type="text" value={settingsForm.hero_button_en || ''} onChange={e => setSettingsForm((p: any) => ({ ...p, hero_button_en: e.target.value }))} className={inputCls} placeholder="Request Quote" />
                        </Field>
                      </div>
                    </div>

                    {/* Statistics */}
                    <div className="p-6 bg-[#0d0d0d] border border-[#1a1a1a] rounded-sm space-y-6">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">📊 Hero Statistics</h4>
                      <div className="grid md:grid-cols-2 gap-6">
                        <Field label="Years of Experience" hint="e.g. 15+">
                          <input type="text" value={settingsForm.stats_years || ''} onChange={e => setSettingsForm((p: any) => ({ ...p, stats_years: e.target.value }))} className={inputCls} placeholder="15+" />
                        </Field>
                        <Field label="Completed Projects" hint="e.g. 500+">
                          <input type="text" value={settingsForm.stats_projects || ''} onChange={e => setSettingsForm((p: any) => ({ ...p, stats_projects: e.target.value }))} className={inputCls} placeholder="500+" />
                        </Field>
                        <Field label="Stat Label 1 (DE)">
                          <input type="text" value={settingsForm.stat_label_1_de || ''} onChange={e => setSettingsForm((p: any) => ({ ...p, stat_label_1_de: e.target.value }))} className={inputCls} placeholder="Jahre Facherfahrung" />
                        </Field>
                        <Field label="Stat Label 2 (DE)">
                          <input type="text" value={settingsForm.stat_label_2_de || ''} onChange={e => setSettingsForm((p: any) => ({ ...p, stat_label_2_de: e.target.value }))} className={inputCls} placeholder="Referenzprojekte" />
                        </Field>
                      </div>
                    </div>

                    {/* Images */}
                    <div className="p-6 bg-[#0d0d0d] border border-[#1a1a1a] rounded-sm space-y-6">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">🖼️ Website Images</h4>
                      <div className="grid md:grid-cols-2 gap-8">
                        {[
                          { id: 'about_image_url', label: 'About Us Image' },
                          { id: 'cta_image_url', label: 'CTA Background Image' },
                          { id: 'contact_image_url', label: 'Contact Section Image' },
                          { id: 'footer_image_url', label: 'Footer Image' },
                        ].map(img => (
                          <ImageUploadField
                            key={img.id}
                            label={img.label}
                            fieldKey={img.id}
                            value={settingsForm[img.id] || ''}
                            isUploading={isUploading}
                            onUpload={uploadAndSetSettings}
                            onChange={v => setSettingsForm((p: any) => ({ ...p, [img.id]: v }))}
                          />
                        ))}
                      </div>
                    </div>

                    {/* CTA Section Text */}
                    <div className="p-6 bg-[#0d0d0d] border border-[#1a1a1a] rounded-sm space-y-6">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">📣 CTA Section</h4>
                      <div className="grid md:grid-cols-2 gap-6">
                        <BilingualInput
                          labelDe="CTA Titel (DE)" labelEn="CTA Title (EN)"
                          valueDe={settingsForm.cta_title_de || ''} valueEn={settingsForm.cta_title_en || ''}
                          onChangeDe={v => setSettingsForm((p: any) => ({ ...p, cta_title_de: v }))}
                          onChangeEn={v => setSettingsForm((p: any) => ({ ...p, cta_title_en: v }))}
                        />
                        <BilingualInput
                          labelDe="CTA Untertitel (DE)" labelEn="CTA Subtitle (EN)"
                          valueDe={settingsForm.cta_subtitle_de || ''} valueEn={settingsForm.cta_subtitle_en || ''}
                          onChangeDe={v => setSettingsForm((p: any) => ({ ...p, cta_subtitle_de: v }))}
                          onChangeEn={v => setSettingsForm((p: any) => ({ ...p, cta_subtitle_en: v }))}
                          textarea rows={2}
                        />
                        <Field label="CTA Button Text (DE)">
                          <input type="text" value={settingsForm.cta_button_de || ''} onChange={e => setSettingsForm((p: any) => ({ ...p, cta_button_de: e.target.value }))} className={inputCls} placeholder="Jetzt Angebot anfordern" />
                        </Field>
                        <Field label="CTA Button Text (EN)">
                          <input type="text" value={settingsForm.cta_button_en || ''} onChange={e => setSettingsForm((p: any) => ({ ...p, cta_button_en: e.target.value }))} className={inputCls} placeholder="Request Quote Now" />
                        </Field>
                      </div>
                    </div>

                    <SaveButton isSaving={isSaving} isUploading={!!isUploading} saveState={saveState} />
                  </form>
                )}

                {/* ──────── SERVICES ──────── */}
                {activeTab === 'services' && (
                  <div className="space-y-10">
                    <SectionHeader
                      icon={<Zap size={20} />}
                      title="Services Management"
                      subtitle="Add, edit, or remove the services displayed on your website."
                    />

                    <form onSubmit={handleSaveService} className="p-6 bg-[#0d0d0d] border border-[#1a1a1a] rounded-sm space-y-6">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">
                        {editingService ? '✏️ Edit Service' : '➕ New Service'}
                      </h4>
                      <div className="grid md:grid-cols-2 gap-6">
                        <BilingualInput
                          labelDe="Service-Titel (DE)" labelEn="Service Title (EN)"
                          valueDe={serviceForm.title_de || serviceForm.title || ''} valueEn={serviceForm.title_en || ''}
                          onChangeDe={v => setServiceForm(p => ({ ...p, title_de: v, title: v }))}
                          onChangeEn={v => setServiceForm(p => ({ ...p, title_en: v }))}
                          required
                        />
                        <Field label="Icon Name" hint="Hammer, Drill, Building2, Truck, Construction, Zap, ShieldCheck, Star, Award">
                          <div className="flex gap-2">
                            <select
                              value={serviceForm.icon_name || 'Hammer'}
                              onChange={e => setServiceForm(p => ({ ...p, icon_name: e.target.value }))}
                              className={inputCls}
                            >
                              {['Hammer', 'Drill', 'Building2', 'Truck', 'Construction', 'Zap', 'ShieldCheck', 'Clock', 'Star', 'Award'].map(ic => (
                                <option key={ic} value={ic}>{iconMap[ic] || '🔧'} {ic}</option>
                              ))}
                            </select>
                          </div>
                        </Field>
                        <div className="md:col-span-2">
                          <BilingualInput
                            labelDe="Beschreibung (DE)" labelEn="Description (EN)"
                            valueDe={serviceForm.description_de || serviceForm.description || ''} valueEn={serviceForm.description_en || ''}
                            onChangeDe={v => setServiceForm(p => ({ ...p, description_de: v, description: v }))}
                            onChangeEn={v => setServiceForm(p => ({ ...p, description_en: v }))}
                            textarea rows={4}
                          />
                        </div>
                        <Field label="Sort Order" hint="Lower numbers appear first">
                          <input type="number" value={serviceForm.sort_order || 0} onChange={e => setServiceForm(p => ({ ...p, sort_order: parseInt(e.target.value) }))} className={inputCls} />
                        </Field>
                      </div>
                      <div className="flex gap-3 items-center">
                        <button type="submit" disabled={isSaving} className={`button-primary disabled:opacity-50 transition-all ${
                          crudSaveState === 'saved' ? 'border-green-500/50' : crudSaveState === 'error' ? 'border-red-500/50' : ''
                        }`}>
                          {crudSaveState === 'saving' ? <Loader2 size={16} className="animate-spin" /> :
                           crudSaveState === 'saved' ? <CheckCircle2 size={16} className="text-green-400" /> :
                           crudSaveState === 'error' ? <AlertCircle size={16} className="text-red-400" /> :
                           (editingService ? <Save size={16} /> : <Plus size={16} />)}
                          {crudSaveState === 'saving' ? 'Saving...' : crudSaveState === 'saved' ? 'Saved!' : crudSaveState === 'error' ? 'Failed — Retry' : (editingService ? 'Update Service' : 'Add Service')}
                        </button>
                        {editingService && (
                          <button type="button" onClick={() => { setEditingService(null); setServiceForm(blankService); }} className="px-5 py-3 border border-[#333] text-zinc-400 hover:text-white rounded-sm text-sm font-bold uppercase tracking-widest">
                            Cancel
                          </button>
                        )}
                      </div>
                    </form>

                    {/* Services List */}
                    <div className="space-y-3">
                      {services.length === 0 ? (
                        <EmptyState label="No services yet. Add your first service above." />
                      ) : services.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)).map(svc => (
                        <div key={svc.id} className="flex items-center gap-4 p-4 bg-[#0d0d0d] border border-[#1a1a1a] rounded-sm group hover:border-[#333] transition-colors">
                          <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-sm flex items-center justify-center text-lg shrink-0">
                            {iconMap[svc.icon_name] || '🔧'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="font-black text-sm text-white">{svc.title_de || svc.title}</h5>
                            <p className="text-[11px] text-zinc-500 truncate mt-0.5">{svc.description_de || svc.description}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button onClick={() => { setEditingService(svc); const c: any = {}; Object.keys(svc).forEach(k => { c[k] = svc[k] ?? ''; }); setServiceForm(c); }}
                              className="p-2 text-zinc-500 hover:text-primary rounded-sm hover:bg-[#111] transition-colors">
                              <Pencil size={16} />
                            </button>
                            <button onClick={() => deleteService(svc.id)} className="p-2 text-zinc-500 hover:text-red-500 rounded-sm hover:bg-[#111] transition-colors">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ──────── PROJECTS ──────── */}
                {activeTab === 'projects' && (
                  <div className="space-y-10">
                    <SectionHeader
                      icon={<Briefcase size={20} />}
                      title="Project Management"
                      subtitle="Manage your project portfolio with images, titles, and categories."
                    />

                    <form onSubmit={handleSaveProject} className="p-6 bg-[#0d0d0d] border border-[#1a1a1a] rounded-sm space-y-6">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">
                        {editingProject ? '✏️ Edit Project' : '➕ New Project'}
                      </h4>
                      <div className="grid md:grid-cols-2 gap-6">
                        <BilingualInput
                          labelDe="Projekt-Titel (DE)" labelEn="Project Title (EN)"
                          valueDe={projectForm.title_de || projectForm.title || ''} valueEn={projectForm.title_en || ''}
                          onChangeDe={v => setProjectForm(p => ({ ...p, title_de: v, title: v }))}
                          onChangeEn={v => setProjectForm(p => ({ ...p, title_en: v }))}
                          required
                        />
                        <BilingualInput
                          labelDe="Kategorie (DE)" labelEn="Category (EN)"
                          valueDe={projectForm.category_de || projectForm.category || ''} valueEn={projectForm.category_en || ''}
                          onChangeDe={v => setProjectForm(p => ({ ...p, category_de: v, category: v }))}
                          onChangeEn={v => setProjectForm(p => ({ ...p, category_en: v }))}
                          required
                        />
                        <div className="md:col-span-2">
                          <BilingualInput
                            labelDe="Beschreibung (DE)" labelEn="Description (EN)"
                            valueDe={projectForm.description_de || projectForm.description || ''} valueEn={projectForm.description_en || ''}
                            onChangeDe={v => setProjectForm(p => ({ ...p, description_de: v, description: v }))}
                            onChangeEn={v => setProjectForm(p => ({ ...p, description_en: v }))}
                            textarea rows={3}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <ImageUploadField
                            label="Project Image"
                            fieldKey="project_image"
                            value={projectForm.image_url}
                            isUploading={isUploading}
                            onUpload={async (field, file) => {
                              const url = await handleImageUpload(field, file);
                              if (url) setProjectForm(p => ({ ...p, image_url: url }));
                            }}
                            onChange={v => setProjectForm(p => ({ ...p, image_url: v }))}
                          />
                        </div>
                      </div>
                      <div className="flex gap-3 items-center">
                        <button type="submit" disabled={isSaving || !!isUploading} className={`button-primary disabled:opacity-50 transition-all ${
                          crudSaveState === 'saved' ? 'border-green-500/50' : crudSaveState === 'error' ? 'border-red-500/50' : ''
                        }`}>
                          {crudSaveState === 'saving' ? <Loader2 size={16} className="animate-spin" /> :
                           crudSaveState === 'saved' ? <CheckCircle2 size={16} className="text-green-400" /> :
                           crudSaveState === 'error' ? <AlertCircle size={16} className="text-red-400" /> :
                           (editingProject ? <Save size={16} /> : <Plus size={16} />)}
                          {crudSaveState === 'saving' ? 'Saving...' : crudSaveState === 'saved' ? 'Saved!' : crudSaveState === 'error' ? 'Failed — Retry' : (editingProject ? 'Update Project' : 'Add Project')}
                        </button>
                        {editingProject && (
                          <button type="button" onClick={() => { setEditingProject(null); setProjectForm(blankProject); }} className="px-5 py-3 border border-[#333] text-zinc-400 hover:text-white rounded-sm text-sm font-bold uppercase tracking-widest">
                            Cancel
                          </button>
                        )}
                      </div>
                    </form>

                    {/* Projects Grid */}
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {projects.length === 0 ? (
                        <div className="sm:col-span-2 lg:col-span-3">
                          <EmptyState label="No projects yet. Add your first project above." />
                        </div>
                      ) : projects.map(project => (
                        <div key={project.id} className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-sm overflow-hidden group hover:border-[#333] transition-colors">
                          <div className="relative aspect-video">
                            <img src={project.image_url} alt="" className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => {
                                  setEditingProject(project);
                                  const c: any = {};
                                  Object.keys(project).forEach(k => { c[k] = project[k] ?? ''; });
                                  setProjectForm(c);
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="p-2 bg-primary text-black rounded-sm hover:bg-white transition-colors"
                              >
                                <Pencil size={14} />
                              </button>
                              <button onClick={() => deleteProject(project)} className="p-2 bg-red-600 text-white rounded-sm hover:bg-red-500 transition-colors">
                                <Trash2 size={14} />
                              </button>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 p-3">
                              <p className="text-[10px] font-black uppercase tracking-widest text-primary">{project.category_de || project.category}</p>
                              <h5 className="font-black text-sm text-white mt-0.5 truncate">{project.title_de || project.title}</h5>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ──────── FAQS ──────── */}
                {activeTab === 'faqs' && (
                  <div className="space-y-10">
                    <SectionHeader
                      icon={<HelpCircle size={20} />}
                      title="FAQ Management"
                      subtitle="Manage frequently asked questions shown on your website."
                    />

                    <form onSubmit={handleSaveFaq} className="p-6 bg-[#0d0d0d] border border-[#1a1a1a] rounded-sm space-y-6">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">
                        {editingFaq ? '✏️ Edit FAQ' : '➕ New FAQ'}
                      </h4>
                      <div className="space-y-6">
                        <BilingualInput
                          labelDe="Frage (Deutsch)" labelEn="Question (English)"
                          valueDe={faqForm.question_de || faqForm.question || ''} valueEn={faqForm.question_en || ''}
                          onChangeDe={v => setFaqForm(p => ({ ...p, question_de: v, question: v }))}
                          onChangeEn={v => setFaqForm(p => ({ ...p, question_en: v }))}
                          required
                        />
                        <BilingualInput
                          labelDe="Antwort (Deutsch)" labelEn="Answer (English)"
                          valueDe={faqForm.answer_de || faqForm.answer || ''} valueEn={faqForm.answer_en || ''}
                          onChangeDe={v => setFaqForm(p => ({ ...p, answer_de: v, answer: v }))}
                          onChangeEn={v => setFaqForm(p => ({ ...p, answer_en: v }))}
                          textarea rows={4}
                        />
                        <Field label="Sort Order">
                          <input type="number" value={faqForm.sort_order || 0} onChange={e => setFaqForm(p => ({ ...p, sort_order: parseInt(e.target.value) }))} className={inputCls} />
                        </Field>
                      </div>
                      <div className="flex gap-3 items-center">
                        <button type="submit" disabled={isSaving} className={`button-primary disabled:opacity-50 transition-all ${
                          crudSaveState === 'saved' ? 'border-green-500/50' : crudSaveState === 'error' ? 'border-red-500/50' : ''
                        }`}>
                          {crudSaveState === 'saving' ? <Loader2 size={16} className="animate-spin" /> :
                           crudSaveState === 'saved' ? <CheckCircle2 size={16} className="text-green-400" /> :
                           crudSaveState === 'error' ? <AlertCircle size={16} className="text-red-400" /> :
                           (editingFaq ? <Save size={16} /> : <Plus size={16} />)}
                          {crudSaveState === 'saving' ? 'Saving...' : crudSaveState === 'saved' ? 'Saved!' : crudSaveState === 'error' ? 'Failed — Retry' : (editingFaq ? 'Update FAQ' : 'Add FAQ')}
                        </button>
                        {editingFaq && (
                          <button type="button" onClick={() => { setEditingFaq(null); setFaqForm(blankFaq); }} className="px-5 py-3 border border-[#333] text-zinc-400 hover:text-white rounded-sm text-sm font-bold uppercase tracking-widest">
                            Cancel
                          </button>
                        )}
                      </div>
                    </form>

                    <div className="space-y-3">
                      {faqs.length === 0 ? (
                        <EmptyState label="No FAQs yet. Add your first FAQ above." />
                      ) : faqs.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)).map((faq, idx) => (
                        <div key={faq.id} className="p-5 bg-[#0d0d0d] border border-[#1a1a1a] rounded-sm group hover:border-[#333] transition-colors">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-[10px] font-black bg-primary/10 text-primary px-2 py-1 rounded-sm">#{idx + 1}</span>
                                <h5 className="font-black text-sm text-white">{faq.question_de || faq.question}</h5>
                              </div>
                              <p className="text-xs text-zinc-500 leading-relaxed">{faq.answer_de || faq.answer}</p>
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <button onClick={() => { setEditingFaq(faq); const c: any = {}; Object.keys(faq).forEach(k => { c[k] = faq[k] ?? ''; }); setFaqForm(c); }}
                                className="p-2 text-zinc-500 hover:text-primary rounded-sm hover:bg-[#111] transition-colors">
                                <Pencil size={15} />
                              </button>
                              <button onClick={() => deleteFaq(faq.id)} className="p-2 text-zinc-500 hover:text-red-500 rounded-sm hover:bg-[#111] transition-colors">
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ──────── TESTIMONIALS ──────── */}
                {activeTab === 'testimonials' && (
                  <div className="space-y-10">
                    <SectionHeader
                      icon={<Star size={20} />}
                      title="Testimonials"
                      subtitle="Manage customer reviews and testimonials."
                    />

                    <form onSubmit={handleSaveTestimonial} className="p-6 bg-[#0d0d0d] border border-[#1a1a1a] rounded-sm space-y-6">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">
                        {editingTestimonial ? '✏️ Edit Testimonial' : '➕ New Testimonial'}
                      </h4>
                      <div className="grid md:grid-cols-2 gap-6">
                        <Field label="Author Name" required>
                          <input type="text" value={testimonialForm.author || ''} onChange={e => setTestimonialForm((p: any) => ({ ...p, author: e.target.value }))} className={inputCls} placeholder="Max Mustermann" />
                        </Field>
                        <Field label="Company / Role">
                          <input type="text" value={testimonialForm.company || ''} onChange={e => setTestimonialForm((p: any) => ({ ...p, company: e.target.value }))} className={inputCls} placeholder="Bauunternehmen GmbH" />
                        </Field>
                        <Field label="Rating (1-5)">
                          <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map(n => (
                              <button key={n} type="button"
                                onClick={() => setTestimonialForm((p: any) => ({ ...p, rating: n }))}
                                className={`p-2 rounded-sm transition-colors ${(testimonialForm.rating || 5) >= n ? 'text-primary' : 'text-zinc-600'} hover:text-primary`}>
                                <Star size={20} fill={(testimonialForm.rating || 5) >= n ? 'currentColor' : 'none'} />
                              </button>
                            ))}
                          </div>
                        </Field>
                        <div className="md:col-span-2">
                          <BilingualInput
                            labelDe="Bewertungstext (DE)" labelEn="Review Text (EN)"
                            valueDe={testimonialForm.text_de || testimonialForm.text || ''} valueEn={testimonialForm.text_en || ''}
                            onChangeDe={v => setTestimonialForm((p: any) => ({ ...p, text_de: v, text: v }))}
                            onChangeEn={v => setTestimonialForm((p: any) => ({ ...p, text_en: v }))}
                            textarea rows={3}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <ImageUploadField
                            label="Author Avatar (optional)"
                            fieldKey="testimonial_avatar"
                            value={testimonialForm.avatar_url || ''}
                            isUploading={isUploading}
                            onUpload={async (field, file) => {
                              const url = await handleImageUpload(field, file);
                              if (url) setTestimonialForm((p: any) => ({ ...p, avatar_url: url }));
                            }}
                            onChange={v => setTestimonialForm((p: any) => ({ ...p, avatar_url: v }))}
                          />
                        </div>
                      </div>
                      <div className="flex gap-3 items-center">
                        <button type="submit" disabled={isSaving} className={`button-primary disabled:opacity-50 transition-all ${
                          crudSaveState === 'saved' ? 'border-green-500/50' : crudSaveState === 'error' ? 'border-red-500/50' : ''
                        }`}>
                          {crudSaveState === 'saving' ? <Loader2 size={16} className="animate-spin" /> :
                           crudSaveState === 'saved' ? <CheckCircle2 size={16} className="text-green-400" /> :
                           crudSaveState === 'error' ? <AlertCircle size={16} className="text-red-400" /> :
                           (editingTestimonial ? <Save size={16} /> : <Plus size={16} />)}
                          {crudSaveState === 'saving' ? 'Saving...' : crudSaveState === 'saved' ? 'Saved!' : crudSaveState === 'error' ? 'Failed — Retry' : (editingTestimonial ? 'Update Testimonial' : 'Add Testimonial')}
                        </button>
                        {editingTestimonial && (
                          <button type="button" onClick={() => { setEditingTestimonial(null); setTestimonialForm(blankTestimonial); }} className="px-5 py-3 border border-[#333] text-zinc-400 hover:text-white rounded-sm text-sm font-bold uppercase tracking-widest">
                            Cancel
                          </button>
                        )}
                      </div>
                    </form>

                    <div className="grid md:grid-cols-2 gap-4">
                      {testimonials.length === 0 ? (
                        <div className="md:col-span-2">
                          <EmptyState label="No testimonials yet. Add your first one above." />
                        </div>
                      ) : testimonials.map(t => (
                        <div key={t.id} className="p-5 bg-[#0d0d0d] border border-[#1a1a1a] rounded-sm group hover:border-[#333] transition-colors">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              {t.avatar_url ? (
                                <img src={t.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover border border-[#333]" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-black text-sm">
                                  {(t.author || '?')[0]}
                                </div>
                              )}
                              <div>
                                <div className="font-black text-sm text-white">{t.author}</div>
                                <div className="text-[10px] text-zinc-500">{t.company}</div>
                              </div>
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <button onClick={() => {
                                setEditingTestimonial(t);
                                const c: any = {}; Object.keys(t).forEach(k => { c[k] = t[k] ?? ''; });
                                setTestimonialForm(c);
                              }}
                                className="p-2 text-zinc-500 hover:text-primary rounded-sm hover:bg-[#111] transition-colors"><Pencil size={15} /></button>
                              <button onClick={() => deleteTestimonial(t.id)} className="p-2 text-zinc-500 hover:text-red-500 rounded-sm hover:bg-[#111] transition-colors"><Trash2 size={15} /></button>
                            </div>
                          </div>
                          <div className="flex gap-1 mt-3">
                            {[1,2,3,4,5].map(n => <Star key={n} size={13} className={n <= (t.rating || 5) ? 'text-primary fill-primary' : 'text-zinc-700'} />)}
                          </div>
                          <p className="text-xs text-zinc-400 mt-2 leading-relaxed italic">&ldquo;{t.text_de || t.text}&rdquo;</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ──────── CONTACT & SEO ──────── */}
                {activeTab === 'contact' && (
                  <form onSubmit={handleSaveSettings} className="space-y-10">
                    <SectionHeader
                      icon={<Globe size={20} />}
                      title="Contact & SEO Settings"
                      subtitle="Update contact details, social links, and search engine optimization settings."
                    />

                    {/* Contact Details */}
                    <div className="p-6 bg-[#0d0d0d] border border-[#1a1a1a] rounded-sm space-y-6">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">📞 Contact Information</h4>
                      <div className="grid md:grid-cols-2 gap-6">
                        <Field label="Phone Number">
                          <input type="tel" value={settingsForm.phone || ''} onChange={e => setSettingsForm((p: any) => ({ ...p, phone: e.target.value }))} className={inputCls} placeholder="+49 159 06142923" />
                        </Field>
                        <Field label="Email Address">
                          <input type="email" value={settingsForm.email || ''} onChange={e => setSettingsForm((p: any) => ({ ...p, email: e.target.value }))} className={inputCls} placeholder="info@company.de" />
                        </Field>
                        <Field label="WhatsApp Number" hint="Include country code e.g. 4915906142923">
                          <input type="text" value={settingsForm.whatsapp_number || ''} onChange={e => setSettingsForm((p: any) => ({ ...p, whatsapp_number: e.target.value }))} className={inputCls} placeholder="4915906142923" />
                        </Field>
                        <div className="space-y-2">
                          <BilingualInput
                            labelDe="Adresse (DE)" labelEn="Address (EN)"
                            valueDe={settingsForm.address_de || settingsForm.address || ''} valueEn={settingsForm.address_en || ''}
                            onChangeDe={v => setSettingsForm((p: any) => ({ ...p, address_de: v, address: v }))}
                            onChangeEn={v => setSettingsForm((p: any) => ({ ...p, address_en: v }))}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Field label="Google Maps URL / Embed Code" hint="Go to Google Maps → Share → Embed map. Paste the URL or entire <iframe> tag here.">
                            <textarea rows={3} value={settingsForm.google_maps_url || ''} onChange={e => setSettingsForm((p: any) => ({ ...p, google_maps_url: e.target.value }))} className={textareaCls} placeholder="https://www.google.com/maps/embed?..." />
                          </Field>
                        </div>
                      </div>
                    </div>

                    {/* Social Media */}
                    <div className="p-6 bg-[#0d0d0d] border border-[#1a1a1a] rounded-sm space-y-6">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">📱 Social Media Links</h4>
                      <div className="grid md:grid-cols-2 gap-6">
                        {[
                          { id: 'facebook_url', label: 'Facebook URL', ph: 'https://facebook.com/...' },
                          { id: 'instagram_url', label: 'Instagram URL', ph: 'https://instagram.com/...' },
                          { id: 'linkedin_url', label: 'LinkedIn URL', ph: 'https://linkedin.com/...' },
                          { id: 'tiktok_url', label: 'TikTok URL', ph: 'https://tiktok.com/@...' },
                        ].map(s => (
                          <Field key={s.id} label={s.label}>
                            <input type="url" value={settingsForm[s.id] || ''} onChange={e => setSettingsForm((p: any) => ({ ...p, [s.id]: e.target.value }))} className={inputCls} placeholder={s.ph} />
                          </Field>
                        ))}
                      </div>
                    </div>

                    {/* SEO Metadata */}
                    <div className="p-6 bg-[#0d0d0d] border border-[#1a1a1a] rounded-sm space-y-6">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">🔍 SEO Metadata</h4>
                      <div className="space-y-6">
                        <BilingualInput
                          labelDe="Meta-Titel (DE)" labelEn="Meta Title (EN)"
                          valueDe={settingsForm.seo_title_de || ''} valueEn={settingsForm.seo_title_en || ''}
                          onChangeDe={v => setSettingsForm((p: any) => ({ ...p, seo_title_de: v }))}
                          onChangeEn={v => setSettingsForm((p: any) => ({ ...p, seo_title_en: v }))}
                        />
                        <BilingualInput
                          labelDe="Meta-Beschreibung (DE)" labelEn="Meta Description (EN)"
                          valueDe={settingsForm.seo_description_de || ''} valueEn={settingsForm.seo_description_en || ''}
                          onChangeDe={v => setSettingsForm((p: any) => ({ ...p, seo_description_de: v }))}
                          onChangeEn={v => setSettingsForm((p: any) => ({ ...p, seo_description_en: v }))}
                          textarea rows={3}
                        />
                        <Field label="Keywords (comma separated)" hint="e.g. Abbruch München, Kernbohrung, Entkernung">
                          <input type="text" value={settingsForm.seo_keywords || ''} onChange={e => setSettingsForm((p: any) => ({ ...p, seo_keywords: e.target.value }))} className={inputCls} />
                        </Field>
                        <Field label="OG Image URL" hint="Image shown when sharing on social media (recommended: 1200×630px)">
                          <input type="url" value={settingsForm.og_image_url || ''} onChange={e => setSettingsForm((p: any) => ({ ...p, og_image_url: e.target.value }))} className={inputCls} placeholder="https://..." />
                        </Field>
                      </div>
                    </div>

                    {/* Opening Hours */}
                    <div className="p-6 bg-[#0d0d0d] border border-[#1a1a1a] rounded-sm space-y-6">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">🕐 Opening Hours</h4>
                      <div className="grid md:grid-cols-2 gap-6">
                        <Field label="Weekdays (Mon–Fri)">
                          <input type="text" value={settingsForm.hours_weekdays || ''} onChange={e => setSettingsForm((p: any) => ({ ...p, hours_weekdays: e.target.value }))} className={inputCls} placeholder="Mo–Fr: 08:00–18:00" />
                        </Field>
                        <Field label="Saturday">
                          <input type="text" value={settingsForm.hours_saturday || ''} onChange={e => setSettingsForm((p: any) => ({ ...p, hours_saturday: e.target.value }))} className={inputCls} placeholder="Sa: 09:00–14:00" />
                        </Field>
                        <Field label="Sunday / Holiday">
                          <input type="text" value={settingsForm.hours_sunday || ''} onChange={e => setSettingsForm((p: any) => ({ ...p, hours_sunday: e.target.value }))} className={inputCls} placeholder="Geschlossen" />
                        </Field>
                      </div>
                    </div>

                    {/* Footer Settings */}
                    <div className="p-6 bg-[#0d0d0d] border border-[#1a1a1a] rounded-sm space-y-6">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">🦶 Footer Settings</h4>
                      <div className="space-y-4">
                        <Field label="Copyright Text" hint="Shown in the bottom bar of the footer. Use {year} to auto-insert the current year.">
                          <input
                            type="text"
                            value={settingsForm.footer_copyright || ''}
                            onChange={e => setSettingsForm((p: any) => ({ ...p, footer_copyright: e.target.value }))}
                            className={inputCls}
                            placeholder={`© ${new Date().getFullYear()} FJ BAUSERVICE. Alle Rechte vorbehalten.`}
                          />
                        </Field>
                        <Field label="WhatsApp Number" hint="Include country code, e.g. +49 159 06142923">
                          <input
                            type="text"
                            value={settingsForm.whatsapp_number || ''}
                            onChange={e => setSettingsForm((p: any) => ({ ...p, whatsapp_number: e.target.value }))}
                            className={inputCls}
                            placeholder="+49 159 06142923"
                          />
                        </Field>
                        <p className="text-[10px] text-zinc-600 italic leading-tight">
                          💡 Logo, company name, address, phone, email, social links are all editable above and reflected in the footer automatically.
                        </p>
                      </div>
                    </div>

                    <SaveButton isSaving={isSaving} isUploading={!!isUploading} saveState={saveState} />
                  </form>
                )}

                {/* ──────── MEDIA LIBRARY ──────── */}
                {activeTab === 'media' && (
                  <div className="space-y-8">
                    <SectionHeader
                      icon={<ImageIcon size={20} />}
                      title="Media Library"
                      subtitle="All uploaded images stored in Supabase Storage. Upload, copy URL, or delete files."
                    />

                    {/* Upload area */}
                    <div className="p-6 bg-[#0d0d0d] border border-[#1a1a1a] rounded-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">⬆️ Upload New File</h4>
                        <button
                          onClick={loadMediaFiles}
                          disabled={loadingMedia}
                          className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-zinc-500 hover:text-primary transition-colors"
                        >
                          <RefreshCw size={14} className={loadingMedia ? 'animate-spin' : ''} /> Refresh
                        </button>
                      </div>
                      <label className="cursor-pointer block">
                        <div className={`border-2 border-dashed rounded-sm p-8 text-center transition-all ${
                          isUploading === 'media_upload'
                            ? 'border-primary bg-primary/5'
                            : 'border-[#333] hover:border-primary hover:bg-primary/5'
                        }`}>
                          {isUploading === 'media_upload' ? (
                            <><Loader2 size={32} className="mx-auto animate-spin text-primary mb-3" />
                            <p className="text-sm font-black text-primary">Uploading to Supabase Storage...</p></>
                          ) : (
                            <><Upload size={32} className="mx-auto text-zinc-600 mb-3" />
                            <p className="text-sm font-black text-white">Click to upload or drag & drop</p>
                            <p className="text-xs text-zinc-600 mt-1">PNG, JPG, WebP, GIF, SVG — up to 10MB</p></>
                          )}
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={!!isUploading}
                          onChange={handleMediaUpload}
                        />
                      </label>
                    </div>

                    {/* Error state */}
                    {mediaError && (
                      <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-sm flex items-start gap-3">
                        <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-black text-red-400">Failed to load media files</p>
                          <p className="text-xs text-red-400/70 mt-1">{mediaError}</p>
                          <button onClick={loadMediaFiles} className="text-xs text-red-400 hover:text-white underline mt-2">Try again</button>
                        </div>
                      </div>
                    )}

                    {/* Loading state */}
                    {loadingMedia && (
                      <div className="flex justify-center py-16">
                        <div className="text-center">
                          <Loader2 className="animate-spin text-primary mx-auto mb-3" size={36} />
                          <p className="text-xs text-zinc-600 font-bold uppercase tracking-widest">Loading from Supabase Storage...</p>
                        </div>
                      </div>
                    )}

                    {/* Empty state */}
                    {!loadingMedia && !mediaError && mediaFiles.length === 0 && (
                      <div className="py-16 text-center border-2 border-dashed border-[#1a1a1a] rounded-sm">
                        <div className="text-5xl mb-4">🖼️</div>
                        <p className="text-xs font-black uppercase tracking-widest text-zinc-600">No files uploaded yet</p>
                        <p className="text-xs text-zinc-700 mt-2">Upload an image using the area above to get started.</p>
                      </div>
                    )}

                    {/* Media Grid */}
                    {!loadingMedia && mediaFiles.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xs text-zinc-500 font-bold">{mediaFiles.length} file{mediaFiles.length !== 1 ? 's' : ''} in storage</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                          {mediaFiles.map(file => (
                            <MediaCard
                              key={file.name}
                              file={file}
                              onDelete={handleDeleteMedia}
                              onCopy={(url) => { navigator.clipboard.writeText(url); addToast('info', 'URL copied to clipboard!'); }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ──────── INQUIRIES ──────── */}
                {activeTab === 'inquiries' && (
                  <div className="space-y-10">
                    <SectionHeader
                      icon={<Mail size={20} />}
                      title="Contact Inquiries"
                      subtitle="View and manage messages received through the contact form."
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500 font-bold">{inquiries.length} {inquiries.length === 1 ? 'inquiry' : 'inquiries'}</span>
                      <button onClick={fetchInquiries} className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-zinc-500 hover:text-primary transition-colors">
                        <RefreshCw size={14} /> Refresh
                      </button>
                    </div>
                    {loadingInquiries ? (
                      <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin text-primary" size={40} />
                      </div>
                    ) : inquiries.length === 0 ? (
                      <EmptyState label="No inquiries yet. They will appear here when customers contact you." />
                    ) : (
                      <div className="space-y-4">
                        {inquiries.map(inq => (
                          <div key={inq.id} className="p-6 bg-[#0d0d0d] border border-[#1a1a1a] rounded-sm group hover:border-[#333] transition-colors relative">
                            <button
                              onClick={() => deleteInquiry(inq.id)}
                              className="absolute top-5 right-5 p-2 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-sm transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 size={15} />
                            </button>
                            <div className="flex flex-wrap gap-3 items-center mb-4">
                              <span className="text-primary font-black text-sm">{inq.name}</span>
                              <span className="text-zinc-600 text-xs">•</span>
                              <a href={`mailto:${inq.email}`} className="text-zinc-400 text-xs hover:text-primary transition-colors">{inq.email}</a>
                              <span className="text-zinc-600 text-xs">•</span>
                              <span className="text-zinc-600 text-[10px]">
                                {new Date(inq.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            {inq.subject && <h5 className="font-black text-sm text-white mb-2">{inq.subject}</h5>}
                            <p className="text-sm text-zinc-400 leading-relaxed">{inq.message}</p>
                            <div className="flex gap-3 mt-4">
                              <a href={`mailto:${inq.email}?subject=Re: ${inq.subject || 'Ihre Anfrage'}`}
                                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:text-white border border-primary/30 hover:border-white px-3 py-2 rounded-sm transition-colors">
                                <Mail size={12} /> Reply
                              </a>
                              {inq.email && (
                                <button
                                  onClick={() => { navigator.clipboard.writeText(inq.email); addToast('info', 'Email copied!'); }}
                                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white border border-[#222] hover:border-[#444] px-3 py-2 rounded-sm transition-colors">
                                  <Copy size={12} /> Copy Email
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ──────── DATA & BACKUP ──────── */}
                {activeTab === 'data' && (
                  <div className="space-y-10">
                    <SectionHeader
                      icon={<Database size={20} />}
                      title="Data & Backup"
                      subtitle="Export or import all website data. Keep regular backups to protect your content."
                    />

                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Export */}
                      <div className="p-6 bg-[#0d0d0d] border border-[#1a1a1a] rounded-sm space-y-5">
                        <div className="w-12 h-12 bg-green-500/10 border border-green-500/20 rounded-sm flex items-center justify-center">
                          <Download size={22} className="text-green-400" />
                        </div>
                        <div>
                          <h4 className="font-black text-white">Create Backup</h4>
                          <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                            Exports all projects, services, FAQs, testimonials, site settings, and inquiries into a JSON file.
                          </p>
                        </div>
                        <button onClick={handleExport} disabled={isSaving} className="button-primary w-full justify-center disabled:opacity-50">
                          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                          Download Backup
                        </button>
                      </div>

                      {/* Import */}
                      <div className="p-6 bg-[#0d0d0d] border border-red-500/20 rounded-sm space-y-5">
                        <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-sm flex items-center justify-center">
                          <Upload size={22} className="text-red-400" />
                        </div>
                        <div>
                          <h4 className="font-black text-white">Restore Backup</h4>
                          <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                            Upload a backup JSON file to restore your data. <strong className="text-red-400">This overwrites current data.</strong>
                          </p>
                        </div>
                        <label className="cursor-pointer">
                          <div className="flex items-center justify-center gap-2 w-full bg-[#111] border border-[#333] text-zinc-400 hover:text-white hover:border-red-500/50 font-black py-4 px-8 uppercase tracking-widest text-sm transition-all rounded-sm">
                            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                            Select Backup File
                          </div>
                          <input type="file" accept=".json" onChange={handleImport} disabled={isSaving} className="hidden" />
                        </label>
                      </div>
                    </div>

                    {/* SQL Setup */}
                    <div className="border border-primary/20 bg-primary/5 rounded-sm p-6 space-y-4">
                      <div className="flex items-center gap-3">
                        <Database size={18} className="text-primary" />
                        <h4 className="font-black text-sm uppercase tracking-widest text-primary">Database Migration SQL</h4>
                      </div>
                      <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-sm space-y-3">
                        <p className="text-xs text-red-300 font-bold leading-relaxed">⚠️ STEP 1: Run this Quick Fix SQL in Supabase SQL Editor</p>
                        <QuickFixSqlBox />
                        <p className="text-[10px] text-zinc-500">
                          <strong className="text-zinc-300">STEP 2:</strong> Go to Supabase → Settings → API → click <strong className="text-zinc-300">Reload Schema Cache</strong>
                        </p>
                      </div>
                      <p className="text-xs text-zinc-500 leading-relaxed">
                        Or run the complete SQL below to create all tables and columns from scratch:
                      </p>
                      <SqlSetupBox />
                    </div>

                    {/* Guidelines */}
                    <div className="p-6 bg-[#0d0d0d] border border-[#1a1a1a] rounded-sm">
                      <h5 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4">Backup Guidelines</h5>
                      <ul className="text-xs text-zinc-500 space-y-2 list-disc pl-4 leading-relaxed">
                        <li>Backups include settings, projects, services, FAQs, testimonials, and inquiries.</li>
                        <li>Image files are not backed up — only their URLs are stored.</li>
                        <li>Always create a backup before restoring from a file.</li>
                        <li>Restore will delete all existing records before importing.</li>
                      </ul>
                    </div>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </motion.div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </>
  );
}

// ─── Save Button ──────────────────────────────────────────────────────────────
function SaveButton({ isSaving, isUploading, saveState }: { isSaving: boolean; isUploading: boolean; saveState?: 'idle' | 'saving' | 'saved' | 'error' }) {
  const state = saveState || (isSaving ? 'saving' : 'idle');
  return (
    <div className="sticky bottom-0 pt-6 pb-2 bg-gradient-to-t from-black/80 to-transparent">
      <button
        type="submit"
        disabled={isSaving || isUploading}
        className={`button-primary w-full justify-center gap-3 py-5 text-base disabled:opacity-50 transition-all ${
          state === 'saved' ? 'shadow-[0_0_40px_rgba(34,197,94,0.4)] border-green-500/50' :
          state === 'error' ? 'shadow-[0_0_40px_rgba(239,68,68,0.4)] border-red-500/50' :
          'shadow-[0_0_40px_rgba(255,117,31,0.3)]'
        }`}
      >
        {state === 'saving' ? (
          <><Loader2 size={20} className="animate-spin" /> Saving to database...</>
        ) : state === 'saved' ? (
          <><CheckCircle2 size={20} className="text-green-400" /> Saved Successfully! — CTRL+S to save again</>
        ) : state === 'error' ? (
          <><AlertCircle size={20} className="text-red-400" /> Save Failed — Click to Retry</>
        ) : (
          <><Save size={20} /> Save Changes — CTRL+S</>  
        )}
      </button>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ label }: { label: string }) {
  return (
    <div className="py-16 text-center border-2 border-dashed border-[#1a1a1a] rounded-sm">
      <div className="text-4xl mb-4">📭</div>
      <p className="text-xs font-black uppercase tracking-widest text-zinc-600">{label}</p>
    </div>
  );
}

// ─── Media Card ───────────────────────────────────────────────────────────────
function MediaCard({ file, onDelete, onCopy }: { file: MediaFile; onDelete: (name: string) => void; onCopy: (url: string) => void }) {
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleCopy = () => {
    onCopy(file.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sizeStr = file.size
    ? file.size > 1024 * 1024
      ? `${(file.size / 1024 / 1024).toFixed(1)} MB`
      : `${Math.round(file.size / 1024)} KB`
    : '';

  return (
    <div className="group relative bg-[#0d0d0d] border border-[#1a1a1a] rounded-sm overflow-hidden hover:border-[#333] transition-colors">
      {/* Thumbnail */}
      <div className="relative aspect-square bg-[#080808]">
        {!imgError ? (
          <img
            src={file.url}
            alt={file.name}
            className="w-full h-full object-cover opacity-75 group-hover:opacity-100 transition-opacity"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon size={28} className="text-zinc-700" />
          </div>
        )}
        {/* Overlay actions */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            onClick={handleCopy}
            title="Copy URL"
            className="p-2 bg-primary text-black rounded-sm hover:bg-white transition-colors"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
          <a
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            title="Open in new tab"
            className="p-2 bg-[#222] text-white rounded-sm hover:bg-[#333] transition-colors"
          >
            <ExternalLink size={14} />
          </a>
          <button
            onClick={() => onDelete(file.name)}
            title="Delete"
            className="p-2 bg-red-600 text-white rounded-sm hover:bg-red-500 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      {/* Info */}
      <div className="p-2">
        <p className="text-[10px] text-zinc-400 truncate font-bold" title={file.name}>{file.name}</p>
        <div className="flex items-center justify-between mt-0.5">
          {sizeStr && <span className="text-[9px] text-zinc-600">{sizeStr}</span>}
          {file.createdAt && (
            <span className="text-[9px] text-zinc-700">
              {new Date(file.createdAt).toLocaleDateString('de-DE')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Quick Fix SQL Box (4 missing columns only) ──────────────────────────────
function QuickFixSqlBox() {
  const [copied, setCopied] = useState(false);
  const sql = `-- QUICK FIX: Add 4 missing columns to site_settings
-- Run in Supabase SQL Editor → then Settings → API → Reload Schema Cache
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS faq_subtitle text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS whyus_subtitle text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS whyus_banner_heading text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS whyus_banner_sub text;`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <button
        onClick={handleCopy}
        className="absolute top-3 right-3 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-300 border border-red-800/50 hover:border-red-500/50 px-3 py-1.5 rounded-sm transition-colors bg-[#0a0a0a]"
      >
        {copied ? <><Check size={12} className="text-green-400" /> Copied!</> : <><Copy size={12} /> Copy SQL</>}
      </button>
      <pre className="text-[10px] bg-[#050505] border border-red-900/40 p-4 pt-10 overflow-x-auto text-red-300/80 font-mono leading-relaxed rounded-sm select-all">
        {sql}
      </pre>
    </div>
  );
}

// ─── SQL Setup Box ────────────────────────────────────────────────────────────
function SqlSetupBox() {
  const [copied, setCopied] = useState(false);
  const sql = `-- ═══════════════════════════════════════════════════════════
-- FJ BAUSERVICE - Complete CMS Database Setup
-- Run this in your Supabase SQL Editor
-- After running: Settings → API → Reload Schema Cache
-- ═══════════════════════════════════════════════════════════

-- 1. SITE SETTINGS - Add all new columns (safe to re-run)
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS slogan_de text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS slogan_en text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS description_de text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS description_en text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS hero_image_url text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS hero_heading_de text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS hero_heading_en text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS hero_subtext_de text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS hero_subtext_en text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS hero_button_de text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS hero_button_en text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS stat_label_1_de text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS stat_label_2_de text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS about_image_url text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS cta_image_url text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS cta_title_de text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS cta_title_en text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS cta_subtitle_de text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS cta_subtitle_en text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS cta_button_de text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS cta_button_en text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS contact_image_url text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS footer_image_url text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS stats_years text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS stats_projects text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS facebook_url text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS instagram_url text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS linkedin_url text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS tiktok_url text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS whatsapp_number text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS address_de text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS address_en text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS google_maps_url text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS seo_title_de text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS seo_title_en text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS seo_description_de text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS seo_description_en text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS seo_keywords text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS og_image_url text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS hours_weekdays text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS hours_saturday text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS hours_sunday text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS logo_scale text DEFAULT '1';

-- 1b. VISUAL EDITOR columns (Site Editor)
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS primary_color text DEFAULT '#ff751f';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS hero_cta_label text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS services_title text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS services_subtitle text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS projects_title text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS projects_subtitle text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS faq_title text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS whyus_title text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS whyus_subtitle text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS whyus_banner_heading text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS whyus_banner_sub text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS whyus_1_title text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS whyus_1_desc text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS whyus_2_title text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS whyus_2_desc text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS whyus_3_title text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS whyus_3_desc text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS whyus_4_title text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS whyus_4_desc text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS faq_subtitle text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS contact_title text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS contact_subtitle text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS footer_copyright text;

-- 2. SERVICES TABLE
CREATE TABLE IF NOT EXISTS services (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text,
  title_de text,
  title_en text,
  description text,
  description_de text,
  description_en text,
  icon_name text DEFAULT 'Hammer',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public all" ON services;
CREATE POLICY "Allow public all" ON services FOR ALL USING (true);

-- 3. FAQS TABLE
CREATE TABLE IF NOT EXISTS faqs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  question text,
  question_de text,
  question_en text,
  answer text,
  answer_de text,
  answer_en text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public all" ON faqs;
CREATE POLICY "Allow public all" ON faqs FOR ALL USING (true);

-- 4. TESTIMONIALS TABLE
CREATE TABLE IF NOT EXISTS testimonials (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  author text,
  company text,
  text text,
  text_de text,
  text_en text,
  rating integer DEFAULT 5,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public all" ON testimonials;
CREATE POLICY "Allow public all" ON testimonials FOR ALL USING (true);

-- 5. CONTACT INQUIRIES
CREATE TABLE IF NOT EXISTS contact_inquiries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text, email text, subject text, message text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE contact_inquiries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public insert" ON contact_inquiries;
CREATE POLICY "Allow public insert" ON contact_inquiries FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow admin all" ON contact_inquiries;
CREATE POLICY "Allow admin all" ON contact_inquiries FOR ALL USING (true);

-- 6. SITE SETTINGS POLICIES
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public all" ON site_settings;
CREATE POLICY "Allow public all" ON site_settings FOR ALL USING (true);

-- 7. INITIAL DATA
INSERT INTO site_settings (id, name, slogan) VALUES (1, 'FJ BAUSERVICE', 'Raum für Neues schaffen')
ON CONFLICT (id) DO NOTHING;

-- 8. STORAGE BUCKET POLICIES (run if needed)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('images', 'images', true) ON CONFLICT DO NOTHING;
-- CREATE POLICY "Public upload" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'images');
-- CREATE POLICY "Public view" ON storage.objects FOR SELECT TO public USING (bucket_id = 'images');
-- CREATE POLICY "Public update" ON storage.objects FOR UPDATE TO public USING (bucket_id = 'images');
-- CREATE POLICY "Public delete" ON storage.objects FOR DELETE TO public USING (bucket_id = 'images');

-- IMPORTANT: After running, go to Supabase → Settings → API → click "Reload Schema"`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <button
        onClick={handleCopy}
        className="absolute top-3 right-3 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-primary border border-[#333] hover:border-primary px-3 py-1.5 rounded-sm transition-colors bg-[#0a0a0a]"
      >
        {copied ? <><Check size={12} className="text-green-400" /> Copied!</> : <><Copy size={12} /> Copy SQL</>}
      </button>
      <pre className="text-[9px] bg-[#050505] border border-[#1a1a1a] p-4 pt-10 overflow-x-auto text-zinc-500 font-mono leading-relaxed rounded-sm select-all max-h-64 overflow-y-auto scrollbar-thin">
        {sql}
      </pre>
    </div>
  );
}
