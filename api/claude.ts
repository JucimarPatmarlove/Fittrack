import { GoogleGenerativeAI } from '@google/generative-ai';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { aiRateLimiter, protectApi } from '../src/middleware/auth';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Proteção JWT
  if (!(await protectApi(req, res))) return;

  // Rate Limiting
  if (!(await aiRateLimiter(req, res))) return;

  const { text: userText, system } = req.body;

  if (!userText) {
    return res.status(400).json({ error: 'Falta o parâmetro "text" no corpo do pedido.' });
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash-latest',
      systemInstruction: system || 'És o treinador IA do FitTrack.',
    });

    const result = await model.generateContent(userText);
    return res.json({ reply: result.response.text() });
  } catch (e: any) {
    console.error('[Vercel API] Erro no /api/claude:', e);
    return res
      .status(500)
      .json({ error: { message: e.message || 'Ocorreu um erro ao processar o pedido.' } });
  }
}
