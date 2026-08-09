// src/services/demographicEngine.ts

export type DemographicProfile =
  | 'standard_adult'
  | 'female_cycle_synced'
  | 'senior_joint_focus'
  | 'youth_gamified';

export type CyclePhase = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal';

export interface DemographicFeatures {
  hideWeight: boolean;
  showAvatar: boolean;
  largeUI: boolean;
  rpeType: 'standard' | 'fun_scale' | 'joint_pain_scale';
  autoReplaceImpact: boolean;
  modulateIntensityByCycle: boolean;
  showCycleTracker: boolean;
  uiFontScale: number; // 1.0 = normal, 1.2 = maior
}

// Mapa de substituição para exercícios de alto impacto (para idosos com dor >= 7)
export const HIGH_IMPACT_REPLACEMENTS: Record<string, string> = {
  Agachamento: 'Agachamento na Caixa',
  'Agachamento Livre': 'Agachamento na Caixa',
  Saltos: 'Elevação de Joelhos',
  Burpees: 'Agachamento Lento',
  'Jumping Jacks': 'Marcha no Lugar',
  'Corda de Saltar': 'Step Lateral',
  'Box Jump': 'Step Up na Caixa',
  Lunge: 'Split Squat Assistido',
  Afundo: 'Leg Press',
  Corrida: 'Caminhada Rápida',
};

export const DemographicEngine = {
  getProfileType(age: number, gender: string, wantsCycleSyncing: boolean): DemographicProfile {
    if (age <= 14) return 'youth_gamified';
    if (age >= 60) return 'senior_joint_focus';
    if (gender === 'female' && wantsCycleSyncing) return 'female_cycle_synced';
    return 'standard_adult';
  },

  getFeatures(profileType: DemographicProfile): DemographicFeatures {
    switch (profileType) {
      case 'youth_gamified':
        return {
          hideWeight: true,
          showAvatar: true,
          largeUI: false,
          rpeType: 'fun_scale',
          autoReplaceImpact: false,
          modulateIntensityByCycle: false,
          showCycleTracker: false,
          uiFontScale: 1.0,
        };
      case 'senior_joint_focus':
        return {
          hideWeight: false,
          showAvatar: false,
          largeUI: true,
          rpeType: 'joint_pain_scale',
          autoReplaceImpact: true,
          modulateIntensityByCycle: false,
          showCycleTracker: false,
          uiFontScale: 1.2,
        };
      case 'female_cycle_synced':
        return {
          hideWeight: false,
          showAvatar: false,
          largeUI: false,
          rpeType: 'standard',
          autoReplaceImpact: false,
          modulateIntensityByCycle: true,
          showCycleTracker: true,
          uiFontScale: 1.0,
        };
      default: // standard_adult
        return {
          hideWeight: false,
          showAvatar: false,
          largeUI: false,
          rpeType: 'standard',
          autoReplaceImpact: false,
          modulateIntensityByCycle: false,
          showCycleTracker: false,
          uiFontScale: 1.0,
        };
    }
  },

  // Para mulheres: factor de intensidade baseado na fase do ciclo
  getCycleIntensityFactor(cyclePhase: CyclePhase): number {
    switch (cyclePhase) {
      case 'menstrual':
        return 0.7; // redução de 30%
      case 'luteal':
        return 0.85; // redução de 15%
      case 'follicular':
        return 1.0;
      case 'ovulatory':
        return 1.05; // ligeiro aumento
      default:
        return 1.0;
    }
  },

  // Determinar fase do ciclo a partir do dia (simplificado, ciclo de 28 dias)
  getCyclePhaseFromDay(day: number): CyclePhase {
    if (day <= 5) return 'menstrual';
    if (day <= 13) return 'follicular';
    if (day <= 15) return 'ovulatory';
    return 'luteal';
  },

  // Substituir exercício de alto impacto (para idosos com dor alta)
  replaceHighImpactExercise(exerciseName: string): string {
    return HIGH_IMPACT_REPLACEMENTS[exerciseName] || exerciseName;
  },
};
