// ════════════════════════════════════════════════════════════════
// FitTrack — Cliente Supabase do browser (Rede Social)
// ════════════════════════════════════════════════════════════════
//
// Usa a anon key, não a service role key. A anon key é segura para
// expor no bundle do cliente — a proteção real vem das políticas RLS
// definidas em supabase/migrations/001_social.sql. Cada utilizador só
// consegue ler/escrever o que as políticas permitem, independentemente
// do que o código do cliente tente fazer.
//
// NUNCA importes isto em código que corre no servidor com a service
// role key — usa src/services/tools/supabaseQuery.ts para isso.
// ════════════════════════════════════════════════════════════════

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

let client: SupabaseClient | null = null;

/**
 * Devolve o cliente Supabase do browser, ou null se a rede social não
 * estiver configurada (permite que o resto da app funcione sem esta feature).
 */
export function getSocialClient(): SupabaseClient | null {
  if (client) return client;
  if (!url || !anonKey) {
    console.warn('[Social] VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY não configurados — rede social desativada.');
    return null;
  }
  client = createClient(url, anonKey, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
  return client;
}

export function isSocialConfigured(): boolean {
  return Boolean(url && anonKey);
}