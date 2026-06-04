// src/services/jwtEngine.ts
// ════════════════════════════════════════════════════════════════
// FitTrack V7 — Motor JWT Zero-Dependência (Browser-side)
// ════════════════════════════════════════════════════════════════
//
// Gera JWTs de curta duração (60s) usando a Web Crypto API nativa.
// Sem bibliotecas externas — funciona em qualquer browser moderno.
//
// O SHARED_SECRET vem de VITE_API_SHARED_SECRET no .env.
// NOTA: Embora o segredo esteja no bundle, o token expira em 60s,
// impedindo ataques de replay de longa duração.
// ════════════════════════════════════════════════════════════════

const SHARED_SECRET = import.meta.env.VITE_API_SHARED_SECRET || 'fittrack-dev-fallback-secret-change-me';

// ── Utilidades Base64URL (sem padding) ───────────────────────────

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

// ── Importar chave para HMAC-SHA256 ──────────────────────────────

async function getSigningKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(SHARED_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
}

// ── Gerar JWT ────────────────────────────────────────────────────

/**
 * Gera um JWT HS256 válido por 60 segundos.
 * Payload inclui: origin (FitTrack-V7), iat, exp.
 */
export async function generateShortLivedToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    origin: 'FitTrack-V7-Client',
    iat: now,
    exp: now + 60, // Expira em 60 segundos
  };

  const headerB64 = textToBase64Url(JSON.stringify(header));
  const payloadB64 = textToBase64Url(JSON.stringify(payload));
  const signingInput = `${headerB64}.${payloadB64}`;

  const key = await getSigningKey();
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(signingInput)
  );

  const signatureB64 = base64UrlEncode(signature);
  return `${signingInput}.${signatureB64}`;
}
