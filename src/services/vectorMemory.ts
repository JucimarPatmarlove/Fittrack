import { GoogleGenerativeAI } from '@google/generative-ai';
import { Pinecone } from '@pinecone-database/pinecone';

// Inicialização das chaves (a configurar no teu .env)
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY || '' });
// O nome do index que vais criar no painel do Pinecone
const index = pc.index('fittrack-memory');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export class VectorMemory {
  /**
   * 1. Converte o texto (resumo do treino ou pergunta do utilizador) num vetor matemático
   */
  private static async getEmbedding(text: string): Promise<number[]> {
    try {
      // O modelo "text-embedding-004" da Google é rápido e barato
      const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
      const result = await model.embedContent(text);
      return result.embedding.values;
    } catch (error) {
      console.error('[VectorMemory] Falha ao gerar embedding:', error);
      throw error;
    }
  }

  /**
   * 2. Guarda o resumo de um treino finalizado no Pinecone
   */
  public static async memorizeWorkout(userId: string, workoutId: string, summary: string) {
    try {
      const vector = await this.getEmbedding(summary);

      await index.upsert([
        {
          id: workoutId,
          values: vector,
          metadata: {
            userId,
            summary,
            timestamp: Date.now(),
          },
        },
      ]);

      console.log(`[Pinecone] Treino ${workoutId} injetado na matrix vetorial.`);
    } catch (error) {
      console.error('[Pinecone] Falha ao memorizar treino:', error);
    }
  }

  /**
   * 3. Puxa as memórias passadas mais relevantes para o contexto atual
   */
  public static async recallMemories(userId: string, userQuery: string): Promise<string[]> {
    try {
      // Converte a pergunta do utilizador num vetor para procurar semelhanças
      const queryVector = await this.getEmbedding(userQuery);

      const response = await index.query({
        vector: queryVector,
        topK: 3, // Puxa apenas os 3 treinos com maior relevância matemática
        includeMetadata: true,
        filter: { userId: { $eq: userId } }, // Garante que não mistura dados de utilizadores diferentes
      });

      // Extrai os resumos de texto dos metadados devolvidos
      const memories = (response.matches || [])
        .map((match) => match.metadata?.summary as string)
        .filter((summary) => summary !== undefined);

      return memories;
    } catch (error) {
      console.error('[Pinecone] Falha ao recuperar memórias:', error);
      return [];
    }
  }
}
