// @ts-nocheck
// src/utils/validation.ts
// Schemas Zod para validação rigorosa de formulários (nutrição, exercícios, perfil).
// Impede inputs absurdos como calorias negativas ou proteínas > 500g.

import { z } from 'zod';

// ── NUTRIÇÃO: Validação de Item de Refeição ──────────────────────────────────

export const MealItemSchema = z.object({
  name: z
    .string()
    .min(1, 'O nome do alimento é obrigatório.')
    .max(100, 'O nome é demasiado longo (máx. 100 caracteres).'),
  calories: z
    .number({ invalid_type_error: 'Calorias deve ser um número.' })
    .min(0, 'Calorias não pode ser negativo.')
    .max(5000, 'Valor máximo de calorias: 5000 kcal.'),
  protein: z
    .number({ invalid_type_error: 'Proteínas deve ser um número.' })
    .min(0, 'Proteínas não pode ser negativo.')
    .max(500, 'Valor máximo de proteínas: 500g.'),
  carb: z
    .number({ invalid_type_error: 'Carboidratos deve ser um número.' })
    .min(0, 'Carboidratos não pode ser negativo.')
    .max(1000, 'Valor máximo de carboidratos: 1000g.'),
  fat: z
    .number({ invalid_type_error: 'Gorduras deve ser um número.' })
    .min(0, 'Gorduras não pode ser negativo.')
    .max(500, 'Valor máximo de gorduras: 500g.'),
});

// ── EXERCÍCIO: Validação de Set ──────────────────────────────────────────────

import { SetSchema } from './schemas';

export const ExerciseSetSchema = SetSchema;

// ── PERFIL: Validação de campos numéricos do utilizador ──────────────────────

export const ProfileFieldsSchema = z.object({
  weight: z
    .number({ invalid_type_error: 'Peso deve ser um número.' })
    .min(30, 'Peso mínimo: 30 kg.')
    .max(300, 'Peso máximo: 300 kg.'),
  height: z
    .number({ invalid_type_error: 'Altura deve ser um número.' })
    .min(100, 'Altura mínima: 100 cm.')
    .max(250, 'Altura máxima: 250 cm.')
    .optional(),
  age: z
    .number({ invalid_type_error: 'Idade deve ser um número.' })
    .int('Idade deve ser um número inteiro.')
    .min(14, 'Idade mínima: 14 anos.')
    .max(100, 'Idade máxima: 100 anos.')
    .optional(),
});

// ── HIDRATAÇÃO: Validação de input de água ───────────────────────────────────

export const WaterInputSchema = z
  .number({ invalid_type_error: 'Volume deve ser um número.' })
  .int('Volume deve ser um número inteiro (ml).')
  .min(1, 'Volume mínimo: 1 ml.')
  .max(5000, 'Volume máximo por registo: 5000 ml.');

// ── HELPER: Validar e retornar erros legíveis ────────────────────────────────

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
}

/**
 * Valida um item de refeição e retorna erros mapeados por campo.
 */
export function validateMealItem(data: unknown): ValidationResult<z.infer<typeof MealItemSchema>> {
  const result = MealItemSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0]?.toString() || 'unknown';
    errors[field] = issue.message;
  }
  return { success: false, errors };
}

/**
 * Valida um set de exercício e retorna erros mapeados por campo.
 */
export function validateExerciseSet(data: unknown): ValidationResult<z.infer<typeof ExerciseSetSchema>> {
  const result = ExerciseSetSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0]?.toString() || 'unknown';
    errors[field] = issue.message;
  }
  return { success: false, errors };
}

/**
 * Valida campos numéricos do perfil e retorna erros mapeados por campo.
 */
export function validateProfileFields(data: unknown): ValidationResult<z.infer<typeof ProfileFieldsSchema>> {
  const result = ProfileFieldsSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0]?.toString() || 'unknown';
    errors[field] = issue.message;
  }
  return { success: false, errors };
}
