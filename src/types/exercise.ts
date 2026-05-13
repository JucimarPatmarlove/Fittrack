// src/types/exercise.ts
export type ExerciseCategory =
  | 'compound_multi'      // Supino, Agachamento, Peso Morto, Desenvolvimento, Remada Curvada
  | 'compound_uni'        // Leg Press, Cadeira Extensora, Pulley frontal, Crossover
  | 'isolation_multi'     // Rosca Direta, Tríceps Testa, Elevação Lateral, Panturrilha em pé
  | 'isolation_uni'       // Face Pull, Rosca Martelo, Tríceps Corda, Panturrilha sentado
  | 'bodyweight';         // Flexões, Barra Fixa, Mergulhos, Prancha, Abdominais

export type Goal = 'forca' | 'hipertrofia' | 'resistencia' | string;

export type UserLevel = 'iniciante' | 'intermedio' | 'avancado' | string;
