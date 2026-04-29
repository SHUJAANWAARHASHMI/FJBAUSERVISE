/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

// Fallback values provided by the user
const DEFAULT_URL = 'https://qlvainogsjashyaryjao.supabase.co';
const DEFAULT_KEY = 'sb_publishable_sTtR7-Rcf4gz8aaNfYoYGQ_wsCWbB6u';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing. Using placeholder values.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
