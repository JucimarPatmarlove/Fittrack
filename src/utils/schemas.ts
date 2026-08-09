// @ts-nocheck
import { z } from 'zod';

export const ProfileSchema = z.object({
  name: z.string().min(1, "O nome não pode estar vazio").max(50),
  goal: z.enum(["hipertrofia", "forca", "condicionamento", "perda_peso", "saude"]),
  level: z.enum(["beginner", "intermediate", "advanced", "pro"]),
  weight: z.number().min(30).max(300),
  xp: z.number().min(0).default(0),
  proMode: z.boolean().optional(),
  philosophy: z.string().optional(),
  classicStyle: z.string().optional(),
  age: z.number().min(14).max(100).optional(),
  injuries: z.array(z.string()).optional(),
  gender: z.string().optional(),
  height: z.number().optional(),
  availableEquipment: z.array(z.string()).optional(),
  trainingDays: z.array(z.string()).optional(),
  preferredWorkoutDuration: z.number().optional(),
  dayPreferences: z.record(z.string()).optional(),
}).passthrough();


// ── BASE SET SCHEMA (Campos comuns a todos) ──
const BaseSetSchema = z.object({
  rpe: z.number().min(1).max(10).optional(),
  done: z.boolean().optional(),
  isWarmup: z.boolean().optional(),
});

// ── SCHEMAS ESPECÍFICOS POR TIPO ──
const WeightedSetSchema = BaseSetSchema.extend({
  type: z.literal("weighted"),
  reps: z.number().min(0).max(100),
  weight: z.number().min(0).max(1000),
});

const BodyweightSetSchema = BaseSetSchema.extend({
  type: z.literal("bodyweight"),
  reps: z.number().min(0).max(100),
  addedWeight: z.number().min(0).max(200).optional(),
});

const CardioSetSchema = BaseSetSchema.extend({
  type: z.union([z.literal("cardio"), z.literal("distance")]),
  duration: z.number().min(0), // seconds
  distance: z.number().min(0).optional(), // km
});

const TimedSetSchema = BaseSetSchema.extend({
  type: z.union([z.literal("timed"), z.literal("mobility")]),
  duration: z.number().min(0), // seconds
});

// ── DISCRIMINATED UNION COM FALLBACK ──
// O z.preprocess garante que dados antigos (sem 'type') recebem 'weighted'
// e remove os `undefined` que o Zod strict reprovaria, protegendo a Base de Dados.
export const SetSchema = z.preprocess((val: any) => {
  if (typeof val === 'object' && val !== null) {
    if (!val.type) return { ...val, type: 'weighted' };
  }
  return val;
}, z.discriminatedUnion("type", [
  WeightedSetSchema,
  BodyweightSetSchema,
  CardioSetSchema,
  TimedSetSchema,
]));

export const ExerciseSchema = z.object({
  name: z.string(),
  muscle: z.string(),
  type: z.enum(["weighted", "bodyweight", "cardio", "timed", "mobility", "distance"]), // Sem default, obriga a declaração
  sets: z.array(SetSchema)
});

export const WorkoutSchema = z.object({
  date: z.string(),
  dayLabel: z.string().optional(),
  duration: z.number().min(0),
  totalVolume: z.number().min(0).optional(),
  exercises: z.array(ExerciseSchema),
  feedback: z.object({
    difficulty: z.enum(["easy", "medium", "hard"]).optional(),
    notes: z.string().optional()
  }).optional()
});

export const HistorySchema = z.array(WorkoutSchema);
