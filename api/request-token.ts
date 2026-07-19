import type { VercelRequest, VercelResponse } from '@vercel/node';
import { webcrypto } from 'crypto';

function base64UrlEncode(buffer: Buffer): string {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { deviceId, nonce } = req.body;
  const JWT_SHARED_SECRET = process.env.JWT_SHARED_SECRET;

  if (!JWT_SHARED_SECRET) {
    console.error('[CRITICAL] JWT_SHARED_SECRET ausente nas variáveis de ambiente!');
    return res.status(500).json({ error: 'Erro de configuração no servidor.' });
  }

  if (!deviceId || !nonce) {
    return res.status(400).json({ error: 'Missing deviceId or nonce' });
  }

  try {
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = {
      iss: 'fittrack-client',
      deviceId,
      nonce,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 5, // 5 minutos
    };

    const headerB64 = base64UrlEncode(Buffer.from(JSON.stringify(header)));
    const payloadB64 = base64UrlEncode(Buffer.from(JSON.stringify(payload)));
    const signingInput = `${headerB64}.${payloadB64}`;

    const key = await webcrypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(JWT_SHARED_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await webcrypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(signingInput)
    );

    const signatureB64 = base64UrlEncode(Buffer.from(signatureBuffer));
    const token = `${signingInput}.${signatureB64}`;

    return res.json({ token });
  } catch (e: any) {
    console.error('[Vercel API] Erro ao emitir token:', e.message);
    return res.status(500).json({ error: 'Erro ao emitir token.' });
  }
}
