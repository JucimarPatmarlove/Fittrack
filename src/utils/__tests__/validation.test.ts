// src/utils/__tests__/validation.test.ts
// Testes para os schemas Zod de validação de formulários (nutrição, exercícios, perfil).

import { describe, expect, it } from 'vitest';
import {
  ExerciseSetSchema,
  MealItemSchema,
  ProfileFieldsSchema,
  WaterInputSchema,
  validateExerciseSet,
  validateMealItem,
  validateProfileFields,
} from '../validation';

describe('validation — MealItemSchema', () => {
  it('aceita um item de refeição válido', () => {
    const result = MealItemSchema.safeParse({
      name: 'Peito de Frango',
      calories: 165,
      protein: 31,
      carb: 0,
      fat: 3.6,
    });
    expect(result.success).toBe(true);
  });

  it('rejeita calorias negativas', () => {
    const result = MealItemSchema.safeParse({
      name: 'Alimento',
      calories: -100,
      protein: 10,
      carb: 5,
      fat: 2,
    });
    expect(result.success).toBe(false);
  });

  it('rejeita proteínas > 500g', () => {
    const result = MealItemSchema.safeParse({
      name: 'Alimento',
      calories: 200,
      protein: 501,
      carb: 5,
      fat: 2,
    });
    expect(result.success).toBe(false);
  });

  it('rejeita calorias > 5000', () => {
    const result = MealItemSchema.safeParse({
      name: 'Alimento',
      calories: 5001,
      protein: 10,
      carb: 5,
      fat: 2,
    });
    expect(result.success).toBe(false);
  });

  it('rejeita nome vazio', () => {
    const result = MealItemSchema.safeParse({
      name: '',
      calories: 100,
      protein: 10,
      carb: 5,
      fat: 2,
    });
    expect(result.success).toBe(false);
  });

  it('rejeita gorduras negativas', () => {
    const result = MealItemSchema.safeParse({
      name: 'Alimento',
      calories: 100,
      protein: 10,
      carb: 5,
      fat: -1,
    });
    expect(result.success).toBe(false);
  });

  it('aceita valores zero (0 calorias, 0g macros)', () => {
    const result = MealItemSchema.safeParse({
      name: 'Água',
      calories: 0,
      protein: 0,
      carb: 0,
      fat: 0,
    });
    expect(result.success).toBe(true);
  });
});

describe('validation — ExerciseSetSchema', () => {
  it('aceita um set válido', () => {
    const result = ExerciseSetSchema.safeParse({ weight: 80, reps: 10, rpe: 8 });
    expect(result.success).toBe(true);
  });

  it('aceita um set sem RPE (opcional)', () => {
    const result = ExerciseSetSchema.safeParse({ weight: 80, reps: 10 });
    expect(result.success).toBe(true);
  });

  it('rejeita peso negativo', () => {
    const result = ExerciseSetSchema.safeParse({ weight: -5, reps: 10, rpe: 8 });
    expect(result.success).toBe(false);
  });

  it('rejeita peso > 1000kg', () => {
    const result = ExerciseSetSchema.safeParse({ weight: 1001, reps: 10, rpe: 8 });
    expect(result.success).toBe(false);
  });

  it('rejeita reps negativos', () => {
    const result = ExerciseSetSchema.safeParse({ weight: 80, reps: -1, rpe: 8 });
    expect(result.success).toBe(false);
  });

  it('rejeita reps > 100', () => {
    const result = ExerciseSetSchema.safeParse({ weight: 80, reps: 101, rpe: 8 });
    expect(result.success).toBe(false);
  });

  it('rejeita RPE < 1', () => {
    const result = ExerciseSetSchema.safeParse({ weight: 80, reps: 10, rpe: 0 });
    expect(result.success).toBe(false);
  });

  it('rejeita RPE > 10', () => {
    const result = ExerciseSetSchema.safeParse({ weight: 80, reps: 10, rpe: 11 });
    expect(result.success).toBe(false);
  });

  it('aceita peso 0 (bodyweight)', () => {
    const result = ExerciseSetSchema.safeParse({ weight: 0, reps: 15 });
    expect(result.success).toBe(true);
  });
});

describe('validation — ProfileFieldsSchema', () => {
  it('aceita campos válidos', () => {
    const result = ProfileFieldsSchema.safeParse({ weight: 80, height: 178, age: 28 });
    expect(result.success).toBe(true);
  });

  it('aceita apenas peso (height e age opcionais)', () => {
    const result = ProfileFieldsSchema.safeParse({ weight: 70 });
    expect(result.success).toBe(true);
  });

  it('rejeita peso < 30kg', () => {
    const result = ProfileFieldsSchema.safeParse({ weight: 25 });
    expect(result.success).toBe(false);
  });

  it('rejeita peso > 300kg', () => {
    const result = ProfileFieldsSchema.safeParse({ weight: 301 });
    expect(result.success).toBe(false);
  });

  it('rejeita idade < 14', () => {
    const result = ProfileFieldsSchema.safeParse({ weight: 70, age: 10 });
    expect(result.success).toBe(false);
  });

  it('rejeita idade > 100', () => {
    const result = ProfileFieldsSchema.safeParse({ weight: 70, age: 101 });
    expect(result.success).toBe(false);
  });

  it('rejeita altura < 100cm', () => {
    const result = ProfileFieldsSchema.safeParse({ weight: 70, height: 50 });
    expect(result.success).toBe(false);
  });

  it('rejeita altura > 250cm', () => {
    const result = ProfileFieldsSchema.safeParse({ weight: 70, height: 260 });
    expect(result.success).toBe(false);
  });
});

describe('validation — WaterInputSchema', () => {
  it('aceita 250ml', () => {
    const result = WaterInputSchema.safeParse(250);
    expect(result.success).toBe(true);
  });

  it('rejeita 0ml', () => {
    const result = WaterInputSchema.safeParse(0);
    expect(result.success).toBe(false);
  });

  it('rejeita valores negativos', () => {
    const result = WaterInputSchema.safeParse(-100);
    expect(result.success).toBe(false);
  });

  it('rejeita > 5000ml', () => {
    const result = WaterInputSchema.safeParse(5001);
    expect(result.success).toBe(false);
  });
});

describe('validation — helper functions', () => {
  describe('validateMealItem', () => {
    it('retorna success com data para input válido', () => {
      const result = validateMealItem({ name: 'Ovo', calories: 78, protein: 6, carb: 1, fat: 5 });
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.name).toBe('Ovo');
    });

    it('retorna errors mapeados por campo para input inválido', () => {
      const result = validateMealItem({ name: '', calories: -100, protein: 600, carb: 5, fat: 2 });
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.name).toBeDefined();
      expect(result.errors?.calories).toBeDefined();
      expect(result.errors?.protein).toBeDefined();
    });
  });

  describe('validateExerciseSet', () => {
    it('retorna success para set válido', () => {
      const result = validateExerciseSet({ weight: 100, reps: 8, rpe: 9 });
      expect(result.success).toBe(true);
    });

    it('retorna errors para peso absurdo', () => {
      const result = validateExerciseSet({ weight: 2000, reps: -5, rpe: 15 });
      expect(result.success).toBe(false);
      expect(result.errors?.weight).toBeDefined();
      expect(result.errors?.reps).toBeDefined();
      expect(result.errors?.rpe).toBeDefined();
    });
  });

  describe('validateProfileFields', () => {
    it('retorna success para perfil válido', () => {
      const result = validateProfileFields({ weight: 80 });
      expect(result.success).toBe(true);
    });

    it('retorna errors para peso inválido', () => {
      const result = validateProfileFields({ weight: 5 });
      expect(result.success).toBe(false);
      expect(result.errors?.weight).toBeDefined();
    });
  });
});
