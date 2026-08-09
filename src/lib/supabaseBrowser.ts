// ════════════════════════════════════════════════════════════════
// FitTrack V7 — Supabase Browser Client (Anon Key, RLS Protected)
// ════════════════════════════════════════════════════════════════
//
// Cliente separado do backend (supabaseQuery.ts usa service_role).
// Este usa a anon key pública, protegida por Row Level Security.
// Quando as env vars não estão definidas, devolve null → mock mode.
// ════════════════════════════════════════════════════════════════

import { type SupabaseClient, createClient } from '@supabase/supabase-js';

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
    console.info(
      '[Supabase Browser] Env vars em falta (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). Modo mock activo.',
    );
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

/**
 * Faz login anónimo no Supabase.
 * Cria um utilizador fantasma (shadow user) se não existir sessão.
 * Ideal para apps locais (local-first) que precisam de RLS.
 */
export async function signInAnonymously(): Promise<string | null> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return null;

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user) {
      return session.user.id;
    }

    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;

    return data.user?.id || null;
  } catch (error) {
    console.error('[Supabase Browser] Erro no login anónimo:', error);
    return null;
  }
}
