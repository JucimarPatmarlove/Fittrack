import type { UserProfile } from '../types';
// @ts-nocheck
import type { MuscleRecovery } from './fitnessMechanics';
import { createSpan } from '../utils/telemetry';
import { SpanStatusCode } from '@opentelemetry/api';

export class AIWorkoutGenerator {
  private static exercisePool = [
    { name: 'Supino Plano', muscle: 'Peito', difficulty: 'iniciante' },
    { name: 'Fundos', muscle: 'Peito', difficulty: 'intermedio' },
    { name: 'Puxada Frontal', muscle: 'Costas', difficulty: 'iniciante' },
    { name: 'Remada Curvada', muscle: 'Costas', difficulty: 'intermedio' },
    { name: 'Barra Fixa', muscle: 'Costas', difficulty: 'avancado' },
    { name: 'Agachamento', muscle: 'Pernas', difficulty: 'iniciante' },
    { name: 'Leg Press', muscle: 'Pernas', difficulty: 'iniciante' },
    { name: 'Press Militar', muscle: 'Ombros', difficulty: 'iniciante' },
    { name: 'Elevação Lateral', muscle: 'Ombros', difficulty: 'iniciante' },
    { name: 'Rosca Direta', muscle: 'Bíceps', difficulty: 'iniciante' },
    { name: 'Tríceps Corda', muscle: 'Tríceps', difficulty: 'iniciante' },
    { name: 'Tríceps Testa', muscle: 'Tríceps', difficulty: 'intermedio' },
    { name: 'Plank', muscle: 'Core', difficulty: 'iniciante' },
    { name: 'Burpees', muscle: 'Core', difficulty: 'intermedio' },
  ];

  private static determineAnatolyPhase(
    history: any[] | undefined,
    muscleGroup: string,
  ): 'powerlifting' | 'bodybuilding' {
    if (!history || history.length === 0) return 'powerlifting';

    const lastWorkout = history
      .filter(
        (w) => w && w.exercises && w.exercises.some((e: any) => e && e.muscle === muscleGroup),
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

    if (!lastWorkout) return 'powerlifting';

    const lastExercise = lastWorkout.exercises.find((e: any) => e && e.muscle === muscleGroup);
    const wasPowerlifting =
      lastExercise && lastExercise.sets && lastExercise.sets.some((s: any) => s && s.reps <= 5);

    return wasPowerlifting ? 'bodybuilding' : 'powerlifting';
  }

  static generateWorkout(
    recoveredMuscles: MuscleRecovery[],
    profile: UserProfile,
    history?: any[],
  ) {
    const span = createSpan('ai.coach.response', { 
        muscle_count: recoveredMuscles.length,
        profile_level: profile.level
    });

    try {
    // 1. Priorizar os 2 ou 3 músculos mais descansados (>70% de recuperação)
    const toTrain = recoveredMuscles
      .filter((m) => m.recoveryPercentage > 70)
      .sort((a, b) => b.recoveryPercentage - a.recoveryPercentage)
      .slice(0, 3);

    if (toTrain.length === 0) return null;

    const selectedExercises: string[] = [];

    // 2. Escolher os exercícios correspondentes
    toTrain.forEach((m) => {
      const suitable = this.exercisePool.filter((e) => e.muscle === m.muscle);
      if (suitable.length > 0) {
        selectedExercises.push(suitable[0].name);
        if (suitable[1]) selectedExercises.push(suitable[1].name);
      }
    });

    // 3. Determinar fase DUP (Anatoly) com base no músculo primário
    const primaryMuscle = toTrain[0].muscle;
    const phase = this.determineAnatolyPhase(history, primaryMuscle);

    const labelPrefix =
      phase === 'powerlifting'
        ? '🔥 DIA DE FORÇA (POWERLIFTING)'
        : '💪 DIA DE VOLUME (BODYBUILDING)';

    const result = {
      id: `anatoly_${Date.now()}`,
      label: `${labelPrefix}: ${toTrain.map((m) => m.muscle).join(' & ')}`,
      phase,
      exercises: selectedExercises,
    };
    
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: (error as Error).message });
      throw error;
    } finally {
      span.end();
    }
  }
}
