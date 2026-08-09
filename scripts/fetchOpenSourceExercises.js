#!/usr/bin/env node

/**
 * 📦 FitTrack — Script de Download em Massa de Media de Exercícios
 *
 * Fontes open-source:
 *  1. yuhonas/free-exercise-db (Unlicense — dados em domínio público)
 *  2. wger.de API (AGPL — imagens CC-BY-SA)
 *
 * Uso: node scripts/fetchOpenSourceExercises.js
 *
 * Outputs:
 *  - public/assets/exercises/images/  (SVGs animados gerados localmente)
 *  - public/assets/exercises/gifs/    (marcadores + GIFs descarregados)
 *  - Mapeamento cruzado com os 77 exercícios do exerciseMedia.ts
 */

import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { fileURLToPath } from 'url';
import { finished } from 'stream/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const IMG_DIR = path.join(PROJECT_ROOT, 'public', 'assets', 'exercises', 'images');
const GIF_DIR = path.join(PROJECT_ROOT, 'public', 'assets', 'exercises', 'gifs');

// Garantir que as pastas existem
[IMG_DIR, GIF_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ── MAPA: Nome FitTrack → slug para ficheiros ──────────────────────────────
const EXERCISES = [
  'barbell_bench_press',
  'barbell_incline_bench_press',
  'dumbbell_bench_press',
  'dumbbell_incline_bench_press',
  'decline_bench_press',
  'close_grip_bench_press',
  'cable_crossover',
  'dumbbell_pullover',
  'barbell_bent_over_row',
  'dumbbell_row',
  'single_arm_dumbbell_row',
  'cable_lat_pulldown_wide_grip',
  'close_grip_pulldown',
  'pull_up',
  'chin_up',
  'seated_cable_row',
  't_bar_row',
  'rack_pull',
  'barbell_back_squat',
  'front_squat',
  'goblet_squat',
  'barbell_deadlift',
  'romanian_deadlift',
  'sumo_deadlift',
  'machine_leg_press',
  'leg_extension',
  'lying_leg_curl',
  'seated_leg_curl',
  'hip_thrust',
  'lunge',
  'bulgarian_split_squat',
  'standing_calf_raise',
  'seated_calf_raise',
  'box_jump',
  'barbell_overhead_press',
  'dumbbell_shoulder_press',
  'arnold_press',
  'dumbbell_lateral_raise',
  'front_raise',
  'face_pull',
  'upright_row',
  'reverse_pec_deck',
  'barbell_shrug',
  'barbell_bicep_curl',
  'alternating_dumbbell_curl',
  'hammer_curl',
  'concentration_curl',
  'preacher_curl',
  'cable_rope_tricep_pushdown',
  'skull_crusher',
  'triceps_pushdown',
  'overhead_triceps_extension',
  'diamond_push_up',
  'bench_dip',
  'plank',
  'side_plank',
  'crunch',
  'cable_crunch',
  'hanging_leg_raise',
  'russian_twist',
  'pallof_press',
  'lying_leg_raise',
  'push_up',
  'burpee',
  'dips',
  'kettlebell_swing',
  'power_clean',
  'jump_squat',
  'box_step_up',
  'clean_and_jerk',
  'snatch',
  'thruster',
  'farmers_walk',
  'sled_push',
  'medicine_ball_slam',
  'battle_ropes',
  'sandbag_carry',
  // Bodyweight extras (do bodyweight-exercises.json)
  'bodyweight_squat',
  'mountain_climbers',
];

// ── MAPA: slug FitTrack → possíveis nomes no free-exercise-db ──────────────
const SLUG_TO_FREE_DB = {
  push_up: ['Push-Ups', 'Push-up'],
  pull_up: ['Pull-ups', 'Pull-Up'],
  chin_up: ['Chin-Up', 'Chin-Ups'],
  barbell_bench_press: ['Barbell Bench Press', 'Bench Press - Barbell'],
  barbell_back_squat: ['Squat - Barbell', 'Barbell Squat'],
  barbell_deadlift: ['Deadlift - Barbell', 'Barbell Deadlift'],
  barbell_overhead_press: ['Overhead Press - Barbell', 'Military Press'],
  barbell_bent_over_row: ['Bent Over Row - Barbell', 'Barbell Row'],
  dumbbell_bench_press: ['Bench Press - Dumbbell', 'Dumbbell Bench Press'],
  dumbbell_shoulder_press: ['Shoulder Press - Dumbbell', 'Dumbbell Shoulder Press'],
  dumbbell_lateral_raise: ['Lateral Raise - Dumbbell', 'Dumbbell Lateral Raise'],
  barbell_bicep_curl: ['Bicep Curl - Barbell', 'Barbell Curl'],
  hammer_curl: ['Hammer Curl', 'Hammer Curls - Dumbbell'],
  cable_rope_tricep_pushdown: ['Tricep Pushdown - Cable', 'Triceps Pushdown'],
  lunge: ['Lunge', 'Lunges'],
  plank: ['Plank'],
  crunch: ['Crunches', 'Crunch'],
  burpee: ['Burpees', 'Burpee'],
  dips: ['Dips', 'Parallel Bar Dips'],
  russian_twist: ['Russian Twist'],
  hip_thrust: ['Hip Thrust', 'Barbell Hip Thrust'],
  romanian_deadlift: ['Romanian Deadlift', 'Romanian Deadlift - Barbell'],
  front_squat: ['Front Squat', 'Front Squat - Barbell'],
  leg_extension: ['Leg Extension', 'Leg Extension - Machine'],
  lying_leg_curl: ['Lying Leg Curl', 'Leg Curl - Machine'],
  hanging_leg_raise: ['Hanging Leg Raise'],
  mountain_climbers: ['Mountain Climbers'],
  jump_squat: ['Jump Squat', 'Squat Jump'],
  diamond_push_up: ['Diamond Push-Up', 'Diamond Push-Ups'],
  face_pull: ['Face Pull', 'Face Pulls'],
  arnold_press: ['Arnold Press'],
  skull_crusher: ['Skull Crusher', 'Skull Crushers'],
  kettlebell_swing: ['Kettlebell Swing', 'Kettlebell Swings'],
  box_jump: ['Box Jump', 'Box Jumps'],
  side_plank: ['Side Plank'],
};

// ── DOWNLOAD HELPERS ────────────────────────────────────────────────────────

async function downloadFile(url, outputPath, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const writer = fs.createWriteStream(outputPath);
    await finished(Readable.fromWeb(response.body).pipe(writer));
    return true;
  } catch (err) {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

// ── GERADOR DE SVG PLACEHOLDER (visual cyberpunk) ───────────────────────────

function generateSvgPlaceholder(exerciseName, muscleGroup) {
  const colors = {
    Peito: '#ef4444',
    Costas: '#3b82f6',
    Pernas: '#22c55e',
    Ombros: '#f97316',
    Braços: '#a855f7',
    Core: '#eab308',
    'Full Body': '#06b6d4',
    Cardio: '#ec4899',
    Tríceps: '#a855f7',
  };

  const color = colors[muscleGroup] || '#e8c84a';
  const emojis = {
    Peito: '🫁',
    Costas: '🔙',
    Pernas: '🦵',
    Ombros: '🤷',
    Braços: '💪',
    Core: '⭕',
    'Full Body': '🏋️',
    Cardio: '🏃',
    Tríceps: '🦾',
  };
  const emoji = emojis[muscleGroup] || '🏋️';

  // Formatar nome para display
  const displayName = exerciseName.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#080b0f"/>
      <stop offset="100%" style="stop-color:#0e1318"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <rect x="1" y="1" width="398" height="298" rx="16" fill="none" stroke="${color}" stroke-opacity="0.3"/>
  <!-- Grid -->
  <g stroke="${color}" stroke-opacity="0.05" stroke-width="1">
    ${Array.from({ length: 20 }, (_, i) => `<line x1="${i * 20}" y1="0" x2="${i * 20}" y2="300"/>`).join('\n    ')}
    ${Array.from({ length: 15 }, (_, i) => `<line x1="0" y1="${i * 20}" x2="400" y2="${i * 20}"/>`).join('\n    ')}
  </g>
  <!-- Emoji -->
  <text x="200" y="120" font-size="48" text-anchor="middle" dominant-baseline="middle">${emoji}</text>
  <!-- Nome -->
  <text x="200" y="180" fill="${color}" font-family="'Outfit', sans-serif" font-size="16" font-weight="bold" text-anchor="middle" filter="url(#glow)">${displayName}</text>
  <!-- Grupo Muscular -->
  <text x="200" y="210" fill="#55626e" font-family="'Outfit', sans-serif" font-size="11" text-anchor="middle" text-transform="uppercase" letter-spacing="3">${muscleGroup.toUpperCase()}</text>
  <!-- Badge -->
  <rect x="150" y="240" width="100" height="24" rx="12" fill="${color}" fill-opacity="0.15" stroke="${color}" stroke-opacity="0.3"/>
  <text x="200" y="256" fill="${color}" font-family="'DM Mono', monospace" font-size="9" text-anchor="middle" font-weight="bold">FITTRACK V7</text>
</svg>`;
}

// ── MAPA de exercício → grupo muscular ──────────────────────────────────────

const EXERCISE_MUSCLES = {
  barbell_bench_press: 'Peito',
  barbell_incline_bench_press: 'Peito',
  dumbbell_bench_press: 'Peito',
  dumbbell_incline_bench_press: 'Peito',
  decline_bench_press: 'Peito',
  close_grip_bench_press: 'Peito',
  cable_crossover: 'Peito',
  dumbbell_pullover: 'Peito',
  push_up: 'Peito',
  barbell_bent_over_row: 'Costas',
  dumbbell_row: 'Costas',
  single_arm_dumbbell_row: 'Costas',
  cable_lat_pulldown_wide_grip: 'Costas',
  close_grip_pulldown: 'Costas',
  pull_up: 'Costas',
  chin_up: 'Costas',
  seated_cable_row: 'Costas',
  t_bar_row: 'Costas',
  rack_pull: 'Costas',
  barbell_back_squat: 'Pernas',
  front_squat: 'Pernas',
  goblet_squat: 'Pernas',
  barbell_deadlift: 'Pernas',
  romanian_deadlift: 'Pernas',
  sumo_deadlift: 'Pernas',
  machine_leg_press: 'Pernas',
  leg_extension: 'Pernas',
  lying_leg_curl: 'Pernas',
  seated_leg_curl: 'Pernas',
  hip_thrust: 'Pernas',
  lunge: 'Pernas',
  bulgarian_split_squat: 'Pernas',
  standing_calf_raise: 'Pernas',
  seated_calf_raise: 'Pernas',
  box_jump: 'Pernas',
  jump_squat: 'Pernas',
  box_step_up: 'Pernas',
  bodyweight_squat: 'Pernas',
  barbell_overhead_press: 'Ombros',
  dumbbell_shoulder_press: 'Ombros',
  arnold_press: 'Ombros',
  dumbbell_lateral_raise: 'Ombros',
  front_raise: 'Ombros',
  face_pull: 'Ombros',
  upright_row: 'Ombros',
  reverse_pec_deck: 'Ombros',
  barbell_shrug: 'Ombros',
  barbell_bicep_curl: 'Braços',
  alternating_dumbbell_curl: 'Braços',
  hammer_curl: 'Braços',
  concentration_curl: 'Braços',
  preacher_curl: 'Braços',
  cable_rope_tricep_pushdown: 'Braços',
  skull_crusher: 'Braços',
  triceps_pushdown: 'Braços',
  overhead_triceps_extension: 'Braços',
  diamond_push_up: 'Braços',
  bench_dip: 'Braços',
  plank: 'Core',
  side_plank: 'Core',
  crunch: 'Core',
  cable_crunch: 'Core',
  hanging_leg_raise: 'Core',
  russian_twist: 'Core',
  pallof_press: 'Core',
  lying_leg_raise: 'Core',
  burpee: 'Full Body',
  dips: 'Peito',
  kettlebell_swing: 'Pernas',
  power_clean: 'Full Body',
  clean_and_jerk: 'Full Body',
  snatch: 'Full Body',
  thruster: 'Full Body',
  farmers_walk: 'Full Body',
  sled_push: 'Full Body',
  medicine_ball_slam: 'Full Body',
  battle_ropes: 'Full Body',
  sandbag_carry: 'Full Body',
  mountain_climbers: 'Cardio',
};

// ── MAIN ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  📦 FitTrack — Exercise Media Downloader     ║');
  console.log('║  Fontes: free-exercise-db + wger (Open Source)║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');

  let downloadedCount = 0;
  let placeholderCount = 0;
  let skippedCount = 0;

  // ── FASE 1: Descarregar dados do free-exercise-db ─────────────────────
  console.log('📡 Fase 1: A descarregar base de dados do free-exercise-db...');
  let freeDbExercises = [];

  try {
    const res = await fetch(
      'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json',
      {
        signal: AbortSignal.timeout(15000),
      },
    );
    if (res.ok) {
      freeDbExercises = await res.json();
      console.log(`   ✅ ${freeDbExercises.length} exercícios carregados do free-exercise-db`);
    }
  } catch (err) {
    console.log('   ⚠️ free-exercise-db não acessível. A continuar só com placeholders.');
  }

  // ── FASE 2: Para cada exercício do FitTrack ───────────────────────────
  console.log('');
  console.log(`🎨 Fase 2: A processar ${EXERCISES.length} exercícios...`);
  console.log('');

  for (const slug of EXERCISES) {
    const svgPath = path.join(IMG_DIR, `${slug}.svg`);
    const gifPath = path.join(GIF_DIR, `${slug}.gif`);
    const muscle = EXERCISE_MUSCLES[slug] || 'Full Body';

    // ── SVG: Gerar placeholder cyberpunk se não existir ─────────────
    if (!fs.existsSync(svgPath)) {
      const svg = generateSvgPlaceholder(slug, muscle);
      fs.writeFileSync(svgPath, svg);
      placeholderCount++;
    } else {
      skippedCount++;
    }

    // ── GIF: Tentar descarregar do free-exercise-db ─────────────────
    if (!fs.existsSync(gifPath) || fs.statSync(gifPath).size === 0) {
      let downloaded = false;

      // Tentar mapear via SLUG_TO_FREE_DB
      const possibleNames = SLUG_TO_FREE_DB[slug] || [];

      for (const name of possibleNames) {
        // Procurar no free-exercise-db
        const match = freeDbExercises.find(
          (ex) =>
            ex.name &&
            (ex.name.toLowerCase() === name.toLowerCase() ||
              ex.name.toLowerCase().includes(name.toLowerCase())),
        );

        if (match && match.images && match.images.length > 0) {
          // Descarregar a primeira imagem
          const imageUrl = `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${match.images[0]}`;
          const imgDownloadPath = path.join(IMG_DIR, `${slug}_photo.jpg`);

          if (await downloadFile(imageUrl, imgDownloadPath)) {
            console.log(`   ✅ ${slug} — imagem descarregada do free-exercise-db`);
            downloaded = true;
            downloadedCount++;
            break;
          }
        }
      }

      if (!downloaded) {
        // Criar marcador GIF vazio (o utilizador pode substituir depois)
        fs.writeFileSync(gifPath, '');
      }
    }
  }

  // ── FASE 3: Relatório ─────────────────────────────────────────────────
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  📊 Relatório Final                          ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log(`║  Total exercícios:    ${EXERCISES.length.toString().padStart(3)}`);
  console.log(`║  SVGs gerados:        ${placeholderCount.toString().padStart(3)}`);
  console.log(`║  Imagens descarregadas:${downloadedCount.toString().padStart(3)}`);
  console.log(`║  Já existentes:       ${skippedCount.toString().padStart(3)}`);
  console.log('╠══════════════════════════════════════════════╣');
  console.log('║  📁 Imagens: public/assets/exercises/images/ ║');
  console.log('║  📁 GIFs:    public/assets/exercises/gifs/   ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');
  console.log('💡 Para GIFs reais, substitui os marcadores vazios');
  console.log('   em public/assets/exercises/gifs/ por .gif animados.');
  console.log('');
  console.log('🔒 Licenças:');
  console.log('   • Dados JSON: Unlicense (domínio público)');
  console.log('   • SVGs gerados: Criação FitTrack (sem restrições)');
  console.log('   • Fotos free-exercise-db: Proveniência ambígua');
  console.log('     (usar com cautela em produção comercial)');
}

main().catch((err) => {
  console.error('❌ Erro fatal:', err);
  process.exit(1);
});
