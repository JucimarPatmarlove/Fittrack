// src/services/jwtEngine.ts

let cachedToken: { token: string; expiresAt: number } | null = null;

export async function generateShortLivedToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now) return cachedToken.token;

  const nonce = crypto.randomUUID();
  const timestamp = now;
  const apiUrl = '/api/request-token';

  try {
    const response = await fetch(apiUrl, {
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
    // Em desenvolvimento offline, podemos permitir um token dummy (apenas para testes locais)
    if (import.meta.env.DEV) {
      console.warn('[JWT] Modo dev offline – utilizando token dummy. NÃO SEGURO!');
      return 'dev-dummy-token';
    }
    throw new Error('Não foi possível obter token de segurança. Verifique a ligação ao servidor.');
  }
}

export function invalidateToken(): void {
  cachedToken = null;
}
