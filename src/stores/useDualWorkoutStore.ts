// @ts-nocheck
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
  scheduleWorkout: (
    date: string,
    slot: WorkoutSlot,
    workoutId: string,
    workoutName: string,
  ) => void;
  completeWorkout: (date: string, slot: WorkoutSlot) => void;
  getWorkoutsForDate: (date: string) => {
    morning?: ScheduledWorkout;
    afternoon?: ScheduledWorkout;
  };
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

        set((state) => ({
          // Remove treinos anteriores não concluídos para o mesmo dia e bloco, substituindo pelo novo
          scheduledWorkouts: [
            ...state.scheduledWorkouts.filter(
              (w) => !(w.date === date && w.slot === slot && !w.completed),
            ),
            newWorkout,
          ],
        }));
      },

      completeWorkout: (date, slot) => {
        set((state) => ({
          scheduledWorkouts: state.scheduledWorkouts.map((w) =>
            w.date === date && w.slot === slot
              ? { ...w, completed: true, completedAt: new Date().toISOString() }
              : w,
          ),
        }));
      },

      getWorkoutsForDate: (date) => {
        const workouts = get().scheduledWorkouts.filter((w) => w.date === date);
        return {
          morning: workouts.find((w) => w.slot === 'morning'),
          afternoon: workouts.find((w) => w.slot === 'afternoon'),
        };
      },

      getNextWorkout: () => {
        const workouts = get()
          .scheduledWorkouts.filter((w) => !w.completed)
          .sort((a, b) => {
            if (a.date !== b.date) return a.date.localeCompare(b.date);
            if (a.slot === 'morning' && b.slot === 'afternoon') return -1;
            if (a.slot === 'afternoon' && b.slot === 'morning') return 1;
            return 0;
          });
        return workouts.length > 0 ? workouts[0] : null;
      },
    }),
    { name: 'dual-workout-storage' },
  ),
);
