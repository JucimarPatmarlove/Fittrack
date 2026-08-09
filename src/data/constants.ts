// @ts-nocheck
import { GoalType, LevelType, SexType } from "../types";

export const C = {
    bg: "#080b0f", surface: "#0e1318", card: "#131920", border: "#1e2832",
    accent: "#e8c84a", accentLow: "#e8c84a22", red: "#e84a4a", green: "#3dd68c",
    blue: "#4a9ee8", text: "#eceae4", muted: "#55626e", dim: "#1e2832",
};

export const GOALS = [
    { id: "hipertrofia", label: "Hipertrofia", icon: "💪", desc: "Ganhar massa", color: "#e84a4a" },
    { id: "forca", label: "Força", icon: "🏋️", desc: "Cargas máximas", color: "#e8a44a" },
    { id: "perda_peso", label: "Perda de Peso", icon: "🔥", desc: "Queimar gordura", color: "#3dd68c" },
    { id: "condicionamento", label: "Condicionamento", icon: "⚡", desc: "Resistência", color: "#4a9ee8" },
    { id: "v_taper_aesthetics", label: "V-Taper Aesthetics", icon: "📐", desc: "Foco em ombros e dorsais", color: "#ccff00" },
];


export const WORKOUT_PLANS = [
    { id: "p1", label: "Peito & Tríceps", exercises: ["Barbell Bench Press", "Cable Rope Tricep Pushdown", "Plank"] },
    { id: "p2", label: "Costas & Bíceps", exercises: ["Cable Lat Pulldown Wide-Grip", "Barbell Bent Over Row", "Barbell Bicep Curl"] },
    { id: "p3", label: "Pernas & Ombros", exercises: ["Barbell Back Squat", "Barbell Overhead Press"] },
    { id: "calisthenics", type: "circuit", rounds: 3, restBetweenRounds: 180, label: "Calistenia Park", exercises: ["Pull-Up", "Dips", "Burpee", "Plank"] },
];

export const ME: Record<string, string> = { Peito: "🫁", Costas: "🔙", Ombros: "🤷", Bíceps: "💪", Tríceps: "🦾", Pernas: "🦵", Core: "⭕" };

// ── V2 MIGRATED CONSTANTS ────────────────────────────────────────────────────────
export const MUSCLE_GROUPS = [
  'Todos', 'Abdutores', 'ABS', 'Adutores', 'Antebraços', 'Bíceps',
  'Dors', 'Flexores do Quadril', 'Gémeos', 'Glúteos', 'Isquiotibiais',
  'Oblíquos', 'Ombros', 'Parte inferior das costas', 'Peito',
  'Quadríceps', 'Tibial Anterior', 'Trapézio', 'Tríceps',
];

export const EQUIPMENT_TYPES = [
  'Todos os equipamentos', 'Barra', 'Barra Hexagonal', 'Barra W',
  'Bola de estabilidade', 'Bola medicinal', 'Faixas de Resistência',
  'Halteres', 'Kettlebell', 'Máquina de Cabos', 'Máquina Smith',
  'Máquinas', 'Outros', 'PesoCorporal',
];

export const ACTIVITY_TYPES = [
  'Todos os tipos', 'Pilates', 'Yoga', 'CrossFit', 'Calistenia',
  'Treino Intervalado de Alta Intensidade', 'Levantamento de peso',
  'Cardio', 'Aquecimento de Mobilidade', 'Desempenho Esportivo',
  'Treinamento de Balanceamento', 'Musculação', 'Treinamento Funcional',
];

export const EXERCISE_LIBRARY = [
  { id: 'barbell_bench',      name: 'Barbell Bench Press',              muscles: ['Peito'],                              equipment: 'Barra',           type: 'Levantamento de peso', emoji: '🏋️' },
  { id: 'barbell_incline',    name: 'Barbell Incline Bench Press',      muscles: ['Peito'],                              equipment: 'Barra',           type: 'Levantamento de peso', emoji: '🏋️' },
  { id: 'dumbbell_bench',     name: 'Dumbbell Bench Press',             muscles: ['Peito'],                              equipment: 'Halteres',        type: 'Musculação',           emoji: '💪' },
  { id: 'dumbbell_incline',   name: 'Dumbbell Incline Bench Press',     muscles: ['Peito'],                              equipment: 'Halteres',        type: 'Musculação',           emoji: '💪' },
  { id: 'push_up',            name: 'Push-Up',                          muscles: ['Peito'],                              equipment: 'PesoCorporal',    type: 'Calistenia',           emoji: '🤸' },
  { id: 'dips',               name: 'Dips',                             muscles: ['Tríceps', 'Peito'],                   equipment: 'PesoCorporal',    type: 'Calistenia',           emoji: '⬇️' },
  { id: 'barbell_row',        name: 'Barbell Bent Over Row',            muscles: ['Dors', 'Trapézio'],                   equipment: 'Barra',           type: 'Levantamento de peso', emoji: '🏋️' },
  { id: 'barbell_deadlift',   name: 'Barbell Deadlift',                 muscles: ['Glúteos', 'Isquiotibiais', 'Parte inferior das costas'], equipment: 'Barra', type: 'Levantamento de peso', emoji: '⬆️' },
  { id: 'pull_up',            name: 'Pull-Up',                          muscles: ['Dors'],                               equipment: 'PesoCorporal',    type: 'Calistenia',           emoji: '⬆️' },
  { id: 'chin_up',            name: 'Chin-Up',                          muscles: ['Dors'],                               equipment: 'PesoCorporal',    type: 'Calistenia',           emoji: '🆙' },
  { id: 'cable_lat_wide',     name: 'Cable Lat Pull Down Wide-Grip',    muscles: ['Dors'],                               equipment: 'Máquina de Cabos',type: 'Musculação',           emoji: '〰️' },
  { id: 'barbell_ohp',        name: 'Barbell Overhead Press',           muscles: ['Ombros'],                             equipment: 'Barra',           type: 'Levantamento de peso', emoji: '🏋️' },
  { id: 'dumbbell_press',     name: 'Dumbbell Shoulder Press',          muscles: ['Ombros'],                             equipment: 'Halteres',        type: 'Musculação',           emoji: '💪' },
  { id: 'dumbbell_lateral',   name: 'Dumbbell Lateral Raise',           muscles: ['Ombros'],                             equipment: 'Halteres',        type: 'Musculação',           emoji: '🦅' },
  { id: 'barbell_curl',       name: 'Barbell Bicep Curl',               muscles: ['Bíceps'],                             equipment: 'Barra',           type: 'Musculação',           emoji: '💪' },
  { id: 'cable_tricep_rope',  name: 'Cable Rope Tricep Pushdown',       muscles: ['Tríceps'],                            equipment: 'Máquina de Cabos',type: 'Musculação',           emoji: '〰️' },
  { id: 'barbell_squat',      name: 'Barbell Back Squat',               muscles: ['Quadríceps', 'Glúteos'],              equipment: 'Barra',           type: 'Levantamento de peso', emoji: '🏋️' },
  { id: 'bodyweight_squat',   name: 'Bodyweight Squat',                 muscles: ['Quadríceps', 'Glúteos'],              equipment: 'PesoCorporal',    type: 'Calistenia',           emoji: '🤸' },
  { id: 'machine_legpress',   name: 'Machine Leg Press',                muscles: ['Quadríceps', 'Glúteos'],              equipment: 'Máquinas',        type: 'Musculação',           emoji: '🔧' },
  { id: 'barbell_hip_thrust', name: 'Barbell Hip Thrust',               muscles: ['Glúteos'],                            equipment: 'Barra',           type: 'Musculação',           emoji: '🍑' },
  { id: 'crunch',             name: 'Crunch',                           muscles: ['ABS'],                                equipment: 'PesoCorporal',    type: 'Calistenia',           emoji: '⭕' },
  { id: 'plank',              name: 'Plank',                            muscles: ['ABS'],                                equipment: 'PesoCorporal',    type: 'Calistenia',           emoji: '➖' },
  { id: 'burpee',             name: 'Burpee',                           muscles: ['Quadríceps', 'Glúteos', 'Peito'],     equipment: 'PesoCorporal',    type: 'Treino Intervalado de Alta Intensidade', emoji: '💥' }
];

export const V2_LOAD_PCT: Record<string, Record<string, [number, number, number]>> = {
  'Barbell Bench Press': { hipertrofia:[0.45,0.65,0.80], forca:[0.60,0.90,1.10], perda_peso:[0.30,0.45,0.60] },
  'Barbell Back Squat':  { hipertrofia:[0.60,0.90,1.20], forca:[0.80,1.20,1.60], perda_peso:[0.40,0.60,0.85] },
  'Barbell Deadlift':    { hipertrofia:[0.70,1.00,1.30], forca:[0.90,1.30,1.70], perda_peso:[0.50,0.70,0.95] },
};