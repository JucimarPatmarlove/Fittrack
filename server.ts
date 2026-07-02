import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { webcrypto, createHmac } from 'crypto';
import { readFileSync, existsSync } from 'fs';

// ─── CARREGAR VARIÁVEIS DE AMBIENTE ──────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env and .env.local (Node.js doesn't do this automatically)
function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.substring(0, eqIdx).trim();
    let value = trimmed.substring(eqIdx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(path.join(__dirname, '.env'));
loadEnvFile(path.join(__dirname, '.env.local'));

const PORT = parseInt(process.env.PORT || '3001', 10);
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const JWT_SHARED_SECRET = process.env.API_SHARED_SECRET || process.env.VITE_API_SHARED_SECRET || '';

// ─── REPLAY PROTECTION (Nonce Cache) ─────────────────────────────────────────
const usedNonces = new Map<string, number>(); // nonce → timestamp
const NONCE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Auto-clean expired nonces every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [nonce, ts] of usedNonces) {
    if (now - ts > NONCE_TTL_MS) usedNonces.delete(nonce);
  }
}, NONCE_TTL_MS);

// Inicializar Inteligência Artificial (Gemini SDK oficial)
const ai = new GoogleGenerativeAI(GEMINI_API_KEY as string);

// ─── JWT VERIFICATION (Zero-Dep) ─────────────────────────────────────────────
function base64UrlDecode(str: string): Buffer {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Buffer.from(str, 'base64');
}

async function verifyJWT(token: string) {
  if (!JWT_SHARED_SECRET) {
    // Se não há segredo, aceita em modo de desenvolvimento
    return { valid: true, payload: {} as any };
  }

  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, error: 'Token JWT malformado' };
    }

    const [headerB64, payloadB64, signatureB64] = parts;
    const key = await webcrypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(JWT_SHARED_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signingInput = `${headerB64}.${payloadB64}`;
    const signature = base64UrlDecode(signatureB64);
    const isValid = await webcrypto.subtle.verify(
      'HMAC',
      key,
      signature,
      new TextEncoder().encode(signingInput)
    );

    if (!isValid) {
      return { valid: false, error: 'Assinatura JWT inválida' };
    }

    const payload = JSON.parse(base64UrlDecode(payloadB64).toString('utf-8'));
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < now) {
      return { valid: false, error: `Token expirado` };
    }

    return { valid: true, payload };
  } catch (e: any) {
    return { valid: false, error: `Erro ao verificar JWT: ${e.message}` };
  }
}

// ─── PROMPT BUILDER (Tratamento local para AI) ───────────────────────────
function buildWorkoutPrompt(profile: any, recoveryTokens: any[], history: any[]) {
  const muscleMap: Record<string, { affects: string[]; coef: number }> = {
    'Tríceps': { affects: ['Supino', 'Press Militar', 'Fundos'], coef: 0.3 },
    'Bíceps': { affects: ['Remada', 'Puxada'], coef: 0.25 },
    'Ombros': { affects: ['Supino Inclinado'], coef: 0.2 }
  };

  const compensatory = (recoveryTokens || [])
    .filter(m => m.recoveryPct < 60)
    .map(m => ({
      muscle: m.muscle,
      impact: Math.round((60 - m.recoveryPct) * (muscleMap[m.muscle]?.coef || 0.1)),
      affected: muscleMap[m.muscle]?.affects || []
    })).filter(x => x.impact > 0);

  return `
És um treinador de elite com PhD em biomecânica trabalhando no Fittrack V7 Neural Engine.

DADOS DO ATLETA:
- Objetivo: ${profile?.goal || 'hipertrofia'}
- Nível: ${profile?.level || 'intermediate'}
- XP Atual: ${profile?.xp || 0}

RECUPERAÇÃO MUSCULAR ATUAL (Primária):
${(recoveryTokens || []).map(m => `- ${m.muscle}: ${m.recoveryPct}% recuperado (${m.hoursLeft}h p/ total)`).join('\n') || '- Sem dados de recuperação.'}

FADIGA COMPENSATÓRIA DETECTADA (Secundária):
${compensatory.map(f => `- ${f.muscle}: ${f.impact}% de impacto negativo/fraqueza esperada nos exercícios [${f.affected.join(', ')}]`).join('\n') || '- Nenhuma restrição sistémica imposta.'}

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

async function startServer() {
  const app = express();

  // Middlewares básicos
  app.use(cors());
  app.use(express.json());

  // Log requests
  app.use((req, res, next) => {
    console.log(`[BFF] ${req.method} ${req.url}`);
    next();
  });

  // ── ROTA HEALTHCHECK (Pública) ─────────────────────────────────────────────
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      hasApiKey: !!GEMINI_API_KEY,
      timestamp: Date.now(),
    });
  });

  // ── ROTA REQUEST TOKEN (JWT) ───────────────────────────────────────────────
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

      // Replay protection: reject previously used nonces
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
      console.error('[BFF] Erro ao emitir token:', e.message);
      res.status(500).json({ error: 'Erro ao emitir token.' });
    }
  });

  // ── MIDDLEWARE GATEWAY JWT (Proteção de Endpoints de IA) ────────────────────
  app.use('/api', async (req, res, next) => {
    // Excluir endpoints públicos
    if (req.path === '/health' || req.method === 'GET') {
      return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn(`[BFF] 🚫 Pedido sem token JWT de ${req.ip}`);
      res.status(401).json({ error: { message: 'Acesso Negado: Token JWT ausente.' } });
      return;
    }

    const token = authHeader.split(' ')[1];
    const jwtResult = await verifyJWT(token);

    if (!jwtResult.valid) {
      console.warn(`[BFF] 🔒 JWT rejeitado de ${req.ip}: ${jwtResult.error}`);
      res.status(403).json({ error: { message: `Acesso Negado: ${jwtResult.error}` } });
      return;
    }

    next();
  });

  // ── ROTA CLAUDE (Mapeada para Gemini 3.5 Flash) ────────────────────────────
  app.post('/api/claude', async (req, res) => {
    if (!GEMINI_API_KEY) {
      res.status(500).json({ error: { message: 'A chave de API do Gemini não está configurada.' } });
      return;
    }

    try {
      const { system, messages, temperature = 0.3 } = req.body;

      if (!messages || !messages.length) {
        res.status(400).json({ error: { message: 'Nenhuma mensagem fornecida.' } });
        return;
      }

      // Extrair o texto da última mensagem do utilizador
      const lastMessage = messages[messages.length - 1];
      const userText = lastMessage.content || lastMessage.text || '';

      console.log(`[BFF] ⚡ Encaminhando ao Gemini: "${userText.slice(0, 50)}..."`);

      const model = ai.getGenerativeModel({
        model: 'gemini-3.5-flash',
        systemInstruction: system || 'És o treinador IA do FitTrack, especialista em periodização e biomecânica.',
      });

      const response = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: userText }] }],
        generationConfig: {
          temperature: temperature,
        }
      });

      console.log(`[BFF] ✅ Resposta gerada com sucesso!`);

      // Formato esperado pelo anthropicService.ts client:
      // return data.content[0].text;
      res.json({
        content: [
          {
            text: response.response.text() || 'Desculpa, não consegui obter uma resposta.'
          }
        ]
      });
    } catch (e: any) {
      console.error('[BFF] Erro no endpoint /api/claude:', e);
      res.status(500).json({ error: { message: e.message || 'Falha ao chamar o modelo Gemini.' } });
    }
  });

  // ── ROTA GENERATE WORKOUT (Mapeada para Gemini JSON) ─────────────────────────
  app.post('/api/generate-workout', async (req, res) => {
    if (!GEMINI_API_KEY) {
      res.status(500).json({ error: { message: 'A chave de API do Gemini não está configurada.' } });
      return;
    }

    try {
      const { systemPrompt, userPrompt, maxTokens = 1500, profile, recoveryTokens, history } = req.body;

      let finalSystem = systemPrompt || 'Output STRICT JSON only.';
      let finalUser = userPrompt;

      if (!finalUser && profile) {
        finalUser = buildWorkoutPrompt(profile, recoveryTokens || [], history || []);
      }

      if (!finalUser) {
        res.status(400).json({ error: { message: 'Falta o prompt do treino.' } });
        return;
      }

      console.log(`[BFF] 🏋️ Gerando treino preditivo com Gemini...`);

      const model = ai.getGenerativeModel({
        model: 'gemini-3.5-flash',
        systemInstruction: finalSystem,
      });

      const response = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: finalUser }] }],
        generationConfig: {
          temperature: 0.3,
          responseMimeType: 'application/json',
        }
      });

      const responseText = response.response.text() || '{}';

      try {
        const parsed = JSON.parse(responseText);
        const normalized = {
          id: parsed.id || 'ai_gen_predictive',
          label: parsed.label || 'Motor Preditivo V7',
          reasoning: parsed.reasoning || '',
          exercises: (parsed.exercises || []).map((e: any) => typeof e === 'string' ? e : e.name),
          exercisesDetails: parsed.exercises || [],
        };

        res.json({ content: responseText, parsed: normalized, raw: responseText });
      } catch (parseErr) {
        res.json({ content: responseText, raw: responseText });
      }
    } catch (e: any) {
      console.error('[BFF] Erro no /api/generate-workout:', e);
      res.status(500).json({ error: { message: e.message || 'Falha ao construir treino.' } });
    }
  });

  // ── CONFIGURAÇÃO DO SERVIDOR DE DEV OU PROD ───────────────────────────────
  if (process.env.NODE_ENV !== 'production') {
    // Modo de Desenvolvimento: montar o Vite Middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log(`[BFF] Servidor Vite integrado montado.`);
  } else {
    // Modo de Produção: Servir ficheiros estáticos da pasta dist/
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log(`[BFF] Servindo ficheiros de produção estáticos.`);
  }

  const startWithFallback = (portToTry: number) => {
    const server = app.listen(portToTry, '0.0.0.0', () => {
      console.log(`[BFF] FitTrack rodando no endereço http://localhost:${portToTry}`);
    });

    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`[BFF] A porta ${portToTry} está ocupada. A tentar a porta ${portToTry + 1}...`);
        startWithFallback(portToTry + 1);
      } else {
        console.error('[BFF] Erro no servidor:', err);
      }
    });
  };

  startWithFallback(PORT);
}

startServer().catch((e) => {
  console.error('[BFF] Erro crítico de arranque:', e);
});
