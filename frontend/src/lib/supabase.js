import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

// Если переменные не заданы, клиент не создаётся, приложение не падает
export const supabase = isSupabaseConfigured ? createClient(url, anonKey) : null;
