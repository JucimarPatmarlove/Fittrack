import type { VercelRequest, VercelResponse } from '@vercel/node';
import { VectorMemory } from '../src/services/vectorMemory';
import { aiRateLimiter } from '../src/middleware/rateLimiter';
import { runAgentLoop } from '../src/services/tools/agentLoop';

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
    // 2. Memória Vetorial (Pinecone RAG)
    const pastMemories = await VectorMemory.recallMemories(userId, prompt);
    
    const systemPrompt = `
      És o FitTrack AI Coach, um treinador de elite com acesso a ferramentas em tempo real.
      Responde de forma curta, direta e tática.
      
      Tens 3 ferramentas disponíveis:
      - pesquisar_internet: Para dados em tempo real (meteorologia, estudos, notícias)
      - consultar_metricas: Para números exatos de treino (volume, frequência, PRs)
      - auditar_repositorio: Para ler código e commits do projeto (apenas DevOps)
      
      Usa as ferramentas APENAS quando necessário. Para perguntas gerais, responde diretamente.
      
      Histórico relevante do atleta:
      ${pastMemories.length > 0 ? pastMemories.join('\n') : 'Sem histórico relevante.'}
    `;

    // 3. Agentic Loop (Gemini + Function Calling)
    const reply = await runAgentLoop(prompt, systemPrompt, userId);
    return res.status(200).json({ reply });
    
  } catch (error) {
    console.error('[Vercel API] Erro no Coach:', error);
    return res.status(500).json({ error: 'Falha nos servidores táticos.' });
  }
}
