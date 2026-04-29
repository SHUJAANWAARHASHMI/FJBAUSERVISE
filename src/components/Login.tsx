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
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) throw loginError;
      
      onLoginStatus(true);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(lang === 'de' ? 'Anmeldung fehlgeschlagen: Ungültige E-Mail oder Passwort.' : 'Login failed: Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl relative overflow-hidden">
        {/* Progress Bar */}
        {isLoading && (
          <div className="absolute top-0 left-0 h-1 bg-primary animate-[shimmer_2s_infinite]" style={{ width: '100%', backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, transparent, rgba(234, 179, 8, 0.5), transparent)' }} />
        )}

        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Lock className="text-primary" size={24} />
            </div>
            <h2 className="text-2xl font-black heading-dynamic uppercase tracking-widest text-white">
              {lang === 'de' ? 'Admin Login' : 'Admin Login'}
            </h2>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-tighter mt-2">
              {lang === 'de' ? 'Zugriff nur für autorisiertes Personal' : 'Authorized access only'}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block px-1">
                {lang === 'de' ? 'E-Mail Adresse' : 'Email Address'}
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-primary transition-colors" size={18} />
                <input 
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-primary px-12 py-3 text-sm text-white placeholder:text-zinc-700 focus:outline-none transition-all rounded-md"
                  placeholder="admin@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block px-1">
                {lang === 'de' ? 'Passwort' : 'Password'}
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-primary transition-colors" size={18} />
                <input 
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-primary px-12 py-3 text-sm text-white placeholder:text-zinc-700 focus:outline-none transition-all rounded-md"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-500/10 border border-red-500/20 rounded-md flex items-start gap-3 mt-4"
              >
                <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
                <p className="text-[11px] text-red-400 font-bold leading-snug">{error}</p>
              </motion.div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full button-primary justify-center py-4 text-sm disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <span className="flex items-center gap-2">
                {isLoading ? (lang === 'de' ? 'Anmeldung...' : 'Logging in...') : (lang === 'de' ? 'Anmelden' : 'Login')}
                {!isLoading && <Lock size={16} className="group-hover:scale-110 transition-transform" />}
              </span>
            </button>
          </form>

          <div className="mt-12 pt-8 border-t border-zinc-800/50">
            <p className="text-[9px] text-zinc-600 text-center uppercase font-black tracking-widest leading-relaxed">
              If you lost your access credentials, please contact your database administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
