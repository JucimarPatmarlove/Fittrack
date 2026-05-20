import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMG_DIR = path.resolve(__dirname, '../public/assets/exercises/images');

// Complete list of exercises from exerciseMediaMap
const exercises = [
    "barbell_bench_press",
    "barbell_incline_bench_press",
    "dumbbell_bench_press",
    "dumbbell_incline_bench_press",
    "decline_bench_press",
    "close_grip_bench_press",
    "cable_crossover",
    "dumbbell_pullover",
    "barbell_bent_over_row",
    "dumbbell_row",
    "single_arm_dumbbell_row",
    "cable_lat_pulldown_wide_grip",
    "close_grip_pulldown",
    "pull_up",
    "chin_up",
    "seated_cable_row",
    "t_bar_row",
    "rack_pull",
    "barbell_back_squat",
    "front_squat",
    "goblet_squat",
    "barbell_deadlift",
    "romanian_deadlift",
    "sumo_deadlift",
    "machine_leg_press",
    "leg_extension",
    "lying_leg_curl",
    "seated_leg_curl",
    "hip_thrust",
    "lunge",
    "bulgarian_split_squat",
    "standing_calf_raise",
    "seated_calf_raise",
    "box_jump",
    "barbell_overhead_press",
    "dumbbell_shoulder_press",
    "arnold_press",
    "dumbbell_lateral_raise",
    "front_raise",
    "face_pull",
    "upright_row",
    "reverse_pec_deck",
    "barbell_shrug",
    "barbell_bicep_curl",
    "alternating_dumbbell_curl",
    "hammer_curl",
    "concentration_curl",
    "preacher_curl",
    "cable_rope_tricep_pushdown",
    "skull_crusher",
    "triceps_pushdown",
    "overhead_triceps_extension",
    "diamond_push_up",
    "bench_dip",
    "plank",
    "side_plank",
    "crunch",
    "cable_crunch",
    "hanging_leg_raise",
    "russian_twist",
    "pallof_press",
    "lying_leg_raise",
    "push_up",
    "burpee",
    "dips",
    "kettlebell_swing",
    "power_clean",
    "jump_squat",
    "box_step_up",
    "clean_and_jerk",
];

// Create directory if it doesn't exist
if (!fs.existsSync(IMG_DIR)) {
    fs.mkdirSync(IMG_DIR, { recursive: true });
    console.log(`📁 Created directory: ${IMG_DIR}`);
}

// SVG template function
const svgTemplate = (name) => `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1a2e;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0f0f1e;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#grad1)"/>
  <circle cx="200" cy="100" r="50" fill="#e8c84a22" opacity="0.3"/>
  <text x="50%" y="45%" fill="#e8c84a" text-anchor="middle" dy=".3em" font-family="'Bebas Neue', monospace" font-size="28" font-weight="bold" letter-spacing="2">${name.replace(/_/g, ' ').toUpperCase()}</text>
  <text x="50%" y="70%" fill="#888" text-anchor="middle" dy=".3em" font-family="monospace" font-size="12">🏋️ Exercise Placeholder</text>
  <rect x="10%" y="80%" width="80%" height="15%" fill="none" stroke="#e8c84a44" stroke-width="1" rx="4"/>
  <text x="50%" y="87%" fill="#666" text-anchor="middle" font-family="monospace" font-size="10">Tap to download media</text>
</svg>`;

// Generate all placeholders
let created = 0;
let skipped = 0;

exercises.forEach(name => {
    const filePath = path.join(IMG_DIR, `${name}.svg`);
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, svgTemplate(name));
        created++;
        console.log(`✅ Created: ${name}.svg`);
    } else {
        skipped++;
    }
});

console.log(`\n✨ SVG Placeholder Generation Complete!`);
console.log(`   Created: ${created} new files`);
console.log(`   Skipped: ${skipped} existing files`);
console.log(`   Location: ${IMG_DIR}`);
