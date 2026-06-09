import { createHmac, timingSafeEqual } from 'crypto';

/**
 * FitTrack V7 — Vercel Serverless: /api/generate-workout
 * ═══════════════════════════════════════════════════════
 * 
 * Endpoint seguro para geração de treinos via Anthropic Claude.
 * JWT HS256 (60s) + Rate Limiting implícito pela Vercel.
 * 
 * Variáveis de Ambiente (Vercel Dashboard):
 *   ANTHROPIC_API_KEY   — Chave da API Claude
 *   API_SHARED_SECRET   — Segredo JWT (idêntico ao VITE_API_SHARED_SECRET)
 */

function verifyJWT(token, secret) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    const [headerB64, payloadB64, signatureB64] = parts;
    const expectedSignature = createHmac('sha256', secret)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64url');

    // Comparação segura contra timing attacks
    const sigBuf = Buffer.from(signatureB64);
    const expBuf = Buffer.from(expectedSignature);
    if (sigBuf.length !== expBuf.length) return false;
    if (!timingSafeEqual(sigBuf, expBuf)) return false;

    // Verificar expiração
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) return false;
    if (payload.iat && payload.iat > now + 5) return false; // clock skew

    return true;
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  // ── CORS ──
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  // ── JWT Gateway ──
  const secret = process.env.API_SHARED_SECRET;
  if (secret) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Acesso Negado: Token JWT ausente.' });
    }
    if (!verifyJWT(authHeader.slice(7), secret)) {
      return res.status(403).json({ error: 'Acesso Negado: Token inválido ou expirado.' });
    }
  }

  // ── Verificar API Key ──
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY não configurada na Vercel.' });
  }

  // ── Processar pedido ──
  const { systemPrompt, userPrompt, maxTokens = 1500, profile } = req.body;

  if (!systemPrompt && !userPrompt) {
    return res.status(400).json({ error: 'Missing prompt: envia systemPrompt e/ou userPrompt.' });
  }

  let finalSystemPrompt = systemPrompt || 'És o treinador IA do FitTrack, especialista em periodização e biomecânica. Output STRICT JSON.';
  if (profile?.goal === 'v_taper_aesthetics') {
    finalSystemPrompt += '\n\nO utilizador tem como objetivo **V-Taper Aesthetics** (estética em V). Prioriza exercícios que aumentem a largura dos ombros (deltoides laterais) e do latíssimo do dorso. Evita exercícios que possam hipertrofiar os oblíquos (ex: flexões laterais com peso). Recomenda a prática diária de Stomach Vacuum para afinar a cintura.';
  }

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: maxTokens,
        temperature: 0.3,
        system: finalSystemPrompt,
        messages: [{ role: 'user', content: userPrompt || finalSystemPrompt }],
      }),
    });

    const data = await anthropicRes.json();

    if (!anthropicRes.ok) {
      console.error('[Vercel] Anthropic error:', data);
      return res.status(anthropicRes.status).json({ error: data.error?.message || 'Erro na Anthropic' });
    }

    // Tentar extrair JSON da resposta
    const text = data.content?.[0]?.text || '';
    let content = text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) content = jsonMatch[0];

    return res.status(200).json({ content, raw: text });
  } catch (error) {
    console.error('[Vercel] Error:', error);
    return res.status(500).json({ error: error.message || 'Erro interno no servidor.' });
  }
}
