import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  calculateWorkoutXP,
  detectPRs,
  detectNewExercises,
  calculateLevelFromXP,
  calculateXPToLevel,
  getDefaultChallenges,
} from '../gamificationEngine';
import type { WorkoutSession } from '../../types';

vi.mock('../../db/schema', () => ({
  getDB: vi.fn(),
  getRecentSetLogsDecrypted: vi.fn(),
  getRecoveryMetricsByDateRange: vi.fn(),
}));

describe('gamificationEngine', () => {
  describe('calculateWorkoutXP', () => {
    it('deve calcular XP base com duração de 30min', () => {
      const xp = calculateWorkoutXP({
        durationMinutes: 30,
        totalVolumeKg: 0,
        prsHit: 0,
        streakDay: 0,
        rpeAverage: 5,
        exercisesCount: 3,
        newExercises: 0,
      });
      expect(xp).toBeGreaterThanOrEqual(100);
    });

    it('deve adicionar bónus de volume', () => {
      const xp = calculateWorkoutXP({
        durationMinutes: 30,
        totalVolumeKg: 5000,
        prsHit: 0,
        streakDay: 0,
        rpeAverage: 5,
        exercisesCount: 3,
        newExercises: 0,
      });
      expect(xp).toBeGreaterThanOrEqual(100 + 250); // 5000/1000 * 50 = 250
    });

    it('deve adicionar bónus de PR', () => {
      const xp = calculateWorkoutXP({
        durationMinutes: 30,
        totalVolumeKg: 0,
        prsHit: 2,
        streakDay: 0,
        rpeAverage: 5,
        exercisesCount: 3,
        newExercises: 0,
      });
      expect(xp).toBeGreaterThanOrEqual(100 + 400); // 2 * 200 = 400
    });

    it('deve adicionar bónus de streak', () => {
      const xpDay1 = calculateWorkoutXP({
        durationMinutes: 30,
        totalVolumeKg: 0,
        prsHit: 0,
        streakDay: 1,
        rpeAverage: 5,
        exercisesCount: 3,
        newExercises: 0,
      });
      const xpDay7 = calculateWorkoutXP({
        durationMinutes: 30,
        totalVolumeKg: 0,
        prsHit: 0,
        streakDay: 7,
        rpeAverage: 5,
        exercisesCount: 3,
        newExercises: 0,
      });
      expect(xpDay7).toBeGreaterThan(xpDay1);
    });
  });

  describe('detectPRs', () => {
    const history: WorkoutSession[] = [
      {
        id: '1',
        planId: 'p1',
        startedAt: Date.now() - 86400000,
        exercises: [
          { exerciseId: 'bench', sets: [{ weight: 80, reps: 8, rpe: 8 }] },
        ],
        totalVolume: 640,
        totalSets: 1,
        totalReps: 8,
        avgRpe: 8,
        durationSeconds: 60,
        xpEarned: 0,
        prs: [],
      } as any,
    ];

    it('deve detectar PR quando peso é maior que histórico', async () => {
      const workout: WorkoutSession = {
        id: '2',
        planId: 'p1',
        startedAt: Date.now(),
        exercises: [
          { exerciseId: 'bench', sets: [{ weight: 85, reps: 8, rpe: 8 }] },
        ],
        totalVolume: 680,
        totalSets: 1,
        totalReps: 8,
        avgRpe: 8,
        durationSeconds: 60,
        xpEarned: 0,
        prs: [],
      } as any;

      const prs = await detectPRs(workout, history);
      expect(prs).toBe(1);
    });

    it('não deve detectar PR quando peso é igual', async () => {
      const workout: WorkoutSession = {
        id: '3',
        planId: 'p1',
        startedAt: Date.now(),
        exercises: [
          { exerciseId: 'bench', sets: [{ weight: 80, reps: 8, rpe: 8 }] },
        ],
        totalVolume: 640,
        totalSets: 1,
        totalReps: 8,
        avgRpe: 8,
        durationSeconds: 60,
        xpEarned: 0,
        prs: [],
      } as any;

      const prs = await detectPRs(workout, history);
      expect(prs).toBe(0);
    });
  });

  describe('detectNewExercises', () => {
    const history: WorkoutSession[] = [
      {
        id: '1',
        planId: 'p1',
        startedAt: Date.now() - 86400000,
        exercises: [{ exerciseId: 'bench' }, { exerciseId: 'squat' }],
        totalVolume: 0,
        totalSets: 0,
        totalReps: 0,
        avgRpe: 0,
        durationSeconds: 0,
        xpEarned: 0,
        prs: [],
      } as any,
    ];

    it('deve detectar exercícios novos', async () => {
      const workout: WorkoutSession = {
        id: '2',
        planId: 'p1',
        startedAt: Date.now(),
        exercises: [{ exerciseId: 'deadlift' }, { exerciseId: 'bench' }],
        totalVolume: 0,
        totalSets: 0,
        totalReps: 0,
        avgRpe: 0,
        durationSeconds: 0,
        xpEarned: 0,
        prs: [],
      } as any;

      const count = await detectNewExercises(workout, history);
      expect(count).toBe(1);
    });
  });

  describe('XP to Level', () => {
    it('deve calcular XP necessário para nível', () => {
      const xp = calculateXPToLevel(1);
      expect(xp).toBeGreaterThan(0);
    });

    it('deve calcular nível a partir de XP', () => {
      const result = calculateLevelFromXP(1500);
      expect(result.level).toBe(2);
      expect(result.xpInLevel).toBeGreaterThanOrEqual(0);
    });
  });

  describe('default challenges', () => {
    it('deve retornar desafios com estrutura correta', () => {
      const challenges = getDefaultChallenges();
      expect(challenges).toBeInstanceOf(Array);
      expect(challenges[0]).toHaveProperty('id');
      expect(challenges[0]).toHaveProperty('type');
      expect(challenges[0]).toHaveProperty('target');
      expect(challenges[0]).toHaveProperty('reward');
    });
  });
});
