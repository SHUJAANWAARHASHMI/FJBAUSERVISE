import { motion, AnimatePresence } from 'motion/react';
import { Send, MapPin, Phone, Mail, CheckCircle2, AlertCircle, Loader2, Facebook, Instagram, Linkedin } from 'lucide-react';
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

import { translations } from '../lib/translations';

export default function Contact({ settings, lang }: { settings: any, lang: 'en' | 'de' }) {
  const t = translations[lang];
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      setErrorMessage(lang === 'de' ? 'Bitte füllen Sie alle Pflichtfelder aus.' : 'Please fill in all required fields.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      const { error } = await supabase
        .from('contact_inquiries')
        .insert([
          {
            name: formData.name,
            email: formData.email,
            subject: formData.subject,
            message: formData.message,
            created_at: new Date().toISOString()
          },
        ]);

      if (error) throw error;

      setStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setStatus('idle'), 5000);
    } catch (err: any) {
      console.error('Supabase error:', err);
      setErrorMessage(err.message || (lang === 'de' ? 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.' : 'An error occurred. Please try again later.'));
      setStatus('error');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <section className="py-24 px-6 max-w-7xl mx-auto bg-surface-card border-x border-surface-border">
      <div className="grid lg:grid-cols-2 gap-16">
        {/* Left Column */}
        <div className="space-y-12">
          <div className="space-y-6">
            <h2 className="heading-dynamic text-6xl">{t.contact.title}</h2>
            <p className="text-zinc-400 text-lg">
              {lang === 'de' ? (settings?.description_de || settings?.description || t.contact.subtitle) : (settings?.description_en || settings?.description || t.contact.subtitle)}
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-primary flex items-center justify-center shrink-0">
                <Phone className="text-black" size={24} />
              </div>
              <div>
                <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest block mb-1">{t.contact.call}</span>
                <span className="text-xl font-bold">{settings?.phone || '0159 06142923'}</span>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-primary flex items-center justify-center shrink-0">
                <Mail className="text-black" size={24} />
              </div>
              <div>
                <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest block mb-1">{t.contact.email}</span>
                <span className="text-xl font-bold underline decoration-primary decoration-2 underline-offset-4">{settings?.email || 'amjad.ali@fj-bauservice.com'}</span>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 bg-primary flex items-center justify-center shrink-0">
                <MapPin className="text-black" size={24} />
              </div>
              <div>
                <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest block mb-1">{t.contact.address}</span>
                <span className="text-xl font-bold">{settings?.address || 'Bahnhofstraße 9, 83022 Rosenheim'}</span>
              </div>
            </div>
          </div>

          {/* Social Icons */}
          <div className="pt-4 flex gap-4">
            {[
              { Icon: Facebook, url: settings?.facebook_url },
              { Icon: Instagram, url: settings?.instagram_url },
              { Icon: Linkedin, url: settings?.linkedin_url }
            ].filter(s => s.url).map(({ Icon, url }, idx) => (
              <a 
                key={idx} 
                href={url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-12 h-12 border border-surface-border flex items-center justify-center text-white hover:bg-primary hover:text-black transition-all"
              >
                <Icon size={20} />
              </a>
            ))}
          </div>

          {/* Mini Map */}
          <div className="h-64 bg-surface-dark border border-surface-border overflow-hidden">
            {settings?.google_maps_url ? (
              <iframe 
                src={settings.google_maps_url} 
                width="100%" 
                height="100%" 
                style={{ border: 0, filter: 'grayscale(1) invert(0.9) contrast(1.2)' }} 
                allowFullScreen={false} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                title="Location Map"
              ></iframe>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-600 font-bold uppercase tracking-widest text-xs">
                Google Maps Dynamic View
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Form */}
        <div className="bg-surface-dark p-10 border border-surface-border relative overflow-hidden">
          <form className="space-y-8" onSubmit={handleSubmit}>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t.contact.form.name} *</label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full bg-surface-card border-b border-surface-border py-3 focus:outline-none focus:border-primary transition-colors text-white" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t.contact.form.email} *</label>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full bg-surface-card border-b border-surface-border py-3 focus:outline-none focus:border-primary transition-colors text-white" 
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t.contact.form.subject}</label>
              <input 
                type="text" 
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className="w-full bg-surface-card border-b border-surface-border py-3 focus:outline-none focus:border-primary transition-colors text-white" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t.contact.form.message} *</label>
              <textarea 
                rows={4}
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                className="w-full bg-surface-card border-b border-surface-border py-3 focus:outline-none focus:border-primary transition-colors text-white resize-none" 
              />
            </div>

            <div className="space-y-4">
              <button 
                type="submit" 
                disabled={status === 'loading'}
                className="button-primary w-full justify-center group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === 'loading' ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>{t.contact.form.send} <Send className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" size={18} /></>
                )}
              </button>

              <AnimatePresence>
                {status === 'success' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 text-green-500 font-bold text-sm uppercase tracking-wider"
                  >
                    <CheckCircle2 size={16} /> {t.contact.form.success}
                  </motion.div>
                )}
                {status === 'error' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 text-red-500 font-bold text-sm uppercase tracking-wider"
                  >
                    <AlertCircle size={16} /> {errorMessage || t.contact.form.error}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
