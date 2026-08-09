import { webcrypto } from 'crypto';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Conexão ao Upstash
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// Algoritmo Sliding Window: 10 requests a cada 60 segundos
const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, '60 s'),
  analytics: true,
});

export const aiRateLimiter = async (req: VercelRequest, res: VercelResponse): Promise<boolean> => {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
    const identifier = Array.isArray(ip) ? ip[0] : ip;

    const { success, limit, remaining, reset } = await ratelimit.limit(`ai_limit_${identifier}`);

    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', reset);

    if (!success) {
      console.warn(`[Upstash] Bloqueio tático ativado. IP: ${identifier} excedeu a quota.`);
      res.status(429).json({
        error: 'Demasiados pedidos. Descansa 1 minuto e tenta novamente.',
      });
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Upstash] Falha no Rate Limiter, a permitir tráfego por precaução:', error);
    return true; // Se o Redis falhar, não quebramos a app inteira
  }
};

// ─── JWT VERIFICATION ─────────────────────────────────────────────
function base64UrlDecode(str: string): Buffer {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Buffer.from(str, 'base64');
}

export async function verifyJWT(token: string) {
  const JWT_SHARED_SECRET = process.env.JWT_SHARED_SECRET;
  if (!JWT_SHARED_SECRET) {
    console.error('[CRITICAL] JWT_SHARED_SECRET ausente nas variáveis de ambiente!');
    return { valid: false, error: 'Erro interno de configuração de segurança.' };
  }

  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, error: 'Token JWT malformado' };
    }

    const headerB64 = parts[0] as string;
    const payloadB64 = parts[1] as string;
    const signatureB64 = parts[2] as string;
    const key = await webcrypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(JWT_SHARED_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    );

    const signingInput = `${headerB64}.${payloadB64}`;
    const signature = base64UrlDecode(signatureB64);
    const isValid = await webcrypto.subtle.verify(
      'HMAC',
      key,
      signature,
      new TextEncoder().encode(signingInput),
    );

    if (!isValid) {
      return { valid: false, error: 'Assinatura JWT inválida' };
    }

    const payload = JSON.parse(base64UrlDecode(payloadB64).toString('utf-8'));

    // Validar expiração
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return { valid: false, error: 'Token expirado' };
    }

    // Proteger contra Replay Attacks com Upstash Redis (Nonces)
    if (payload.nonce) {
      const isNew = await redis.set(`nonce_${payload.nonce}`, '1', { ex: 300, nx: true });
      if (!isNew) {
        return { valid: false, error: 'Replay attack detetado (Nonce reutilizado)' };
      }
    }

    return { valid: true, payload };
  } catch (e: any) {
    return { valid: false, error: e.message || 'Erro na verificação JWT' };
  }
}

export async function protectApi(req: VercelRequest, res: VercelResponse): Promise<boolean> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Acesso negado. Token ausente.' });
    return false;
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    res.status(401).json({ error: 'Acesso negado. Token mal formatado.' });
    return false;
  }
  const { valid, error } = await verifyJWT(token);

  if (!valid) {
    res.status(403).json({ error: `Acesso bloqueado: ${error}` });
    return false;
  }

  return true;
}
