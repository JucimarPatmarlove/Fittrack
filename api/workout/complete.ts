import type { VercelRequest, VercelResponse } from '@vercel/node';
import { VectorMemory } from '../../src/services/vectorMemory';
import { protectApi } from '../../src/middleware/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Proteção JWT
  if (!(await protectApi(req, res))) return;

  const { userId, workoutId, summary } = req.body;
  
  // Responde imediatamente ao frontend para não bloquear a UI
  res.status(200).json({ message: 'Treino recebido. Sincronização vetorial pendente na Edge.' });

  // Processa a gravação no Pinecone
  if (userId && workoutId && summary) {
    try {
      await VectorMemory.memorizeWorkout(userId, workoutId, summary);
    } catch(e) {
      console.error('[Vercel API] Falha na sincronização vetorial em background:', e);
    }
  }
  return;
}
