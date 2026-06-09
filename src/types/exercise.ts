// src/types/exercise.ts

/**
 * Categorias de exercício para o motor de fadiga neural e tracking de volume.
 * compound_multi / compound_uni: movimentos multi-articulares (maior custo SNC)
 * isolation_multi / isolation_uni: movimentos mono-articulares
 * bodyweight: peso corporal, sem carga externa
 * mobility: mobilidade/flexibilidade (sem fadiga significativa)
 * cardio_metabolic: HIIT, cardio aeróbico de alta intensidade
 * isometrics: prancha, parede, etc.
 */
export type ExerciseCategory =
  | 'compound_multi'    // Supino, Agachamento, Peso Morto, Desenvolvimento
  | 'compound_uni'      // Leg Press, Pulldown, Remada no cabo
  | 'isolation_multi'   // Rosca, Tríceps testa, Elevação lateral
  | 'isolation_uni'     // Face Pull, Concentração, Crossover
  | 'bodyweight'        // Flexões, Barra Fixa, Prancha, Burpee
  | 'mobility'          // Alongamentos, rotações articulares, yoga
  | 'cardio_metabolic'  // Battle Ropes, Sled, Medicine Ball
  | 'isometrics';       // Prancha cronometrada, Wall Sit

/**
 * Objectivos de treino — usado para filtrar exercícios e recomendar prescrições.
 */
export type Goal =
  | 'hipertrofia'
  | 'forca'
  | 'resistencia'
  | 'mobilidade'
  | 'saude_articular'   // Reabilitação, longevidade (seniors)
  | 'perda_de_peso'
  | 'v_taper_aesthetics'
  | string;             // Compatibilidade com valores legados

/**
 * Nível do utilizador.
 */
export type UserLevel = 'iniciante' | 'intermedio' | 'avancado' | string;

/**
 * Modalidade de treino — determina que modos e exercícios são elegíveis.
 * Usado pelo DemographicEngine e pelo WorkoutModeSelector.
 */
export type Modality =
  | 'musculacao'   // Treino clássico de força/hipertrofia
  | 'crossfit'     // AMRAP, EMOM, WODs
  | 'funcional'    // Kettlebell, TRX, circuitos
  | 'longevidade'  // Séniores: baixo impacto articular, mobilidade
  | 'powerlifting' // Foco em SQ/BP/DL com alta carga
  | 'mobilidade';  // Yoga, pilates, fluxos de mobilidade

/**
 * Nível de impacto articular.
 * Usado pelo DemographicEngine para substituir exercícios em seniors com dor ≥ 7.
 */
export type JointImpactLevel = 'low' | 'medium' | 'high';

/**
 * Definição completa de um exercício na base de dados.
 * Os campos legados (muscle, equipment, base) mantêm-se para compatibilidade.
 * Os novos campos (goals, modalities, jointImpact, ageMin) são opcionais
 * e podem ser preenchidos progressivamente via script de migração.
 */
export interface ExerciseDefinition {
  // ── Campos legados (já existentes no EXERCISE_DB) ──
  muscle: string;
  equipment: string;
  base?: Record<string, number[]>;

  // ── Novos campos demográficos e de modalidade ──
  /** Objectivos para os quais este exercício é recomendado */
  goals?: Goal[];
  /** Modalidades onde este exercício é adequado */
  modalities?: Modality[];
  /** Impacto nas articulações — filtra exercícios para seniors com dor alta */
  jointImpact?: JointImpactLevel;
  /** Idade mínima recomendada (protege youth_gamified < 14) */
  ageMin?: number;
  /** Músculos secundários trabalhados */
  secondaryMuscles?: string[];
}
