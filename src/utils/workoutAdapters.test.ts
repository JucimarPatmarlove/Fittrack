import { describe, it, expect } from 'vitest';
import { toWorkoutData, toWorkoutSession } from './workoutAdapters';
import type { WorkoutSession } from '../db/schema';

describe('workoutAdapters', () => {
  describe('toWorkoutData', () => {
    it('should convert WorkoutSession to WorkoutSessionData correctly', () => {
      const session: WorkoutSession = {
        id: 'test-id-123',
        date: 1700000000000,
        name: 'Treino Teste',
        durationSeconds: 3600,
        totalVolumeKg: 5000,
        readinessScore: 85,
        isCompleted: true,
      };

      const result = toWorkoutData(session);

      expect(result.date).toBe('2023-11-14'); // 1700000000000 converted to date string
      expect(result.dayLabel).toBe('Treino Teste');
      expect(result.duration).toBe(3600);
      expect(result.totalVolume).toBe(5000);
      expect(result.exercises).toEqual([]);
    });

    it('should handle empty name', () => {
      const session: WorkoutSession = {
        id: 'test-id',
        date: Date.now(),
        name: '',
        durationSeconds: 1800,
        totalVolumeKg: 2500,
        readinessScore: 75,
        isCompleted: true,
      };

      const result = toWorkoutData(session);
      expect(result.dayLabel).toBe('');
    });

    it('should handle zero values', () => {
      const session: WorkoutSession = {
        id: 'test-id',
        date: Date.now(),
        name: 'Treino Leve',
        durationSeconds: 0,
        totalVolumeKg: 0,
        readinessScore: 90,
        isCompleted: false,
      };

      const result = toWorkoutData(session);
      expect(result.duration).toBe(0);
      expect(result.totalVolume).toBe(0);
    });
  });

  describe('toWorkoutSession', () => {
    it('should convert WorkoutSessionData to WorkoutSession correctly', () => {
      const data = {
        date: '2023-11-14',
        dayLabel: 'Treino Teste',
        duration: 3600,
        totalVolume: 5000,
        exercises: [],
      };

      const result = toWorkoutSession(data);

      expect(result.id).toBeDefined();
      expect(result.date).toBe(1699920000000); // timestamp from date string (2023-11-14T00:00:00.000Z)
      expect(result.name).toBe('Treino Teste');
      expect(result.durationSeconds).toBe(3600);
      expect(result.totalVolumeKg).toBe(5000);
      expect(result.readinessScore).toBe(85);
      expect(result.isCompleted).toBe(true);
    });

    it('should use provided id if exists', () => {
      const data = {
        id: 'custom-id',
        date: '2023-11-14',
        dayLabel: 'Treino Teste',
        duration: 3600,
        totalVolume: 5000,
        exercises: [],
      };

      const result = toWorkoutSession(data);
      expect(result.id).toBe('custom-id');
    });

    it('should generate random id if not provided', () => {
      const data = {
        date: '2023-11-14',
        dayLabel: 'Treino Teste',
        duration: 3600,
        totalVolume: 5000,
        exercises: [],
      };

      const result1 = toWorkoutSession(data);
      const result2 = toWorkoutSession(data);

      expect(result1.id).not.toBe(result2.id);
      expect(result1.id).toBeDefined();
    });

    it('should handle empty dayLabel with default', () => {
      const data = {
        date: '2023-11-14',
        dayLabel: '',
        duration: 1800,
        totalVolume: 2500,
        exercises: [],
      };

      const result = toWorkoutSession(data);
      expect(result.name).toBe('Treino');
    });
  });
});
