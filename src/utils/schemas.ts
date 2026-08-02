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


export const SetSchema = z.object({
  reps: z.number().min(0).max(100).optional(),
  weight: z.number().min(0).max(1000).optional(),
  rpe: z.number().min(1).max(10).optional(),
  duration: z.number().min(0).optional(), // seconds
  distance: z.number().min(0).optional(), // km
  addedWeight: z.number().min(0).optional(), // kg for calisthenics
  type: z.enum(["weighted", "bodyweight", "cardio", "timed", "mobility", "distance"]).default("weighted"),
}).passthrough();

export const ExerciseSchema = z.object({
  name: z.string(),
  muscle: z.string(),
  type: z.enum(["weighted", "bodyweight", "cardio", "timed", "mobility", "distance"]).default("weighted"),
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
