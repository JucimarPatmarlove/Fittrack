import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Readable } from 'stream';
import { finished } from 'stream/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Pastas de destino
const IMG_DIR = path.join(PROJECT_ROOT, 'public', 'assets', 'exercises', 'images');
const GIF_DIR = path.join(PROJECT_ROOT, 'public', 'assets', 'exercises', 'gifs');

// Garantir que as pastas existem
[IMG_DIR, GIF_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Lista dos 77 exercícios (nomes normalizados, iguais aos do exerciseMedia.ts)
const exercises = [
  "barbell_bench_press", "barbell_incline_bench_press", "dumbbell_bench_press", "dumbbell_incline_bench_press",
  "decline_bench_press", "close_grip_bench_press", "cable_crossover", "dumbbell_pullover",
  "barbell_bent_over_row", "dumbbell_row", "single_arm_dumbbell_row", "cable_lat_pulldown_wide_grip",
  "close_grip_pulldown", "pull_up", "chin_up", "seated_cable_row", "t_bar_row", "rack_pull",
  "barbell_back_squat", "front_squat", "goblet_squat", "barbell_deadlift", "romanian_deadlift",
  "sumo_deadlift", "machine_leg_press", "leg_extension", "lying_leg_curl", "seated_leg_curl",
  "hip_thrust", "lunge", "bulgarian_split_squat", "standing_calf_raise", "seated_calf_raise", "box_jump",
  "barbell_overhead_press", "dumbbell_shoulder_press", "arnold_press", "dumbbell_lateral_raise",
  "front_raise", "face_pull", "upright_row", "reverse_pec_deck", "barbell_shrug",
  "barbell_bicep_curl", "alternating_dumbbell_curl", "hammer_curl", "concentration_curl", "preacher_curl",
  "cable_rope_tricep_pushdown", "skull_crusher", "triceps_pushdown", "overhead_triceps_extension",
  "diamond_push_up", "bench_dip",
  "plank", "side_plank", "crunch", "cable_crunch", "hanging_leg_raise", "russian_twist", "pallof_press", "lying_leg_raise",
  "push_up", "burpee", "dips", "kettlebell_swing", "power_clean", "jump_squat", "box_step_up",
  "clean_and_jerk", "snatch", "thruster", "farmers_walk", "sled_push", "medicine_ball_slam", "battle_ropes", "sandbag_carry"
];

// Função para descarregar ficheiro
async function downloadFile(url, outputPath) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Erro de rede: ${response.status} ${response.statusText}`);
  const writer = fs.createWriteStream(outputPath);
  await finished(Readable.fromWeb(response.body).pipe(writer));
}

// Placeholder SVG (para fallback)
const placeholderSvg = `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#1a1a2e"/><text x="50%" y="50%" fill="#888" text-anchor="middle" dy=".3em" font-family="monospace">🏋️ Exercício</text></svg>`;

async function main() {
  console.log(`🖼️ A descarregar media para ${exercises.length} exercícios...`);
  for (const name of exercises) {
    const imgPath = path.join(IMG_DIR, `${name}.jpg`);
    const gifPath = path.join(GIF_DIR, `${name}.gif`);

    // Imagem (Unsplash)
    if (!fs.existsSync(imgPath)) {
      try {
        const unsplashUrl = `https://source.unsplash.com/400x300/?fitness,workout,${encodeURIComponent(name)}`;
        await downloadFile(unsplashUrl, imgPath);
        console.log(`✅ Imagem: ${name}.jpg`);
      } catch (err) {
        // Fallback: criar SVG placeholder
        fs.writeFileSync(imgPath, placeholderSvg);
        console.log(`⚠️ Placeholder SVG: ${name}.jpg`);
      }
    } else {
      console.log(`⏭️ Imagem já existe: ${name}.jpg`);
    }

    // GIF (opcional – sem chave GIPHY, não descarrega; mas podes obter manualmente)
    if (!fs.existsSync(gifPath)) {
      // Apenas cria ficheiro vazio como marcador; o utilizador pode depois substituir por GIFs reais
      fs.writeFileSync(gifPath, '');
      console.log(`📁 Marcador GIF criado: ${name}.gif (substitua por GIF real)`);
    }
  }
  console.log('🎉 Processo concluído! As imagens estão em public/assets/exercises/images/');
  console.log('💡 Dica: Para GIFs reais, substitua os ficheiros vazios por .gif animados.');
}

main().catch(console.error);
