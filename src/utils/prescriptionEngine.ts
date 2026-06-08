// src/utils/prescriptionEngine.ts
import { ExerciseCategory, Goal, UserLevel } from '../types/exercise';
import { getExerciseCategory } from '../data/exerciseClassifier';
import { calculateSuggestedWeight } from './loadCalculator';
import { MacrocycleEngine } from '../services/macrocycleEngine';
import { getMissedDays } from './missedDaysDetector';
import { WorkoutSession } from '../types';

export interface UserProfile {
  sex?: 'male' | 'female' | string;
  gender?: string;
  age?: number;
  goal?: Goal;
  level?: UserLevel;
  trainingPhilosophy?: string;
  philosophy?: string;
  injuries?: string[];
  weeksActive?: number;
}

export interface ExercisePrescription {
  repsTarget: string;
  repsSuggested: number;
  rpeTarget: number;
  restSeconds: number;
  warmupSets: { weightPercent: number; reps: number }[];
  suggestedWeight: number;
  explanation: string;   // explicação da sugestão
  presets: {
    strength: { weight: number; reps: number };
    endurance: { weight: number; reps: number };
    volume: { weight: number; reps: number; setsDelta: number };
  };
}

export function getPrescription(
  profile: UserProfile | undefined,
  exerciseName: string,
  historicalPR?: { weight: number; reps: number } | null,
  phase?: 'powerlifting' | 'bodybuilding',
  history?: WorkoutSession[]
): ExercisePrescription {
  const category = getExerciseCategory(exerciseName);
  const goal: Goal = profile?.goal || 'hipertrofia';
  const level: UserLevel = profile?.level || 'intermedio';
  const age = profile?.age || 30;
  const injuries = profile?.injuries || [];

  // 1. Definir reps alvo e RPE baseados no objetivo
  let repsMin = 8, repsMax = 12, rpe = 7, rest = 60;
  const gStr = String(goal).toLowerCase();
  if (gStr.includes('forc') || gStr.includes('forç') || phase === 'powerlifting') {
    repsMin = 3; repsMax = 5;
    rpe = 9;
    rest = 180;
  } else if (gStr.includes('resist') || gStr.includes('perda') || gStr.includes('condicionamento')) {
    repsMin = 15; repsMax = 20;
    rpe = 6;
    rest = 45;
  }

  // 1.5 Macrocycle Override
  const weeksActive = profile?.weeksActive ?? 0;
  const macroPhase = MacrocycleEngine.getCurrentPhase(weeksActive);
  const phaseRules = MacrocycleEngine.getPrescriptionRules(macroPhase);
  
  if (macroPhase !== 'ADAPTACAO' || String(level).toLowerCase() !== 'avancado') {
    const repsMatch = phaseRules.repsTarget.match(/(\d+)-?(\d+)?/);
    if (repsMatch) {
      repsMin = parseInt(repsMatch[1], 10);
      repsMax = repsMatch[2] ? parseInt(repsMatch[2], 10) : repsMin;
    }
    rest = phaseRules.restSeconds;
  }

  // Ajustes por nível
  const lStr = String(level).toLowerCase();
  if (lStr.includes('begin') || lStr.includes('iniciante')) {
    repsMin = Math.max(6, repsMin - 2);
    repsMax = Math.max(10, repsMax - 2);
    rpe = Math.max(5, rpe - 1);
    rest += 30;
  } else if (lStr.includes('adv') || lStr.includes('avancado') || lStr.includes('pro')) {
    repsMin += 2;
    repsMax += 2;
    rpe = Math.min(9, rpe + 1);
    rest = Math.max(60, rest - 15);
  }

  // Factor lesão (se houver, reduzimos intensidade)
  const injuryModifier = injuries && injuries.length > 0 ? 0.8 : 1.0;

  // 2. Estimar 1RM a partir do PR histórico (se existir)
  let oneRM = 0;
  if (historicalPR && historicalPR.weight > 0 && historicalPR.reps > 0) {
    oneRM = historicalPR.weight * (1 + historicalPR.reps / 30);
  } else {
    // Sem histórico, usar um valor simbólico baixo (ex: 20% do peso corporal do user, mas não temos; usamos 20kg para iniciante)
    oneRM = 40; // valor genérico, mas depois o loadCalculator vai reduzir
  }

  const targetReps = Math.floor((repsMin + repsMax) / 2);

  // 3. Calcular peso sugerido
  let suggestedWeight = calculateSuggestedWeight({
    oneRM,
    targetReps,
    category,
    userLevel: level,
    age,
    goal,
    injuryModifier,
  });

  // Se não houver histórico e o peso sugerido ficou zero, usar fallback
  if (!historicalPR && suggestedWeight === 0) {
    suggestedWeight = 20; // fallback razoável para iniciante
  }

  // 3.5 Ajuste de Missed Days
  let explanation = `Baseado no teu 1RM estimado de ${Math.round(oneRM)}kg e no teu objectivo de ${goal}, recomendamos ${suggestedWeight}kg para ${targetReps} reps.`;

  const plannedDays = (profile as any)?.trainingDays?.map((d: any) => Number(d)) || [];
  const missedDays = history ? getMissedDays(history, plannedDays, 3).length : 0;
  if (missedDays > 0) {
    const reduction = 0.9; // reduz 10%
    suggestedWeight = Math.max(0, Math.round(suggestedWeight * reduction));
    explanation += ` Como faltaste ${missedDays} dia(s) planeado(s), ajustámos a carga para te reinserires com segurança.`;
  }

  // 4. Criar presets (Força, Resistência, Volume)
  const strengthReps = Math.max(3, targetReps - 5);
  const strengthWeight = calculateSuggestedWeight({
    oneRM,
    targetReps: strengthReps,
    category,
    userLevel: level,
    age,
    goal: 'forca',
    injuryModifier,
  }) || suggestedWeight + 5;

  const enduranceReps = targetReps + 5;
  const enduranceWeight = calculateSuggestedWeight({
    oneRM,
    targetReps: enduranceReps,
    category,
    userLevel: level,
    age,
    goal: 'resistencia',
    injuryModifier,
  }) || Math.max(0, suggestedWeight - 5);

  const volumeWeight = suggestedWeight; // mantém peso
  const volumeSetsDelta = 1; // adiciona uma série

  // 5. Explicação textual complementar
  if (category === 'compound_multi') explanation += ` Este é um exercício composto, por isso a carga pode ser mais elevada.`;
  else if (category === 'isolation_multi') explanation += ` Este é um exercício de isolamento, por isso a carga é naturalmente mais baixa.`;

  // 6. Séries de aquecimento (apenas para cargas > 0)
  const warmupSets = suggestedWeight > 0 ? [
    { weightPercent: 0.5, reps: Math.min(8, targetReps) },
    { weightPercent: 0.7, reps: Math.min(5, targetReps) },
    { weightPercent: 0.85, reps: Math.min(3, targetReps) },
  ].filter(w => w.reps > 0) : [];

  return {
    repsTarget: `${repsMin}-${repsMax}`,
    repsSuggested: targetReps,
    rpeTarget: rpe,
    restSeconds: rest,
    warmupSets,
    suggestedWeight,
    explanation,
    presets: {
      strength: { weight: strengthWeight, reps: strengthReps },
      endurance: { weight: enduranceWeight, reps: enduranceReps },
      volume: { weight: volumeWeight, reps: targetReps, setsDelta: volumeSetsDelta },
    },
  };
}
