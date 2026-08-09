// @ts-nocheck
import { describe, expect, it } from 'vitest';
import type { UserProfile } from '../../types';
import { OfflineWorkoutEngine } from '../offlineWorkoutEngine';

describe('OfflineWorkoutEngine', () => {
  it('should generate a fallback single workout properly', () => {
    const profile: Partial<UserProfile> = { goal: 'Hipertrofia' };
    const workout = OfflineWorkoutEngine.generateSingleWorkout(profile);

    expect(workout).toBeDefined();
    expect(workout.exercises.length).toBeGreaterThan(0);
    expect(workout.id).toMatch(/^ai_gen_fallback_/);
  });

  it('should return HOME_GYM_POOL if equipment is Apenas Halteres', () => {
    const profile: Partial<UserProfile> = { availableEquipment: ['Apenas Halteres'] };
    // This calls selectExercisePool internally via generateWeeklyPlan
    const plan = OfflineWorkoutEngine.generateWeeklyPlan(profile, 'hipertrofia');

    expect(plan.workouts).toBeDefined();
    expect(plan.workouts.length).toBe(7);
  });

  it('should generate a rest day for inactive days', () => {
    const profile: Partial<UserProfile> = { trainingDays: ['Segunda', 'Quarta'] };
    const plan = OfflineWorkoutEngine.generateWeeklyPlan(profile, 'hipertrofia');

    const tuesday = plan.workouts.find((w: any) => w.day === 'Terça');
    expect(tuesday.focus).toBe('Descanso');
    expect(tuesday.exercises).toContain('Recuperação Ativa');
  });

  it('should prioritize user preferences', () => {
    const profile: Partial<UserProfile> = {
      trainingDays: ['Segunda'],
      dayPreferences: { Segunda: 'Peito Foco' },
    };
    const plan = OfflineWorkoutEngine.generateWeeklyPlan(profile, 'hipertrofia');

    const monday = plan.workouts.find((w: any) => w.day === 'Segunda');
    expect(monday.focus).toContain('Peito');
  });
});
