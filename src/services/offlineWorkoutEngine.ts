import { WorkoutSession } from '../db/schema';
import { UserProfile } from '../types';

// 1. Base de Dados Categorizada Interna
const EXERCISE_POOL = {
  peito: ['Supino Plano', 'Supino Inclinado', 'Crossover', 'Dumbbell Bench Press', 'Push-Up', 'Peck Deck', 'Spoto Press'],
  costas: ['Puxada Frontal', 'Remada Curvada', 'Pull-Up', 'Cable Row', 'Levantamento Terra', 'Face Pull', 'Remada Unilateral'],
  pernas: ['Agachamento Livre', 'Leg Press', 'Agachamento Búlgaro', 'Romanian Deadlift', 'Cadeira Extensora', 'Mesa Flexora', 'Calf Raise', 'Hip Thrust'],
  ombros: ['Press Militar', 'Elevação Lateral', 'Elevação Frontal', 'Dumbbell Shoulder Press', 'Arnold Press', 'Reverse Pec Deck'],
  bracos: ['Rosca Direta', 'Tríceps Corda', 'Tríceps Testa', 'Dumbbell Bicep Curl', 'Hammer Curl', 'Dips', 'Preacher Curl'],
  core: ['Plank', 'Crunch', 'Leg Raises', 'Russian Twist', 'Ab Wheel', 'Hanging Leg Raise']
};

// 2. Fallbacks de Equipamento (redução para quem não tem gym completo)
const HOME_GYM_POOL = {
  peito: ['Push-Up', 'Dumbbell Bench Press', 'Dumbbell Flyes', 'Floor Press'],
  costas: ['Remada Unilateral', 'Pull-Up', 'Dumbbell Pullover', 'Superman'],
  pernas: ['Agachamento Búlgaro', 'Goblet Squat', 'Romanian Deadlift c/ Halteres', 'Lunges', 'Calf Raise'],
  ombros: ['Dumbbell Shoulder Press', 'Elevação Lateral', 'Elevação Frontal'],
  bracos: ['Dumbbell Bicep Curl', 'Hammer Curl', 'Tríceps Testa (Halter)', 'Dips (Cadeira)'],
  core: EXERCISE_POOL.core
};

const CARDIO_EXERCISES = ['Burpees', 'Mountain Climbers', 'Jumping Jacks', 'Squat Jumps'];

// Preference -> exercise selector config
interface PreferenceConfig {
  keywords: string[];
  getExercises: (pool: any) => string[];
  titleSuffix?: string;
}

const PREFERENCE_CONFIGS: Record<string, PreferenceConfig> = {
  pernas: {
    keywords: ['perna', 'leg', 'coxa', 'glúteo'],
    getExercises: (pool) => [...getRandom(pool.pernas, 4), ...getRandom(pool.core, 1)],
    titleSuffix: 'Pernas',
  },
  peito: {
    keywords: ['peito', 'chest'],
    getExercises: (pool) => [...getRandom(pool.peito, 3), ...getRandom(pool.ombros, 1), ...getRandom(pool.bracos, 1)],
    titleSuffix: 'Peito',
  },
  costas: {
    keywords: ['costa', 'back', 'lats'],
    getExercises: (pool) => [...getRandom(pool.costas, 3), ...getRandom(pool.bracos, 2)],
    titleSuffix: 'Costas',
  },
  ombros: {
    keywords: ['ombro', 'shoulder'],
    getExercises: (pool) => [...getRandom(pool.ombros, 3), ...getRandom(pool.core, 2)],
    titleSuffix: 'Ombros',
  },
  bracos: {
    keywords: ['braço', 'braco', 'arm', 'bícep', 'trícep'],
    getExercises: (pool) => [...getRandom(pool.bracos, 4), ...getRandom(pool.core, 1)],
    titleSuffix: 'Braços',
  },
  core: {
    keywords: ['core', 'abdo', 'plank'],
    getExercises: (pool) => [...getRandom(pool.core, 4)],
    titleSuffix: 'Core',
  },
  cardio: {
    keywords: ['cardio', 'hiit', 'respir'],
    getExercises: () => CARDIO_EXERCISES,
    titleSuffix: 'Cardio / HIIT',
  },
};

const FALLBACK_EXERCISES = (pool: any) => [
  ...getRandom(pool.peito, 1),
  ...getRandom(pool.costas, 1),
  ...getRandom(pool.pernas, 1),
  ...getRandom(pool.core, 1),
];

const DAYS_OF_WEEK = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

const getRandom = (arr: string[], n: number): string[] => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(n, arr.length));
};

/** Extracts preference type from a day preference string */
const classifyPreference = (prefLower: string): string | null => {
  for (const [key, config] of Object.entries(PREFERENCE_CONFIGS)) {
    if (config.keywords.some(kw => prefLower.includes(kw))) return key;
  }
  return null;
};

/** Builds a workout for a given day preference */
const buildPreferenceDay = (pool: any, prefVal: string) => {
  const prefLower = prefVal.toLowerCase();
  const prefType = classifyPreference(prefLower);

  if (prefType) {
    const config = PREFERENCE_CONFIGS[prefType];
    return {
      exercises: config.getExercises(pool),
      focusTitle: prefVal.includes('(') ? prefVal : `${config.titleSuffix} (${prefVal})`,
    };
  }

  return {
    exercises: FALLBACK_EXERCISES(pool),
    focusTitle: prefVal,
  };
};

/** Build a rest day entry */
function buildRestDay(day: string) {
  return { day, focus: 'Descanso', exercises: ['Recuperação Ativa', 'Alongamentos'] };
}

/** Build a day based on user preference */
function buildPreferredDay(day: string, pool: any, prefVal: string) {
  const { exercises, focusTitle } = buildPreferenceDay(pool, prefVal);
  return { day, focus: focusTitle, exercises };
}

/** Build a day from the split plan */
function buildSplitDay(day: string, rawSplit: any[], splitIndex: number) {
  const workoutDay = rawSplit[splitIndex];
  return { day, focus: workoutDay.title, exercises: workoutDay.exercises };
}

/** Build a fallback general training day */
function buildFallbackDay(day: string, pool: any) {
  return { day, focus: 'Treino Geral', exercises: FALLBACK_EXERCISES(pool) };
}

/** Determine which exercise pool to use based on equipment */
function selectExercisePool(profile: Partial<UserProfile>) {
  const isHomeGym = profile.availableEquipment?.[0] === 'Apenas Halteres' || profile.availableEquipment?.[0] === 'Peso Corporal';
  return isHomeGym ? HOME_GYM_POOL : EXERCISE_POOL;
}

/** Build a single day workout entry based on all conditions */
function buildWorkoutDay(
  day: string,
  activeDays: string[],
  dayPreferences: Record<string, string>,
  pool: any,
  rawSplit: any[],
  splitIndexRef: { current: number }
) {
  if (!activeDays.includes(day)) {
    return buildRestDay(day);
  }

  const prefVal = dayPreferences[day];
  if (prefVal && prefVal !== 'Padrão') {
    return buildPreferredDay(day, pool, prefVal);
  }

  if (splitIndexRef.current < rawSplit.length) {
    const result = buildSplitDay(day, rawSplit, splitIndexRef.current);
    splitIndexRef.current++;
    return result;
  }

  return buildFallbackDay(day, pool);
}

export class OfflineWorkoutEngine {
  
  static generateSingleWorkout(profile: Partial<UserProfile>, history: WorkoutSession[] = []): any {
    const pool = selectExercisePool(profile);
    const goal = profile.goal || 'Hipertrofia';
    
    const exercises = goal.toLowerCase().includes('força')
      ? [...getRandom(pool.peito, 1), ...getRandom(pool.pernas, 2), ...getRandom(pool.core, 1)]
      : [...getRandom(pool.peito, 1), ...getRandom(pool.costas, 1), ...getRandom(pool.ombros, 1), ...getRandom(pool.bracos, 1)];

    return {
      id: `ai_gen_fallback_${Date.now()}`,
      label: "Motor Preditivo Local (Offline)",
      reasoning: "Sem ligação à API neural. A usar o motor de fallback local baseado nos teus objetivos principais.",
      exercises,
      exercisesDetails: []
    };
  }

  static generateWeeklyPlan(profile: Partial<UserProfile>, planType: string = 'hipertrofia') {
    const pool = selectExercisePool(profile);
    const goal = profile.goal || 'Hipertrofia';
    const activeDays = profile.trainingDays || ["Segunda", "Quarta", "Sexta"];
    const rawSplit = this.getSplitForPlanType(planType, goal, pool);
    const dayPreferences = profile.dayPreferences || {};
    const splitIndexRef = { current: 0 };

    const finalPlan = DAYS_OF_WEEK.map(day => 
      buildWorkoutDay(day, activeDays, dayPreferences, pool, rawSplit, splitIndexRef)
    );

    return {
      id: `offline_${Date.now()}`,
      name: `Plano Offline: ${planType.toUpperCase()}`,
      description: `Motor Local V7 gerou um plano perfeitamente categorizado para ${planType}, porque estás sem ligação ao servidor.`,
      workouts: finalPlan,
      createdAt: Date.now(),
      type: planType,
    };
  }

  private static getSplitForPlanType(planType: string, goal: string, pool: any): any[] {
    const normalizedType = planType.toLowerCase();
    const planTypeMap = this.getPlanTypeMap();
    
    if (planTypeMap[normalizedType]) {
      return planTypeMap[normalizedType](pool);
    }

    if (goal.toLowerCase().includes('força')) {
      return this.generateUpperLowerSplit(pool);
    }
    if (goal.toLowerCase().includes('hipertrofia')) {
      return this.generatePushPullLegsSplit(pool);
    }

    return this.generateFullBodySplit(pool);
  }

  // Plan type lookup table (inside class to access private methods)
  private static getPlanTypeMap(): Record<string, (pool: any) => any[]> {
    return {
      'forca': (pool) => this.generateUpperLowerSplit(pool),
      'powerbuilding': (pool) => this.generateUpperLowerSplit(pool),
      'anatoly': (pool) => this.generateAnatolySplit(pool),
      'hiit': (pool) => this.generateHIITSplit(pool),
      'functional': (pool) => this.generateFunctionalSplit(pool),
      'hipertrofia': (pool) => this.generatePushPullLegsSplit(pool),
      'classic': (pool) => this.generatePushPullLegsSplit(pool),
    };
  }

  static generateUpperLowerSplit(pool: any) {
    return [
      { title: 'Força Superior (Upper A)', exercises: [...getRandom(pool.peito, 2), ...getRandom(pool.costas, 2), ...getRandom(pool.ombros, 1)] },
      { title: 'Força Inferior (Lower A)', exercises: [...getRandom(pool.pernas, 4), ...getRandom(pool.core, 1)] },
      { title: 'Hipertrofia Superior (Upper B)', exercises: [...getRandom(pool.costas, 2), ...getRandom(pool.peito, 2), ...getRandom(pool.bracos, 2)] },
      { title: 'Hipertrofia Inferior (Lower B)', exercises: [...getRandom(pool.pernas, 3), ...getRandom(pool.core, 2)] },
      { title: 'Força Full Body', exercises: [...getRandom(pool.pernas, 1), ...getRandom(pool.peito, 1), ...getRandom(pool.costas, 1)] },
      { title: 'Core & Braços', exercises: [...getRandom(pool.bracos, 3), ...getRandom(pool.core, 3)] },
      { title: 'Cardio Pesar', exercises: ['HIIT', 'Mobilidade Total'] },
    ];
  }

  static generatePushPullLegsSplit(pool: any) {
    return [
      { title: 'Treino Push (Empurrar)', exercises: [...getRandom(pool.peito, 3), ...getRandom(pool.ombros, 2), ...getRandom(pool.bracos, 1)] },
      { title: 'Treino Pull (Puxar)', exercises: [...getRandom(pool.costas, 3), ...getRandom(pool.bracos, 2)] },
      { title: 'Treino de Pernas (Legs)', exercises: [...getRandom(pool.pernas, 4), ...getRandom(pool.core, 2)] },
      { title: 'Treino Push Foco Ombros', exercises: [...getRandom(pool.ombros, 3), ...getRandom(pool.peito, 1), ...getRandom(pool.bracos, 2)] },
      { title: 'Treino Pull Foco Lats', exercises: [...getRandom(pool.costas, 3), ...getRandom(pool.core, 2)] },
      { title: 'Treino de Pernas (Posteriores)', exercises: [...getRandom(pool.pernas, 4), ...getRandom(pool.core, 1)] },
      { title: 'Treino de Braços', exercises: [...getRandom(pool.bracos, 4), ...getRandom(pool.core, 2)] },
    ];
  }

  static generateFullBodySplit(pool: any) {
    return [
      { title: 'Full Body A (Foco Metabólico)', exercises: [...getRandom(pool.pernas, 1), ...getRandom(pool.peito, 1), ...getRandom(pool.costas, 1), ...getRandom(pool.core, 2)] },
      { title: 'HIIT & Core', exercises: ['Jumping Jacks', 'Burpees', 'Mountain Climbers', ...getRandom(pool.core, 2)] },
      { title: 'Full Body B (Força Resistência)', exercises: [...getRandom(pool.pernas, 2), ...getRandom(pool.ombros, 1), ...getRandom(pool.bracos, 2)] },
      { title: 'Cardio LISS', exercises: ['Corrida Leve 30min', 'Ciclismo', 'Alongamentos'] },
      { title: 'Full Body C (Circuito Funcional)', exercises: [...getRandom(pool.costas, 1), ...getRandom(pool.peito, 1), ...getRandom(pool.pernas, 1), ...getRandom(pool.core, 2)] },
      { title: 'Core & Estabilidade', exercises: [...getRandom(pool.core, 4)] },
      { title: 'Mobilidade', exercises: ['Yoga', 'Alongamento Dinâmico'] },
    ];
  }

  static generateAnatolySplit(pool: any) {
    return [
      { title: 'Pressão Máxima (Força)', exercises: [...getRandom(pool.peito, 2), ...getRandom(pool.ombros, 1), ...getRandom(pool.bracos, 1)] },
      { title: 'Puxada Explosiva', exercises: [...getRandom(pool.costas, 3), ...getRandom(pool.bracos, 1)] },
      { title: 'Quadriceps Selvagem', exercises: [...getRandom(pool.pernas, 3), ...getRandom(pool.core, 1)] },
      { title: 'Full Body Acessórios', exercises: [...getRandom(pool.peito, 1), ...getRandom(pool.costas, 1), ...getRandom(pool.pernas, 1)] },
      { title: 'Pressão Isolada (Ondulação)', exercises: [...getRandom(pool.peito, 1), ...getRandom(pool.ombros, 2), ...getRandom(pool.bracos, 2)] },
      { title: 'Posteriores & Core', exercises: [...getRandom(pool.pernas, 2), ...getRandom(pool.core, 3)] },
      { title: 'Força de Pegada', exercises: [...getRandom(pool.costas, 2), ...getRandom(pool.bracos, 2)] },
    ];
  }

  static generateHIITSplit(pool: any) {
    return [
      { title: 'HIIT Full Body (Tabata 20/10)', exercises: ['Burpees', 'Mountain Climbers', 'Jumping Jacks', 'High Knees'] },
      { title: 'HIIT Core & Legs (30/15)', exercises: ['Agachamento Livre', 'Lunges Alternados', 'Plank', 'Crunch', 'Russian Twist'] },
      { title: 'HIIT Upper & Cardio', exercises: ['Push-Up', 'Dips', 'Burpees', 'Shadow Boxing'] },
      { title: 'HIIT Endurance Pura', exercises: ['High Knees', 'Mountain Climbers', 'Squat Jumps', 'Plank Jacks'] },
      { title: 'HIIT Express 15min', exercises: ['Burpees', 'Push-Up', 'Agachamento Livre'] },
      { title: 'Recuperação Ativa', exercises: ['Caminhada', 'Mobilidade Total'] },
      { title: 'Desafio Tabata Final', exercises: ['Burpees', 'Lunges Alternados', 'Push-Up', 'Plank'] },
    ];
  }

  static generateFunctionalSplit(pool: any) {
    return [
      { title: 'Cross: Força Base + AMRAP 12', exercises: ['Agachamento Livre', 'Press Militar', 'Burpees', 'Pull-Up', 'Kettlebell Swings'] },
      { title: 'Cross: Endurance (EMOM 15)', exercises: ['Levantamento Terra', 'Push-Up', 'Box Jumps', 'Russian Twist'] },
      { title: 'Cross: Ginástica & Core', exercises: ['Pull-Up', 'Dips', 'Plank', 'Hanging Leg Raise'] },
      { title: 'Cross: Condicionamento', exercises: ['Remada Curvada', 'Lunges Alternados', 'Mountain Climbers', 'Burpees'] },
      { title: 'Cross: Oly Lifts (Adaptado)', exercises: ['Romanian Deadlift', 'Dumbbell Shoulder Press', 'Squat Jumps'] },
      { title: 'Cross: Team WOD / Longo', exercises: ['Push-Up', 'Pull-Up', 'Agachamento Livre', 'Burpees'] },
      { title: 'Recuperação', exercises: ['Yoga', 'Mobilidade Lombar'] },
    ];
  }
}