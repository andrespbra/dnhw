import { createClient } from '@supabase/supabase-js';

// Tenta pegar do ambiente (Vite ou Process), mas usa os valores fornecidos como fallback seguro
const getEnvVar = (key: string) => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      // @ts-ignore
      return import.meta.env[key];
    }
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      // @ts-ignore
      return process.env[key];
    }
  } catch (e) {
    // ignore errors
  }
  return '';
};

// Credenciais fornecidas explicitamente para garantir funcionamento
const PROVIDED_URL = 'https://lbrighsftwssjuwfrdpe.supabase.co';
const PROVIDED_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxicmlnaHNmdHdzc2p1d2ZyZHBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NTg2NzUsImV4cCI6MjA4MTQzNDY3NX0.XD0tHk9rq8Ss-x4sXx8EkRcRm3GubK3fFdWKyvPZPnQ';

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL') || PROVIDED_URL;
const supabaseKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || PROVIDED_KEY;

export const isSupabaseConfigured = 
  supabaseUrl && 
  supabaseKey && 
  supabaseUrl !== 'https://placeholder.supabase.co' &&
  !supabaseUrl.includes('placeholder');

if (!isSupabaseConfigured) {
  console.warn("ATENÇÃO: Credenciais do Supabase não encontradas ou inválidas.");
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key'
);