#!/usr/bin/env node
/**
 * Migration script: Gym Visual dataset -> Fittrack ExerciseDefinition + EXERCISE_LIBRARY
 * Run with: node scripts/migrate-exercises.js
 */

const fs = require('fs');
const path = require('path');

// ── Load source data ──────────────────────────────────────────────
const datasetPath = path.resolve(__dirname, '../public/data/exercises-dataset.json');
const raw = JSON.parse(fs.readFileSync(datasetPath, 'utf-8'));

// ── Key exercises that MUST match existing WORKOUT_PLANS and V2_LOAD_PCT ──────────────────────
// Map dataset names to expected names
const KEY_EXERCISE_NAME_MAP = {
  'barbell bench press': 'Barbell Bench Press',
  'cable bar lateral pulldown': 'Cable Lat Pulldown Wide-Grip', // closest match
  'bodyweight incline side plank': 'Plank',
  'barbell bent over row': 'Barbell Bent Over Row',
  'barbell alternate biceps curl': 'Barbell Bicep Curl',
  'barbell full squat (back pov)': 'Barbell Back Squat',
  'barbell seated overhead press': 'Barbell Overhead Press',
  'pull-up': 'Pull-Up',
  'elbow dips': 'Dips',
  'burpee': 'Burpee',
  'barbell deadlift': 'Barbell Deadlift',
  'cable alternate triceps extension': 'Cable Rope Tricep Pushdown', // closest match
};

// Check if an exercise is a key exercise and should use the mapped name
const getKeyExerciseName = (datasetName) => {
  const lower = datasetName.toLowerCase();
  return KEY_EXERCISE_NAME_MAP[lower] || null;
};

// ── Portuguese equipment mapping ──────────────────────────────────
const EQUIPMENT_MAP = {
  'body weight': 'PesoCorporal',
  'barbell': 'Barra',
  'dumbbell': 'Halteres',
  'cable': 'Máquina de Cabos',
  'smith machine': 'Máquina Smith',
  'ez barbell': 'Barra W',
  'olympic barbell': 'Barra',
  'trap bar': 'Barra Hexagonal',
  'kettlebell': 'Kettlebell',
  'band': 'Faixas de Resistência',
  'resistance band': 'Faixas de Resistência',
  'medicine ball': 'Bola medicinal',
  'stability ball': 'Bola de estabilidade',
  'bosu ball': 'Bola de estabilidade',
  'roller': 'Outros',
  'wheel roller': 'Outros',
  'rope': 'Outros',
  'weighted': 'Outros',
  'assisted': 'Máquinas',
  'leverage machine': 'Máquinas',
  'elliptical machine': 'Outros',
  'skierg machine': 'Outros',
  'sled machine': 'Outros',
  'stationary bike': 'Outros',
  'stepmill machine': 'Outros',
  'tire': 'Outros',
  'hammer': 'Outros',
  'upper body ergometer': 'Outros',
};

// ── Category/Body part to muscle group (Portuguese) ───────────────
const MUSCLE_MAP = {
  'abs': 'ABS',
  'obliques': 'Oblíquos',
  'pectoralis': 'Peito', // appears as 'pectorals' in target
  'pectorals': 'Peito',
  'delts': 'Ombros',
  'lats': 'Dors',
  'traps': 'Trapézio',
  'biceps': 'Bíceps',
  'triceps': 'Tríceps',
  'forearms': 'Antebraços',
  'quads': 'Quadríceps',
  'hamstrings': 'Isquiotibiais',
  'glutes': 'Glúteos',
  'calves': 'Gémeos',
  'abductors': 'Abdutores',
  'adductors': 'Adutores',
  'serratus anterior': 'Outros',
  'levator scapulae': 'Outros',
  'spine': 'Parte inferior das costas',
  'upper back': 'Dors',
  'cardiovascular system': 'Outros',
  'hip flexors': 'Flexores do Quadril',
  'lower back': 'Parte inferior das costas',
  'ankle stabilizers': 'Outros',
  'rhomboids': 'Dors',
  'shoulders': 'Ombros',
  'core': 'ABS',
  'back': 'Dors',
};

// ── Category to activity type ─────────────────────────────────────
const CATEGORY_TYPE_MAP = {
  'cardio': 'Cardio',
  'chest': 'Musculação',
  'back': 'Musculação',
  'shoulders': 'Musculação',
  'upper arms': 'Musculação',
  'lower arms': 'Musculação',
  'upper legs': 'Musculação',
  'lower legs': 'Musculação',
  'waist': 'Calistenia',
  'neck': 'Mobilidade',
};

// ── Emoji mapping ─────────────────────────────────────────────────
const EMOJI_MAP = {
  'Peito': '🏋️',
  'Dors': '🔙',
  'Ombros': '🤷',
  'Bíceps': '💪',
  'Tríceps': '🦾',
  'Antebraços': '💪',
  'Quadríceps': '🦵',
  'Isquiotibiais': '🦵',
  'Glúteos': '🍑',
  'Gémeos': '🦵',
  'ABS': '⭕',
  'Oblíquos': '⭕',
  'Abdutores': '🦵',
  'Adutores': '🦵',
  'Flexores do Quadril': '🦵',
  'Trapézio': '🔙',
  'Parte inferior das costas': '🔙',
  'Outros': '🏋️',
  'PesoCorporal': '🤸',
  'Barra': '🏋️',
  'Halteres': '💪',
  'Máquina de Cabos': '〰️',
  'Máquina Smith': '🔧',
  'Barra W': '🏋️',
  'Barra Hexagonal': '🏋️',
  'Kettlebell': '🏋️',
  'Faixas de Resistência': '🔗',
  'Bola medicinal': '⚽',
  'Bola de estabilidade': '⚽',
  'Máquinas': '🔧',
  'Outros': '🔧',
};

// ── Helper functions ──────────────────────────────────────────────
const mapEquipment = (eq) => EQUIPMENT_MAP[eq] || 'Outros';
const mapMuscle = (muscle) => MUSCLE_MAP[muscle.toLowerCase()] || 'Outros';
const mapCategoryToType = (cat) => CATEGORY_TYPE_MAP[cat] || 'Musculação';
const getEmoji = (muscle, equipment) => EMOJI_MAP[muscle] || EMOJI_MAP[equipment] || '🏋️';

// Convert target to primary muscle group (Portuguese)
const getPrimaryMuscle = (target, muscleGroup) => {
  const primary = mapMuscle(target);
  if (primary !== 'Outros') return primary;
  return mapMuscle(muscleGroup);
};

// Get secondary muscles in Portuguese
const getSecondaryMuscles = (secondary) => {
  return secondary
    .map(m => mapMuscle(m))
    .filter((m, i, arr) => m !== 'Outros' && arr.indexOf(m) === i);
};

// Build exercise ID from name (lowercase, underscores, no special chars)
const buildId = (name, index) => {
  let id = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 60);

  // Add index suffix to ensure uniqueness
  return `${id}_${index}`;
};

// ── Transform dataset ─────────────────────────────────────────────
const exercisesDef = {};
const exerciseLibrary = [];

raw.forEach((item, idx) => {
  const primaryMuscle = getPrimaryMuscle(item.target, item.muscle_group);
  const secondaryMuscles = getSecondaryMuscles(item.secondary_muscles || []);
  const equipment = mapEquipment(item.equipment);
  const type = mapCategoryToType(item.category);
  const emoji = getEmoji(primaryMuscle, equipment);

  // Use mapped name for key exercises
  const mappedName = getKeyExerciseName(item.name);
  const finalName = mappedName || item.name;
  const id = buildId(finalName, idx);

  // ExerciseDefinition for EXERCISE_DB
  exercisesDef[finalName] = {
    muscle: primaryMuscle,
    equipment,
    type: equipment === 'PesoCorporal' ? 'bodyweight' : 'weighted',
    base: { hipertrofia: [3, 8, 12] },
    goals: ['hipertrofia'],
    modalities: ['musculacao'],
    jointImpact: equipment === 'PesoCorporal' ? 'low' : 'medium',
    ageMin: 14,
    secondaryMuscles,
    instructions: item.instruction_steps?.en || [],
    media: {
      gif: `/data/exercise-gifs/${path.basename(item.gif_url)}`,
    },
  };

  // EXERCISE_LIBRARY entry
  exerciseLibrary.push({
    id,
    name: finalName,
    muscles: [primaryMuscle, ...secondaryMuscles].filter(Boolean),
    equipment,
    type,
    emoji,
  });
});

// ── Write EXERCISE_DB (exerciseDB.ts) ─────────────────────────────
const dbOutput = `import type { ExerciseDefinition } from '../types/exercise';

export const EXERCISE_DB: Record<string, ExerciseDefinition> = ${JSON.stringify(exercisesDef, null, 2)};
`;

fs.writeFileSync(
  path.resolve(__dirname, '../src/data/exerciseDB.ts'),
  dbOutput,
  'utf-8'
);

// ── Write EXERCISE_LIBRARY (constants.ts replacement section) ─────
// We'll generate a constants snippet that can replace the EXERCISE_LIBRARY array
const libOutput = `export const EXERCISE_LIBRARY = ${JSON.stringify(exerciseLibrary, null, 2)};\n`;

fs.writeFileSync(
  path.resolve(__dirname, '../src/data/exercises-generated.ts'),
  libOutput,
  'utf-8'
);

// ── Summary ───────────────────────────────────────────────────────
console.log(`✅ Generated ${Object.keys(exercisesDef).length} exercises`);
console.log(`✅ Written to src/data/exerciseDB.ts`);
console.log(`✅ Written to src/data/exercises-generated.ts`);
console.log('\nSample entry:');
console.log(JSON.stringify(exercisesDef[Object.keys(exercisesDef)[0]], null, 2));
console.log('\nSample library entry:');
console.log(JSON.stringify(exerciseLibrary[0], null, 2));

// Check for duplicates in IDs
const ids = exerciseLibrary.map(e => e.id);
const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
if (dupes.length > 0) {
  console.warn('⚠️ Duplicate IDs found:', [...new Set(dupes)]);
}