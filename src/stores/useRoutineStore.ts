import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WORKOUT_PLANS } from '../data/constants';

interface RoutinePlan {
  id: string;
  name: string;
  description: string;
  days: {
    label: string;
    focus: string;
    exercises: string[];
  }[];
}

interface RoutineState {
  activeRoutineId: string;
  customRoutines: RoutinePlan[];
  getActiveRoutine: () => RoutinePlan | null;
  setActiveRoutine: (id: string) => void;
  applyNewRoutine: (routine: RoutinePlan) => void;
}

// Exemplos de templates periodizados
export const DEFAULT_ROUTINES: RoutinePlan[] = [
  {
    id: 'hypertrophy_v1',
    name: 'Hipertrofia Periodizada',
    description: 'Foco em volume ondulatório para ganho de massa muscular.',
    days: [
      { label: 'Push (Peito, Ombro, Tríceps)', focus: 'Push', exercises: ['Supino Inclinado com Halteres', 'Desenvolvimento', 'Tríceps Corda'] },
      { label: 'Pull (Costas, Bíceps)', focus: 'Pull', exercises: ['Puxada Frontal', 'Remada Curvada', 'Rosca Direta'] },
      { label: 'Pernas', focus: 'Legs', exercises: ['Agachamento Livre', 'Leg Press', 'Cadeira Extensora'] },
      { label: 'Full Body', focus: 'Full Body', exercises: ['Desenvolvimento', 'Agachamento Livre', 'Puxada Frontal', 'Abdominais'] },
    ]
  },
  {
    id: 'strength_v1',
    name: 'Força e Potência',
    description: 'Maior intensidade, menos reps, focado em progressão de carga.',
    days: [
      { label: 'Força Superior', focus: 'Upper', exercises: ['Supino Reto', 'Remada Curvada', 'Desenvolvimento'] },
      { label: 'Força Inferior', focus: 'Lower', exercises: ['Agachamento Livre', 'Levantamento Terra', 'Leg Press'] },
      { label: 'Potência Total', focus: 'Full', exercises: ['Levantamento Terra', 'Supino Inclinado com Halteres'] },
    ]
  }
];

export const useRoutineStore = create<RoutineState>()(
  persist(
    (set, get) => ({
      activeRoutineId: 'hypertrophy_v1',
      customRoutines: [],
      
      getActiveRoutine: () => {
        const id = get().activeRoutineId;
        return get().customRoutines.find(r => r.id === id) || DEFAULT_ROUTINES.find(r => r.id === id) || null;
      },
      
      setActiveRoutine: (id) => set({ activeRoutineId: id }),
      
      applyNewRoutine: (routine) => set((state) => ({
        customRoutines: [...state.customRoutines.filter(r => r.id !== routine.id), routine],
        activeRoutineId: routine.id
      }))
    }),
    { name: 'ft_routines' }
  )
);
