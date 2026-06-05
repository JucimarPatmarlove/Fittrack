/**
 * FitTrack V7 — Servidor Proxy BFF (Backend For Frontend)
 * ════════════════════════════════════════════════════════
 * 
 * ARQUITETURA ZERO TRUST:
 *   Frontend (React/Vite)  →  Este Servidor (Node.js)  →  API Anthropic
 *   A API Key NUNCA toca no browser. Fica isolada neste processo Node.
 *
 * USA O SDK OFICIAL DA ANTHROPIC (@anthropic-ai/sdk) para chamadas tipo-safe.
 * O servidor HTTP usa módulos nativos Node.js (sem Express).
 * Quando a rede voltar, podes instalar express/cors/dotenv se quiseres.
 * 
 * EXECUÇÃO:
 *   node server.js
 *   (corre na porta 3001 por defeito, configurável via PORT no .env)
 * 
 * ENDPOINTS:
 *   POST /api/claude             — Proxy genérico para a API Messages
 *   POST /api/generate-workout   — Endpoint especializado (prompt no servidor)
 *   GET  /api/health             — Health check
 */

import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { webcrypto } from 'crypto';
import Anthropic from '@anthropic-ai/sdk';

// ─── CARREGAR VARIÁVEIS DE AMBIENTE (.env manual) ────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadEnv() {
  const envPath = resolve(__dirname, '.env');
  if (!existsSync(envPath)) {
    console.warn('[BFF] ⚠️  Ficheiro .env não encontrado. A usar variáveis de ambiente do sistema.');
    return;
  }
  
  const content = readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.substring(0, eqIdx).trim();
    let value = trimmed.substring(eqIdx + 1).trim();
    // Remove aspas envolventes
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
  console.log('[BFF] ✅ Variáveis de ambiente carregadas do .env');
}

loadEnv();

// ─── CONFIGURAÇÃO ────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT || '3001', 10);
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const JWT_SHARED_SECRET = process.env.API_SHARED_SECRET || process.env.VITE_API_SHARED_SECRET || '';

// Instanciar o SDK oficial da Anthropic
const anthropic = ANTHROPIC_API_KEY 
  ? new Anthropic({ apiKey: ANTHROPIC_API_KEY })
  : null;

// ─── JWT VERIFICATION (Zero-Dep, Node.js Crypto) ─────────────────────────────

function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Buffer.from(str, 'base64');
}

async function verifyJWT(token) {
  if (!JWT_SHARED_SECRET) {
    // Se não há segredo configurado, aceita tudo (modo dev)
    console.warn('[BFF] ⚠️ JWT desactivado (API_SHARED_SECRET não definido)');
    return { valid: true, payload: {} };
  }

  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, error: 'Token JWT malformado' };
    }

    const [headerB64, payloadB64, signatureB64] = parts;

    // Verificar assinatura HMAC-SHA256
    const subtle = webcrypto.subtle;
    const key = await subtle.importKey(
      'raw',
      new TextEncoder().encode(JWT_SHARED_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signingInput = `${headerB64}.${payloadB64}`;
    const signature = base64UrlDecode(signatureB64);
    const isValid = await subtle.verify(
      'HMAC',
      key,
      signature,
      new TextEncoder().encode(signingInput)
    );

    if (!isValid) {
      return { valid: false, error: 'Assinatura JWT inválida' };
    }

    // Verificar expiração
    const payload = JSON.parse(base64UrlDecode(payloadB64).toString('utf-8'));
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < now) {
      return { valid: false, error: `Token expirado há ${now - payload.exp}s` };
    }

    // Verificar que não é do futuro distante (clock skew max 5s)
    if (payload.iat && payload.iat > now + 5) {
      return { valid: false, error: 'Token emitido no futuro (clock skew)' };
    }

    return { valid: true, payload };
  } catch (e) {
    return { valid: false, error: `Erro ao verificar JWT: ${e.message}` };
  }
}

// Origens permitidas para CORS
const ALLOWED_ORIGINS = new Set([
  'http://localhost:5173',
  'http://localhost:5174',
  'https://localhost:5173',
  'https://localhost:5174',
  'http://localhost:3000',
  'https://localhost:3000',
]);

// Adicionar origens de rede local (192.168.x.x) dinamicamente
function isAllowedOrigin(origin) {
  if (!origin) return true; // same-origin
  if (ALLOWED_ORIGINS.has(origin)) return true;
  // Permitir qualquer IP local (192.168.x.x, 10.x.x.x) para testes no iPhone
  if (/^https?:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/.test(origin)) {
    return true;
  }
  // Em produção, adiciona o teu domínio real aqui
  if (process.env.NODE_ENV === 'production' && process.env.ALLOWED_ORIGIN) {
    return origin === process.env.ALLOWED_ORIGIN;
  }
  return false;
}

// ─── UTILIDADES HTTP ─────────────────────────────────────────────────────────

/** Lê o body completo de um IncomingMessage */
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB limite
    
    req.on('data', chunk => {
      size += chunk.length;
      if (size > MAX_SIZE) {
        reject(new Error('Payload demasiado grande (máx 10MB)'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    req.on('error', reject);
  });
}

/** Retorna headers CORS */
function getCorsHeaders(origin) {
  const allowed = isAllowedOrigin(origin) ? (origin || '*') : ALLOWED_ORIGINS.values().next().value;
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

/** Envia uma resposta JSON */
function sendJSON(res, statusCode, data, origin = '') {
  const cors = getCorsHeaders(origin);
  res.writeHead(statusCode, { 
    'Content-Type': 'application/json',
    ...cors,
  });
  res.end(JSON.stringify(data));
}

// ─── RATE LIMITING SIMPLES (em memória) ──────────────────────────────────────

const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minuto
const RATE_LIMIT_MAX = 15; // máx 15 pedidos por minuto

function isRateLimited(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { windowStart: now, count: 1 });
    return false;
  }
  
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

// Limpar entradas expiradas periodicamente
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS * 2) {
      rateLimitMap.delete(ip);
    }
  }
}, 120_000);

// ─── SERVIDOR HTTP ───────────────────────────────────────────────────────────

const server = createServer(async (req, res) => {
  const origin = req.headers.origin || '';
  const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const { method, url } = req;

  // ── CORS Preflight ──
  if (method === 'OPTIONS') {
    const cors = getCorsHeaders(origin);
    res.writeHead(204, cors);
    res.end();
    return;
  }

  // ── Health Check ──
  if (method === 'GET' && url === '/api/health') {
    sendJSON(res, 200, { 
      status: 'ok', 
      uptime: process.uptime(),
      hasApiKey: !!ANTHROPIC_API_KEY,
      timestamp: Date.now(),
    }, origin);
    return;
  }

  // ── Rate Limiting ──
  if (isRateLimited(clientIP)) {
    console.warn(`[BFF] ⛔ Rate limit excedido para ${clientIP}`);
    sendJSON(res, 429, { error: { message: 'Too many requests. Aguarda 1 minuto.' } }, origin);
    return;
  }

  // ══════════════════════════════════════════════════════════════════
  // POST /api/request-token — Emissão de JWT efémero (SEM autenticação)
  // ══════════════════════════════════════════════════════════════════
  if (method === 'POST' && url === '/api/request-token') {
    try {
      const body = await readBody(req);
      const { nonce, timestamp } = JSON.parse(body);
      const now = Date.now();

      if (!timestamp || Math.abs(now - timestamp) > 10000) {
        sendJSON(res, 400, { error: 'Pedido expirado ou relógio dessincronizado.' }, origin);
        return;
      }
      if (!nonce || typeof nonce !== 'string' || nonce.length < 16) {
        sendJSON(res, 400, { error: 'Nonce inválido (mín. 16 caracteres).' }, origin);
        return;
      }

      if (!JWT_SHARED_SECRET) {
        // Dev mode sem segredo: emitir token dummy
        sendJSON(res, 200, { token: 'dev-no-secret-token' }, origin);
        return;
      }

      // Gerar JWT com crypto nativo
      const nowSec = Math.floor(now / 1000);
      const header = { alg: 'HS256', typ: 'JWT' };
      const payload = { origin: origin || 'local', nonce, iat: nowSec, exp: nowSec + 60 };

      const { webcrypto: wc } = await import('crypto');
      const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
      const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
      const signingInput = `${headerB64}.${payloadB64}`;

      const { createHmac } = await import('crypto');
      const sig = createHmac('sha256', JWT_SHARED_SECRET).update(signingInput).digest('base64url');

      const token = `${signingInput}.${sig}`;
      console.log(`[BFF] 🎟️ Token emitido para ${clientIP} (exp: 60s)`);
      sendJSON(res, 200, { token }, origin);
    } catch (e) {
      console.error('[BFF] ❌ Erro ao emitir token:', e.message);
      sendJSON(res, 500, { error: 'Erro ao emitir token.' }, origin);
    }
    return;
  }

  // ══════════════════════════════════════════════════════════════════
  // JWT GATEWAY — Validação de token em TODOS os outros pedidos POST
  // ══════════════════════════════════════════════════════════════════
  if (method === 'POST') {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn(`[BFF] 🚫 Pedido sem token JWT de ${clientIP}`);
      sendJSON(res, 401, { error: { message: 'Acesso Negado: Token JWT ausente. Envia Authorization: Bearer <token>.' } }, origin);
      return;
    }

    const token = authHeader.split(' ')[1];
    const jwtResult = await verifyJWT(token);

    if (!jwtResult.valid) {
      console.warn(`[BFF] 🔒 JWT rejeitado de ${clientIP}: ${jwtResult.error}`);
      sendJSON(res, 403, { error: { message: `Acesso Negado: ${jwtResult.error}` } }, origin);
      return;
    }

    console.log(`[BFF] ✅ JWT válido (origin: ${jwtResult.payload.origin || 'unknown'})`);
  }

  // ── Verificar que o SDK está inicializado ──
  if (!anthropic) {
    sendJSON(res, 500, { 
      error: { message: 'ANTHROPIC_API_KEY não está configurada no servidor. Cria um ficheiro .env com a tua chave.' } 
    }, origin);
    return;
  }

  // ══════════════════════════════════════════════════════════════════
  // POST /api/claude — Proxy genérico para a API Messages da Anthropic
  // ══════════════════════════════════════════════════════════════════
  if (method === 'POST' && url === '/api/claude') {
    try {
      const body = await readBody(req);
      const payload = JSON.parse(body);

      // Sanitização: remover campos que o cliente não deveria enviar
      delete payload.api_key;
      delete payload.apiKey;

      console.log(`[BFF] 📡 /api/claude → model: ${payload.model}, max_tokens: ${payload.max_tokens}`);
      
      // Chamar a API da Anthropic via SDK oficial
      const response = await anthropic.messages.create({
        model: payload.model || 'claude-3-5-sonnet-20241022',
        max_tokens: payload.max_tokens || 1500,
        system: payload.system || 'És o treinador IA do FitTrack, especialista em periodização e biomecânica.',
        temperature: payload.temperature,
        messages: payload.messages || [{ role: 'user', content: 'Olá' }],
      });

      sendJSON(res, 200, response, origin);
    } catch (e) {
      console.error('[BFF] ❌ Erro no /api/claude:', e.message);
      const status = e.status || 500;
      sendJSON(res, status, { error: { message: e.message } }, origin);
    }
    return;
  }

  // ══════════════════════════════════════════════════════════════════
  // POST /api/generate-workout — Endpoint especializado
  // ══════════════════════════════════════════════════════════════════
  if (method === 'POST' && url === '/api/generate-workout') {
    try {
      const body = await readBody(req);
      const { systemPrompt, userPrompt, maxTokens = 1500, profile, recoveryTokens, history } = JSON.parse(body);

      // Suporta dois modos:
      // 1. systemPrompt + userPrompt (genérico, enviado pelo cliente)
      // 2. profile + recoveryTokens + history (construção do prompt no servidor)
      let finalSystem = systemPrompt || 'Output STRICT JSON only.';
      let finalUser = userPrompt;

      if (!finalUser && profile) {
        // Construir o prompt no servidor (lógica de negócio protegida)
        finalUser = buildWorkoutPrompt(profile, recoveryTokens || [], history || []);
      }

      if (!finalUser) {
        sendJSON(res, 400, { error: { message: 'Missing prompt: envia systemPrompt+userPrompt ou profile+recoveryTokens.' } }, origin);
        return;
      }

      console.log(`[BFF] 🏋️ /api/generate-workout → maxTokens: ${maxTokens}`);

      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: maxTokens,
        system: finalSystem,
        temperature: 0.3,
        messages: [{ role: 'user', content: finalUser }],
      });

      const text = response.content[0].text;

      // Tentar extrair JSON da resposta (a IA pode devolver markdown)
      let json = text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) json = jsonMatch[0];

      try {
        const parsed = JSON.parse(json);
        // Normalizar para o formato do ActiveWorkout
        const normalized = {
          id: parsed.id || 'ai_gen_predictive',
          label: parsed.label || 'Motor Preditivo V7',
          reasoning: parsed.reasoning || '',
          exercises: (parsed.exercises || []).map((e) => typeof e === 'string' ? e : e.name),
          exercisesDetails: parsed.exercises || [],
        };
        sendJSON(res, 200, { content: json, parsed: normalized, raw: text }, origin);
      } catch (parseErr) {
        // Se não conseguiu fazer parse, retorna o texto bruto
        sendJSON(res, 200, { content: json, raw: text }, origin);
      }
    } catch (e) {
      console.error('[BFF] ❌ Erro no /api/generate-workout:', e.message);
      const status = e.status || 500;
      sendJSON(res, status, { error: { message: e.message } }, origin);
    }
    return;
  }

  // ── 404 — Rota não encontrada ──
  sendJSON(res, 404, { error: { message: `Rota ${method} ${url} não encontrada.` } }, origin);
});

// ─── PROMPT BUILDER (lógica de negócio no servidor) ──────────────────────────

function buildWorkoutPrompt(profile, recoveryTokens, history) {
  const muscleMap = {
    'Tríceps': { affects: ['Supino', 'Press Militar', 'Fundos'], coef: 0.3 },
    'Bíceps': { affects: ['Remada', 'Puxada'], coef: 0.25 },
    'Ombros': { affects: ['Supino Inclinado'], coef: 0.2 }
  };

  const compensatory = recoveryTokens
    .filter(m => m.recoveryPct < 60)
    .map(m => ({
      muscle: m.muscle,
      impact: Math.round((60 - m.recoveryPct) * (muscleMap[m.muscle]?.coef || 0.1)),
      affected: muscleMap[m.muscle]?.affects || []
    })).filter(x => x.impact > 0);

  return `
És um treinador de elite com PhD em biomecânica trabalhando no Fittrack V7 Neural Engine.

DADOS DO ATLETA:
- Objetivo: ${profile.goal || 'hipertrofia'}
- Nível: ${profile.level || 'intermediate'}
- XP Atual: ${profile.xp || 0}

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

Retorna EXCLUSIVAMENTE um objeto JSON estrito com esta shape, NADA mais (nem formatação markdown):
{
  "id": "ai_gen_predictive",
  "label": "Motor Preditivo V7",
  "reasoning": "Explica em 1 parágrafo curto.",
  "exercises": [
     {"name": "Nome Válido", "sets": 3, "reps": 10, "rest": 90, "percent1RM": 0.75, "notes": "Foca-te na contração..."}
  ]
}`;
}

// ─── ARRANQUE ────────────────────────────────────────────────────────────────

server.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║   🔐 FitTrack V7 — BFF Proxy Server (SDK Anthropic) ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log(`║   📡 Porta: ${PORT}                                     ║`);
  console.log(`║   🔑 API Key: ${ANTHROPIC_API_KEY ? '✅ Configurada' : '❌ EM FALTA'}                 ║`);
  console.log(`║   🛡️  JWT: ${JWT_SHARED_SECRET ? '✅ Activo (HS256, 60s)' : '⚠️  DESACTIVADO (dev)'}       ║`);
  console.log(`║   🤖 SDK: @anthropic-ai/sdk (oficial)                 ║`);
  console.log(`║   ⚡ Rate Limit: ${RATE_LIMIT_MAX} req/min                         ║`);
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log('║   Endpoints:                                         ║');
  console.log('║     POST /api/claude             (proxy + JWT)       ║');
  console.log('║     POST /api/generate-workout   (proxy + JWT)       ║');
  console.log('║     GET  /api/health             (público)            ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('');
  if (!ANTHROPIC_API_KEY) {
    console.warn('⚠️  ATENÇÃO: ANTHROPIC_API_KEY não definida!');
    console.warn('   Cria um ficheiro .env na raiz com:');
    console.warn('   ANTHROPIC_API_KEY=sk-ant-api03-...');
    console.warn('');
  }
});
