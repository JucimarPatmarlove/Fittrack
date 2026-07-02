import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { webcrypto, createHmac } from 'crypto';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const JWT_SHARED_SECRET = process.env.API_SHARED_SECRET || process.env.VITE_API_SHARED_SECRET || '';

const ai = new GoogleGenerativeAI(GEMINI_API_KEY as string);

// ─── REPLAY PROTECTION (Nonce Cache) ─────────────────────────────────────────
const usedNonces = new Map<string, number>();
const NONCE_TTL_MS = 5 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  for (const [nonce, ts] of usedNonces) {
    if (now - ts > NONCE_TTL_MS) usedNonces.delete(nonce);
  }
}, NONCE_TTL_MS);

function base64UrlDecode(str: string): Buffer {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Buffer.from(str, 'base64');
}

async function verifyJWT(token: string) {
  if (!JWT_SHARED_SECRET) return { valid: true, payload: {} as any };
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return { valid: false, error: 'Token JWT malformado' };
    const [headerB64, payloadB64, signatureB64] = parts;
    const key = await webcrypto.subtle.importKey(
      'raw', new TextEncoder().encode(JWT_SHARED_SECRET),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
    );
    const signingInput = `${headerB64}.${payloadB64}`;
    const signature = new Uint8Array(base64UrlDecode(signatureB64));
    const isValid = await webcrypto.subtle.verify('HMAC', key, signature, new TextEncoder().encode(signingInput));
    if (!isValid) return { valid: false, error: 'Assinatura JWT inválida' };
    const payload = JSON.parse(base64UrlDecode(payloadB64).toString('utf-8'));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) return { valid: false, error: `Token expirado` };
    return { valid: true, payload };
  } catch (e: any) {
    return { valid: false, error: `Erro ao verificar JWT: ${e.message}` };
  }
}

function buildWorkoutPrompt(profile: any, recoveryTokens: any[], history: any[]) {
  const muscleMap: Record<string, { affects: string[]; coef: number }> = {
    'Tríceps': { affects: ['Supino', 'Press Militar', 'Fundos'], coef: 0.3 },
    'Bíceps': { affects: ['Remada', 'Puxada'], coef: 0.25 },
    'Ombros': { affects: ['Supino Inclinado'], coef: 0.2 }
  };
  const compensatory = (recoveryTokens || [])
    .filter((m: any) => m.recoveryPct < 60)
    .map((m: any) => ({
      muscle: m.muscle,
      impact: Math.round((60 - m.recoveryPct) * (muscleMap[m.muscle]?.coef || 0.1)),
      affected: muscleMap[m.muscle]?.affects || []
    })).filter((x: any) => x.impact > 0);

  return `
És um treinador de elite com PhD em biomecânica trabalhando no Fittrack V7 Neural Engine.

DADOS DO ATLETA:
- Objetivo: ${profile?.goal || 'hipertrofia'}
- Nível: ${profile?.level || 'intermediate'}
- XP Atual: ${profile?.xp || 0}

RECUPERAÇÃO MUSCULAR ATUAL (Primária):
${(recoveryTokens || []).map((m: any) => `- ${m.muscle}: ${m.recoveryPct}% recuperado (${m.hoursLeft}h p/ total)`).join('\n') || '- Sem dados de recuperação.'}

FADIGA COMPENSATÓRIA DETECTADA (Secundária):
${compensatory.map((f: any) => `- ${f.muscle}: ${f.impact}% de impacto negativo/fraqueza esperada nos exercícios [${f.affected.join(', ')}]`).join('\n') || '- Nenhuma restrição sistémica imposta.'}

INSTRUÇÕES CORE:
1. Se a recuperacaoPct de um músculo < 50%, NÃO inclua exercícios que o usem como alvo principal.
2. Se há fadiga compensatória, adapte notas técnicas recomendando a redução da carga ou o foco excêntrico intenso.
3. Aplique Periodização Ondulatória no JSON gerado:
   - Hipertrofia: 8-12 reps, 75% 1RM
   - Força: 3-5 reps, 85-90% 1RM
   - Condicionamento/Perda Peso: 15-20 reps, 50% 1RM

Retorna EXCLUSIVAMENTE um objeto JSON estrito com esta shape, NADA mais:
{
  "id": "ai_gen_predictive",
  "label": "Motor Preditivo V7",
  "reasoning": "Explica em 1 parágrafo curto.",
  "exercises": [
     {"name": "Nome Válido", "sets": 3, "reps": 10, "rest": 90, "percent1RM": 0.75, "notes": "Foca-te na contração..."}
  ]
}`;
}

const app = express();
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[BFF VERCEL] ${req.method} ${req.url}`);
  next();
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    hasApiKey: !!GEMINI_API_KEY,
    timestamp: Date.now(),
  });
});

app.post('/api/request-token', async (req, res) => {
  try {
    const { nonce, timestamp } = req.body;
    const now = Date.now();
    if (!timestamp || Math.abs(now - timestamp) > 30000) {
      res.status(400).json({ error: 'Pedido expirado ou relógio dessincronizado.' });
      return;
    }
    if (!nonce || typeof nonce !== 'string' || nonce.length < 16) {
      res.status(400).json({ error: 'Nonce inválido (mín. 16 caracteres).' });
      return;
    }
    // Replay protection
    if (usedNonces.has(nonce)) {
      res.status(400).json({ error: 'Nonce já utilizado. Gera um novo nonce por pedido.' });
      return;
    }
    usedNonces.set(nonce, Date.now());
    if (!JWT_SHARED_SECRET) {
      res.json({ token: 'dev-no-secret-token' });
      return;
    }
    const nowSec = Math.floor(now / 1000);
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = { origin: req.headers.origin || 'local', nonce, iat: nowSec, exp: nowSec + 300 };

    const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signingInput = `${headerB64}.${payloadB64}`;
    const sig = createHmac('sha256', JWT_SHARED_SECRET).update(signingInput).digest('base64url');

    res.json({ token: `${signingInput}.${sig}` });
  } catch (e: any) {
    console.error('[BFF VERCEL] Erro ao emitir token:', e.message);
    res.status(500).json({ error: 'Erro ao emitir token.' });
  }
});

app.use('/api', async (req, res, next) => {
  if (req.path === '/health' || req.method === 'GET') return next();
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: { message: 'Acesso Negado: Token JWT ausente.' } });
    return;
  }
  const token = authHeader.split(' ')[1];
  const jwtResult = await verifyJWT(token);
  if (!jwtResult.valid) {
    res.status(403).json({ error: { message: `Acesso Negado: ${jwtResult.error}` } });
    return;
  }
  next();
});

app.post('/api/claude', async (req, res) => {
  if (!GEMINI_API_KEY) {
    res.status(500).json({ error: { message: 'A chave de API do Gemini não está configurada.' } });
    return;
  }
  try {
    const { system, messages, temperature = 0.3 } = req.body;
    const lastMessage = messages[messages.length - 1];
    const userText = lastMessage.content || lastMessage.text || '';
    const model = ai.getGenerativeModel({
      model: 'gemini-3.5-flash',
      systemInstruction: system || 'És o treinador IA do FitTrack.',
    });
    const response = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: userText }] }],
      generationConfig: { temperature }
    });
    res.json({ content: [{ text: response.response.text() || 'Desculpa, não consegui obter uma resposta.' }] });
  } catch (e: any) {
    res.status(500).json({ error: { message: e.message || 'Falha ao chamar o modelo Gemini.' } });
  }
});

app.post('/api/generate-workout', async (req, res) => {
  if (!GEMINI_API_KEY) {
    res.status(500).json({ error: { message: 'A chave de API do Gemini não está configurada.' } });
    return;
  }
  try {
    const { systemPrompt, userPrompt, profile, recoveryTokens, history } = req.body;
    let finalSystem = systemPrompt || 'Output STRICT JSON only.';
    let finalUser = userPrompt || (profile ? buildWorkoutPrompt(profile, recoveryTokens || [], history || []) : null);
    if (!finalUser) {
      res.status(400).json({ error: { message: 'Falta o prompt do treino.' } });
      return;
    }
    const model = ai.getGenerativeModel({ model: 'gemini-3.5-flash', systemInstruction: finalSystem });
    const response = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: finalUser }] }],
      generationConfig: { temperature: 0.3, responseMimeType: 'application/json' }
    });
    const responseText = response.response.text() || '{}';
    try {
      const parsed = JSON.parse(responseText);
      const normalized = {
        id: parsed.id || 'ai_gen_predictive', label: parsed.label || 'Motor Preditivo V7',
        reasoning: parsed.reasoning || '',
        exercises: (parsed.exercises || []).map((e: any) => typeof e === 'string' ? e : e.name),
        exercisesDetails: parsed.exercises || [],
      };
      res.json({ content: responseText, parsed: normalized, raw: responseText });
    } catch {
      res.json({ content: responseText, raw: responseText });
    }
  } catch (e: any) {
    res.status(500).json({ error: { message: e.message || 'Falha ao construir treino.' } });
  }
});

export default app;
