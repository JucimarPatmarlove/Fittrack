// src/services/anthropicService.ts
// ════════════════════════════════════════════════════════════════
// FitTrack V7 — Serviço de IA (Refatorado para BFF Proxy)
// ════════════════════════════════════════════════════════════════
//
// ANTES:  Frontend → SDK Anthropic (chave exposta no browser!)
// AGORA:  Frontend → server.js (BFF, porta 3001) → SDK Anthropic
//
// A API Key NUNCA aparece no código do frontend.
// O SDK @anthropic-ai/sdk NÃO é importado no cliente.
// ════════════════════════════════════════════════════════════════

import { cacheWorkout, getCachedWorkout } from '../ai/cacheLayer';
import type { WorkoutSession } from '../db/schema';
import { useEffortStore } from '../stores/useEffortStore';
import { generateShortLivedToken } from './jwtEngine';
import { MacrocycleEngine } from './macrocycleEngine';
import { OfflineWorkoutEngine } from './offlineWorkoutEngine';

// ── URL do Proxy BFF (configurável via variável de ambiente) ──
// Em dev: o Vite proxy redireciona /api/* → localhost:3001 (ver vite.config.js)
// Em prod: VITE_API_URL aponta para o backend real (ex: https://api.fittrack.app)
const API_URL = import.meta.env.VITE_API_URL || '';

// ── Helper: Chamada segura ao proxy com JWT ──
async function callProxy(endpoint: string, payload: any): Promise<any> {
  const url = `${API_URL}${endpoint}`;

  // Gerar JWT de curta duração (60s) para autenticar o pedido
  const token = await generateShortLivedToken();

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ error: { message: response.statusText } }));
    let errorMessage = errorData.error?.message || `Proxy error: ${response.status}`;

    // Interceptar problemas de timestamp específicos do server.ts
    if (
      errorMessage.includes('expirado') ||
      errorMessage.includes('dessincronizado') ||
      errorMessage.includes('clock')
    ) {
      errorMessage =
        '⚠️ O relógio do teu dispositivo está desfasado da hora global.\n\n' +
        '🔧 Como resolver:\n' +
        '  • Android: Definições → Sistema → Data e Hora → "Automático"\n' +
        '  • iOS:   Definições → Geral → Data e Hora → "Definir Automaticamente"\n' +
        '  • PC:    Ativar sincronização de hora nas definições do sistema operativo\n\n' +
        'Após corrigir, reinicia a aplicação para o AI Coach voltar a funcionar.';
    }

    throw new Error(errorMessage);
  }

  return response.json();
}

// ── Helper: Gerar treino via endpoint especializado ──
export async function generateWorkout(prompt: string, system?: string): Promise<any> {
  try {
    const data = await callProxy('/api/generate-workout', {
      systemPrompt: system,
      userPrompt: prompt,
      maxTokens: 2000,
    });
    return data.parsed || JSON.parse(data.content);
  } catch (error) {
    console.error('Falha ao gerar treino via proxy:', error);
    return {
      reasoning: 'Não foi possível contactar o treinador IA. Usando plano padrão.',
      exercises: [],
    };
  }
}

// ════════════════════════════════════════════════════════════════
// API PRINCIPAL — Mantém compatibilidade com Dashboard, AICoach,
// WeeklyPlanGenerator e todos os consumidores existentes.
// ════════════════════════════════════════════════════════════════

export const AnthropicService = {
  /**
   * Conversa com o Neural Coach.
   * Envia o prompt e histórico ao proxy, que reencaminha para a Anthropic.
   */
  async askCoach(prompt: string, history: WorkoutSession[], __apiKey?: string): Promise<string> {
    const recentHistory = [...history]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    const systemPrompt = `
Atua como um Coach de Musculação de Elite e Fisiologista de Elite para o atleta da Fittrack.
O teu objetivo é providenciar conselhos curtíssimos (1 a 3 parágrafos curtos) baseados nas entranhas do seu histórico. Sê motivacional mas brutalmente direto (estilo cyberpunk gym/coach sargento cibernético).
Histórico Recente em JSON (lê e diagnostica assimetrias, gaps temporais ou estagnação nas cargas):
${JSON.stringify(recentHistory)}
    `;

    try {
      const data = await callProxy('/api/claude', {
        model: 'claude-3-haiku-20240307',
        max_tokens: 300,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }],
      });

      return data.content[0].text;
    } catch (e: any) {
      console.error('[AnthropicService] Erro no askCoach:', e.message);
      return `Erro Offline/Rede: A ligação ao servidor proxy quebrou. Verifica que o server.js está a correr (node server.js). (${e.message})`;
    }
  },

  /**
   * Gera um treino preditivo com IA.
   * Tenta primeiro o cache local, depois o proxy BFF, e por fim o motor offline.
   */
  async generateWorkout(
    profile: any,
    recoveryTokens: any[],
    history: WorkoutSession[],
  ): Promise<any> {
    const fallbackWorkout = OfflineWorkoutEngine.generateSingleWorkout(profile, history);

    const contextHash = `workout_${profile.goal}_${profile.level}_${new Date().toISOString().split('T')[0]}_${history.length}`;
    const cachedStr = await getCachedWorkout(contextHash);
    if (cachedStr) return cachedStr;

    try {
      // Endpoint especializado — o prompt é construído no servidor
      const data = await callProxy('/api/generate-workout', {
        profile: { goal: profile.goal, level: profile.level, xp: profile.xp },
        recoveryTokens,
        history: history.slice(-5),
      });

      const normalizedWorkout = data.parsed || {
        id: 'ai_gen_predictive',
        label: 'Motor Preditivo V7',
        reasoning: '',
        exercises: [],
        exercisesDetails: [],
      };

      await cacheWorkout(contextHash, normalizedWorkout);
      return normalizedWorkout;
    } catch (e) {
      console.error('Falha a gerar treino AI Preditivo:', e);
      return fallbackWorkout;
    }
  },

  /**
   * Gera um plano semanal completo com IA.
   * A lógica de construção do prompt permanece no frontend
   * (é complexa e depende de muitos estados locais do Zustand).
   */
  async generateWeeklyPlan(profile: any, philosophy = 'classic'): Promise<any> {
    let typeRequirements = '';

    if (philosophy === 'powerbuilding') {
      let workoutsThisWeek = 0;
      try {
        const histStr = localStorage.getItem('fit_history');
        if (histStr) {
          const hist = JSON.parse(histStr);
          workoutsThisWeek = hist.filter(
            (w: any) => new Date(w.date).getTime() > Date.now() - 7 * 24 * 3600 * 1000,
          ).length;
        }
      } catch (_e) {
        /* ignore */
      }
      const isStrengthDay = workoutsThisWeek % 2 === 0;

      typeRequirements = isStrengthDay
        ? `- **FILOSOFIA POWERBUILDING (DIA DE FORÇA MÁXIMA)**: Foco nos "Big 3". Repetições: 3 a 5. RPE alvo: 9. Séries: 4-5. Descanso: 3 a 5 minutos. Máx 4-5 exercícios.`
        : `- **FILOSOFIA POWERBUILDING (DIA DE HIPERTROFIA)**: Foco em volume muscular. Repetições: 8 a 12. RPE alvo: 7-8. Descanso: 60-90 segundos. Exercícios compostos + acessórios.`;
    } else if (philosophy === 'hiit') {
      typeRequirements = `- **FILOSOFIA HIIT / CONDICIONAMENTO**: Circuitos por tempo. Séries/Reps medidos em tempo. Foco em queima de gordura e VO2 Max.`;
    } else if (philosophy === 'functional') {
      typeRequirements = `- **FILOSOFIA CROSS-TRAINING / FUNCIONAL**: Blocos de treino (AMRAP, EMOM). Movimentos naturais (Kettlebell, cordas, sprints). Foco: Performance real.`;
    } else {
      typeRequirements = `- **FILOSOFIA MUSCULAÇÃO CLÁSSICA**: Isolamento de grupos musculares (Push/Pull/Legs). Repetições: 8 a 12, RPE 7-8. Descanso: 60 a 90 segundos.`;
    }

    const effortLastWeek = useEffortStore.getState().getTotalEffortLastWeek();
    const isOvertraining = effortLastWeek > 850;

    const dayPrefs = profile.dayPreferences
      ? Object.entries(profile.dayPreferences)
          .filter(
            ([day, focus]) => profile.trainingDays?.includes(day) && focus && focus !== 'Padrão',
          )
          .map(([day, focus]) => `- ${day}: Treinar com foco em "${focus}"`)
          .join('\n')
      : '';

    const weeksActive = profile.weeksActive ?? 0;
    const phase = MacrocycleEngine.getCurrentPhase(weeksActive);
    const phaseRules = MacrocycleEngine.getPrescriptionRules(phase);

    const prompt = `
És um treinador de elite e fisiologista com experiência clínica.
Cria um plano de treino semanal (7 dias) perfeitamente adaptado ao atleta Fittrack.

DADOS DO ATLETA (BIOFEEDBACK & LOGÍSTICA):
- Objetivo Principal: ${profile.goal}
- Fase Clínica Atual: ${phaseRules.phaseName}
- Estrutura Obrigatória: ${phaseRules.trainingType}
- Filosofia de Treino: ${profile.philosophy || 'classic'}
- Género Biológico: ${profile.gender || 'Feminino'}
- Peso: ${profile.weight ? profile.weight + ' kg' : 'Não especificado'}
- Altura: ${profile.height ? profile.height + ' cm' : 'Não especificada'}
- Nível: ${profile.level || 'intermediate'}
- Equipamento Disponível: ${profile.availableEquipment?.join(', ') || 'Ginásio Completo'}
- Dias de Treino Selecionados: ${profile.trainingDays?.join(', ') || 'Segunda, Quarta, Sexta'}
- Duração Ideal do Treino: ${profile.preferredWorkoutDuration || 60} minutos
- Lesões Ativas/Limitações: ${profile.injuries?.length ? profile.injuries.join(', ') : 'Nenhuma'}
- Pontos de Esforço na última semana: ${effortLastWeek}
${dayPrefs ? `- Focos Específicos por Dia:\n${dayPrefs}` : ''}
${isOvertraining ? '- ⚠️ ALERTA: Risco de overtraining.' : '- Recuperação saudável.'}

REGRAS CORE DE PRESCRIÇÃO:
1. Retorna EXCLUSIVAMENTE um objeto JSON estrito.
2. Plano com exatamente 7 dias (Segunda a Domingo).
3. Só prescreve treinos nos dias: [${profile.trainingDays?.join(', ') || 'Segunda, Quarta, Sexta'}]. Restantes = "Descanso" ou "Descanso Ativo".
4. Adapta volume ao tempo disponível (${profile.preferredWorkoutDuration || 60} min).
5. Respeita lesões: ${profile.injuries?.join(', ') || 'Nenhuma'}.
6. ${typeRequirements}
7. ALINHAMENTO COM A FASE CLÍNICA: Utiliza obrigatoriamente a estrutura '${phaseRules.trainingType}', com ${phaseRules.sets} séries por exercício, alvo de ${phaseRules.repsTarget} repetições, descansando ${phaseRules.restSeconds} segundos.
8. ${isOvertraining ? 'OVERTRAINING: Reduz séries 20%, peso -10%, RPE máx 6.' : 'Progressão normal.'}
9. Respeita focos específicos por dia se listados acima.
${profile.goal === 'v_taper_aesthetics' ? '10. V-TAPER AESTHETICS: Prioriza exercícios de ombros laterais e dorsais (largura). Evita exercícios pesados para oblíquos (como flexões laterais) e quadríceps muito massivos. Inclui "Stomach Vacuum" diariamente.' : ''}

Formato JSON (sem markdown nem backticks):
{
  "name": "Nome do Plano",
  "description": "Descrição breve",
  "reasoning": "Explicação técnica",
  "plan": [
    { "day": "Segunda", "focus": "Peito & Tríceps", "exercises": ["Supino Plano", "Fundos"] },
    { "day": "Terça", "focus": "Descanso Ativo", "exercises": ["Caminhada 30 min"] }
  ]
}`;

    try {
      const data = await callProxy('/api/claude', {
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1200,
        system: 'Output STRICT JSON only. Be precise, athletic and clinical.',
        temperature: 0.3,
        messages: [{ role: 'user', content: prompt }],
      });

      if (!data.content?.[0]?.text) {
        throw new Error('Resposta da IA com formato inesperado: ' + JSON.stringify(data));
      }

      let text = data.content[0].text;
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        text = text.substring(firstBrace, lastBrace + 1);
      } else {
        throw new Error('Não encontrei JSON na resposta: ' + text);
      }

      return JSON.parse(text);
    } catch (e: any) {
      console.warn('Falha a gerar plano semanal. A usar OfflineWorkoutEngine.', e);
      const fallbackPlanWrapper = OfflineWorkoutEngine.generateWeeklyPlan(profile, philosophy);
      return {
        name: fallbackPlanWrapper.name,
        description: fallbackPlanWrapper.description,
        reasoning: fallbackPlanWrapper.description,
        plan: fallbackPlanWrapper.workouts,
      };
    }
  },
};
