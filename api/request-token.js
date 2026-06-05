// api/request-token.js
// ════════════════════════════════════════════════════════════════════════════
// FitTrack V7 — Vercel Serverless: /api/request-token
// ════════════════════════════════════════════════════════════════════════════
//
// PROPÓSITO:
//   Emite tokens JWT de curta duração (60s) assinados com API_SHARED_SECRET.
//   O segredo NUNCA toca no browser — elimina VITE_API_SHARED_SECRET do bundle.
//
// FLUXO:
//   1. Cliente envia POST { nonce: uuid, timestamp: ms }
//   2. Servidor valida timestamp (±30s clock skew tolerado)
//   3. Servidor assina JWT com API_SHARED_SECRET (só existe em Node.js)
//   4. Cliente recebe token efémero, cacheia 50s, envia em Authorization: Bearer
//   5. /api/claude valida o token antes de reencaminhar para a Anthropic API
//
// ANTI-REPLAY:
//   - Tokens expiram em 60s (campo `exp`)
//   - Nonce incluído no payload (poderia ser guardado num Set em memória
//     para rejeição estrita; omitido aqui por ser serverless stateless)
//   - Timestamp do cliente validado (rejeita pedidos com >30s de desfasagem)
//
// VARIÁVEIS DE AMBIENTE NECESSÁRIAS (Vercel Dashboard > Settings > Env Vars):
//   API_SHARED_SECRET  — string aleatória ≥32 chars, SEM prefixo VITE_
//
// ════════════════════════════════════════════════════════════════════════════

import { createHmac } from 'crypto';

// ─── CORS HELPER ─────────────────────────────────────────────────────────────

const ALLOWED_ORIGINS = [
  'https://fittrack.vercel.app',         // produção (ajusta ao teu domínio)
  'https://fittrack-*.vercel.app',       // preview deployments
  'http://localhost:5173',               // dev Vite
  'http://localhost:4173',               // dev preview
  'http://192.168.1.133:5173',           // Dell Latitude (lab)
  'http://192.168.1.127:5173',           // Lenovo Ideapad (lab)
];

function isOriginAllowed(origin) {
  if (!origin) return true; // requests sem origin (curl, Postman) aceites em dev
  return ALLOWED_ORIGINS.some((allowed) => {
    if (allowed.includes('*')) {
      const pattern = allowed.replace('*', '.*');
      return new RegExp(`^${pattern}$`).test(origin);
    }
    return allowed === origin;
  });
}

function setCorsHeaders(req, res) {
  const origin = req.headers.origin;
  if (origin && isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// ─── JWT BUILDER ─────────────────────────────────────────────────────────────

function base64url(input) {
  const str = typeof input === 'string' ? input : JSON.stringify(input);
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function buildJWT(secret, payload) {
  const header    = base64url({ alg: 'HS256', typ: 'JWT' });
  const body      = base64url(payload);
  const signature = createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${signature}`;
}

// ─── HANDLER ─────────────────────────────────────────────────────────────────

export default function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Validar origem
  const origin = req.headers.origin;
  if (origin && !isOriginAllowed(origin)) {
    return res.status(403).json({ error: 'Origem não autorizada.' });
  }

  // Verificar variável de ambiente
  const secret = process.env.API_SHARED_SECRET;
  if (!secret || secret.length < 32) {
    console.error('[request-token] API_SHARED_SECRET ausente ou demasiado curto.');
    return res.status(500).json({ error: 'Configuração do servidor incorrecta.' });
  }

  // Validar body
  const { nonce, timestamp } = req.body || {};

  if (!nonce || typeof nonce !== 'string' || nonce.length < 8) {
    return res.status(400).json({ error: 'Nonce inválido.' });
  }

  if (!timestamp || typeof timestamp !== 'number') {
    return res.status(400).json({ error: 'Timestamp inválido.' });
  }

  // Verificar clock skew (±30 segundos)
  const serverNow = Date.now();
  const drift = Math.abs(serverNow - timestamp);
  if (drift > 30_000) {
    return res.status(400).json({
      error: `Clock skew excessivo (${Math.round(drift / 1000)}s). Sincroniza o relógio.`,
    });
  }

  // Emitir token (válido 60s)
  const now = Math.floor(serverNow / 1000);
  const token = buildJWT(secret, {
    iss: 'fittrack-v7',
    sub: 'client-auth',
    nonce,
    iat: now,
    exp: now + 60,
  });

  // Cache-Control: sem cache (tokens são efémeros por design)
  res.setHeader('Cache-Control', 'no-store');

  return res.status(200).json({ token });
}
