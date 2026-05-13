// ── COLORS ────────────────────────────────────────────────────────────────────
export const C = {
  bg: '#080b0f', surface: '#0e1318', card: '#131920', border: '#1e2832',
  accent: '#e8c84a', accentLow: '#e8c84a22',
  red: '#e84a4a', green: '#3dd68c', orange: '#e8a44a', blue: '#4a9ee8',
  text: '#eceae4', muted: '#55626e', dim: '#1e2832',
}

// ── GOALS / LEVELS ────────────────────────────────────────────────────────────
export const GOALS = [
  { id: 'hipertrofia',     label: 'Hipertrofia',    icon: '💪', desc: 'Ganhar massa muscular',    color: '#e84a4a' },
  { id: 'forca',           label: 'Força',           icon: '🏋️', desc: 'Aumentar cargas máximas', color: '#e8a44a' },
  { id: 'perda_peso',      label: 'Perda de Peso',   icon: '🔥', desc: 'Queimar gordura',          color: '#3dd68c' },
  { id: 'condicionamento', label: 'Condicionamento', icon: '⚡', desc: 'Resistência geral',        color: '#4a9ee8' },
]

export const LEVELS = [
  { id: 'iniciante',  label: 'Iniciante',  desc: 'Primeira vez no ginásio' },
  { id: 'intermedio', label: 'Intermédio', desc: 'Treino há 6–12 meses' },
  { id: 'avancado',   label: 'Avançado',   desc: 'Treino há 1+ anos' },
]

export const SEX_OPTS = [
  { id: 'm', label: '♂ Masculino' },
  { id: 'f', label: '♀ Feminino' },
  { id: 'nb', label: '⚧ Outro' },
]

// ── MUSCLE GROUPS (from Motra screenshots) ────────────────────────────────────
export const MUSCLE_GROUPS = [
  'Todos', 'Abdutores', 'ABS', 'Adutores', 'Antebraços', 'Bíceps',
  'Dors', 'Flexores do Quadril', 'Gémeos', 'Glúteos', 'Isquiotibiais',
  'Oblíquos', 'Ombros', 'Parte inferior das costas', 'Peito',
  'Quadríceps', 'Tibial Anterior', 'Trapézio', 'Tríceps',
]

export const EQUIPMENT_TYPES = [
  'Todos os equipamentos', 'Barra', 'Barra Hexagonal', 'Barra W',
  'Bola de estabilidade', 'Bola medicinal', 'Faixas de Resistência',
  'Halteres', 'Kettlebell', 'Máquina de Cabos', 'Máquina Smith',
  'Máquinas', 'Outros', 'PesoCorporal',
]

export const ACTIVITY_TYPES = [
  'Todos os tipos', 'Pilates', 'Yoga', 'CrossFit', 'Calistenia',
  'Treino Intervalado de Alta Intensidade', 'Levantamento de peso',
  'Cardio', 'Aquecimento de Mobilidade', 'Desempenho Esportivo',
  'Treinamento de Balanceamento', 'Musculação', 'Treinamento Funcional',
]

// ── EXERCISE LIBRARY (from Motra screenshots + extended) ─────────────────────
// emoji as placeholder icon (in real app would be image)
export const EXERCISE_LIBRARY = [
  // PEITO
  { id: 'barbell_bench',      name: 'Barbell Bench Press',              muscles: ['Peito'],                              equipment: 'Barra',           type: 'Levantamento de peso', emoji: '🏋️' },
  { id: 'barbell_incline',    name: 'Barbell Incline Bench Press',      muscles: ['Peito'],                              equipment: 'Barra',           type: 'Levantamento de peso', emoji: '🏋️' },
  { id: 'dumbbell_bench',     name: 'Dumbbell Bench Press',             muscles: ['Peito'],                              equipment: 'Halteres',        type: 'Musculação',           emoji: '💪' },
  { id: 'dumbbell_incline',   name: 'Dumbbell Incline Bench Press',     muscles: ['Peito'],                              equipment: 'Halteres',        type: 'Musculação',           emoji: '💪' },
  { id: 'dumbbell_fly',       name: 'Dumbbell Fly',                     muscles: ['Peito'],                              equipment: 'Halteres',        type: 'Musculação',           emoji: '🦅' },
  { id: 'cable_fly',          name: 'Cable Fly',                        muscles: ['Peito'],                              equipment: 'Máquina de Cabos',type: 'Musculação',           emoji: '〰️' },
  { id: 'push_up',            name: 'Push-Up',                          muscles: ['Peito'],                              equipment: 'PesoCorporal',    type: 'Calistenia',           emoji: '🤸' },
  { id: 'machine_chest',      name: 'Machine Seated Chest Press',       muscles: ['Peito'],                              equipment: 'Máquinas',        type: 'Musculação',           emoji: '🔧' },
  { id: 'dips',               name: 'Dips',                             muscles: ['Tríceps', 'Peito'],                   equipment: 'PesoCorporal',    type: 'Calistenia',           emoji: '⬇️' },

  // COSTAS / DORS
  { id: 'barbell_row',        name: 'Barbell Bent Over Row',            muscles: ['Dors', 'Trapézio'],                   equipment: 'Barra',           type: 'Levantamento de peso', emoji: '🏋️' },
  { id: 'barbell_deadlift',   name: 'Barbell Deadlift',                 muscles: ['Glúteos', 'Isquiotibiais', 'Parte inferior das costas'], equipment: 'Barra', type: 'Levantamento de peso', emoji: '⬆️' },
  { id: 'barbell_rdl',        name: 'Barbell Romanian Deadlift',        muscles: ['Isquiotibiais', 'Glúteos', 'Parte inferior das costas'], equipment: 'Barra', type: 'Levantamento de peso', emoji: '🔽' },
  { id: 'pull_up',            name: 'Pull-Up',                          muscles: ['Dors'],                               equipment: 'PesoCorporal',    type: 'Calistenia',           emoji: '⬆️' },
  { id: 'chin_up',            name: 'Chin-Up',                          muscles: ['Dors'],                               equipment: 'PesoCorporal',    type: 'Calistenia',           emoji: '🆙' },
  { id: 'cable_lat_wide',     name: 'Cable Lat Pull Down Wide-Grip',    muscles: ['Dors'],                               equipment: 'Máquina de Cabos',type: 'Musculação',           emoji: '〰️' },
  { id: 'machine_lat_wide',   name: 'Machine Lat Pull Down Wide-Grip',  muscles: ['Dors'],                               equipment: 'Máquinas',        type: 'Musculação',           emoji: '🔧' },
  { id: 'cable_seated_row',   name: 'Cable Bar Seated Row',             muscles: ['Dors', 'Trapézio'],                   equipment: 'Máquina de Cabos',type: 'Musculação',           emoji: '〰️' },
  { id: 'cable_v_row',        name: 'Cable V-Handle Seated Row',        muscles: ['Dors', 'Trapézio'],                   equipment: 'Máquina de Cabos',type: 'Musculação',           emoji: '〰️' },
  { id: 'machine_row',        name: 'Machine Row',                      muscles: ['Dors', 'Trapézio'],                   equipment: 'Máquinas',        type: 'Musculação',           emoji: '🔧' },
  { id: 'dumbbell_row',       name: 'Dumbbell Row',                     muscles: ['Dors'],                               equipment: 'Halteres',        type: 'Musculação',           emoji: '💪' },

  // OMBROS
  { id: 'barbell_ohp',        name: 'Barbell Overhead Press / Military Press', muscles: ['Ombros'],                    equipment: 'Barra',           type: 'Levantamento de peso', emoji: '🏋️' },
  { id: 'dumbbell_press',     name: 'Dumbbell Shoulder Press',          muscles: ['Ombros'],                             equipment: 'Halteres',        type: 'Musculação',           emoji: '💪' },
  { id: 'dumbbell_lateral',   name: 'Dumbbell Lateral Raise',           muscles: ['Ombros'],                             equipment: 'Halteres',        type: 'Musculação',           emoji: '🦅' },

  // BÍCEPS
  { id: 'barbell_curl',       name: 'Barbell Bicep Curl',               muscles: ['Bíceps'],                             equipment: 'Barra',           type: 'Musculação',           emoji: '💪' },
  { id: 'dumbbell_curl',      name: 'Dumbbell Bicep Curl',              muscles: ['Bíceps'],                             equipment: 'Halteres',        type: 'Musculação',           emoji: '💪' },
  { id: 'dumbbell_hammer',    name: 'Dumbbell Hammer Curl',             muscles: ['Bíceps'],                             equipment: 'Halteres',        type: 'Musculação',           emoji: '🔨' },

  // TRÍCEPS
  { id: 'cable_tricep_rope',  name: 'Cable Rope Tricep Pushdown / Extension', muscles: ['Tríceps'],                    equipment: 'Máquina de Cabos',type: 'Musculação',           emoji: '〰️' },
  { id: 'cable_tricep_bar',   name: 'Cable Bar Tricep Pushdown / Extension',  muscles: ['Tríceps'],                    equipment: 'Máquina de Cabos',type: 'Musculação',           emoji: '〰️' },

  // PERNAS / QUADRÍCEPS
  { id: 'barbell_squat',      name: 'Barbell Back Squat',               muscles: ['Quadríceps', 'Glúteos'],              equipment: 'Barra',           type: 'Levantamento de peso', emoji: '🏋️' },
  { id: 'bodyweight_squat',   name: 'Bodyweight Squat',                 muscles: ['Quadríceps', 'Glúteos'],              equipment: 'PesoCorporal',    type: 'Calistenia',           emoji: '🤸' },
  { id: 'machine_legpress',   name: 'Machine Leg Press (Moving Chair)', muscles: ['Quadríceps', 'Glúteos'],              equipment: 'Máquinas',        type: 'Musculação',           emoji: '🔧' },
  { id: 'dumbbell_lunge',     name: 'Dumbbell Lunge',                   muscles: ['Quadríceps', 'Glúteos'],              equipment: 'Halteres',        type: 'Musculação',           emoji: '🚶' },
  { id: 'bodyweight_lunge',   name: 'Bodyweight Lunge',                 muscles: ['Quadríceps', 'Glúteos'],              equipment: 'PesoCorporal',    type: 'Calistenia',           emoji: '🤸' },
  { id: 'dumbbell_goblet',    name: 'Dumbbell Goblet Squat',            muscles: ['Quadríceps', 'Glúteos'],              equipment: 'Halteres',        type: 'Musculação',           emoji: '🏆' },
  { id: 'high_knees',         name: 'High Knees',                       muscles: ['Quadríceps', 'Flexores do Quadril'],  equipment: 'PesoCorporal',    type: 'Cardio',               emoji: '🏃' },
  { id: 'jumping_jacks',      name: 'Jumping Jacks',                    muscles: ['Quadríceps', 'Glúteos'],              equipment: 'PesoCorporal',    type: 'Cardio',               emoji: '⭐' },

  // GLÚTEOS / ISQUIOTIBIAIS
  { id: 'barbell_hip_thrust', name: 'Barbell Hip Thrust',               muscles: ['Glúteos'],                            equipment: 'Barra',           type: 'Musculação',           emoji: '🍑' },
  { id: 'kettlebell_swing',   name: 'Kettlebell Swing',                 muscles: ['Glúteos', 'Isquiotibiais'],           equipment: 'Kettlebell',      type: 'Musculação',           emoji: '🔔' },

  // ABS / CORE
  { id: 'crunch',             name: 'Crunch',                           muscles: ['ABS'],                                equipment: 'PesoCorporal',    type: 'Calistenia',           emoji: '⭕' },
  { id: 'sit_up',             name: 'Sit-Up',                           muscles: ['ABS', 'Flexores do Quadril'],         equipment: 'PesoCorporal',    type: 'Calistenia',           emoji: '⭕' },
  { id: 'plank',              name: 'Plank',                            muscles: ['ABS'],                                equipment: 'PesoCorporal',    type: 'Calistenia',           emoji: '➖' },
  { id: 'forearm_plank_abduct', name: 'Forearm Plank Hip Abduction',    muscles: ['ABS', 'Oblíquos', 'Abdutores'],       equipment: 'PesoCorporal',    type: 'Calistenia',           emoji: '↔️' },

  // ABDUTORES
  { id: 'bw_side_lying_abduct', name: 'Bodyweight Side Lying Hip Abduction', muscles: ['Abdutores'],                    equipment: 'PesoCorporal',    type: 'Calistenia',           emoji: '🦵' },
  { id: 'bw_standing_abduct',   name: 'Bodyweight Standing Hip Abduction',   muscles: ['Glúteos', 'Abdutores'],         equipment: 'PesoCorporal',    type: 'Calistenia',           emoji: '🦵' },
  { id: 'cable_hip_abduct',     name: 'Cable Hip Abduction',            muscles: ['Glúteos', 'Abdutores'],               equipment: 'Máquina de Cabos',type: 'Musculação',           emoji: '〰️' },
  { id: 'machine_hip_abduct',   name: 'Machine Hip Abduction',          muscles: ['Glúteos', 'Abdutores'],               equipment: 'Máquinas',        type: 'Musculação',           emoji: '🔧' },
  { id: 'rb_side_clamshell',    name: 'Resistance Band Side-Lying Clamshell', muscles: ['Glúteos', 'Abdutores'],        equipment: 'Faixas de Resistência', type: 'Musculação',      emoji: '🦀' },
  { id: 'rb_standing_abduct',   name: 'Resistance Band Standing Hip Abduction', muscles: ['Glúteos', 'Abdutores'],      equipment: 'Faixas de Resistência', type: 'Musculação',      emoji: '🦀' },
  { id: 'lateral_leg_swing',    name: 'Lateral Leg Swing',              muscles: ['Abdutores', 'Adutores'],              equipment: 'PesoCorporal',    type: 'Aquecimento de Mobilidade', emoji: '🦵' },
  { id: 'rb_lateral_walk',      name: 'Resistance Band Lateral Walk',   muscles: ['Abdutores', 'Glúteos'],               equipment: 'Faixas de Resistência', type: 'Musculação',      emoji: '🦀' },
  { id: 'side_lying_circle',    name: 'Side Lying Leg Circle',          muscles: ['Glúteos', 'Abdutores'],               equipment: 'PesoCorporal',    type: 'Calistenia',           emoji: '⭕' },
  { id: 'fire_hydrant',         name: 'Fire Hydrant Circle',            muscles: ['Glúteos', 'Abdutores'],               equipment: 'PesoCorporal',    type: 'Calistenia',           emoji: '🚒' },
  { id: 'step_jacks',           name: 'Step Jacks',                     muscles: ['Abdutores'],                          equipment: 'PesoCorporal',    type: 'Cardio',               emoji: '🚶' },
  { id: 'foam_roller_itband',   name: 'Foam Roller IT Band',            muscles: ['Abdutores', 'Glúteos'],               equipment: 'Outros',          type: 'Aquecimento de Mobilidade', emoji: '🧻' },

  // FULL BODY / CARDIO
  { id: 'burpee',             name: 'Burpee',                           muscles: ['Quadríceps', 'Glúteos', 'Peito'],     equipment: 'PesoCorporal',    type: 'Treino Intervalado de Alta Intensidade', emoji: '💥' },
]

// Map exercise names to muscle groups for recovery tracking
export const MUSCLE_EMOJIS = {
  Peito: '🫁', Dors: '🔙', Ombros: '🤷', Bíceps: '💪', Tríceps: '🦾',
  Quadríceps: '🦵', Isquiotibiais: '🦵', Glúteos: '🍑', Gémeos: '🦶',
  ABS: '⭕', Oblíquos: '〰️', 'Parte inferior das costas': '🔽',
  Abdutores: '↔️', Adutores: '↔️', Trapézio: '🔺', Antebraços: '💪',
}

// ── WEEKLY PLAN ───────────────────────────────────────────────────────────────
export const WEEKLY_PLAN = {
  1: { label: 'Peito & Tríceps',  exercises: ['Barbell Bench Press','Barbell Incline Bench Press','Dumbbell Fly','Cable Bar Tricep Pushdown / Extension','Dips'] },
  2: { label: 'Costas & Bíceps',  exercises: ['Barbell Bent Over Row','Cable Lat Pull Down Wide-Grip','Cable V-Handle Seated Row','Dumbbell Bicep Curl','Barbell Bicep Curl'] },
  3: { label: 'Pernas',           exercises: ['Barbell Back Squat','Machine Leg Press (Moving Chair)','Barbell Romanian Deadlift','Dumbbell Lunge','Barbell Hip Thrust'] },
  4: { label: 'Ombros & Core',    exercises: ['Barbell Overhead Press / Military Press','Dumbbell Shoulder Press','Dumbbell Lateral Raise','Plank','Crunch'] },
}

export const REST_DAYS = [5, 6]

// ── LOAD PERCENTAGES ─────────────────────────────────────────────────────────
// [iniciante, intermedio, avancado] × bodyweight
export const LOAD_PCT = {
  'Barbell Bench Press':     { hipertrofia:[0.45,0.65,0.80], forca:[0.60,0.90,1.10], perda_peso:[0.30,0.45,0.60], condicionamento:[0.25,0.40,0.55] },
  'Barbell Incline Bench Press': { hipertrofia:[0.35,0.55,0.70], forca:[0.50,0.75,0.95], perda_peso:[0.25,0.38,0.50], condicionamento:[0.20,0.33,0.45] },
  'Dumbbell Bench Press':    { hipertrofia:[0.20,0.30,0.40], forca:[0.28,0.42,0.55], perda_peso:[0.15,0.22,0.30], condicionamento:[0.12,0.18,0.25] },
  'Dumbbell Fly':            { hipertrofia:[0.08,0.13,0.18], forca:[0.10,0.16,0.22], perda_peso:[0.06,0.10,0.14], condicionamento:[0.05,0.08,0.12] },
  'Barbell Bent Over Row':   { hipertrofia:[0.45,0.65,0.85], forca:[0.60,0.90,1.10], perda_peso:[0.30,0.45,0.60], condicionamento:[0.25,0.40,0.55] },
  'Barbell Deadlift':        { hipertrofia:[0.70,1.00,1.30], forca:[0.90,1.30,1.70], perda_peso:[0.50,0.70,0.95], condicionamento:[0.40,0.60,0.80] },
  'Barbell Romanian Deadlift':{ hipertrofia:[0.55,0.80,1.05], forca:[0.70,1.05,1.40], perda_peso:[0.40,0.58,0.80], condicionamento:[0.35,0.52,0.70] },
  'Cable Lat Pull Down Wide-Grip': { hipertrofia:[0.40,0.60,0.80], forca:[0.55,0.80,1.00], perda_peso:[0.30,0.45,0.60], condicionamento:[0.25,0.40,0.55] },
  'Cable V-Handle Seated Row': { hipertrofia:[0.35,0.55,0.75], forca:[0.50,0.75,0.95], perda_peso:[0.25,0.40,0.55], condicionamento:[0.20,0.35,0.50] },
  'Dumbbell Row':            { hipertrofia:[0.22,0.33,0.44], forca:[0.28,0.42,0.56], perda_peso:[0.16,0.25,0.33], condicionamento:[0.14,0.22,0.30] },
  'Barbell Overhead Press / Military Press': { hipertrofia:[0.30,0.45,0.60], forca:[0.40,0.60,0.80], perda_peso:[0.20,0.32,0.45], condicionamento:[0.18,0.28,0.40] },
  'Dumbbell Shoulder Press': { hipertrofia:[0.14,0.22,0.30], forca:[0.18,0.28,0.38], perda_peso:[0.10,0.16,0.22], condicionamento:[0.08,0.14,0.20] },
  'Dumbbell Lateral Raise':  { hipertrofia:[0.04,0.07,0.11], forca:[0.06,0.10,0.16], perda_peso:[0.03,0.05,0.08], condicionamento:[0.02,0.04,0.07] },
  'Barbell Bicep Curl':      { hipertrofia:[0.18,0.28,0.38], forca:[0.24,0.36,0.48], perda_peso:[0.12,0.20,0.28], condicionamento:[0.10,0.16,0.24] },
  'Dumbbell Bicep Curl':     { hipertrofia:[0.10,0.16,0.22], forca:[0.13,0.20,0.28], perda_peso:[0.07,0.11,0.16], condicionamento:[0.06,0.10,0.14] },
  'Dumbbell Hammer Curl':    { hipertrofia:[0.10,0.16,0.22], forca:[0.13,0.20,0.28], perda_peso:[0.07,0.11,0.16], condicionamento:[0.06,0.10,0.14] },
  'Cable Rope Tricep Pushdown / Extension': { hipertrofia:[0.08,0.14,0.20], forca:[0.10,0.18,0.26], perda_peso:[0.06,0.10,0.16], condicionamento:[0.05,0.08,0.12] },
  'Cable Bar Tricep Pushdown / Extension':  { hipertrofia:[0.10,0.16,0.24], forca:[0.13,0.20,0.30], perda_peso:[0.07,0.12,0.18], condicionamento:[0.06,0.10,0.16] },
  'Barbell Back Squat':      { hipertrofia:[0.60,0.90,1.20], forca:[0.80,1.20,1.60], perda_peso:[0.40,0.60,0.85], condicionamento:[0.35,0.55,0.75] },
  'Machine Leg Press (Moving Chair)': { hipertrofia:[0.90,1.30,1.80], forca:[1.20,1.80,2.40], perda_peso:[0.60,0.90,1.30], condicionamento:[0.55,0.80,1.10] },
  'Dumbbell Lunge':          { hipertrofia:[0.14,0.22,0.30], forca:[0.18,0.28,0.38], perda_peso:[0.10,0.16,0.22], condicionamento:[0.08,0.14,0.20] },
  'Barbell Hip Thrust':      { hipertrofia:[0.65,0.95,1.25], forca:[0.85,1.25,1.65], perda_peso:[0.45,0.65,0.90], condicionamento:[0.40,0.60,0.80] },
  'Kettlebell Swing':        { hipertrofia:[0.20,0.30,0.40], forca:[0.25,0.38,0.50], perda_peso:[0.15,0.22,0.30], condicionamento:[0.12,0.18,0.25] },
  // Bodyweight exercises → null
  'Barbell Deadlift': { hipertrofia:[0.70,1.00,1.30], forca:[0.90,1.30,1.70], perda_peso:[0.50,0.70,0.95], condicionamento:[0.40,0.60,0.80] },
  'Pull-Up': null, 'Chin-Up': null, 'Push-Up': null, 'Dips': null,
  'Crunch': null, 'Sit-Up': null, 'Plank': null, 'Burpee': null,
  'Bodyweight Squat': null, 'Bodyweight Lunge': null, 'High Knees': null, 'Jumping Jacks': null,
}

export const LEVEL_IDX = { iniciante: 0, intermedio: 1, avancado: 2 }

// Recovery hours by goal
export const RECOVERY_HOURS = {
  hipertrofia: 48, forca: 72, perda_peso: 24, condicionamento: 24,
}
