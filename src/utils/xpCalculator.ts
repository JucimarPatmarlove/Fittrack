// src/utils/xpCalculator.ts

export function calculateSetEffort(set: any, userBodyweightKg: number = 75): number {
  const bw = userBodyweightKg; // fallback if undefined or 0

  switch (set.type) {
    case 'weighted':
      return (set.weight || 0) * (set.reps || 0);

    case 'bodyweight': {
      const baseWeight = bw * 0.7; // 70% do peso corporal
      const added = set.addedWeight || 0;
      return (baseWeight + added) * (set.reps || 0);
    }

    case 'cardio': {
      const distEffort = (set.distance || 0) * 100;
      const timeEffort = (set.duration || 0) / 60 * 2; // duration em segundos -> minutos
      return distEffort + timeEffort;
    }

    case 'timed':
      return set.duration || 0; // segundos

    case 'mobility':
      return (set.duration || 0) * 0.5;

    case 'distance':
      return (set.distance || 0) * 100;

    default:
      // Fallback para sets antigos que não têm type definido explicitamente
      return (set.weight || 0) * (set.reps || 0);
  }
}

export function calculateWorkoutEffort(sets: any[], userBodyweightKg: number = 75): number {
  return sets.flat().filter(s => s.done).reduce((sum, set) => {
    return sum + calculateSetEffort(set, userBodyweightKg);
  }, 0);
}
