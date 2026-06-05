// src/services/macrocycleEngine.ts

export type TrainingPhase = 'ADAPTACAO' | 'TRANSFORMACAO' | 'DESENVOLVIMENTO';

export interface PhasePrescription {
  phaseName: string;
  trainingType: 'FullBody' | 'Circuito' | 'Split';
  focus: string[];
  sets: number;
  repsTarget: string;
  restSeconds: number;
  cardioMinutes: number;
}

export const MacrocycleEngine = {
  getCurrentPhase(weeksActive: number): TrainingPhase {
    if (weeksActive <= 4) return 'ADAPTACAO';
    if (weeksActive <= 12) return 'TRANSFORMACAO';
    return 'DESENVOLVIMENTO';
  },

  getPrescriptionRules(phase: TrainingPhase): PhasePrescription {
    switch (phase) {
      case 'ADAPTACAO':
        return {
          phaseName: 'Adaptação do Corpo e Articulações',
          trainingType: 'FullBody',
          focus: ['Postura', 'Técnica', 'Resistência Muscular'],
          sets: 2,
          repsTarget: '15-20',
          restSeconds: 45,
          cardioMinutes: 15,
        };
      case 'TRANSFORMACAO':
        return {
          phaseName: 'Perda de Massa Gorda (PMG)',
          trainingType: 'Circuito',
          focus: ['Massa Muscular', 'Metabolismo', 'Queima de Gordura'],
          sets: 4,
          repsTarget: '12',
          restSeconds: 120,
          cardioMinutes: 0,
        };
      case 'DESENVOLVIMENTO':
        return {
          phaseName: 'Ganho Massa Muscular (GMM) e Força',
          trainingType: 'Split',
          focus: ['Carga pesada', 'Massa Muscular', 'Força Máxima'],
          sets: 4,
          repsTarget: '10-12',
          restSeconds: 90,
          cardioMinutes: 0,
        };
    }
  },
};
