import { createHmac } from 'crypto';

/**
 * FitTrack V7 — Vercel Serverless: /api/request-token
 * ════════════════════════════════════════════════════
 * 
 * Endpoint de negociação JWT (Zero Trust).
 * O frontend pede um token efémero (60s) enviando nonce + timestamp.
 * O segredo NUNCA sai do servidor.
 * 
 * Variáveis de Ambiente (Vercel Dashboard):
 *   API_SHARED_SECRET — Segredo para assinar tokens JWT
 */

const ALLOWED_ORIGINS = [
  'https://fittrack-v7.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
  'https://localhost:5173',
];

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  // Permitir IPs de rede local (192.168.x.x, 10.x.x.x) para testes mobile
  if (/^https?:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/.test(origin)) return true;
  // Permitir previews da Vercel
  if (origin.endsWith('.vercel.app')) return true;
  return false;
}

function base64UrlEncode(buffer) {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function createJWT(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerB64 = base64UrlEncode(Buffer.from(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(Buffer.from(JSON.stringify(payload)));
  const signingInput = `${headerB64}.${payloadB64}`;
  const signature = createHmac('sha256', secret).update(signingInput).digest();
  const signatureB64 = base64UrlEncode(signature);
  return `${signingInput}.${signatureB64}`;
}

export default function handler(req, res) {
  const origin = req.headers.origin || '';

  // CORS
  if (isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  // Verificar origem em produção
  if (process.env.NODE_ENV === 'production' && !isAllowedOrigin(origin)) {
    return res.status(403).json({ error: 'Origem não autorizada.' });
  }

  try {
    const { nonce, timestamp } = req.body;
    const now = Date.now();

    // Validação de frescura (máx 10 segundos)
    if (!timestamp || Math.abs(now - timestamp) > 10000) {
      return res.status(400).json({ error: 'Pedido expirado ou relógio dessincronizado.' });
    }

    // Validação do nonce
    if (!nonce || typeof nonce !== 'string' || nonce.length < 16) {
      return res.status(400).json({ error: 'Nonce inválido (mín. 16 caracteres).' });
    }

    const secret = process.env.API_SHARED_SECRET;
    if (!secret) {
      console.error('[FATAL] API_SHARED_SECRET não definido no servidor.');
      return res.status(500).json({ error: 'Configuração interna em falta.' });
    }

    // Gerar JWT válido por 60 segundos
    const nowSec = Math.floor(now / 1000);
    const token = createJWT({
      origin: origin || 'unknown',
      nonce,
      iat: nowSec,
      exp: nowSec + 60,
    }, secret);

    return res.status(200).json({ token });
  } catch (error) {
    console.error('[Token Error]', error);
    return res.status(500).json({ error: 'Erro interno na emissão do token.' });
  }
}
