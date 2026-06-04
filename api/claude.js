import { createHmac, timingSafeEqual } from 'crypto';

/**
 * FitTrack V7 — Vercel Serverless: /api/claude
 * ══════════════════════════════════════════════
 * 
 * Proxy genérico para a API Messages da Anthropic.
 * Usado pelo AICoach e WeeklyPlanGenerator.
 */

function verifyJWT(token, secret) {
  try {
    const [headerB64, payloadB64, signatureB64] = token.split('.');
    const expectedSignature = createHmac('sha256', secret)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64url');
    const sigBuf = Buffer.from(signatureB64);
    const expBuf = Buffer.from(expectedSignature);
    if (sigBuf.length !== expBuf.length) return false;
    if (!timingSafeEqual(sigBuf, expBuf)) return false;
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
    const now = Math.floor(Date.now() / 1000);
    return !(payload.exp && payload.exp < now);
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  // JWT Gateway
  const secret = process.env.API_SHARED_SECRET;
  if (secret) {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ') || !verifyJWT(auth.slice(7), secret)) {
      return res.status(403).json({ error: 'Token inválido ou expirado.' });
    }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API Key não configurada.' });

  // Sanitizar payload
  const payload = { ...req.body };
  delete payload.api_key;
  delete payload.apiKey;

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: payload.model || 'claude-3-5-sonnet-20241022',
        max_tokens: payload.max_tokens || 1500,
        system: payload.system || 'És o treinador IA do FitTrack.',
        temperature: payload.temperature ?? 0.3,
        messages: payload.messages || [{ role: 'user', content: 'Olá' }],
      }),
    });

    const data = await anthropicRes.json();
    return res.status(anthropicRes.status).json(data);
  } catch (error) {
    console.error('[Vercel] Claude proxy error:', error);
    return res.status(500).json({ error: error.message });
  }
}
