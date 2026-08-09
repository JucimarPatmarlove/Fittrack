/// <reference types="node" />
// ════════════════════════════════════════════════════════════════
// FitTrack V7 — Arsenal MCP: Supabase SQL (Analista de Dados)
// ════════════════════════════════════════════════════════════════
//
// Executa funções RPC pré-definidas no Supabase para cálculos
// de métricas de treino. O Gemini NUNCA envia SQL raw.
// ════════════════════════════════════════════════════════════════

import { type SupabaseClient, createClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

function getSupabase(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  supabaseClient = createClient(url, key, { auth: { persistSession: false } });
  return supabaseClient;
}

const RPC_MAP: Record<string, string> = {
  volume_total: 'calc_volume_total',
  frequencia_treinos: 'calc_frequencia_treinos',
  pr_exercicio: 'calc_pr_exercicio',
  historico_peso: 'calc_historico_peso',
  treinos_por_grupo_muscular: 'calc_treinos_por_grupo',
};

interface MetricParams {
  metric_type: string;
  exercise_name?: string;
  period_days?: number;
}

/**
 * Executa uma consulta de métricas via Supabase RPC.
 * Se o Supabase não estiver configurado, devolve dados scaffolding.
 */
export async function executeSupabaseMetrics(
  userId: string,
  params: MetricParams,
): Promise<string> {
  const { metric_type, exercise_name, period_days = 30 } = params;
  const supabase = getSupabase();

  // Modo scaffolding quando Supabase não está configurado
  if (!supabase) {
    console.warn('[Supabase Metrics] Não configurado. Modo scaffolding ativo.');
    const exName = exercise_name ? ` para ${exercise_name}` : '';
    return (
      `[MODO DEMO] Métrica "${metric_type}"${exName} (últimos ${period_days} dias): ` +
      `A base de dados SQL ainda não está ligada. Quando ativa, vou calcular valores exatos. ` +
      `Por agora, responde com base no contexto disponível.`
    );
  }

  // Modo produção
  const rpcName = RPC_MAP[metric_type];
  if (!rpcName) {
    return `Tipo de métrica "${metric_type}" não reconhecido. Válidos: ${Object.keys(RPC_MAP).join(', ')}.`;
  }

  try {
    const rpcParams: Record<string, unknown> = { p_user_id: userId, p_days: period_days };
    if (exercise_name) rpcParams.p_exercise = exercise_name;

    const { data, error } = await supabase.rpc(rpcName, rpcParams);

    if (error) {
      console.error(`[Supabase] Erro RPC ${rpcName}:`, error);
      if (error.message.includes('does not exist')) {
        return `A função SQL "${rpcName}" ainda não foi criada no Supabase. Métrica indisponível.`;
      }
      return `Erro SQL: ${error.message}. Responde com contexto disponível.`;
    }

    if (!data || (Array.isArray(data) && data.length === 0)) {
      return `Sem dados para ${metric_type}${exercise_name ? ` (${exercise_name})` : ''} nos últimos ${period_days} dias.`;
    }

    return `Dados da BD (${metric_type}, ${period_days}d):\n${JSON.stringify(data, null, 2)}\nUsa estes números exatos na resposta.`;
  } catch (error) {
    console.error('[Supabase] Falha:', error);
    return 'Falha na ligação à base de dados. Responde com contexto disponível.';
  }
}
