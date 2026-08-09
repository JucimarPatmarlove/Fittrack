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
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
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
