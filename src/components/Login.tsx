import React, { useState } from 'react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { X, Lock, Mail, AlertCircle } from 'lucide-react';

interface LoginProps {
  onLoginStatus: (status: boolean) => void;
  onClose: () => void;
  lang: 'en' | 'de';
}

export default function Login({ onLoginStatus, onClose, lang }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError) throw loginError;
      onLoginStatus(true);
    } catch (err: any) {
      setError(lang === 'de' ? 'Anmeldung fehlgeschlagen: Ungültige E-Mail oder Passwort.' : 'Login failed: Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl shadow-2xl relative overflow-hidden">
        {isLoading && (
          <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-primary via-orange-400 to-primary bg-[length:200%] animate-[shimmer_1.5s_infinite]" />
        )}

        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors">
          <X size={20} />
        </button>

        <div className="p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center mb-4">
              <Lock className="text-primary" size={24} />
            </div>
            <h2 className="text-2xl font-black heading-dynamic uppercase tracking-widest text-gray-900">
              Admin Login
            </h2>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-tighter mt-2">
              {lang === 'de' ? 'Zugriff nur für autorisiertes Personal' : 'Authorized access only'}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">
                {lang === 'de' ? 'E-Mail Adresse' : 'Email Address'}
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                <input
                  type="email" required value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-primary px-12 py-3 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none transition-all rounded-lg"
                  placeholder="admin@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">
                {lang === 'de' ? 'Passwort' : 'Password'}
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                <input
                  type="password" required value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-primary px-12 py-3 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none transition-all rounded-lg"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
              >
                <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
                <p className="text-[11px] text-red-600 font-bold leading-snug">{error}</p>
              </motion.div>
            )}

            <button
              type="submit" disabled={isLoading}
              className="w-full button-primary justify-center py-4 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading
                ? (lang === 'de' ? 'Anmeldung...' : 'Logging in...')
                : (lang === 'de' ? 'Anmelden' : 'Login')}
              {!isLoading && <Lock size={16} />}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-[9px] text-gray-400 text-center uppercase font-black tracking-widest leading-relaxed">
              Contact your database administrator if you lost access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
