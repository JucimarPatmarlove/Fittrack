import { WorkoutSession } from "../types";
import { getCachedWorkout, cacheWorkout } from "../ai/cacheLayer";
import { OfflineWorkoutEngine } from "./offlineWorkoutEngine";
import { useEffortStore } from "../stores/useEffortStore";

export const AnthropicService = {
    async askCoach(prompt: string, history: WorkoutSession[]): Promise<string> {
        // Serializa os 5 últimos treinos para poupar tokens, mas dar todo o contexto
        const recentHistory = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
        const systemPrompt = `
Atua como um Coach de Musculação de Elite e Fisiologista de Elite para o atleta da Fittrack.
O teu objetivo é providenciar conselhos curtíssimos (1 a 3 parágrafos curtos) baseados nas entranhas do seu histórico. Sê motivacional mas brutalmente direto (estilo cyberpunk gym/coach sargento cibernético).
Histórico Recente em JSON (lê e diagnostica assimetrias, gaps temporais ou estagnação nas cargas):
${JSON.stringify(recentHistory)}
        `;

        try {
            // FASE 3: Chamada ao nosso Cloudflare Worker (Backend for Frontend) em vez de API direta
            const response = await fetch("/api/claude", {
                method: "POST",
                headers: {
                    "content-type": "application/json"
                },
                body: JSON.stringify({
                    model: "claude-3-haiku-20240307", // Haiku para rapidez na UI (PWA)
                    max_tokens: 300,
                    system: systemPrompt,
                    messages: [{ role: "user", content: prompt }]
                })
            });

            if (!response.ok) {
                const err = await response.json();
                return `Erro do Motor Claude Backend: ${err.error?.message || response.statusText}`;
            }

            const data = await response.json();
            return data.content[0].text;
        } catch (e: any) {
            return `Erro Offline/Rede: A ligação quebrou. Mantém a resiliência humana. Tenta novamente mais tarde. (${e.message})`;
        }
    },

    async generateWorkout(profile: any, recoveryTokens: any[], history: WorkoutSession[]): Promise<any> {
        
        const fallbackWorkout = {
            id: "ai_gen_fallback",
            label: "Treino Inteligente (Offline)",
            reasoning: "A tua rede falhou, mas criei rotina focada em estabilidade.",
            exercises: ["Agachamento", "Supino Plano", "Remada Curvada", "Plank"]
        };

        const contextHash = `workout_${profile.goal}_${profile.level}_${new Date().toISOString().split('T')[0]}_${history.length}`;
        const cachedStr = await getCachedWorkout(contextHash);
        if (cachedStr) {
            return cachedStr;
        }

        // 1. Processar fadiga compensatória
        const muscleMap: Record<string, { affects: string[], coef: number }> = {
            'Tríceps': { affects: ['Supino', 'Press Militar', 'Fundos'], coef: 0.3 },
            'Bíceps': { affects: ['Remada', 'Puxada'], coef: 0.25 },
            'Ombros': { affects: ['Supino Inclinado'], coef: 0.2 }
        };

        const compensatory = recoveryTokens
            .filter(m => m.recoveryPct < 60)
            .map(m => ({
                muscle: m.muscle,
                impact: Math.round((60 - m.recoveryPct) * (muscleMap[m.muscle]?.coef || 0.1)),
                affected: muscleMap[m.muscle]?.affects || []
            })).filter(x => x.impact > 0);

        const prompt = `
És um treinador de elite com PhD em biomecânica trabalhando no Fittrack V7 Neural Engine.

DADOS DO ATLETA:
- Objetivo: ${profile.goal}
- Nível: ${profile.level || 'intermediate'}
- XP Atual: ${profile.xp || 0}

RECUPERAÇÃO MUSCULAR ATUAL (Primária):
${recoveryTokens.map(m => `- ${m.muscle}: ${m.recoveryPct}% recuperado (${m.hoursLeft}h p/ total)`).join('\n')}

FADIGA COMPENSATÓRIA DETECTADA (Secundária):
${compensatory.map(f => `- ${f.muscle}: ${f.impact}% de impacto negativo/fraqueza esperada nos exercícios [${f.affected.join(', ')}]`).join('\n') || '- Nenhuma restrição sistémica imposta.'}

INSTRUÇÕES CORE:
1. Se a recuperacaoPct de um músculo < 50%, NÃO inclua exercícios que o usem como alvo principal.
2. Se há fadiga compensatória, adapte notas técnicas recomendando a redução da carga ou o foco excêntrico intenso (redução do pace p/ s/rep maior).
3. Aplique Periodização Ondulatória no JSON gerado:
   - Hipertrofia: 8-12 reps, 75% 1RM
   - Força: 3-5 reps, 85-90% 1RM
   - Condicionamento/Perda Peso: 15-20 reps, 50% 1RM

Retorna EXCLUSIVAMENTE um objeto JSON estrito com esta shape, NADA mais (nem formatação markdown \`\`\`json):
{
  "id": "ai_gen_predictive",
  "label": "Motor Preditivo V7",
  "reasoning": "Explica em 1 parágrafo curto como manipulaste as variáveis em relação à fadiga secundária e o objetivo.",
  "exercises": [
     {"name": "Nome Válido da Exercise DB", "sets": 3, "reps": 10, "rest": 90, "percent1RM": 0.75, "notes": "Foca-te na contração..."}
  ]
}`;

        try {
            const response = await fetch("/api/claude", {
                method: "POST",
                headers: {
                    "content-type": "application/json"
                },
                body: JSON.stringify({
                    model: "claude-3-5-sonnet-20241022",
                    max_tokens: 800,
                    system: "Output STRICT JSON only.",
                    temperature: 0.3,
                    messages: [{ role: "user", content: prompt }]
                })
            });

            if (!response.ok) throw new Error("Erro na API da Anthropic");
            
            const data = await response.json();
            let text = data.content[0].text;
            const firstBrace = text.indexOf('{');
            const lastBrace = text.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1) {
                text = text.substring(firstBrace, lastBrace + 1);
            }
            const aiWorkout = JSON.parse(text);
            
            // Map the detailed response to our format for ActiveWorkout.tsx compatibility
            const normalizedWorkout = {
                id: aiWorkout.id,
                label: aiWorkout.label,
                reasoning: aiWorkout.reasoning,
                // Assuming ActiveWorkout accepts array of strings for exercises or we just extract names
                // The new system returns detailed sets/reps but ActiveWorkout initializes default from just the name string array. 
                // We'll keep the full objects inside exercisesDetails temporarily, but pass names for the current engine constraints:
                exercises: aiWorkout.exercises.map((e: any) => e.name),
                exercisesDetails: aiWorkout.exercises
            };

            await cacheWorkout(contextHash, normalizedWorkout);
            return normalizedWorkout;
        } catch (e) {
            console.error("Falha a gerar treino AI Preditivo:", e);
            return fallbackWorkout;
        }
    },

    async generateWeeklyPlan(profile: any, philosophy: string = 'classic'): Promise<any> {
        let typeRequirements = '';

        if (philosophy === 'powerbuilding') {
            let workoutsThisWeek = 0;
            try {
                const histStr = localStorage.getItem('fit_history');
                if (histStr) {
                    const hist = JSON.parse(histStr);
                    workoutsThisWeek = hist.filter((w: any) => new Date(w.date).getTime() > Date.now() - 7 * 24 * 3600 * 1000).length;
                }
            } catch (e) { /* ignore */ }
            const isStrengthDay = workoutsThisWeek % 2 === 0;

            if (isStrengthDay) {
                typeRequirements = `
                - **FILOSOFIA POWERBUILDING (DIA DE FORÇA MÁXIMA)**:
                - Foco nos "Big 3" (Supino, Agachamento, Levantamento Terra) ou variações pesadas.
                - Repetições: 3 a 5. RPE alvo: 9.
                - Séries: 4-5 por exercício.
                - Descanso: 3 a 5 minutos.
                - Formato: Prioriza a força, evita volume excessivo (máx 4-5 exercícios).`;
            } else {
                typeRequirements = `
                - **FILOSOFIA POWERBUILDING (DIA DE HIPERTROFIA)**:
                - Foco em volume muscular para complementar a base de força.
                - Repetições: 8 a 12. RPE alvo: 7-8.
                - Descanso: 60-90 segundos.
                - Formato: Exercícios compostos variados + acessórios isolados.`;
            }
        } else if (philosophy === 'hiit') {
            typeRequirements = `
            - **FILOSOFIA HIIT / CONDICIONAMENTO**:
            - Formato: Circuitos por tempo em vez de repetições estáticas.
            - O array 'exercises' deve descrever o circuito (Ex: "Circuito 3x: 40s Burpees, 20s Descanso", ou "Tabata: 20s/10s").
            - Séries/Reps: O volume é medido em tempo sob esforço cardiovascular e pulmonar.
            - Foco em queima de gordura e VO2 Max.`;
        } else if (philosophy === 'functional') {
            typeRequirements = `
            - **FILOSOFIA CROSS-TRAINING / FUNCIONAL**:
            - Formato: Blocos de treino. (Ex: Aquecimento > Bloco Força > WOD/AMRAP).
            - O array 'exercises' pode conter notações típicas como "AMRAP 12min de XYZ", "EMOM 15min" ou "Por Tempo".
            - Exercícios: Movimentos naturais (Kettlebell, cordas, sprints, arranques).
            - Foco: Performance real, resistência muscular e prevenção de lesões.`;
        } else {
            typeRequirements = `
            - **FILOSOFIA MUSCULAÇÃO CLÁSSICA**:
            - Foco: Hipertrofia máxima e estética corporal.
            - Formato: Isolamento de grupos musculares (Push/Pull/Legs ou Bro Split).
            - Repetições: 8 a 12, RPE 7-8.
            - Descanso: 60 a 90 segundos.
            - Adiciona exercícios específicos para cada detalhe muscular.`;
        }

        const effortLastWeek = useEffortStore.getState().getTotalEffortLastWeek();
        const userMaxEffort = 850; // Limiar de Overtraining (pode ser dinâmico)
        const isOvertraining = effortLastWeek > userMaxEffort;

        const prompt = `
És um treinador de elite e fisiologista com experiência clínica.
Cria um plano de treino semanal (7 dias) perfeitamente adaptado ao atleta Fittrack.

DADOS DO ATLETA (BIOFEEDBACK & LOGÍSTICA):
- Objetivo Principal: ${profile.goal}
- Filosofia de Treino Escohida: ${profile.philosophy || 'classic'}
- Género Biológico: ${profile.gender || 'Feminino'}
- Peso: ${profile.weight ? profile.weight + ' kg' : 'Não especificado'}
- Altura: ${profile.height ? profile.height + ' cm' : 'Não especificada'}
- Nível: ${profile.level || 'intermediate'}
- Equipamento Disponível: ${profile.availableEquipment?.join(', ') || 'Ginásio Completo'}
- Dias de Treino Selecionados: ${profile.trainingDays?.join(', ') || 'Segunda, Quarta, Sexta'}
- Duração Ideal do Treino: ${profile.preferredWorkoutDuration || 60} minutos
- Lesões Ativas/Limitações: ${profile.injuries?.length ? profile.injuries.join(', ') : 'Nenhuma'}
- Pontos de Esforço na última semana: ${effortLastWeek}
${isOvertraining ? '- ⚠️ ALERTA: O atleta está em risco de overtraining (esforço excessivo).' : '- Atleta dentro da zona de recuperação saudável.'}

REGRAS CORE DE PRESCRIÇÃO:
1. Retorna EXCLUSIVAMENTE um objeto JSON estrito com o formato abaixo.
2. O plano deve ter exatamente 7 dias (Segunda a Domingo).
3. EXTREMAMENTE IMPORTANTE: Só podes prescrever treinos intensos (exercícios) para os dias específicos solicitados: [${profile.trainingDays?.join(', ') || 'Segunda, Quarta, Sexta'}]. Os restantes dias NÃO mencionados TÊM de ter o "focus" como "Descanso" ou "Descanso Ativo".
4. SE o atleta tiver apenas ${profile.preferredWorkoutDuration || 60} minutos, ajusta o volume total (máximo de 4-6 exercícios se forem 30 mins) e sugere super-séries se necessário.
5. Adapta a seleção de exercícios à Filosofia de Treino (${profile.philosophy}) e adequa o volume/recuperação considerando o género (${profile.gender}).
6. SE o atleta tiver Lesões (${profile.injuries?.join(', ') || 'Nenhuma'}), deves EXCLUIR movimentos que sobrecarreguem essas articulações (ex: sem agachamento livre se dor lombar) e escrever no 'reasoning' como contornaste a lesão.
7. Ajusta a seleção de exercícios ao equipamento: se for 'Home Gym (Halteres)', não prescrevas Leg Press ou cabos.
8. ${typeRequirements}
9. ${isOvertraining ? 'OVERTRAINING DETETADO: Reduz o número de séries em 20%. O peso sugerido deve ser 10% inferior. RPE máximo 6.' : 'Mantém a progressão normal baseada no histórico.'}

Formato JSON esperado (não adiciones markdown nem backticks \`\`\`json):
{
  "name": "Nome Épico do Plano",
  "description": "Breve descrição foda",
  "reasoning": "Explicação técnica de elite sobre como dividiste o volume (para X dias), geriste o tempo (X mins) e adaptaste os exercícios ao equipamento e às eventuais lesões.",
  "plan": [
    {
      "day": "Segunda",
      "focus": "Peito & Tríceps",
      "exercises": ["Supino Plano", "Supino Inclinado", "Fundos", "Tríceps Corda"]
    },
    {
      "day": "Terça",
      "focus": "Descanso Ativo",
      "exercises": ["Caminhada Ligeira 30 min", "Mobilidade Lombar"]
    }
  ]
}`;

        try {
            const response = await fetch("/api/claude", {
                method: "POST",
                headers: {
                    "content-type": "application/json"
                },
                body: JSON.stringify({
                    model: "claude-3-5-sonnet-20241022",
                    max_tokens: 1200,
                    system: "Output STRICT JSON only. Be precise, athletic and clinical.",
                    temperature: 0.3,
                    messages: [{ role: "user", content: prompt }]
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`API HTTP Error: ${response.status} - ${errText}`);
            }
            
            const data = await response.json();
            if (!data.content || !data.content[0] || !data.content[0].text) {
                throw new Error("Resposta da IA com formato inesperado: " + JSON.stringify(data));
            }

            let text = data.content[0].text;
            const firstBrace = text.indexOf('{');
            const lastBrace = text.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1) {
                text = text.substring(firstBrace, lastBrace + 1);
            } else {
                throw new Error("Não encontrei JSON na resposta: " + text);
            }

            try {
                return JSON.parse(text);
            } catch (err: any) {
                throw new Error(`Erro ao fazer parse do JSON: ${err.message}. Texto tentado: ${text}`);
            }
        } catch (e: any) {
            console.warn("Falha a gerar plano semanal real. A usar OfflineWorkoutEngine.", e);
            
            // Usar o motor dinâmico de fallback offline
            const fallbackPlanWrapper = OfflineWorkoutEngine.generateWeeklyPlan(profile, philosophy);
            
            return {
                name: fallbackPlanWrapper.name,
                description: fallbackPlanWrapper.description,
                reasoning: fallbackPlanWrapper.description,
                plan: fallbackPlanWrapper.workouts
            };
        }
    }
}
