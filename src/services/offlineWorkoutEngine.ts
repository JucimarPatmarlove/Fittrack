import { UserProfile, WorkoutSession } from '../db/schema';

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

const getRandom = (arr: string[], n: number): string[] => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(n, arr.length));
};

export class OfflineWorkoutEngine {
  
  static generateSingleWorkout(profile: Partial<UserProfile>, history: WorkoutSession[] = []): any {
    const isHomeGym = profile.availableEquipment?.[0] === 'Apenas Halteres' || profile.availableEquipment?.[0] === 'Peso Corporal';
    const pool = isHomeGym ? HOME_GYM_POOL : EXERCISE_POOL;
    
    // Simplistic predictive logic based on goal
    let exercises: string[] = [];
    const goal = profile.goal || 'Hipertrofia';
    
    if (goal.toLowerCase().includes('força')) {
        exercises = [...getRandom(pool.peito, 1), ...getRandom(pool.pernas, 2), ...getRandom(pool.core, 1)];
    } else {
        exercises = [...getRandom(pool.peito, 1), ...getRandom(pool.costas, 1), ...getRandom(pool.ombros, 1), ...getRandom(pool.bracos, 1)];
    }

    return {
      id: `ai_gen_fallback_${Date.now()}`,
      label: "Motor Preditivo Local (Offline)",
      reasoning: "Sem ligação à API neural. A usar o motor de fallback local baseado nos teus objetivos principais.",
      exercises,
      exercisesDetails: []
    };
  }

  static generateWeeklyPlan(profile: Partial<UserProfile>, planType: string = 'hipertrofia') {
    const isHomeGym = profile.availableEquipment?.[0] === 'Apenas Halteres' || profile.availableEquipment?.[0] === 'Peso Corporal';
    const pool = isHomeGym ? HOME_GYM_POOL : EXERCISE_POOL;

    const goal = profile.goal || 'Hipertrofia';
    const activeDays = profile.trainingDays || ["Segunda", "Quarta", "Sexta"];

    let rawSplit: any[] = [];

    // Decide the split logic based on the requested planType or Goal
    if (planType === 'forca' || planType === 'powerbuilding' || goal.toLowerCase().includes('força')) {
        rawSplit = this.generateUpperLowerSplit(pool);
    } else if (planType === 'anatoly') {
        rawSplit = this.generateAnatolySplit(pool);
    } else if (planType === 'hiit') {
        rawSplit = this.generateHIITSplit(pool);
    } else if (planType === 'functional') {
        rawSplit = this.generateFunctionalSplit(pool);
    } else if (planType === 'hipertrofia' || planType === 'classic' || goal.toLowerCase().includes('hipertrofia')) {
        rawSplit = this.generatePushPullLegsSplit(pool);
    } else {
        rawSplit = this.generateFullBodySplit(pool);
    }

    // Assign the raw split days to the user's selected days, filling the rest with rest days
    const dayPreferences = profile.dayPreferences || {};
    const daysOfWeek = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
    let splitIndex = 0;

    const finalPlan = daysOfWeek.map(day => {
        if (activeDays.includes(day)) {
            const prefVal = dayPreferences[day];
            if (prefVal && prefVal !== 'Padrão') {
                const prefLower = prefVal.toLowerCase();
                let exercises: string[] = [];
                let focusTitle = prefVal;
                
                if (prefLower.includes('perna') || prefLower.includes('leg') || prefLower.includes('coxa') || prefLower.includes('glúteo')) {
                    exercises = [...getRandom(pool.pernas, 4), ...getRandom(pool.core, 1)];
                    focusTitle = prefVal.includes('(') ? prefVal : `Pernas (${prefVal})`;
                } else if (prefLower.includes('peito') || prefLower.includes('chest')) {
                    exercises = [...getRandom(pool.peito, 3), ...getRandom(pool.ombros, 1), ...getRandom(pool.bracos, 1)];
                    focusTitle = prefVal.includes('(') ? prefVal : `Peito (${prefVal})`;
                } else if (prefLower.includes('costa') || prefLower.includes('back') || prefLower.includes('lats')) {
                    exercises = [...getRandom(pool.costas, 3), ...getRandom(pool.bracos, 2)];
                    focusTitle = prefVal.includes('(') ? prefVal : `Costas (${prefVal})`;
                } else if (prefLower.includes('ombro') || prefLower.includes('shoulder')) {
                    exercises = [...getRandom(pool.ombros, 3), ...getRandom(pool.core, 2)];
                    focusTitle = prefVal.includes('(') ? prefVal : `Ombros (${prefVal})`;
                } else if (prefLower.includes('braço') || prefLower.includes('braco') || prefLower.includes('arm') || prefLower.includes('bícep') || prefLower.includes('trícep')) {
                    exercises = [...getRandom(pool.bracos, 4), ...getRandom(pool.core, 1)];
                    focusTitle = prefVal.includes('(') ? prefVal : `Braços (${prefVal})`;
                } else if (prefLower.includes('core') || prefLower.includes('abdo') || prefLower.includes('plank')) {
                    exercises = [...getRandom(pool.core, 4)];
                    focusTitle = prefVal.includes('(') ? prefVal : `Core (${prefVal})`;
                } else if (prefLower.includes('cardio') || prefLower.includes('hiit') || prefLower.includes('respir')) {
                    exercises = ['Burpees', 'Mountain Climbers', 'Jumping Jacks', 'Squat Jumps'];
                    focusTitle = prefVal.includes('(') ? prefVal : `Cardio / HIIT (${prefVal})`;
                } else {
                    exercises = [...getRandom(pool.peito, 1), ...getRandom(pool.costas, 1), ...getRandom(pool.pernas, 1), ...getRandom(pool.core, 1)];
                    focusTitle = prefVal;
                }
                
                return {
                    day: day,
                    focus: focusTitle,
                    exercises: exercises
                };
            }

            if (splitIndex < rawSplit.length) {
                const workoutDay = rawSplit[splitIndex];
                splitIndex++;
                return {
                    day: day,
                    focus: workoutDay.title,
                    exercises: workoutDay.exercises
                };
            } else {
                return {
                    day: day,
                    focus: 'Treino Geral',
                    exercises: [...getRandom(pool.peito, 1), ...getRandom(pool.costas, 1), ...getRandom(pool.pernas, 1), ...getRandom(pool.core, 1)]
                };
            }
        } else {
            return {
                day: day,
                focus: 'Descanso',
                exercises: ['Recuperação Ativa', 'Alongamentos']
            };
        }
    });

    return {
        id: `offline_${Date.now()}`,
        name: `Plano Offline: ${planType.toUpperCase()}`,
        description: `Motor Local V7 gerou um plano perfeitamente categorizado para ${planType}, porque estás sem ligação ao servidor.`,
        workouts: finalPlan,
        createdAt: Date.now(),
        type: planType
    };
  }

  private static generateUpperLowerSplit(pool: any) {
    return [
      {
        title: 'Força Superior (Upper A)',
        exercises: [...getRandom(pool.peito, 2), ...getRandom(pool.costas, 2), ...getRandom(pool.ombros, 1)]
      },
      {
        title: 'Força Inferior (Lower A)',
        exercises: [...getRandom(pool.pernas, 4), ...getRandom(pool.core, 1)]
      },
      {
        title: 'Hipertrofia Superior (Upper B)',
        exercises: [...getRandom(pool.costas, 2), ...getRandom(pool.peito, 2), ...getRandom(pool.bracos, 2)]
      },
      {
        title: 'Hipertrofia Inferior (Lower B)',
        exercises: [...getRandom(pool.pernas, 3), ...getRandom(pool.core, 2)]
      },
      {
        title: 'Força Full Body', // Caso o utilizador escolha 5 dias
        exercises: [...getRandom(pool.pernas, 1), ...getRandom(pool.peito, 1), ...getRandom(pool.costas, 1)]
      },
      {
        title: 'Core & Braços', // Caso escolha 6 dias
        exercises: [...getRandom(pool.bracos, 3), ...getRandom(pool.core, 3)]
      },
      {
        title: 'Cardio Pesar', // Caso escolha 7 dias
        exercises: ['HIIT', 'Mobilidade Total']
      }
    ];
  }

  private static generatePushPullLegsSplit(pool: any) {
    return [
      {
        title: 'Treino Push (Empurrar)',
        exercises: [...getRandom(pool.peito, 3), ...getRandom(pool.ombros, 2), ...getRandom(pool.bracos, 1)] 
      },
      {
        title: 'Treino Pull (Puxar)',
        exercises: [...getRandom(pool.costas, 3), ...getRandom(pool.bracos, 2)]
      },
      {
        title: 'Treino de Pernas (Legs)',
        exercises: [...getRandom(pool.pernas, 4), ...getRandom(pool.core, 2)]
      },
      {
        title: 'Treino Push Foco Ombros',
        exercises: [...getRandom(pool.ombros, 3), ...getRandom(pool.peito, 1), ...getRandom(pool.bracos, 2)]
      },
      {
        title: 'Treino Pull Foco Lats',
        exercises: [...getRandom(pool.costas, 3), ...getRandom(pool.core, 2)]
      },
      {
        title: 'Treino de Pernas (Posteriores)',
        exercises: [...getRandom(pool.pernas, 4), ...getRandom(pool.core, 1)]
      },
      {
        title: 'Treino de Braços',
        exercises: [...getRandom(pool.bracos, 4), ...getRandom(pool.core, 2)]
      }
    ];
  }

  private static generateFullBodySplit(pool: any) {
    return [
      {
        title: 'Full Body A (Foco Metabólico)',
        exercises: [...getRandom(pool.pernas, 1), ...getRandom(pool.peito, 1), ...getRandom(pool.costas, 1), ...getRandom(pool.core, 2)]
      },
      {
        title: 'HIIT & Core',
        exercises: ['Jumping Jacks', 'Burpees', 'Mountain Climbers', ...getRandom(pool.core, 2)]
      },
      {
        title: 'Full Body B (Força Resistência)',
        exercises: [...getRandom(pool.pernas, 2), ...getRandom(pool.ombros, 1), ...getRandom(pool.bracos, 2)]
      },
      {
        title: 'Cardio LISS',
        exercises: ['Corrida Leve 30min', 'Ciclismo', 'Alongamentos']
      },
      {
        title: 'Full Body C (Circuito Funcional)',
        exercises: [...getRandom(pool.costas, 1), ...getRandom(pool.peito, 1), ...getRandom(pool.pernas, 1), ...getRandom(pool.core, 2)]
      },
      {
        title: 'Core & Estabilidade',
        exercises: [...getRandom(pool.core, 4)]
      },
      {
        title: 'Mobilidade',
        exercises: ['Yoga', 'Alongamento Dinâmico']
      }
    ];
  }

  private static generateAnatolySplit(pool: any) {
    return [
      {
        title: 'Pressão Máxima (Força)',
        exercises: [...getRandom(pool.peito, 2), ...getRandom(pool.ombros, 1), ...getRandom(pool.bracos, 1)]
      },
      {
        title: 'Puxada Explosiva',
        exercises: [...getRandom(pool.costas, 3), ...getRandom(pool.bracos, 1)]
      },
      {
        title: 'Quadriceps Selvagem',
        exercises: [...getRandom(pool.pernas, 3), ...getRandom(pool.core, 1)]
      },
      {
        title: 'Full Body Acessórios',
        exercises: [...getRandom(pool.peito, 1), ...getRandom(pool.costas, 1), ...getRandom(pool.pernas, 1)]
      },
      {
        title: 'Pressão Isolada (Ondulação)',
        exercises: [...getRandom(pool.peito, 1), ...getRandom(pool.ombros, 2), ...getRandom(pool.bracos, 2)]
      },
      {
        title: 'Posteriores & Core',
        exercises: [...getRandom(pool.pernas, 2), ...getRandom(pool.core, 3)]
      },
      {
        title: 'Força de Pegada',
        exercises: [...getRandom(pool.costas, 2), ...getRandom(pool.bracos, 2)]
      }
    ];
  }

  private static generateHIITSplit(pool: any) {
    return [
      {
        title: 'HIIT Full Body (Tabata 20/10)',
        exercises: ['Burpees', 'Mountain Climbers', 'Jumping Jacks', 'High Knees']
      },
      {
        title: 'HIIT Core & Legs (30/15)',
        exercises: ['Agachamento Livre', 'Lunges Alternados', 'Plank', 'Crunch', 'Russian Twist']
      },
      {
        title: 'HIIT Upper & Cardio',
        exercises: ['Push-Up', 'Dips', 'Burpees', 'Shadow Boxing']
      },
      {
        title: 'HIIT Endurance Pura',
        exercises: ['High Knees', 'Mountain Climbers', 'Squat Jumps', 'Plank Jacks']
      },
      {
        title: 'HIIT Express 15min',
        exercises: ['Burpees', 'Push-Up', 'Agachamento Livre']
      },
      {
        title: 'Recuperação Ativa',
        exercises: ['Caminhada', 'Mobilidade Total']
      },
      {
        title: 'Desafio Tabata Final',
        exercises: ['Burpees', 'Lunges Alternados', 'Push-Up', 'Plank']
      }
    ];
  }

  private static generateFunctionalSplit(pool: any) {
    return [
      {
        title: 'Cross: Força Base + AMRAP 12',
        exercises: ['Agachamento Livre', 'Press Militar', 'Burpees', 'Pull-Up', 'Kettlebell Swings']
      },
      {
        title: 'Cross: Endurance (EMOM 15)',
        exercises: ['Levantamento Terra', 'Push-Up', 'Box Jumps', 'Russian Twist']
      },
      {
        title: 'Cross: Ginástica & Core',
        exercises: ['Pull-Up', 'Dips', 'Plank', 'Hanging Leg Raise']
      },
      {
        title: 'Cross: Condicionamento',
        exercises: ['Remada Curvada', 'Lunges Alternados', 'Mountain Climbers', 'Burpees']
      },
      {
        title: 'Cross: Oly Lifts (Adaptado)',
        exercises: ['Romanian Deadlift', 'Dumbbell Shoulder Press', 'Squat Jumps']
      },
      {
        title: 'Cross: Team WOD / Longo',
        exercises: ['Push-Up', 'Pull-Up', 'Agachamento Livre', 'Burpees']
      },
      {
        title: 'Recuperação',
        exercises: ['Yoga', 'Mobilidade Lombar']
      }
    ];
  }
}
