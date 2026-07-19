import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';
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

  const { metrics, fitnessLevel, format, availableEquipment } = req.body;
  if (!metrics || !fitnessLevel || !format) {
    return res.status(400).json({ error: 'Faltam dados essenciais (metrics, fitnessLevel, format).' });
  }

  try {
    const finalSystem = `
      És um especialista em fisiologia e periodização desportiva.
      Cria um plano de treino detalhado em JSON baseado nos parâmetros do atleta.
      Nível de fitness atual: ${fitnessLevel}.
      Formato desejado: ${format}.
      Equipamento disponível: ${availableEquipment || 'Nenhum'}.
      Métricas atuais: ${JSON.stringify(metrics)}
    `;

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash-latest',
      systemInstruction: finalSystem,
    });

    const result = await model.generateContent("Gera o treino otimizado. Responde exclusivamente com JSON válido.");
    const responseText = result.response.text();
    
    let parsedContent;
    try {
      const match = responseText.match(/```json\n([\s\S]*?)\n```/);
      const jsonString = match ? (match[1] as string) : responseText.replace(/```[a-z]*\n/g, '').replace(/```/g, '');
      parsedContent = JSON.parse(jsonString);
      return res.json({ content: parsedContent });
    } catch (parseErr) {
      return res.json({ content: responseText, raw: responseText });
    }
  } catch (e: any) {
    console.error('[Vercel API] Erro no /api/generate-workout:', e);
    return res.status(500).json({ error: { message: e.message || 'Falha ao construir treino.' } });
  }
}
