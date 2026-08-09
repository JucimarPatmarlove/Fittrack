/// <reference types="node" />
// ════════════════════════════════════════════════════════════════
// FitTrack V7 — Arsenal MCP: Agentic Loop (Orquestrador)
// ════════════════════════════════════════════════════════════════
//
// O "cérebro" que transforma o Gemini de chatbot em agente autónomo.
//
// CICLO:
// 1. Envia prompt + tools ao Gemini
// 2. Se o Gemini devolver functionCall(s), executa-as
// 3. Devolve os resultados ao Gemini como functionResponse
// 4. Repete até o Gemini devolver texto final (máx 3 iterações)
//
// Corre tanto no api/coach.ts (Vercel) como no server.ts (dev BFF).
// ════════════════════════════════════════════════════════════════

import { GoogleGenerativeAI, type Part } from '@google/generative-ai';
import { executeBraveSearch } from './braveSearch';
import { executeGitHubAudit } from './githubAudit';
import { executeSupabaseMetrics } from './supabaseQuery';
import { COACH_TOOLS } from './toolDefinitions';

const MAX_TOOL_ITERATIONS = 3;

/**
 * Executa uma ferramenta pelo nome e devolve o resultado como string.
 */
async function executeTool(
  toolName: string,
  args: Record<string, unknown>,
  userId: string,
): Promise<string> {
  console.log(`[Agent] 🔧 Executando ferramenta: ${toolName}`, JSON.stringify(args));

  switch (toolName) {
    case 'pesquisar_internet':
      return executeBraveSearch(args.query as string);

    case 'consultar_metricas':
      return executeSupabaseMetrics(userId, {
        metric_type: args.metric_type as string,
        exercise_name: args.exercise_name as string | undefined,
        period_days: args.period_days as number | undefined,
      });

    case 'auditar_repositorio':
      return executeGitHubAudit({
        action: args.action as 'recent_commits' | 'file_content' | 'open_issues',
        file_path: args.file_path as string | undefined,
        branch: args.branch as string | undefined,
      });

    default:
      console.warn(`[Agent] Ferramenta desconhecida: ${toolName}`);
      return `Ferramenta "${toolName}" não existe no arsenal.`;
  }
}

/**
 * Executa o ciclo agentic completo:
 * Prompt → Gemini → (Function Call → Execute → Feed Back)* → Final Text
 *
 * @param prompt - A pergunta do utilizador
 * @param systemInstruction - O system prompt (com RAG context injectado)
 * @param userId - ID do utilizador (para queries Supabase scoped)
 * @returns A resposta final em texto do Gemini
 */
export async function runAgentLoop(
  prompt: string,
  systemInstruction: string,
  userId: string,
): Promise<string> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash-latest',
    systemInstruction,
    tools: COACH_TOOLS,
  });

  // Iniciar chat session para manter contexto entre turns
  const chat = model.startChat();

  // Primeira mensagem: o prompt do utilizador
  let response = await chat.sendMessage(prompt);
  let candidate = response.response;

  for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
    const functionCalls = candidate.functionCalls();

    // Se não há function calls, o Gemini devolveu texto final
    if (!functionCalls || functionCalls.length === 0) {
      break;
    }

    console.log(
      `[Agent] Iteração ${i + 1}/${MAX_TOOL_ITERATIONS}: ${functionCalls.length} ferramenta(s) a executar`,
    );

    // Executar todas as ferramentas pedidas nesta iteração
    const toolResults: Part[] = [];

    for (const call of functionCalls) {
      const result = await executeTool(
        call.name,
        (call.args || {}) as Record<string, unknown>,
        userId,
      );

      toolResults.push({
        functionResponse: {
          name: call.name,
          response: { result },
        },
      });
    }

    // Devolver os resultados ao Gemini para continuar
    response = await chat.sendMessage(toolResults);
    candidate = response.response;
  }

  // Extrair texto final
  const finalText = candidate.text();

  if (!finalText) {
    console.warn('[Agent] Gemini não devolveu texto final após o loop.');
    return 'Desculpa, não consegui processar o teu pedido de momento. Tenta reformular a pergunta.';
  }

  console.log(`[Agent] ✅ Resposta final gerada (${finalText.length} chars)`);
  return finalText;
}
