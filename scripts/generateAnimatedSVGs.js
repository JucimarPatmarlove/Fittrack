import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMG_DIR = path.resolve(__dirname, '../public/assets/exercises/images');

const exercises = [
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
];

// Helper to format exercise name for display
const formatName = (slug) => {
  return slug
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Map each exercise to its specific animation category and primary muscle group
const getExerciseMeta = (name) => {
  const muscleGroups = {
    peito: ['bench_press', 'Peito', '#ef4444'],
    costas: ['row', 'Costas', '#38bdf8'],
    ombros: ['overhead_press', 'Ombros', '#fb923c'],
    pernas: ['squat', 'Pernas', '#10b981'],
    bracos: ['curl', 'Braços', '#a855f7'],
    core: ['core', 'Core', '#f59e0b'],
    full: ['cardio_power', 'Full Body', '#eceae4'],
  };

  // Specific overrides for category mapping
  if (
    name.includes('lat_pulldown') ||
    name.includes('pulldown') ||
    name.includes('pull_up') ||
    name.includes('chin_up')
  ) {
    return { category: 'pulldown', muscle: 'Costas', color: '#38bdf8' };
  }
  if (name.includes('row') || name.includes('shrug') || name.includes('pull')) {
    return { category: 'row', muscle: 'Costas', color: '#38bdf8' };
  }
  if (name.includes('deadlift') || name.includes('hip_thrust')) {
    return { category: 'deadlift', muscle: 'Pernas/Lombar', color: '#10b981' };
  }
  if (
    name.includes('squat') ||
    name.includes('leg_press') ||
    name.includes('lunge') ||
    name.includes('calf') ||
    name.includes('jump') ||
    name.includes('step_up') ||
    name.includes('leg_curl') ||
    name.includes('leg_extension')
  ) {
    return { category: 'squat', muscle: 'Pernas', color: '#10b981' };
  }
  if (name.includes('bicep') || name.includes('curl')) {
    return { category: 'curl', muscle: 'Bíceps', color: '#a855f7' };
  }
  if (
    name.includes('tricep') ||
    name.includes('dip') ||
    name.includes('skull_crusher') ||
    name.includes('extension')
  ) {
    return { category: 'extension', muscle: 'Tríceps', color: '#d946ef' };
  }
  if (
    name.includes('press') &&
    (name.includes('overhead') ||
      name.includes('shoulder') ||
      name.includes('arnold') ||
      name.includes('upright'))
  ) {
    return { category: 'overhead_press', muscle: 'Ombros', color: '#fb923c' };
  }
  if (name.includes('raise') || name.includes('face_pull') || name.includes('pec_deck')) {
    return { category: 'raise', muscle: 'Ombros', color: '#fb923c' };
  }
  if (
    name.includes('plank') ||
    name.includes('crunch') ||
    name.includes('raise') ||
    name.includes('twist') ||
    name.includes('pallof')
  ) {
    return { category: 'core', muscle: 'Core', color: '#f59e0b' };
  }
  if (
    name.includes('bench_press') ||
    name.includes('push_up') ||
    name.includes('crossover') ||
    name.includes('pullover')
  ) {
    return { category: 'bench_press', muscle: 'Peito', color: '#ef4444' };
  }

  // Cardio / Dynamic
  return { category: 'cardio_power', muscle: 'Full Body', color: '#14b8a6' };
};

// Base SVG structure helper with common definitions
const getSvgHeader = (displayName, muscle, color) => `
<svg width="400" height="300" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background Grid -->
    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(232, 200, 74, 0.04)" stroke-width="1"/>
    </pattern>
    <!-- Scanlines -->
    <pattern id="scanlines" width="4" height="4" patternUnits="userSpaceOnUse">
      <rect width="4" height="2" fill="rgba(0,0,0,0.1)"/>
      <rect y="2" width="4" height="2" fill="rgba(255,255,255,0.02)"/>
    </pattern>
    <!-- Glow Filters -->
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="4" result="blur" />
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter id="muscle-glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <!-- Chromatic Aberration -->
    <filter id="glitch">
      <feOffset dx="1" dy="0" in="SourceGraphic" result="red-glitch"/>
      <feOffset dx="-1" dy="0" in="SourceGraphic" result="cyan-glitch"/>
      <feMerge>
        <feMergeNode in="red-glitch"/>
        <feMergeNode in="cyan-glitch"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <style>
    @keyframes radarSpin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes wavePan {
      from { stroke-dashoffset: 0; }
      to { stroke-dashoffset: 40; }
    }
    @keyframes dataFlicker {
      0%, 100% { opacity: 0.8; }
      50% { opacity: 0.4; }
      70% { opacity: 0.9; }
    }
    .radar {
      animation: radarSpin 10s linear infinite;
      transform-origin: 350px 50px;
    }
    .wave {
      animation: wavePan 2s linear infinite;
      stroke-dasharray: 4, 6;
    }
    .flicker {
      animation: dataFlicker 3s random infinite;
    }
  </style>

  <!-- Background Layer -->
  <rect width="100%" height="100%" fill="#080b0f"/>
  <rect width="100%" height="100%" fill="url(#grid)"/>

  <!-- Advanced Data Wave -->
  <path class="wave" d="M 0,280 Q 50,260 100,280 T 200,280 T 300,280 T 400,280" fill="none" stroke="rgba(232, 200, 74, 0.1)" stroke-width="1.5"/>
  <path class="wave" d="M 0,270 Q 50,290 100,270 T 200,270 T 300,270 T 400,270" fill="none" stroke="rgba(56, 189, 248, 0.05)" stroke-width="1"/>

  <!-- Rotating Radar Widget -->
  <g class="radar" opacity="0.3">
    <circle cx="350" cy="50" r="25" fill="none" stroke="#e8c84a" stroke-width="0.5" stroke-dasharray="2,4"/>
    <circle cx="350" cy="50" r="15" fill="none" stroke="#38bdf8" stroke-width="0.5"/>
    <path d="M 350,25 L 350,50 L 375,50" fill="none" stroke="#e8c84a" stroke-width="1"/>
  </g>

  <!-- Glowing UI Frame & Corner Brackets -->
  <rect x="10" y="10" width="380" height="280" rx="12" fill="none" stroke="rgba(232, 200, 74, 0.15)" stroke-width="1.5"/>
  <line x1="20" y1="40" x2="380" y2="40" stroke="rgba(232, 200, 74, 0.15)" stroke-width="1"/>
  
  <!-- Top Left Bracket -->
  <path d="M 25,25 L 15,25 L 15,35" fill="none" stroke="#e8c84a" stroke-width="2"/>
  <!-- Top Right Bracket -->
  <path d="M 375,25 L 385,25 L 385,35" fill="none" stroke="#e8c84a" stroke-width="2"/>
  <!-- Bottom Left Bracket -->
  <path d="M 15,265 L 15,275 L 25,275" fill="none" stroke="#e8c84a" stroke-width="2"/>
  <!-- Bottom Right Bracket -->
  <path d="M 385,265 L 385,275 L 375,275" fill="none" stroke="#e8c84a" stroke-width="2"/>

  <!-- Info Header with Chromatic Glitch -->
  <text x="25" y="30" fill="#eceae4" font-family="'DM Mono', monospace" font-size="12" font-weight="bold" letter-spacing="1" filter="url(#glitch)">${displayName.toUpperCase()}</text>
  <rect x="290" y="18" width="85" height="16" rx="4" fill="rgba(232, 200, 74, 0.1)" stroke="rgba(232, 200, 74, 0.3)" stroke-width="1"/>
  <text x="332" y="30" fill="#e8c84a" font-family="'DM Mono', monospace" font-size="9" font-weight="bold" text-anchor="middle" class="flicker">${muscle.toUpperCase()}</text>

  <!-- Watermark / Cybernetic Grid Details -->
  <text x="25" y="275" fill="rgba(85, 98, 110, 0.7)" font-family="'DM Mono', monospace" font-size="8">FITTRACK ENGINE v7.1 // SIMULADOR KINETIC // AUTO-TRACKING ENEMY</text>
  <text x="350" y="275" fill="rgba(85, 98, 110, 0.7)" font-family="'DM Mono', monospace" font-size="8">SYS.OK</text>
`;

const getSvgFooter = () => `
  <!-- Overlay Scanlines on top of everything -->
  <rect width="100%" height="100%" fill="url(#scanlines)" style="pointer-events:none;mix-blend-mode:overlay;"/>
</svg>
`;

// Templates for categories
const templates = {
  bench_press: (name, muscle, color) => `
  <style>
    @keyframes barMove {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(48px); }
    }
    @keyframes armRight {
      0%, 100% { d: path("M 190,165 L 155,140 L 130,120"); }
      50% { d: path("M 190,165 L 175,185 L 130,168"); }
    }
    @keyframes armLeft {
      0%, 100% { d: path("M 210,165 L 245,140 L 270,120"); }
      50% { d: path("M 210,165 L 225,185 L 270,168"); }
    }
    @keyframes chestGlow {
      0%, 100% { opacity: 0.2; transform: scale(0.9); }
      50% { opacity: 0.95; transform: scale(1.2); }
    }
    .barbell {
      animation: barMove 3s ease-in-out infinite;
    }
    .arm-r {
      animation: armRight 3s ease-in-out infinite;
    }
    .arm-l {
      animation: armLeft 3s ease-in-out infinite;
    }
    .target-muscle {
      animation: chestGlow 3s ease-in-out infinite;
      transform-origin: 200px 165px;
    }
  </style>

  <!-- Bench representation -->
  <rect x="110" y="166" width="180" height="8" rx="3" fill="#1e2832" stroke="rgba(232, 200, 74, 0.3)" stroke-width="1"/>
  <line x1="140" y1="174" x2="140" y2="230" stroke="#1e2832" stroke-width="6"/>
  <line x1="260" y1="174" x2="260" y2="230" stroke="#1e2832" stroke-width="6"/>

  <!-- Stick Figure Lying Down -->
  <!-- Head -->
  <circle cx="160" cy="155" r="10" fill="#eceae4"/>
  <!-- Body/Torso -->
  <line x1="170" y1="165" x2="245" y2="165" stroke="#eceae4" stroke-width="8" stroke-linecap="round"/>
  <!-- Legs -->
  <path d="M 240,165 L 265,185 L 265,230" stroke="#55626e" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>

  <!-- Target Muscle Highlight (Chest) -->
  <circle cx="195" cy="165" r="14" fill="${color}" opacity="0.6" filter="url(#muscle-glow)" class="target-muscle"/>
  <circle cx="205" cy="165" r="14" fill="${color}" opacity="0.6" filter="url(#muscle-glow)" class="target-muscle"/>

  <!-- Arms -->
  <path class="arm-r" fill="none" stroke="#eceae4" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <path class="arm-l" fill="none" stroke="#eceae4" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>

  <!-- Barbell with weights -->
  <g class="barbell" style="transform-origin: 200px 120px;">
    <!-- Bar -->
    <line x1="100" y1="120" x2="300" y2="120" stroke="#eceae4" stroke-width="4"/>
    <!-- Hands holding bar (represented by rings/collars) -->
    <circle cx="130" cy="120" r="3" fill="#e8c84a"/>
    <circle cx="270" cy="120" r="3" fill="#e8c84a"/>
    <!-- Weights Right -->
    <rect x="290" y="100" width="8" height="40" rx="2" fill="#1e2832" stroke="#e8c84a" stroke-width="2"/>
    <rect x="282" y="105" width="8" height="30" rx="2" fill="#1e2832" stroke="#e8c84a" stroke-width="1.5"/>
    <!-- Weights Left -->
    <rect x="102" y="100" width="8" height="40" rx="2" fill="#1e2832" stroke="#e8c84a" stroke-width="2"/>
    <rect x="110" y="105" width="8" height="30" rx="2" fill="#1e2832" stroke="#e8c84a" stroke-width="1.5"/>
  </g>

  <!-- Interactive movement track -->
  <path d="M 200,120 L 200,168" stroke="rgba(232, 200, 74, 0.15)" stroke-dasharray="4,4" stroke-width="1"/>
  `,

  squat: (name, muscle, color) => `
  <style>
    @keyframes squatDown {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(40px); }
    }
    @keyframes legsSquat {
      0%, 100% { d: path("M 200,170 L 195,210 L 200,250"); }
      50% { d: path("M 200,210 L 175,230 L 200,250"); }
    }
    @keyframes quadGlow {
      0%, 100% { opacity: 0.2; }
      50% { opacity: 0.95; }
    }
    .upper-body {
      animation: squatDown 3.2s ease-in-out infinite;
    }
    .legs {
      animation: legsSquat 3.2s ease-in-out infinite;
    }
    .target-muscle {
      animation: quadGlow 3.2s ease-in-out infinite;
    }
  </style>

  <!-- Floor -->
  <line x1="120" y1="250" x2="280" y2="250" stroke="#1e2832" stroke-width="4" stroke-linecap="round"/>

  <!-- Legs -->
  <path class="legs" fill="none" stroke="#eceae4" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>

  <!-- Target Muscle (Quads/Glutes) -->
  <g class="target-muscle" opacity="0.6" filter="url(#muscle-glow)">
    <!-- Quadriceps area -->
    <path class="upper-body" d="M 195,175 L 185,210" stroke="${color}" stroke-width="12" stroke-linecap="round"/>
  </g>

  <!-- Upper Body (Head, Torso, Barbell) -->
  <g class="upper-body">
    <!-- Hips to Shoulder (Torso) -->
    <line x1="200" y1="170" x2="195" y2="120" stroke="#eceae4" stroke-width="8" stroke-linecap="round"/>
    <!-- Head -->
    <circle cx="193" cy="105" r="10" fill="#eceae4"/>
    
    <!-- Barbell on Shoulders -->
    <!-- Bar -->
    <line x1="120" y1="125" x2="270" y2="125" stroke="#55626e" stroke-width="4"/>
    <!-- Plates Right -->
    <rect x="250" y="110" width="8" height="30" rx="2" fill="#1e2832" stroke="#e8c84a" stroke-width="2"/>
    <rect x="258" y="105" width="8" height="40" rx="2" fill="#1e2832" stroke="#e8c84a" stroke-width="1.5"/>
    <!-- Plates Left -->
    <rect x="142" y="110" width="8" height="30" rx="2" fill="#1e2832" stroke="#e8c84a" stroke-width="2"/>
    <rect x="134" y="105" width="8" height="40" rx="2" fill="#1e2832" stroke="#e8c84a" stroke-width="1.5"/>
  </g>

  <!-- Guide line -->
  <line x1="200" y1="100" x2="200" y2="140" stroke="rgba(232, 200, 74, 0.1)" stroke-dasharray="4,4"/>
  `,

  deadlift: (name, muscle, color) => `
  <style>
    @keyframes hingeTorso {
      0%, 100% { transform: rotate(0deg); }
      50% { transform: rotate(45deg); }
    }
    @keyframes hingeBar {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(50px); }
    }
    @keyframes hamGlow {
      0%, 100% { opacity: 0.95; }
      50% { opacity: 0.2; }
    }
    .barbell {
      animation: hingeBar 3.4s ease-in-out infinite;
    }
    .torso-group {
      animation: hingeTorso 3.4s ease-in-out infinite;
    }
    .target-muscle {
      animation: hamGlow 3.4s ease-in-out infinite;
    }
  </style>

  <!-- Floor -->
  <line x1="100" y1="240" x2="300" y2="240" stroke="#1e2832" stroke-width="4" stroke-linecap="round"/>

  <!-- Static Legs -->
  <path d="M 210,185 L 205,210 L 210,240" fill="none" stroke="#eceae4" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>

  <!-- Target Muscle Highlight (Hamstrings / Lower Back) -->
  <path class="target-muscle" d="M 210,185 L 205,210" stroke="${color}" stroke-width="10" stroke-linecap="round" opacity="0.6" filter="url(#muscle-glow)"/>

  <!-- Hinge Group (Pivot at Hips 210,185) -->
  <g class="torso-group" style="transform-origin: 210px 185px;">
    <!-- Torso -->
    <line x1="210" y1="185" x2="210" y2="120" stroke="#eceae4" stroke-width="8" stroke-linecap="round"/>
    <!-- Head -->
    <circle cx="210" cy="105" r="10" fill="#eceae4"/>
    <!-- Arms reaching down to bar -->
    <line x1="210" y1="130" x2="190" y2="185" stroke="#eceae4" stroke-width="4" stroke-linecap="round"/>
  </g>

  <!-- Barbell translating vertically -->
  <g class="barbell" style="transform-origin: 190px 185px;">
    <!-- Bar -->
    <line x1="110" y1="185" x2="270" y2="185" stroke="#55626e" stroke-width="4"/>
    <!-- Weight plates -->
    <rect x="250" y="165" width="8" height="40" rx="2" fill="#1e2832" stroke="#e8c84a" stroke-width="2"/>
    <rect x="258" y="170" width="6" height="30" rx="2" fill="#1e2832" stroke="#e8c84a" stroke-width="1.5"/>
    <rect x="132" y="165" width="8" height="40" rx="2" fill="#1e2832" stroke="#e8c84a" stroke-width="2"/>
    <rect x="126" y="170" width="6" height="30" rx="2" fill="#1e2832" stroke="#e8c84a" stroke-width="1.5"/>
  </g>
  `,

  row: (name, muscle, color) => `
  <style>
    @keyframes armRow {
      0%, 100% { d: path("M 195,145 L 195,200"); }
      50% { d: path("M 195,145 L 210,160 L 220,145"); }
    }
    @keyframes barRow {
      0%, 100% { transform: translateY(50px); }
      50% { transform: translateY(0px); }
    }
    @keyframes latsGlow {
      0%, 100% { opacity: 0.2; }
      50% { opacity: 0.95; }
    }
    .barbell {
      animation: barRow 2.8s ease-in-out infinite;
    }
    .arms {
      animation: armRow 2.8s ease-in-out infinite;
    }
    .target-muscle {
      animation: latsGlow 2.8s ease-in-out infinite;
    }
  </style>

  <!-- Floor -->
  <line x1="120" y1="240" x2="280" y2="240" stroke="#1e2832" stroke-width="4" stroke-linecap="round"/>

  <!-- Figure Bent Over (Static) -->
  <!-- Legs -->
  <path d="M 180,170 L 175,200 L 180,240" fill="none" stroke="#55626e" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <!-- Hips to Shoulder (Bent Torso) -->
  <line x1="180" y1="170" x2="225" y2="145" stroke="#eceae4" stroke-width="7" stroke-linecap="round"/>
  <!-- Head -->
  <circle cx="238" cy="140" r="9" fill="#eceae4"/>

  <!-- Target Muscle (Lats/Back) -->
  <line x1="190" y1="165" x2="215" y2="150" stroke="${color}" stroke-width="12" stroke-linecap="round" class="target-muscle" opacity="0.6" filter="url(#muscle-glow)"/>

  <!-- Moving Arms -->
  <path class="arms" fill="none" stroke="#eceae4" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>

  <!-- Barbell/Dumbbell -->
  <g class="barbell" style="transform-origin: 195px 150px;">
    <!-- Bar -->
    <line x1="120" y1="145" x2="270" y2="145" stroke="#55626e" stroke-width="3"/>
    <!-- Plates -->
    <circle cx="130" cy="145" r="12" fill="#1e2832" stroke="#e8c84a" stroke-width="2"/>
    <circle cx="260" cy="145" r="12" fill="#1e2832" stroke="#e8c84a" stroke-width="2"/>
  </g>
  `,

  pulldown: (name, muscle, color) => `
  <style>
    @keyframes barPull {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(45px); }
    }
    @keyframes armsPull {
      0%, 100% { d: path("M 175,150 L 175,85 L 140,75"); }
      50% { d: path("M 175,150 L 160,130 L 140,120"); }
    }
    @keyframes backGlow {
      0%, 100% { opacity: 0.2; }
      50% { opacity: 0.95; }
    }
    .pulldown-bar {
      animation: barPull 3s ease-in-out infinite;
    }
    .arms {
      animation: armsPull 3s ease-in-out infinite;
    }
    .target-muscle {
      animation: backGlow 3s ease-in-out infinite;
    }
  </style>

  <!-- Seat/Bench -->
  <line x1="140" y1="220" x2="220" y2="220" stroke="#1e2832" stroke-width="4" stroke-linecap="round"/>
  <line x1="180" y1="220" x2="180" y2="260" stroke="#1e2832" stroke-width="6"/>

  <!-- Torso (Static Seated) -->
  <line x1="175" y1="220" x2="175" y2="150" stroke="#eceae4" stroke-width="8" stroke-linecap="round"/>
  <circle cx="175" cy="135" r="9" fill="#eceae4"/>
  <!-- Legs -->
  <path d="M 175,220 L 205,210 L 205,255" fill="none" stroke="#55626e" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>

  <!-- Target Muscle (Lats/Costas) -->
  <line x1="175" y1="190" x2="175" y2="160" stroke="${color}" stroke-width="12" stroke-linecap="round" class="target-muscle" opacity="0.6" filter="url(#muscle-glow)"/>

  <!-- Arms (Pulling) -->
  <path class="arms" fill="none" stroke="#eceae4" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>

  <!-- Barbell Pulldown Bar -->
  <g class="pulldown-bar" style="transform-origin: 200px 75px;">
    <!-- Cable -->
    <line x1="200" y1="30" x2="200" y2="75" stroke="#55626e" stroke-width="1.5" stroke-dasharray="3,3"/>
    <!-- Bar -->
    <path d="M 110,70 L 130,75 L 270,75 L 290,70" fill="none" stroke="#eceae4" stroke-width="3" stroke-linejoin="round"/>
    <circle cx="110" cy="70" r="2.5" fill="#e8c84a"/>
    <circle cx="290" cy="70" r="2.5" fill="#e8c84a"/>
  </g>
  `,

  overhead_press: (name, muscle, color) => `
  <style>
    @keyframes overheadPress {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-55px); }
    }
    @keyframes shoulderArm {
      0%, 100% { d: path("M 185,130 L 165,145 L 150,135"); }
      50% { d: path("M 185,130 L 175,100 L 150,80"); }
    }
    @keyframes shoulderGlow {
      0%, 100% { opacity: 0.3; }
      50% { opacity: 0.95; }
    }
    .press-bar {
      animation: overheadPress 2.9s ease-in-out infinite;
    }
    .arms {
      animation: shoulderArm 2.9s ease-in-out infinite;
    }
    .target-muscle {
      animation: shoulderGlow 2.9s ease-in-out infinite;
    }
  </style>

  <!-- Floor -->
  <line x1="120" y1="250" x2="280" y2="250" stroke="#1e2832" stroke-width="4" stroke-linecap="round"/>

  <!-- Standing Body (Static) -->
  <!-- Legs -->
  <path d="M 185,190 L 180,250 M 215,190 L 220,250" fill="none" stroke="#55626e" stroke-width="4" stroke-linecap="round"/>
  <!-- Torso -->
  <line x1="200" y1="190" x2="200" y2="130" stroke="#eceae4" stroke-width="8" stroke-linecap="round"/>
  <!-- Head -->
  <circle cx="200" cy="115" r="9" fill="#eceae4"/>

  <!-- Target Muscle (Deltoids/Shoulders) -->
  <circle cx="185" cy="130" r="8" fill="${color}" opacity="0.6" filter="url(#muscle-glow)" class="target-muscle"/>
  <circle cx="215" cy="130" r="8" fill="${color}" opacity="0.6" filter="url(#muscle-glow)" class="target-muscle"/>

  <!-- Arms -->
  <path class="arms" fill="none" stroke="#eceae4" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>

  <!-- Barbell -->
  <g class="press-bar" style="transform-origin: 200px 135px;">
    <!-- Bar -->
    <line x1="120" y1="135" x2="280" y2="135" stroke="#eceae4" stroke-width="3"/>
    <!-- Plates -->
    <rect x="260" y="120" width="8" height="30" rx="2" fill="#1e2832" stroke="#e8c84a" stroke-width="2"/>
    <rect x="132" y="120" width="8" height="30" rx="2" fill="#1e2832" stroke="#e8c84a" stroke-width="2"/>
  </g>
  `,

  curl: (name, muscle, color) => `
  <style>
    @keyframes curlMove {
      0%, 100% { transform: rotate(0deg); }
      50% { transform: rotate(-100deg); }
    }
    @keyframes bicepPulse {
      0%, 100% { opacity: 0.2; transform: scaleY(0.9); }
      50% { opacity: 0.95; transform: scaleY(1.3); }
    }
    .forearm-group {
      animation: curlMove 2.6s ease-in-out infinite;
    }
    .target-muscle {
      animation: bicepPulse 2.6s ease-in-out infinite;
      transform-origin: 175px 130px;
    }
  </style>

  <!-- Floor -->
  <line x1="120" y1="250" x2="280" y2="250" stroke="#1e2832" stroke-width="4" stroke-linecap="round"/>

  <!-- Figure Standing Profile (Static) -->
  <!-- Legs -->
  <path d="M 160,180 L 155,250" fill="none" stroke="#55626e" stroke-width="4" stroke-linecap="round"/>
  <!-- Torso -->
  <line x1="165" y1="180" x2="165" y2="120" stroke="#eceae4" stroke-width="8" stroke-linecap="round"/>
  <!-- Head -->
  <circle cx="165" cy="105" r="9" fill="#eceae4"/>
  <!-- Upper Arm (Static) -->
  <line x1="175" y1="125" x2="175" y2="165" stroke="#eceae4" stroke-width="5" stroke-linecap="round"/>

  <!-- Target Muscle (Biceps) -->
  <path class="target-muscle" d="M 175,130 L 182,150" stroke="${color}" stroke-width="10" stroke-linecap="round" opacity="0.6" filter="url(#muscle-glow)"/>

  <!-- Forearm (Rotating from Elbow 175, 165) -->
  <g class="forearm-group" style="transform-origin: 175px 165px;">
    <!-- Forearm -->
    <line x1="175" y1="165" x2="175" y2="215" stroke="#eceae4" stroke-width="4.5" stroke-linecap="round"/>
    <!-- Dumbbell -->
    <g transform="translate(175, 215)">
      <!-- Dumbbell Handle -->
      <line x1="-15" y1="0" x2="15" y2="0" stroke="#55626e" stroke-width="3"/>
      <!-- Dumbbell Plates -->
      <circle cx="-12" cy="0" r="10" fill="#1e2832" stroke="#e8c84a" stroke-width="1.5"/>
      <circle cx="12" cy="0" r="10" fill="#1e2832" stroke="#e8c84a" stroke-width="1.5"/>
    </g>
  </g>
  `,

  extension: (name, muscle, color) => `
  <style>
    @keyframes extMove {
      0%, 100% { transform: rotate(0deg); }
      50% { transform: rotate(95deg); }
    }
    @keyframes tricepPulse {
      0%, 100% { opacity: 0.95; }
      50% { opacity: 0.2; }
    }
    .forearm-group {
      animation: extMove 2.7s ease-in-out infinite;
    }
    .target-muscle {
      animation: tricepPulse 2.7s ease-in-out infinite;
    }
  </style>

  <!-- Floor -->
  <line x1="120" y1="250" x2="280" y2="250" stroke="#1e2832" stroke-width="4" stroke-linecap="round"/>

  <!-- Figure standing profile -->
  <line x1="150" y1="180" x2="150" y2="250" stroke="#55626e" stroke-width="4"/>
  <!-- Torso -->
  <line x1="155" y1="180" x2="155" y2="120" stroke="#eceae4" stroke-width="8" stroke-linecap="round"/>
  <circle cx="155" cy="105" r="9" fill="#eceae4"/>
  <!-- Upper Arm (Forward and elevated for pushdowns) -->
  <line x1="165" y1="125" x2="185" y2="145" stroke="#eceae4" stroke-width="5" stroke-linecap="round"/>

  <!-- Target Muscle (Triceps) -->
  <path class="target-muscle" d="M 160,128 L 175,140" stroke="${color}" stroke-width="9" stroke-linecap="round" opacity="0.6" filter="url(#muscle-glow)"/>

  <!-- Forearm (Rotating at elbow 185, 145) -->
  <g class="forearm-group" style="transform-origin: 185px 145px;">
    <line x1="185" y1="145" x2="145" y2="175" stroke="#eceae4" stroke-width="4" stroke-linecap="round"/>
    <!-- Dumbbell / Handle -->
    <circle cx="145" cy="175" r="5" fill="#e8c84a" filter="url(#glow)"/>
    <line x1="145" y1="175" x2="145" y2="140" stroke="rgba(232, 200, 74, 0.2)" stroke-dasharray="3,3"/>
  </g>
  `,

  raise: (name, muscle, color) => `
  <style>
    @keyframes raiseMoveRight {
      0%, 100% { transform: rotate(0deg); }
      50% { transform: rotate(-80deg); }
    }
    @keyframes raiseMoveLeft {
      0%, 100% { transform: rotate(0deg); }
      50% { transform: rotate(80deg); }
    }
    @keyframes deltPulse {
      0%, 100% { opacity: 0.2; }
      50% { opacity: 0.95; }
    }
    .arm-right {
      animation: raiseMoveRight 2.8s ease-in-out infinite;
    }
    .arm-left {
      animation: raiseMoveLeft 2.8s ease-in-out infinite;
    }
    .target-muscle {
      animation: deltPulse 2.8s ease-in-out infinite;
    }
  </style>

  <!-- Floor -->
  <line x1="120" y1="250" x2="280" y2="250" stroke="#1e2832" stroke-width="4"/>

  <!-- Figure Standing Front (Static) -->
  <path d="M 185,180 L 180,250 M 215,180 L 220,250" fill="none" stroke="#55626e" stroke-width="4"/>
  <line x1="200" y1="180" x2="200" y2="120" stroke="#eceae4" stroke-width="8" stroke-linecap="round"/>
  <circle cx="200" cy="105" r="9" fill="#eceae4"/>

  <!-- Target Muscle (Deltoids) -->
  <circle cx="185" cy="122" r="8" fill="${color}" opacity="0.6" filter="url(#muscle-glow)" class="target-muscle"/>
  <circle cx="215" cy="122" r="8" fill="${color}" opacity="0.6" filter="url(#muscle-glow)" class="target-muscle"/>

  <!-- Right Arm (Pivot at shoulder 185, 122) -->
  <g class="arm-right" style="transform-origin: 185px 122px;">
    <line x1="185" y1="122" x2="185" y2="175" stroke="#eceae4" stroke-width="4.5" stroke-linecap="round"/>
    <circle cx="185" cy="178" r="6" fill="#1e2832" stroke="#e8c84a" stroke-width="1.5"/>
  </g>

  <!-- Left Arm (Pivot at shoulder 215, 122) -->
  <g class="arm-left" style="transform-origin: 215px 122px;">
    <line x1="215" y1="122" x2="215" y2="175" stroke="#eceae4" stroke-width="4.5" stroke-linecap="round"/>
    <circle cx="215" cy="178" r="6" fill="#1e2832" stroke="#e8c84a" stroke-width="1.5"/>
  </g>
  `,

  core: (name, muscle, color) => `
  <style>
    @keyframes crunchBody {
      0%, 100% { transform: rotate(0deg); }
      50% { transform: rotate(-25deg); }
    }
    @keyframes absPulse {
      0%, 100% { opacity: 0.2; }
      50% { opacity: 0.95; }
    }
    .crunch-torso {
      animation: crunchBody 3s ease-in-out infinite;
    }
    .target-muscle {
      animation: absPulse 3s ease-in-out infinite;
    }
  </style>

  <!-- Mat / Floor -->
  <line x1="100" y1="220" x2="300" y2="220" stroke="#1e2832" stroke-width="4" stroke-linecap="round"/>

  <!-- Hips and Legs (Static) -->
  <!-- Hips -->
  <circle cx="180" cy="205" r="8" fill="#55626e"/>
  <!-- Legs -->
  <path d="M 180,205 L 210,185 L 240,218" fill="none" stroke="#55626e" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>

  <!-- Torso & Head (Flexing from hips 180, 205) -->
  <g class="crunch-torso" style="transform-origin: 180px 205px;">
    <!-- Spine -->
    <line x1="180" y1="205" x2="130" y2="170" stroke="#eceae4" stroke-width="7" stroke-linecap="round"/>
    <!-- Head -->
    <circle cx="115" cy="160" r="9" fill="#eceae4"/>
    <!-- Arms crossed on chest -->
    <path d="M 140,177 Q 125,182 135,190" fill="none" stroke="#eceae4" stroke-width="3" stroke-linecap="round"/>

    <!-- Target Muscle (Abs/Core) -->
    <path class="target-muscle" d="M 175,200 L 140,175" stroke="${color}" stroke-width="10" stroke-linecap="round" opacity="0.6" filter="url(#muscle-glow)"/>
  </g>
  `,

  cardio_power: (name, muscle, color) => `
  <style>
    @keyframes kbSwing {
      0%, 100% { transform: rotate(-40deg); }
      50% { transform: rotate(50deg); }
    }
    @keyframes figureMotion {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(8px) rotate(10deg); }
    }
    @keyframes energyWave {
      0% { stroke-dashoffset: 0; }
      100% { stroke-dashoffset: -40; }
    }
    .swing-arm {
      animation: kbSwing 2.5s ease-in-out infinite;
    }
    .body-swing {
      animation: figureMotion 2.5s ease-in-out infinite;
    }
    .energy-path {
      stroke-dasharray: 8, 8;
      animation: energyWave 1.5s linear infinite;
    }
  </style>

  <!-- Floor -->
  <line x1="100" y1="240" x2="300" y2="240" stroke="#1e2832" stroke-width="4"/>

  <!-- Figure (Body Swing Pivot at Feet 170, 240) -->
  <g class="body-swing" style="transform-origin: 170px 240px;">
    <!-- Legs -->
    <path d="M 170,240 L 160,205 L 180,180" fill="none" stroke="#55626e" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    <!-- Torso -->
    <line x1="180" y1="180" x2="200" y2="130" stroke="#eceae4" stroke-width="8" stroke-linecap="round"/>
    <circle cx="205" cy="115" r="9" fill="#eceae4"/>

    <!-- Swing Arm (Pivot at shoulder 195, 135) -->
    <g class="swing-arm" style="transform-origin: 195px 135px;">
      <!-- Arm -->
      <line x1="195" y1="135" x2="250" y2="135" stroke="#eceae4" stroke-width="4" stroke-linecap="round"/>
      <!-- Kettlebell / Weight -->
      <circle cx="260" cy="135" r="10" fill="#1e2832" stroke="#e8c84a" stroke-width="2" filter="url(#glow)"/>
      <path d="M 250,135 Q 260,123 270,135" fill="none" stroke="#e8c84a" stroke-width="2"/>
    </g>
  </g>

  <!-- Dynamic Energy Flow representation -->
  <path class="energy-path" d="M 150,120 Q 230,80 310,140" fill="none" stroke="${color}" stroke-width="2" opacity="0.6" filter="url(#glow)"/>
  `,
};

// Generate directory
if (!fs.existsSync(IMG_DIR)) {
  fs.mkdirSync(IMG_DIR, { recursive: true });
}

let createdCount = 0;

for (const name of exercises) {
  const meta = getExerciseMeta(name);
  const displayName = formatName(name);
  const templateFn = templates[meta.category];

  if (!templateFn) {
    console.error(`Missing template for category: ${meta.category}`);
    continue;
  }

  const svgContent =
    getSvgHeader(displayName, meta.muscle, meta.color) +
    templateFn(name, meta.muscle, meta.color) +
    getSvgFooter();

  const fileName = `${name}.svg`;
  const filePath = path.join(IMG_DIR, fileName);

  fs.writeFileSync(filePath, svgContent.trim());
  createdCount++;
}

console.log(
  `Successfully generated ${createdCount} animated exercise SVGs inside public/assets/exercises/images/`,
);
