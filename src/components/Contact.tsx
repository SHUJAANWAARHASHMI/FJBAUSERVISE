import { motion, AnimatePresence } from 'motion/react';
import { Send, MapPin, Phone, Mail, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { translations } from '../lib/translations';
import { EditableText, EditableSection, useEditorCtx } from '../lib/editorContext';

export default function Contact({ settings, lang }: { settings: any, lang: 'en' | 'de' }) {
  const t = translations[lang];
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const { isEditing, settings: editorSettings } = useEditorCtx();
  const s = isEditing ? (editorSettings ?? settings) : settings;

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
      const { error } = await supabase.from('contact_inquiries').insert([{
        name: formData.name, email: formData.email, subject: formData.subject, message: formData.message,
        created_at: new Date().toISOString()
      }]);
      if (error) throw error;
      setStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setStatus('idle'), 5000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Ein Fehler ist aufgetreten.');
      setStatus('error');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const phone   = s?.phone   || '+49 159 06142923';
  const email   = s?.email   || 'amjad.ali@fj-bauservice.com';
  const address = s?.address_de || s?.address || 'Bahnhofstraße 9, 83022 Rosenheim';

  return (
    <EditableSection id="contact" label="Kontakt">
      <section className="py-32 px-6 max-w-7xl mx-auto bg-white overflow-hidden">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-start">

          {/* Left column */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-16"
          >
            <div className="space-y-8">
              <span className="text-primary font-bold tracking-[0.4em] uppercase text-[10px] md:text-xs">Bereit für Ihr Projekt?</span>
              <EditableText
                field="contact_title"
                value={s?.contact_title || t.contact.title}
                tag="h2"
                className="heading-dynamic text-5xl sm:text-6xl md:text-8xl italic text-gray-900 leading-[1.1] md:leading-none"
              />
              <EditableText
                field="contact_subtitle"
                value={s?.contact_subtitle || 'Planen Sie einen Abbruch in München oder eine Sanierung in Rosenheim? Unser Expertenteam steht Ihnen für eine kostenlose Erstberatung zur Verfügung.'}
                tag="p"
                multiline
                className="text-gray-500 text-base md:text-xl font-medium max-w-lg leading-relaxed"
              />
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-1 gap-10">
              {[
                {
                  Icon: Phone, label: t.contact.call,
                  content: (
                    <EditableText
                      field="phone"
                      value={phone}
                      tag="span"
                      className="text-xl md:text-2xl font-black text-gray-800 hover:text-primary transition-colors block"
                    />
                  )
                },
                {
                  Icon: Mail, label: t.contact.email,
                  content: (
                    <EditableText
                      field="email"
                      value={email}
                      tag="span"
                      className="text-xl md:text-2xl font-black text-gray-800 hover:text-primary transition-colors block break-all"
                    />
                  )
                },
                {
                  Icon: MapPin, label: t.contact.address,
                  content: (
                    <EditableText
                      field="address_de"
                      value={address}
                      tag="span"
                      className="text-xl md:text-2xl font-black text-gray-800"
                    />
                  )
                },
              ].map(({ Icon, label, content }) => (
                <div key={label} className="flex gap-6 group">
                  <div className="w-16 h-16 bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:border-primary group-hover:text-white text-primary transition-all duration-500 shadow-sm rounded-sm">
                    <Icon size={28} strokeWidth={1.5} />
                  </div>
                  <div className="space-y-1">
                    <span className="text-gray-400 text-[10px] md:text-xs font-black uppercase tracking-[0.3em] block mb-2">{label}</span>
                    {content}
                  </div>
                </div>
              ))}
            </div>

            {/* Map */}
            <div className="h-64 bg-gray-100 border border-gray-200 overflow-hidden shadow-md relative rounded-sm">
              {s?.google_maps_url || s?.address || s?.address_de ? (
                <iframe
                  src={(() => {
                    const val = s?.google_maps_url || '';
                    let baseUrl = '';
                    if (val.includes('<iframe')) baseUrl = val.match(/src="([^"]+)"/)?.[1] || '';
                    else if (val.startsWith('http')) baseUrl = val;
                    else {
                      const q = s?.address_de || s?.address || 'Rosenheim, Germany';
                      baseUrl = `https://maps.google.com/maps?q=${encodeURIComponent(q)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
                    }
                    if (baseUrl.includes('?')) return baseUrl.includes('hl=') ? baseUrl.replace(/hl=[a-z]{2}/, 'hl=de') : `${baseUrl}&hl=de`;
                    return `${baseUrl}?hl=de`;
                  })()}
                  width="100%" height="100%"
                  style={{ border: 0 }}
                  allowFullScreen={false} loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Location Map"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold uppercase tracking-widest text-xs">
                  Google Maps View
                </div>
              )}
            </div>
          </motion.div>

          {/* Right column – form */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white border border-gray-200 p-8 md:p-14 relative shadow-[20px_20px_0px_0px_rgba(255,117,31,0.08)] rounded-sm"
          >
            <form className="space-y-10" onSubmit={handleSubmit}>
              <div className="grid md:grid-cols-2 gap-10">
                {[
                  { name: 'name',  label: t.contact.form.name,  type: 'text',  placeholder: 'Ihr voller Name' },
                  { name: 'email', label: t.contact.form.email, type: 'email', placeholder: 'name@beispiel.de' },
                ].map(f => (
                  <div key={f.name} className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 block">{f.label} *</label>
                    <input
                      type={f.type} name={f.name} placeholder={f.placeholder}
                      value={(formData as any)[f.name]} onChange={handleChange} required
                      className="w-full bg-gray-50 border border-gray-200 p-4 focus:outline-none focus:border-primary transition-colors text-gray-800 font-bold rounded-sm"
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 block">{t.contact.form.subject}</label>
                <input
                  type="text" name="subject" placeholder="z.B. Abbruch München Projekt"
                  value={formData.subject} onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-200 p-4 focus:outline-none focus:border-primary transition-colors text-gray-800 font-bold rounded-sm"
                />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 block">{t.contact.form.message} *</label>
                <textarea
                  rows={5} name="message" placeholder="Bitte beschreiben Sie Ihr Vorhaben..."
                  value={formData.message} onChange={handleChange} required
                  className="w-full bg-gray-50 border border-gray-200 p-4 focus:outline-none focus:border-primary transition-colors text-gray-800 font-bold resize-none rounded-sm"
                />
              </div>

              <div className="space-y-6">
                <button
                  type="submit" disabled={status === 'loading'}
                  className="button-primary w-full justify-center group py-6 text-base"
                >
                  {status === 'loading'
                    ? <Loader2 className="animate-spin" size={24} />
                    : <>{t.contact.form.send} <Send className="group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform" size={20} strokeWidth={3} /></>
                  }
                </button>

                <AnimatePresence>
                  {status === 'success' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="flex items-center gap-3 text-green-600 font-black text-xs uppercase tracking-[0.2em] bg-green-50 p-4 border border-green-200 rounded-sm">
                      <CheckCircle2 size={18} /> {t.contact.form.success}
                    </motion.div>
                  )}
                  {status === 'error' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="flex items-center gap-3 text-red-600 font-black text-xs uppercase tracking-[0.2em] bg-red-50 p-4 border border-red-200 rounded-sm">
                      <AlertCircle size={18} /> {errorMessage || t.contact.form.error}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </form>
          </motion.div>
        </div>
      </section>
    </EditableSection>
  );
}
