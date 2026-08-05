// ════════════════════════════════════════════════════════════════
// FitTrack V7 — Supabase Browser Client (Anon Key, RLS Protected)
// ════════════════════════════════════════════════════════════════
//
// Cliente separado do backend (supabaseQuery.ts usa service_role).
// Este usa a anon key pública, protegida por Row Level Security.
// Quando as env vars não estão definidas, devolve null → mock mode.
// ════════════════════════════════════════════════════════════════

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let browserClient: SupabaseClient | null = null;

/**
 * Devolve o cliente Supabase para o browser.
 * Retorna null se as variáveis de ambiente não estiverem configuradas,
 * activando o modo mock nos stores que dependem disto.
 */
export function getSupabaseBrowser(): SupabaseClient | null {
  if (browserClient) return browserClient;

  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

  if (!url || !anonKey) {
    console.info('[Supabase Browser] Env vars em falta (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). Modo mock activo.');
    return null;
  }

  browserClient = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });

  return browserClient;
}

/**
 * Verifica se o Supabase está configurado no browser.
 */
export function isSupabaseConfigured(): boolean {
  return getSupabaseBrowser() !== null;
}
