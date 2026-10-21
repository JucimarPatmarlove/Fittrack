export const C = {
  bg: '#080b0f',
  surface: '#0e1318',
  card: '#131920',
  border: '#1e2832',
  accent: '#e8c84a',
  accentLow: '#e8c84a22',
  red: '#e84a4a',
  green: '#3dd68c',
  blue: '#4a9ee8',
  orange: '#f48c06',
  danger: '#e84a4a',
  text: '#eceae4',
  muted: '#55626e',
  dim: '#1e2832',
};

export const GOALS = [
  { id: 'hipertrofia', label: 'Hipertrofia', icon: '💪', desc: 'Ganhar massa', color: '#e84a4a' },
  { id: 'forca', label: 'Força', icon: '🏋️', desc: 'Cargas máximas', color: '#e8a44a' },
  {
    id: 'perda_peso',
    label: 'Perda de Peso',
    icon: '🔥',
    desc: 'Queimar gordura',
    color: '#3dd68c',
  },
  {
    id: 'condicionamento',
    label: 'Condicionamento',
    icon: '⚡',
    desc: 'Resistência',
    color: '#4a9ee8',
  },
  {
    id: 'v_taper_aesthetics',
    label: 'V-Taper Aesthetics',
    icon: '📐',
    desc: 'Foco em ombros e dorsais',
    color: '#ccff00',
  },
];

export const WORKOUT_PLANS = [
  {
    id: 'p1',
    label: 'Peito & Tríceps',
    exercises: ['Barbell Bench Press', 'Cable Rope Tricep Pushdown', 'Plank'],
  },
  {
    id: 'p2',
    label: 'Costas & Bíceps',
    exercises: ['Cable Lat Pulldown Wide-Grip', 'Barbell Bent Over Row', 'Barbell Bicep Curl'],
  },
  {
    id: 'p3',
    label: 'Pernas & Ombros',
    exercises: ['Barbell Back Squat', 'Barbell Overhead Press'],
  },
  {
    id: 'calisthenics',
    type: 'circuit',
    rounds: 3,
    restBetweenRounds: 180,
    label: 'Calistenia Park',
    exercises: ['Pull-Up', 'Dips', 'Burpee', 'Plank'],
  },
];

export const ME: Record<string, string> = {
  Peito: '🫁',
  Costas: '🔙',
  Ombros: '🤷',
  Bíceps: '💪',
  Tríceps: '🦾',
  Pernas: '🦵',
  Core: '⭕',
};

// ── V2 MIGRATED CONSTANTS ────────────────────────────────────────────────────────
export const MUSCLE_GROUPS = [
  'Todos',
  'Abdutores',
  'ABS',
  'Adutores',
  'Antebraços',
  'Bíceps',
  'Dors',
  'Flexores do Quadril',
  'Gémeos',
  'Glúteos',
  'Isquiotibiais',
  'Oblíquos',
  'Ombros',
  'Parte inferior das costas',
  'Peito',
  'Quadríceps',
  'Tibial Anterior',
  'Trapézio',
  'Tríceps',
];

export const EQUIPMENT_TYPES = [
  'Todos os equipamentos',
  'Barra',
  'Barra Hexagonal',
  'Barra W',
  'Bola de estabilidade',
  'Bola medicinal',
  'Faixas de Resistência',
  'Halteres',
  'Kettlebell',
  'Máquina de Cabos',
  'Máquina Smith',
  'Máquinas',
  'Outros',
  'PesoCorporal',
];

export const ACTIVITY_TYPES = [
  'Todos os tipos',
  'Pilates',
  'Yoga',
  'CrossFit',
  'Calistenia',
  'Treino Intervalado de Alta Intensidade',
  'Levantamento de peso',
  'Cardio',
  'Aquecimento de Mobilidade',
  'Desempenho Esportivo',
  'Treinamento de Balanceamento',
  'Musculação',
  'Treinamento Funcional',
];

// Full EXERCISE_LIBRARY with all 1324 exercises imported from generated file
import { EXERCISE_LIBRARY as FULL_EXERCISE_LIBRARY } from './exercises-generated';
export const EXERCISE_LIBRARY = FULL_EXERCISE_LIBRARY;

export const V2_LOAD_PCT: Record<string, Record<string, [number, number, number]>> = {
  'Barbell Bench Press': {
    hipertrofia: [0.45, 0.65, 0.8],
    forca: [0.6, 0.9, 1.1],
    perda_peso: [0.3, 0.45, 0.6],
  },
  'Barbell Back Squat': {
    hipertrofia: [0.6, 0.9, 1.2],
    forca: [0.8, 1.2, 1.6],
    perda_peso: [0.4, 0.6, 0.85],
  },
  'Barbell Deadlift': {
    hipertrofia: [0.7, 1.0, 1.3],
    forca: [0.9, 1.3, 1.7],
    perda_peso: [0.5, 0.7, 0.95],
  },
};
