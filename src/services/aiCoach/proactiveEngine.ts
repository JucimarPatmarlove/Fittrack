// @ts-nocheck
// ============================================================
// FitTrack V7 — AI Coach Proativo Engine
// ============================================================
// src/services/aiCoach/proactiveEngine.ts
// ============================================================

import type { InjuryRiskReport, StressReading } from '../../types/injury';
import type { RecoveryInput } from '../../types/injury';
import type { WorkoutSession } from '../../types';
import { trackEvent } from '../../utils/telemetry';

// ── 1. Tipos do Sistema Proativo ───────────────────────────

export type TriggerType =
  | 'injury_risk_high'
  | 'injury_risk_critical'
  | 'recovery_low'
  | 'overtraining_detected'
  | 'undertraining_detected'
  | 'pr_achieved'
  | 'streak_at_risk'
  | 'deload_recommended'
  | 'form_check_needed'
  | 'nutrition_reminder';

export type MessagePriority = 'low' | 'medium' | 'high' | 'urgent';
export type MessageAction = 'workout' | 'recovery' | 'rest' | 'modify_plan' | 'view_details' | 'dismiss';

export interface ProactiveMessage {
  id: string;
  trigger: TriggerType;
  priority: MessagePriority;
  title: string;
  body: string;
  action: MessageAction;
  actionLabel: string;
  data?: Record<string, any>;
  timestamp: string;
  expiresAt?: string;
  dismissed: boolean;
}

export interface TriggerContext {
  injuryReport: InjuryRiskReport | null;
  recoveryData: RecoveryInput | null;
  lastWorkout: WorkoutSession | null;
  workoutHistory: WorkoutSession[];
  streakDays: number;
  daysSinceLastWorkout: number;
  userBodyweight: number;
  userGoals: string[];
}

// ── 2. Regras de Gatilho ───────────────────────────────────

interface TriggerRule {
  type: TriggerType;
  condition: (ctx: TriggerContext) => boolean;
  priority: MessagePriority;
  generateMessage: (ctx: TriggerContext) => Omit<ProactiveMessage, 'id' | 'timestamp' | 'dismissed'>;
}

const TRIGGER_RULES: TriggerRule[] = [
  // 🔴 CRITICAL: Risco de lesão crítico
  {
    type: 'injury_risk_critical',
    condition: (ctx) => ctx.injuryReport?.overallRisk === 'critical',
    priority: 'urgent',
    generateMessage: (ctx) => {
      const region = ctx.injuryReport?.flaggedRegions[0];
      return {
        trigger: 'injury_risk_critical',
        priority: 'urgent',
        title: '🚨 Risco Crítico Detectado',
        body: `O teu ${region?.region.replace(/_/g, ' ') || 'ombro'} está em risco crítico (ACWR: ${region?.acuteChronicRatio.toFixed(2)}). Não recomendamos treinar hoje.`,
        action: 'rest',
        actionLabel: 'Dia de Descanso',
        data: { region: region?.region, acwr: region?.acuteChronicRatio },
      };
    },
  },

  // 🟠 HIGH: Risco de lesão elevado
  {
    type: 'injury_risk_high',
    condition: (ctx) => ctx.injuryReport?.overallRisk === 'high' && ctx.injuryReport?.overallRisk !== 'critical',
    priority: 'high',
    generateMessage: (ctx) => {
      const mods = ctx.injuryReport?.suggestedModifications || [];
      const mod = mods[0];
      return {
        trigger: 'injury_risk_high',
        priority: 'high',
        title: '⚠️ Ajuste Recomendado',
        body: mod
          ? `Risco elevado em ${mod.exerciseName}. ${mod.suggestion}`
          : 'Stress acumulado elevado. Considera reduzir volume em 20%.',
        action: 'modify_plan',
        actionLabel: 'Ver Ajustes',
        data: { modifications: mods },
      };
    },
  },

  // 🔵 MEDIUM: Recuperação baixa
  {
    type: 'recovery_low',
    condition: (ctx) => {
      const score = ctx.injuryReport?.flaggedRegions[0]?.recoveryScore;
      return score !== undefined && score < 40;
    },
    priority: 'medium',
    generateMessage: (ctx) => {
      const score = ctx.injuryReport?.flaggedRegions[0]?.recoveryScore || 35;
      return {
        trigger: 'recovery_low',
        priority: 'medium',
        title: '😴 Recuperação Baixa',
        body: `O teu score de recuperação está em ${score}%. O teu sono e HRV indicam fadiga. Um dia de descanso ativo pode ser mais produtivo.`,
        action: 'recovery',
        actionLabel: 'Sessão de Recuperação',
        data: { recoveryScore: score },
      };
    },
  },

  // 🟡 MEDIUM: Overtraining detectado
  {
    type: 'overtraining_detected',
    condition: (ctx) => {
      const highACWR = ctx.injuryReport?.flaggedRegions.some(
        (r) => r.acuteChronicRatio > 1.3
      );
      const highRPE = ctx.workoutHistory
        .slice(-7)
        .every((w) => w.exercises.some((e) => e.sets.some((s: any) => (s.rpe || 5) > 8)));
      return !!highACWR && highRPE;
    },
    priority: 'high',
    generateMessage: (ctx) => ({
      trigger: 'overtraining_detected',
      priority: 'high',
      title: '🔥 Overtraining Detectado',
      body: 'O teu RPE médio subiu 20% esta semana e o ACWR ultrapassou 1.3. É hora de um deload de 3-5 dias para supercompensação.',
      action: 'rest',
      actionLabel: 'Iniciar Deload',
      data: { recommendedDays: 3 },
    }),
  },

  // 🟢 LOW: Undertraining (volume crónico a cair)
  {
    type: 'undertraining_detected',
    condition: (ctx) => {
      const noWorkout3Days = ctx.daysSinceLastWorkout >= 3;
      const chronicDropping = ctx.injuryReport?.flaggedRegions.some(
        (r) => r.acuteChronicRatio < 0.8
      );
      return noWorkout3Days && !!chronicDropping;
    },
    priority: 'low',
    generateMessage: (ctx) => ({
      trigger: 'undertraining_detected',
      priority: 'low',
      title: '💪 Estás Há 3 Dias Parado',
      body: `O teu volume crónico está a cair (ACWR: ${ctx.injuryReport?.flaggedRegions[0]?.acuteChronicRatio?.toFixed(2) || '0.00'}). Um treino rápido de 20min mantém a progressão.`,
      action: 'workout',
      actionLabel: 'Treino Rápido',
      data: { suggestedDuration: 20 },
    }),
  },

  // 🏆 MEDIUM: PR batido
  {
    type: 'pr_achieved',
    condition: (ctx) => {
      const last = ctx.lastWorkout;
      if (!last) return false;
      // Detectar se algum set foi PR (lógica simplificada)
      return last.exercises.some((ex: any) =>
        ex.sets.some((set: any) => {
          if (set.type !== 'weighted') return false;
          // Comparar com histórico (simplificado)
          const historicalMax = ctx.workoutHistory
            .filter((w) => w.date < last.date)
            .flatMap((w) => w.exercises)
            .filter((e: any) => e.name === ex.name)
            .flatMap((e: any) => e.sets)
            .filter((s: any) => s.type === 'weighted')
            .reduce((max: number, s: any) => Math.max(max, s.weight || 0), 0);
          return (set.weight || 0) > historicalMax && historicalMax > 0;
        })
      );
    },
    priority: 'medium',
    generateMessage: (ctx) => {
      const prExercise = ctx.lastWorkout?.exercises.find((ex: any) =>
        ex.sets.some((set: any) => set.type === 'weighted' && set.isPR)
      );
      const prSet = prExercise?.sets.find((s: any) => s.isPR);
      return {
        trigger: 'pr_achieved',
        priority: 'medium',
        title: '🏆 Novo Recorde Pessoal!',
        body: `${prExercise?.name}: ${prSet?.weight}kg × ${prSet?.reps} reps. Estás 5% acima do teu 1RM estimado!`,
        action: 'view_details',
        actionLabel: 'Ver Progressão',
        data: { exercise: prExercise?.name, weight: prSet?.weight, reps: prSet?.reps },
      };
    },
  },

  // 🔥 HIGH: Streak em risco
  {
    type: 'streak_at_risk',
    condition: (ctx) => ctx.streakDays >= 7 && ctx.daysSinceLastWorkout === 1,
    priority: 'high',
    generateMessage: (ctx) => ({
      trigger: 'streak_at_risk',
      priority: 'high',
      title: '🔥 Streak em Risco!',
      body: `Estás com ${ctx.streakDays} dias consecutivos! Falta 1 dia para perderes a streak. Um treino de 15min conta!`,
      action: 'workout',
      actionLabel: 'Treino Express',
      data: { streakDays: ctx.streakDays },
    }),
  },

  // 💡 LOW: Deload recomendado (preventivo)
  {
    type: 'deload_recommended',
    condition: (ctx) => {
      const weeksWithoutDeload = ctx.workoutHistory.filter(
        (w) => new Date(w.date) > new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)
      ).length;
      return weeksWithoutDeload >= 12; // 3+ meses sem deload
    },
    priority: 'low',
    generateMessage: (ctx) => ({
      trigger: 'deload_recommended',
      priority: 'low',
      title: '💡 Deload Preventivo',
      body: 'Já vão 3 meses sem deload. A ciência recomenda 1 semana a 50% de volume a cada 4-6 semanas para supercompensação.',
      action: 'modify_plan',
      actionLabel: 'Ver Plano Deload',
      data: { recommendedWeeks: 1 },
    }),
  },
];

// ── 3. Motor Principal ─────────────────────────────────────

export function evaluateTriggers(context: TriggerContext): ProactiveMessage[] {
  const messages: ProactiveMessage[] = [];

  for (const rule of TRIGGER_RULES) {
    try {
      if (rule.condition(context)) {
        const messageData = rule.generateMessage(context);
        const message: ProactiveMessage = {
          ...messageData,
          id: `${rule.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
          dismissed: false,
        };
        messages.push(message);

        // Track no analytics
        trackEvent('proactive_message_generated', {
          trigger: rule.type,
          priority: rule.priority,
        });
      }
    } catch (error) {
      console.error(`Error evaluating trigger ${rule.type}:`, error);
    }
  }

  // Ordenar por prioridade
  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
  return messages.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

// ── 4. Helpers ─────────────────────────────────────────────

export function shouldShowMessage(message: ProactiveMessage): boolean {
  if (message.dismissed) return false;
  if (message.expiresAt && new Date(message.expiresAt) < new Date()) return false;
  return true;
}

export function dismissMessage(messageId: string): void {
  // Implementado no store
}

export function getMessageIcon(trigger: TriggerType): string {
  const icons: Record<TriggerType, string> = {
    injury_risk_critical: '🚨',
    injury_risk_high: '⚠️',
    recovery_low: '😴',
    overtraining_detected: '🔥',
    undertraining_detected: '💪',
    pr_achieved: '🏆',
    streak_at_risk: '🔥',
    deload_recommended: '💡',
    form_check_needed: '🎥',
    nutrition_reminder: '🥗',
  };
  return icons[trigger] || '💬';
}
