import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { VectorMemory } from '../src/services/vectorMemory';
import { aiRateLimiter } from '../src/middleware/rateLimiter';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 1. Aplica a blindagem do Upstash Redis
  const isAllowed = await aiRateLimiter(req, res);
  if (!isAllowed) return;

  const { userId, prompt } = req.body;

  if (!userId || !prompt) {
    return res.status(400).json({ error: 'Faltam dados críticos (userId ou prompt).' });
  }

  try {
    // 2. Memória Vetorial (Pinecone)
    const pastMemories = await VectorMemory.recallMemories(userId, prompt);
    
    const systemPrompt = `
      És o FitTrack AI Coach. Responde de forma curta, direta e tática.
      Histórico: ${pastMemories.length > 0 ? pastMemories.join('\n') : 'Sem histórico relevante.'}
    `;

    // 3. Chamada ao Gemini
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash-latest",
      systemInstruction: systemPrompt 
    });

    const result = await model.generateContent(prompt);
    res.status(200).json({ reply: result.response.text() });
    
  } catch (error) {
    console.error('[Vercel API] Erro no Coach:', error);
    res.status(500).json({ error: 'Falha nos servidores táticos.' });
  }
}
