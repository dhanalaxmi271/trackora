import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Robust URL validation
const isValidUrl = (url: string) => {
  try {
    return url && (url.startsWith('https://') || url.startsWith('http://'));
  } catch {
    return false;
  }
};

const finalUrl = isValidUrl(supabaseUrl || '') ? (supabaseUrl as string) : 'https://placeholder.supabase.co';
const finalKey = supabaseAnonKey || 'placeholder';

// Silent fail for better dev experience
// if (!isValidUrl(supabaseUrl || '') || !supabaseAnonKey) {
//   console.warn('Supabase credentials missing.');
// }

export const supabase = createClient(finalUrl, finalKey);
