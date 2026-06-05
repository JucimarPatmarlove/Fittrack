// src/services/jwtEngine.ts
interface CachedToken {
  token: string;
  expiresAt: number;
}

let cachedToken: CachedToken | null = null;

export async function generateShortLivedToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now) return cachedToken.token;

  const API_URL = '/api/request-token';
  const nonce = crypto.randomUUID();
  const timestamp = now;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nonce, timestamp }),
    });

    if (!response.ok) {
      throw new Error(`Token request failed: ${response.status}`);
    }

    const { token } = await response.json();
    cachedToken = { token, expiresAt: now + 50_000 };
    return token;
  } catch (err) {
    console.error('[JWT] Falha ao obter token do servidor:', err);

    // Fallback APENAS em desenvolvimento, com aviso explícito
    if (import.meta.env.DEV) {
      console.warn('[JWT] Modo DEV: a utilizar token dummy. NÃO USAR EM PRODUÇÃO.');
      return 'dev-dummy-token';
    }
    throw new Error('Não foi possível estabelecer ligação segura. Verifique a rede.');
  }
}

export function invalidateToken(): void {
  cachedToken = null;
}
