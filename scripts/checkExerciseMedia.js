import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMG_DIR = path.resolve(__dirname, '../public/assets/exercises/images');

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

let missing = [];
exercises.forEach(name => {
  if (!fs.existsSync(path.join(IMG_DIR, `${name}.jpg`))) missing.push(name);
});

if (missing.length) {
  console.warn('⚠️ Imagens em falta:', missing);
} else {
  console.log('✅ Todas as imagens existem!');
}
