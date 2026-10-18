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

/**
 * 🔑 [PASSKEYS] - Inicia o registo de uma Passkey para o utilizador.
 * O utilizador tem de estar autenticado primeiro (com PIN/Anónimo promovido).
 * Encripta a chave AES e envia-a para o Supabase de forma segura.
 */
export async function registerPasskey(aesKeyData: string): Promise<boolean> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return false;

  try {
    // 1. Registar a Passkey (requer @supabase/supabase-js v2.105.0+)
    // Usamos cast para 'any' porque a versão atual do lab (2.103.2) não tem os tipos
    // O utilizador terá de correr npm install @supabase/supabase-js@latest
    const authAny = supabase.auth as any;
    const { error: passkeyError } = await authAny.passkey.register();
    
    if (passkeyError) {
      console.error('[Supabase Browser] Erro no registo de Passkey:', passkeyError);
      return false;
    }

    // 2. Guardar a chave AES encriptada nos metadados do utilizador (Key Escrow)
    const { error: updateError } = await supabase.auth.updateUser({
      data: { vault_key: aesKeyData }
    });

    if (updateError) {
      console.error('[Supabase Browser] Erro ao guardar AES Key no Supabase:', updateError);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[Supabase Browser] Exception no registo de Passkey:', err);
    return false;
  }
}

/**
 * 🔑 [PASSKEYS] - Desbloqueia a sessão através do FaceID/Windows Hello.
 * Retorna a chave AES encriptada (guardada nos metadados).
 */
export async function signInWithPasskey(): Promise<{ vault_key: string } | null> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return null;

  try {
    const authAny = supabase.auth as any;
    const { data, error } = await authAny.passkey.authenticate();
    
    if (error || !data?.user) {
      console.error('[Supabase Browser] Erro ao autenticar com Passkey:', error);
      return null;
    }

    const vaultKey = data.user.user_metadata?.vault_key;
    if (!vaultKey) {
      console.error('[Supabase Browser] Passkey autenticou, mas sem vault_key guardada.');
      return null;
    }

    return { vault_key: vaultKey };
  } catch (err) {
    console.error('[Supabase Browser] Exception na autenticação Passkey:', err);
    return null;
  }
}
