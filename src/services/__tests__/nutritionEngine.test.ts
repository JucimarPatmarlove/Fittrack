// src/services/__tests__/nutritionEngine.test.ts
// Testes unitários para calculateMacros() — Equação de Mifflin-St Jeor
// Cobre diferentes perfis (male, female, lose_weight, gain_muscle) e edge cases.

import { describe, it, expect } from 'vitest';
import { calculateMacros, FitnessGoal, ActivityLevel } from '../nutritionEngine';
import { UserProfile } from '../../types';

const baseProfile: UserProfile = {
  name: 'Test User',
  goal: 'hipertrofia',
  level: 'intermediate',
  weight: 80,
  height: 178,
  age: 28,
  gender: 'male',
};

describe('nutritionEngine — calculateMacros', () => {

  describe('Mifflin-St Jeor BMR Calculation', () => {

    it('calcula BMR correctamente para homem (male)', () => {
      const result = calculateMacros({ ...baseProfile, gender: 'male' });
      // BMR male = 10*80 + 6.25*178 - 5*28 + 5 = 800 + 1112.5 - 140 + 5 = 1777.5
      // TDEE = 1777.5 * 1.55 (MODERATE) = 2755 (rounded)
      // Hipertrofia = TDEE + 400 = 3155
      expect(result.targetCalories).toBe(3155);
    });

    it('calcula BMR correctamente para mulher (female)', () => {
      const result = calculateMacros({ ...baseProfile, gender: 'female', weight: 60, height: 165, age: 25 });
      // BMR female = 10*60 + 6.25*165 - 5*25 - 161 = 600 + 1031.25 - 125 - 161 = 1345.25
      // TDEE = 1345.25 * 1.55 = 2085 (rounded)
      // Hipertrofia = 2085 + 400 = 2485
      expect(result.targetCalories).toBe(2485);
    });

    it('calcula BMR correctamente para gender "other" (média)', () => {
      const result = calculateMacros({ ...baseProfile, gender: 'other' });
      // BMR other = 10*80 + 6.25*178 - 5*28 - 78 = 800 + 1112.5 - 140 - 78 = 1694.5
      // TDEE = 1694.5 * 1.55 = 2626 (rounded)
      // Hipertrofia = 2626 + 400 = 3026
      expect(result.targetCalories).toBe(3026);
    });
  });

  describe('Goal-based calorie adjustments', () => {

    it('aplica déficit calórico para perda_peso', () => {
      const result = calculateMacros({ ...baseProfile, goal: 'perda_peso' });
      // TDEE = 2755 (male, 80kg, 178cm, 28y, moderate)
      // perda_peso = TDEE - 500 = 2255
      expect(result.targetCalories).toBe(2255);
    });

    it('aplica superavit calórico para hipertrofia', () => {
      const result = calculateMacros({ ...baseProfile, goal: 'hipertrofia' });
      // hipertrofia = TDEE + 400 = 3155
      expect(result.targetCalories).toBe(3155);
    });

    it('aplica superavit calórico para forca', () => {
      const result = calculateMacros({ ...baseProfile, goal: 'forca' });
      // forca mapeia para GAIN_MUSCLE = TDEE + 400 = 3155
      expect(result.targetCalories).toBe(3155);
    });

    it('aplica manutenção para saude', () => {
      const result = calculateMacros({ ...baseProfile, goal: 'saude' });
      // saude = TDEE - 100 = 2655
      expect(result.targetCalories).toBe(2655);
    });

    it('aplica manutenção para condicionamento', () => {
      const result = calculateMacros({ ...baseProfile, goal: 'condicionamento' });
      // condicionamento mapeia para HEALTH = TDEE - 100 = 2655
      expect(result.targetCalories).toBe(2655);
    });

    it('aplica manutenção para goal desconhecido', () => {
      const result = calculateMacros({ ...baseProfile, goal: 'unknown_goal' });
      // Mapeia para MAINTAIN = TDEE = 2755
      expect(result.targetCalories).toBe(2755);
    });

    it('respeita o mínimo de 1200 kcal para perda_peso', () => {
      // Pessoa muito leve + sedentária
      const result = calculateMacros({
        ...baseProfile,
        goal: 'perda_peso',
        weight: 40,
        height: 150,
        age: 60,
        gender: 'female',
        anamnesis: { activityLevel: 'sedentario', medicalConditions: [], weeklyFrequencyTarget: 0, goalPriorities: [], targetZone: '', motivationScore: 0 },
      });
      // BMR female = 10*40 + 6.25*150 - 5*60 - 161 = 400 + 937.5 - 300 - 161 = 876.5
      // TDEE = 876.5 * 1.2 = 1052 (rounded)
      // perda_peso = max(1200, 1052 - 500) = max(1200, 552) = 1200
      expect(result.targetCalories).toBe(1200);
    });
  });

  describe('Macro split ratios', () => {

    it('aplica ratio 30/45/25 para hipertrofia (GAIN_MUSCLE)', () => {
      const result = calculateMacros({ ...baseProfile, goal: 'hipertrofia' });
      // targetCalories = 3155
      // protein = 3155 * 0.30 / 4 = 237 (rounded)
      // carb = 3155 * 0.45 / 4 = 355 (rounded)
      // fat = 3155 * 0.25 / 9 = 88 (rounded)
      expect(result.targetProtein).toBe(237);
      expect(result.targetCarb).toBe(355);
      expect(result.targetFat).toBe(88);
    });

    it('aplica ratio 35/40/25 para perda_peso (LOSE_WEIGHT)', () => {
      const result = calculateMacros({ ...baseProfile, goal: 'perda_peso' });
      // targetCalories = 2255
      // protein = 2255 * 0.35 / 4 = 197 (rounded)
      // carb = 2255 * 0.40 / 4 = 226 (rounded)
      // fat = 2255 * 0.25 / 9 = 63 (rounded)
      expect(result.targetProtein).toBe(197);
      expect(result.targetCarb).toBe(226);
      expect(result.targetFat).toBe(63);
    });

    it('aplica ratio 25/50/25 para manutenção (MAINTAIN)', () => {
      const result = calculateMacros({ ...baseProfile, goal: 'random_unknown' });
      // targetCalories = 2755
      // protein = 2755 * 0.25 / 4 = 172 (rounded)
      // carb = 2755 * 0.50 / 4 = 344 (rounded)
      // fat = 2755 * 0.25 / 9 = 77 (rounded)
      expect(result.targetProtein).toBe(172);
      expect(result.targetCarb).toBe(344);
      expect(result.targetFat).toBe(77);
    });
  });

  describe('Activity level multipliers', () => {

    it('aplica multiplicador sedentário (1.2) via anamnese', () => {
      const result = calculateMacros({
        ...baseProfile,
        goal: 'hipertrofia',
        anamnesis: { activityLevel: 'sedentario', medicalConditions: [], weeklyFrequencyTarget: 0, goalPriorities: [], targetZone: '', motivationScore: 0 },
      });
      // BMR = 1777.5, TDEE = 1777.5 * 1.2 = 2133, + 400 = 2533
      expect(result.targetCalories).toBe(2533);
    });

    it('aplica multiplicador ativo (1.725) via anamnese', () => {
      const result = calculateMacros({
        ...baseProfile,
        goal: 'hipertrofia',
        anamnesis: { activityLevel: 'praticante_regular', medicalConditions: [], weeklyFrequencyTarget: 0, goalPriorities: [], targetZone: '', motivationScore: 0 },
      });
      // BMR = 1777.5, TDEE = 1777.5 * 1.725 = 3066, + 400 = 3466
      expect(result.targetCalories).toBe(3466);
    });
  });

  describe('Edge cases e defaults', () => {

    it('aplica defaults quando campos estão vazios', () => {
      const result = calculateMacros({ name: 'Atleta', goal: 'hipertrofia', level: 'beginner', weight: 0 } as UserProfile);
      // weight=0 usa default=70, height default=170, age default=30, gender default=other
      // BMR other = 10*70 + 6.25*170 - 5*30 - 78 = 700 + 1062.5 - 150 - 78 = 1534.5
      // TDEE = 1534.5 * 1.55 = 2378 (rounded)
      // hipertrofia = 2378 + 400 = 2778
      expect(result.targetCalories).toBe(2778);
    });

    it('preserva todos os campos originais do perfil', () => {
      const input = { ...baseProfile, injuries: ['joelho'], proMode: true };
      const result = calculateMacros(input);
      expect(result.injuries).toEqual(['joelho']);
      expect(result.proMode).toBe(true);
      expect(result.name).toBe('Test User');
    });

    it('retorna targetCalories, targetProtein, targetCarb, targetFat', () => {
      const result = calculateMacros(baseProfile);
      expect(result.targetCalories).toBeDefined();
      expect(result.targetProtein).toBeDefined();
      expect(result.targetCarb).toBeDefined();
      expect(result.targetFat).toBeDefined();
      expect(typeof result.targetCalories).toBe('number');
      expect(typeof result.targetProtein).toBe('number');
      expect(typeof result.targetCarb).toBe('number');
      expect(typeof result.targetFat).toBe('number');
    });

    it('macros somam aproximadamente as calorias target (±5%)', () => {
      const result = calculateMacros(baseProfile);
      const caloriesFromMacros = (result.targetProtein! * 4) + (result.targetCarb! * 4) + (result.targetFat! * 9);
      const tolerance = result.targetCalories! * 0.05;
      expect(Math.abs(caloriesFromMacros - result.targetCalories!)).toBeLessThanOrEqual(tolerance);
    });
  });
});
