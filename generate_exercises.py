import json

exercises = [
    # Peito
    {"name": "Barbell Bench Press", "muscle": "Peito", "category": "compound_multi", "equipment": "Barra"},
    {"name": "Barbell Incline Bench Press", "muscle": "Peito", "category": "compound_multi", "equipment": "Barra"},
    {"name": "Dumbbell Bench Press", "muscle": "Peito", "category": "compound_multi", "equipment": "Halteres"},
    {"name": "Dumbbell Incline Bench Press", "muscle": "Peito", "category": "compound_multi", "equipment": "Halteres"},
    {"name": "Decline Bench Press", "muscle": "Peito", "category": "compound_multi", "equipment": "Barra"},
    {"name": "Close-Grip Bench Press", "muscle": "Peito", "category": "compound_multi", "equipment": "Barra"},
    {"name": "Cable Crossover", "muscle": "Peito", "category": "isolation_uni", "equipment": "Máquina de Cabos"},
    {"name": "Dumbbell Pullover", "muscle": "Peito", "category": "isolation_multi", "equipment": "Halteres"},

    # Costas
    {"name": "Barbell Bent Over Row", "muscle": "Costas", "category": "compound_multi", "equipment": "Barra"},
    {"name": "Dumbbell Row", "muscle": "Costas", "category": "compound_multi", "equipment": "Halteres"},
    {"name": "Single-Arm Dumbbell Row", "muscle": "Costas", "category": "compound_multi", "equipment": "Halteres"},
    {"name": "Cable Lat Pulldown Wide-Grip", "muscle": "Costas", "category": "compound_uni", "equipment": "Máquina de Cabos"},
    {"name": "Close-Grip Pulldown", "muscle": "Costas", "category": "compound_uni", "equipment": "Máquina de Cabos"},
    {"name": "Pull-Up", "muscle": "Costas", "category": "bodyweight", "equipment": "PesoCorporal"},
    {"name": "Chin-Up", "muscle": "Costas", "category": "bodyweight", "equipment": "PesoCorporal"},
    {"name": "Seated Cable Row", "muscle": "Costas", "category": "compound_uni", "equipment": "Máquina de Cabos"},
    {"name": "T-Bar Row", "muscle": "Costas", "category": "compound_multi", "equipment": "Barra"},
    {"name": "Rack Pull", "muscle": "Costas", "category": "compound_multi", "equipment": "Barra"},

    # Pernas
    {"name": "Barbell Back Squat", "muscle": "Pernas", "category": "compound_multi", "equipment": "Barra"},
    {"name": "Front Squat", "muscle": "Pernas", "category": "compound_multi", "equipment": "Barra"},
    {"name": "Goblet Squat", "muscle": "Pernas", "category": "compound_multi", "equipment": "Halteres"},
    {"name": "Barbell Deadlift", "muscle": "Pernas", "category": "compound_multi", "equipment": "Barra"},
    {"name": "Romanian Deadlift", "muscle": "Pernas", "category": "compound_multi", "equipment": "Barra"},
    {"name": "Sumo Deadlift", "muscle": "Pernas", "category": "compound_multi", "equipment": "Barra"},
    {"name": "Machine Leg Press", "muscle": "Pernas", "category": "compound_uni", "equipment": "Máquinas"},
    {"name": "Leg Extension", "muscle": "Pernas", "category": "isolation_uni", "equipment": "Máquinas"},
    {"name": "Lying Leg Curl", "muscle": "Pernas", "category": "isolation_uni", "equipment": "Máquinas"},
    {"name": "Seated Leg Curl", "muscle": "Pernas", "category": "isolation_uni", "equipment": "Máquinas"},
    {"name": "Hip Thrust", "muscle": "Pernas", "category": "compound_multi", "equipment": "Barra"},
    {"name": "Lunge", "muscle": "Pernas", "category": "compound_multi", "equipment": "PesoCorporal"},
    {"name": "Bulgarian Split Squat", "muscle": "Pernas", "category": "compound_multi", "equipment": "Halteres"},
    {"name": "Standing Calf Raise", "muscle": "Pernas", "category": "isolation_uni", "equipment": "Máquinas"},
    {"name": "Seated Calf Raise", "muscle": "Pernas", "category": "isolation_uni", "equipment": "Máquinas"},
    {"name": "Box Jump", "muscle": "Pernas", "category": "bodyweight", "equipment": "PesoCorporal"},

    # Ombros
    {"name": "Barbell Overhead Press", "muscle": "Ombros", "category": "compound_multi", "equipment": "Barra"},
    {"name": "Dumbbell Shoulder Press", "muscle": "Ombros", "category": "compound_multi", "equipment": "Halteres"},
    {"name": "Arnold Press", "muscle": "Ombros", "category": "compound_multi", "equipment": "Halteres"},
    {"name": "Dumbbell Lateral Raise", "muscle": "Ombros", "category": "isolation_uni", "equipment": "Halteres"},
    {"name": "Front Raise", "muscle": "Ombros", "category": "isolation_uni", "equipment": "Halteres"},
    {"name": "Face Pull", "muscle": "Ombros", "category": "isolation_uni", "equipment": "Máquina de Cabos"},
    {"name": "Upright Row", "muscle": "Ombros", "category": "compound_multi", "equipment": "Barra"},
    {"name": "Reverse Pec Deck", "muscle": "Ombros", "category": "isolation_uni", "equipment": "Máquinas"},
    {"name": "Barbell Shrug", "muscle": "Ombros", "category": "isolation_uni", "equipment": "Barra"},

    # Braços
    {"name": "Barbell Bicep Curl", "muscle": "Braços", "category": "isolation_multi", "equipment": "Barra"},
    {"name": "Alternating Dumbbell Curl", "muscle": "Braços", "category": "isolation_multi", "equipment": "Halteres"},
    {"name": "Hammer Curl", "muscle": "Braços", "category": "isolation_multi", "equipment": "Halteres"},
    {"name": "Concentration Curl", "muscle": "Braços", "category": "isolation_multi", "equipment": "Halteres"},
    {"name": "Preacher Curl", "muscle": "Braços", "category": "isolation_multi", "equipment": "Máquinas"},
    {"name": "Cable Rope Tricep Pushdown", "muscle": "Braços", "category": "isolation_multi", "equipment": "Máquina de Cabos"},
    {"name": "Skull Crusher", "muscle": "Braços", "category": "isolation_multi", "equipment": "Barra"},
    {"name": "Triceps Pushdown", "muscle": "Braços", "category": "isolation_multi", "equipment": "Máquina de Cabos"},
    {"name": "Overhead Triceps Extension", "muscle": "Braços", "category": "isolation_multi", "equipment": "Halteres"},
    {"name": "Diamond Push-Up", "muscle": "Braços", "category": "bodyweight", "equipment": "PesoCorporal"},
    {"name": "Bench Dip", "muscle": "Braços", "category": "bodyweight", "equipment": "PesoCorporal"},

    # Abdómen / Core
    {"name": "Plank", "muscle": "Core", "category": "bodyweight", "equipment": "PesoCorporal"},
    {"name": "Side Plank", "muscle": "Core", "category": "bodyweight", "equipment": "PesoCorporal"},
    {"name": "Crunch", "muscle": "Core", "category": "bodyweight", "equipment": "PesoCorporal"},
    {"name": "Cable Crunch", "muscle": "Core", "category": "isolation_multi", "equipment": "Máquina de Cabos"},
    {"name": "Hanging Leg Raise", "muscle": "Core", "category": "bodyweight", "equipment": "PesoCorporal"},
    {"name": "Russian Twist", "muscle": "Core", "category": "bodyweight", "equipment": "PesoCorporal"},
    {"name": "Pallof Press", "muscle": "Core", "category": "isolation_multi", "equipment": "Máquina de Cabos"},
    {"name": "Lying Leg Raise", "muscle": "Core", "category": "bodyweight", "equipment": "PesoCorporal"},

    # Funcionais e Peso Corporal
    {"name": "Push-Up", "muscle": "Peito", "category": "bodyweight", "equipment": "PesoCorporal"},
    {"name": "Burpee", "muscle": "Full Body", "category": "bodyweight", "equipment": "PesoCorporal"},
    {"name": "Dips", "muscle": "Tríceps", "category": "bodyweight", "equipment": "PesoCorporal"},
    {"name": "Kettlebell Swing", "muscle": "Pernas", "category": "compound_multi", "equipment": "Kettlebell"},
    {"name": "Power Clean", "muscle": "Full Body", "category": "compound_multi", "equipment": "Barra"},
    {"name": "Jump Squat", "muscle": "Pernas", "category": "bodyweight", "equipment": "PesoCorporal"},
    {"name": "Box Step-Up", "muscle": "Pernas", "category": "bodyweight", "equipment": "PesoCorporal"},

    # Full Body / Compostos Adicionais
    {"name": "Clean and Jerk", "muscle": "Full Body", "category": "compound_multi", "equipment": "Barra"},
    {"name": "Snatch", "muscle": "Full Body", "category": "compound_multi", "equipment": "Barra"},
    {"name": "Thruster", "muscle": "Full Body", "category": "compound_multi", "equipment": "Barra"},
    {"name": "Farmers Walk", "muscle": "Full Body", "category": "compound_multi", "equipment": "Halteres"},
    {"name": "Sled Push", "muscle": "Full Body", "category": "compound_uni", "equipment": "Máquinas"},
    {"name": "Medicine Ball Slam", "muscle": "Full Body", "category": "compound_multi", "equipment": "Bola medicinal"},
    {"name": "Battle Ropes", "muscle": "Full Body", "category": "compound_multi", "equipment": "Outros"},
    {"name": "Sandbag Carry", "muscle": "Full Body", "category": "compound_multi", "equipment": "Outros"}
]

# Create src/data/exerciseDB.ts
db_content = "export const EXERCISE_DB: Record<string, any> = {\\n"
for ex in exercises:
    sets = 4 if ex['category'] in ['compound_multi', 'compound_uni', 'bodyweight'] else 3
    reps = 10
    db_content += f"""  "{ex['name']}": {{ muscle: "{ex['muscle']}", equipment: "{ex['equipment']}", base: {{ hipertrofia: [{sets}, {reps - 2}, {reps + 2}] }} }},\\n"""
db_content += "};\\n"

with open("src/data/exerciseDB.ts", "w") as f:
    f.write(db_content)

# Create src/data/exerciseClassifier.ts
classifier_content = """import { EXERCISE_DB } from './exerciseDB';

export type ExerciseCategory = 'compound_multi' | 'compound_uni' | 'isolation_multi' | 'isolation_uni' | 'bodyweight';

export const exerciseCategoryMap: Record<string, ExerciseCategory> = {\\n"""
for ex in exercises:
    classifier_content += f"""  "{ex['name']}": "{ex['category']}",\\n"""
classifier_content += "};\\n\\n"
classifier_content += """export function getExerciseCategory(exerciseName: string): ExerciseCategory {
  return exerciseCategoryMap[exerciseName] || 'isolation_uni';
}
"""

with open("src/data/exerciseClassifier.ts", "w") as f:
    f.write(classifier_content)

# Create src/data/exerciseMedia.ts
media_content = """export interface ExerciseMedia {
  imageUrl: string;
  gifUrl?: string;
  videoUrl?: string;
  instructions: string;
  tips: string[];
  muscleGroups: string[];
}

const getLocalImage = (name: string) => `/assets/exercises/images/${name.toLowerCase().replace(/ /g, '_')}.jpg`;
const getLocalGif = (name: string) => `/assets/exercises/gifs/${name.toLowerCase().replace(/ /g, '_')}.gif`;

export const exerciseMediaMap: Record<string, ExerciseMedia> = {\\n"""

for ex in exercises:
    media_content += f"""  '{ex['name']}': {{
    imageUrl: getLocalImage('{ex['name']}'),
    gifUrl: getLocalGif('{ex['name']}'),
    instructions: 'Mantenha a postura e contraia os músculos do {ex['muscle'].lower()}. Execute o movimento de forma controlada.',
    tips: ['Mantenha a respiração estável', 'Foque na fase excêntrica', 'Não compense com outros músculos'],
    muscleGroups: ['{ex['muscle']}']
  }},\\n"""

media_content += """};

const placeholderSvg = `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMDgwYjBmMjIiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZmlsbD0iI2U4Yzg0YSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIj7wn4+L7b+9IFNlbSBJbWFnZW08L3RleHQ+PC9zdmc+`;

export function getExerciseMedia(exerciseName: string): ExerciseMedia {
  const name = exerciseName.toLowerCase();
  const exactMatchKey = Object.keys(exerciseMediaMap).find(k => k.toLowerCase() === name);
  if (exactMatchKey) return exerciseMediaMap[exactMatchKey];
  
  const partialMatchKey = Object.keys(exerciseMediaMap).find(k => k.toLowerCase().includes(name) || name.includes(k.toLowerCase()));
  if (partialMatchKey) return exerciseMediaMap[partialMatchKey];

  return {
    imageUrl: placeholderSvg,
    instructions: 'Instruções completas ainda não registadas.',
    tips: ['Mantenha a forma correta'],
    muscleGroups: ['Vários'],
  };
}
"""

with open("src/data/exerciseMedia.ts", "w") as f:
    f.write(media_content)

# Create scripts/downloadExerciseMedia.js
import os
os.makedirs("scripts", exist_ok=True)

script_content = """import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const EXERCISES = [\\n"""
for ex in exercises:
    script_content += f"""  "{ex['name']}",\\n"""
script_content += """];

const IMG_DIR = path.join(__dirname, '../public/assets/exercises/images');
const GIF_DIR = path.join(__dirname, '../public/assets/exercises/gifs');

// Garante que as pastas existem
[IMG_DIR, GIF_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

async function downloadFile(url, outputPath) {
  const writer = fs.createWriteStream(outputPath);
  const response = await axios({ url, method: 'GET', responseType: 'stream' });
  response.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

async function main() {
  for (const ex of EXERCISES) {
    const safeName = ex.toLowerCase().replace(/ /g, '_');
    const imgPath = path.join(IMG_DIR, `${safeName}.jpg`);
    
    if (!fs.existsSync(imgPath)) {
      const unsplashUrl = `https://source.unsplash.com/400x300/?fitness,${encodeURIComponent(ex)}`;
      try {
        await downloadFile(unsplashUrl, imgPath);
        console.log(`[+] Imagem baixada: ${safeName}.jpg`);
      } catch (err) {
        console.log(`[-] Falha ao baixar imagem: ${safeName}. Crie um placeholder vazio.`);
        fs.writeFileSync(imgPath, '');
      }
    }
  }
  console.log("Download de imagens concluído. Para GIFs, forneça as suas próprias animações em public/assets/exercises/gifs/");
}

main().catch(console.error);
"""

with open("scripts/downloadExerciseMedia.js", "w") as f:
    f.write(script_content)

print("Files generated successfully.")
