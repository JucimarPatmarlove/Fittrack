import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type WorkoutSlot = 'morning' | 'afternoon';

export interface ScheduledWorkout {
  id: string;
  date: string;
  slot: WorkoutSlot;
  workoutId: string;
  workoutName: string;
  completed: boolean;
  completedAt?: string;
}

interface DualWorkoutStore {
  scheduledWorkouts: ScheduledWorkout[];
  scheduleWorkout: (date: string, slot: WorkoutSlot, workoutId: string, workoutName: string) => void;
  completeWorkout: (date: string, slot: WorkoutSlot) => void;
  getWorkoutsForDate: (date: string) => { morning?: ScheduledWorkout; afternoon?: ScheduledWorkout };
  getNextWorkout: () => ScheduledWorkout | null;
}

export const useDualWorkoutStore = create<DualWorkoutStore>()(
  persist(
    (set, get) => ({
      scheduledWorkouts: [],

      scheduleWorkout: (date, slot, workoutId, workoutName) => {
        const newWorkout: ScheduledWorkout = {
          id: crypto.randomUUID(),
          date,
          slot,
          workoutId,
          workoutName,
          completed: false,
        };

        set(state => ({
          // Remove treinos anteriores não concluídos para o mesmo dia e bloco, substituindo pelo novo
          scheduledWorkouts: [
            ...state.scheduledWorkouts.filter(w => !(w.date === date && w.slot === slot && !w.completed)), 
            newWorkout
          ],
        }));
      },

      completeWorkout: (date, slot) => {
        set(state => ({
          scheduledWorkouts: state.scheduledWorkouts.map(w =>
            w.date === date && w.slot === slot
              ? { ...w, completed: true, completedAt: new Date().toISOString() }
              : w
          ),
        }));
      },

      getWorkoutsForDate: (date) => {
        const workouts = get().scheduledWorkouts.filter(w => w.date === date);
        return {
          morning: workouts.find(w => w.slot === 'morning'),
          afternoon: workouts.find(w => w.slot === 'afternoon'),
        };
      },

      getNextWorkout: () => {
        const today = new Date().toISOString().split('T')[0];
        const workouts = get().scheduledWorkouts
          .filter(w => !w.completed)
          .sort((a, b) => a.date.localeCompare(b.date));

        const todayWorkout = workouts.find(w => w.date === today);
        if (todayWorkout) return todayWorkout;

        return workouts.find(w => w.date > today) || null;
      },
    }),
    { name: 'dual-workout-storage' }
  )
);
