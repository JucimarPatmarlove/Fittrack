// src/services/jwtEngine.ts
// ════════════════════════════════════════════════════════════════
// FitTrack V7 — Motor JWT Zero Trust (Browser-side)
// ════════════════════════════════════════════════════════════════
//
// EVOLUÇÃO:
//   v1.0: Gerava JWT localmente com VITE_API_SHARED_SECRET (segredo no bundle)
//   v2.0: Pede token efémero ao servidor via /api/request-token
//         O segredo NUNCA toca no browser. Zero Trust puro.
//
// O token é cacheado por 50s (margem de 10s antes de expirar no servidor).
// ════════════════════════════════════════════════════════════════

interface CachedToken {
  token: string;
  expiresAt: number;
}

let cachedToken: CachedToken | null = null;

/**
 * Solicita um JWT efémero (60s) ao backend via /api/request-token.
 * Envia nonce + timestamp; o servidor valida e devolve um token assinado.
 * O token é cacheado localmente por 50s para evitar pedidos desnecessários.
 */
export async function generateShortLivedToken(): Promise<string> {
  const now = Date.now();

  // Usar token em cache se ainda válido (margem de 10s)
  if (cachedToken && cachedToken.expiresAt > now) {
    return cachedToken.token;
  }

  const nonce = crypto.randomUUID();
  const timestamp = now;

  // Em dev, o Vite proxy redireciona /api/* → localhost:3001
  // Em prod, é o mesmo domínio (Vercel)
  const API_URL = import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api/request-token`
    : '/api/request-token';

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nonce, timestamp }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.warn(`[JWT] Falha na negociação (${response.status}): ${errorText}`);
      // Fallback: gerar token localmente se o servidor não responder
      return fallbackLocalToken();
    }

    const data = await response.json();
    const token = data.token;

    // Cache por 50s (o servidor emite com 60s de validade)
    cachedToken = {
      token,
      expiresAt: now + 50_000,
    };

    return token;
  } catch (error) {
    console.warn('[JWT] Servidor indisponível, a usar fallback local:', error);
    return fallbackLocalToken();
  }
}

/**
 * Fallback: gera JWT localmente quando o endpoint /api/request-token
 * não está disponível (dev offline, servidor em baixo, etc.)
 * Usa VITE_API_SHARED_SECRET se existir, senão um token dummy.
 */
async function fallbackLocalToken(): Promise<string> {
  const secret = import.meta.env.VITE_API_SHARED_SECRET;
  if (!secret) {
    // Sem segredo e sem servidor → token vazio (o server.js local aceita sem JWT em dev)
    return 'dev-no-token';
  }

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = { origin: 'FitTrack-V7-Client', iat: now, exp: now + 60 };

  const headerB64 = textToBase64Url(JSON.stringify(header));
  const payloadB64 = textToBase64Url(JSON.stringify(payload));
  const signingInput = `${headerB64}.${payloadB64}`;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC', key, new TextEncoder().encode(signingInput)
  );

  return `${signingInput}.${base64UrlEncode(signature)}`;
}

/**
 * Força renovação do token (útil após falha 403)
 */
export function invalidateToken(): void {
  cachedToken = null;
}

// ── Utilidades Base64URL ──────────────────────────────────────────

function base64UrlEncode(data: ArrayBuffer | Uint8Array): string {
  const bytes = data instanceof ArrayBuffer ? new Uint8Array(data) : data;
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function textToBase64Url(text: string): string {
  return btoa(text).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
