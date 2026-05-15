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
      setErrorMessage('Bitte füllen Sie alle Pflichtfelder aus.');
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
      setErrorMessage(err.message || 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
      setStatus('error');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <section className="py-32 px-6 max-w-7xl mx-auto bg-surface-dark overflow-hidden">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-start">
        {/* Left Column */}
        <motion.div 
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-16"
        >
          <div className="space-y-8">
            <span className="text-primary font-bold tracking-[0.4em] uppercase text-[10px] md:text-xs">Bereit für Ihr Projekt?</span>
            <h2 className="heading-dynamic text-5xl sm:text-6xl md:text-8xl italic text-text-main leading-[1.1] md:leading-none">{t.contact.title}</h2>
            <p className="text-text-muted text-base md:text-xl font-medium max-w-lg leading-relaxed">
              Planen Sie einen Abbruch in München oder eine Sanierung in Rosenheim? Unser Expertenteam steht Ihnen für eine kostenlose Erstberatung und Besichtigung zur Verfügung.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-1 gap-10">
            <div className="flex gap-6 group">
              <div className="w-16 h-16 bg-surface-card flex items-center justify-center shrink-0 border border-surface-border group-hover:bg-primary group-hover:border-primary group-hover:text-black transition-all duration-500">
                <Phone size={28} strokeWidth={1.5} />
              </div>
              <div className="space-y-1">
                <span className="text-text-muted text-[10px] md:text-xs font-black uppercase tracking-[0.3em] block mb-2">{t.contact.call}</span>
                <a href={`tel:${(settings?.phone || '015906142923').replace(/\s+/g, '')}`} className="text-xl md:text-2xl font-black text-text-main hover:text-primary transition-colors block">{settings?.phone || '+49 159 06142923'}</a>
              </div>
            </div>
            
            <div className="flex gap-6 group">
              <div className="w-16 h-16 bg-surface-card flex items-center justify-center shrink-0 border border-surface-border group-hover:bg-primary group-hover:border-primary group-hover:text-black transition-all duration-500">
                <Mail size={28} strokeWidth={1.5} />
              </div>
              <div className="space-y-1">
                <span className="text-text-muted text-[10px] md:text-xs font-black uppercase tracking-[0.3em] block mb-2 font-display">{t.contact.email}</span>
                <a href={`mailto:${settings?.email || 'amjad.ali@fj-bauservice.com'}`} className="text-xl md:text-2xl font-black text-text-main hover:text-primary transition-colors block break-all">{settings?.email || 'amjad.ali@fj-bauservice.com'}</a>
              </div>
            </div>

            <div className="flex gap-6 group">
              <div className="w-16 h-16 bg-surface-card flex items-center justify-center shrink-0 border border-surface-border group-hover:bg-primary group-hover:border-primary group-hover:text-black transition-all duration-500">
                <MapPin size={28} strokeWidth={1.5} />
              </div>
              <div className="space-y-1">
                <span className="text-text-muted text-[10px] md:text-xs font-black uppercase tracking-[0.3em] block mb-2">{t.contact.address}</span>
                <span className="text-xl md:text-2xl font-black text-text-main">{settings?.address || 'Bahnhofstraße 9, 83022 Rosenheim'}</span>
              </div>
            </div>
          </div>

          {/* Mini Map */}
          <div className="h-64 bg-surface-dark border border-surface-border overflow-hidden group shadow-2xl relative">
            {settings?.google_maps_url || settings?.address || settings?.address_de ? (
              <iframe 
                src={(() => {
                  let baseUrl = '';
                  const val = settings?.google_maps_url || '';
                  
                  if (val.includes('<iframe')) {
                    baseUrl = val.match(/src="([^"]+)"/)?.[1] || '';
                  } else if (val.startsWith('http')) {
                    baseUrl = val;
                  } else {
                    const queryAddress = settings?.address_de || settings?.address || 'Rosenheim, Germany';
                    baseUrl = `https://maps.google.com/maps?q=${encodeURIComponent(queryAddress)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
                  }

                  if (baseUrl.includes('?')) {
                    return baseUrl.includes('hl=') ? baseUrl.replace(/hl=[a-z]{2}/, `hl=de`) : `${baseUrl}&hl=de`;
                  }
                  return `${baseUrl}?hl=de`;
                })()} 
                width="100%" 
                height="100%" 
                style={{ border: 0, filter: 'var(--filter-map)' }} 
                allowFullScreen={false} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                title="Location Map"
              ></iframe>
            ) : (
                <div className="w-full h-full flex items-center justify-center text-text-muted font-bold uppercase tracking-widest text-xs">
                Google Maps View
              </div>
            )}
            <div className="absolute inset-0 pointer-events-none border-[12px] border-surface-dark" />
          </div>
        </motion.div>

        {/* Right Column - Form */}
        <motion.div 
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="bg-surface-card p-8 md:p-14 border border-surface-border relative shadow-[20px_20px_0px_0px_rgba(255,117,31,0.1)]"
        >
          <form className="space-y-10" onSubmit={handleSubmit}>
            <div className="grid md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted block">{t.contact.form.name} *</label>
                <input 
                  type="text" 
                  name="name"
                  placeholder="Ihr voller Name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full bg-surface-dark border border-surface-border p-4 focus:outline-none focus:border-primary transition-colors text-text-main font-bold" 
                />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted block">{t.contact.form.email} *</label>
                <input 
                  type="email" 
                  name="email"
                  placeholder="name@beispiel.de"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full bg-surface-dark border border-surface-border p-4 focus:outline-none focus:border-primary transition-colors text-text-main font-bold" 
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted block">{t.contact.form.subject}</label>
              <input 
                type="text" 
                name="subject"
                placeholder="z.B. Abbruch München Projekt"
                value={formData.subject}
                onChange={handleChange}
                className="w-full bg-surface-dark border border-surface-border p-4 focus:outline-none focus:border-primary transition-colors text-text-main font-bold" 
              />
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted block">{t.contact.form.message} *</label>
              <textarea 
                rows={5}
                name="message"
                placeholder="Bitte beschreiben Sie Ihr Vorhaben..."
                value={formData.message}
                onChange={handleChange}
                required
                className="w-full bg-surface-dark border border-surface-border p-4 focus:outline-none focus:border-primary transition-colors text-text-main font-bold resize-none" 
              />
            </div>

            <div className="space-y-6">
              <button 
                type="submit" 
                disabled={status === 'loading'}
                className="button-primary w-full justify-center group py-6 text-base"
              >
                {status === 'loading' ? (
                  <Loader2 className="animate-spin" size={24} />
                ) : (
                  <>{t.contact.form.send} <Send className="group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform" size={20} strokeWidth={3} /></>
                )}
              </button>

              <AnimatePresence>
                {status === 'success' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-3 text-green-500 font-black text-xs uppercase tracking-[0.2em] bg-green-500/10 p-4 border border-green-500/20"
                  >
                    <CheckCircle2 size={18} /> {t.contact.form.success}
                  </motion.div>
                )}
                {status === 'error' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-3 text-red-500 font-black text-xs uppercase tracking-[0.2em] bg-red-500/10 p-4 border border-red-500/20"
                  >
                    <AlertCircle size={18} /> {errorMessage || t.contact.form.error}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </form>
        </motion.div>
      </div>
      
      {/* Social Icons Overlay - Optional Premium Touch */}
      <div className="mt-20 flex justify-center gap-8 border-t border-surface-border pt-12">
        {[Facebook, Instagram, Linkedin].map((Icon, i) => (
          <a key={i} href="#" className="text-text-muted hover:text-primary transition-colors duration-500">
            <Icon size={24} strokeWidth={1} />
          </a>
        ))}
      </div>
    </section>
  );
}
