import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const EXERCISES = [
  "Barbell Bench Press",
  "Barbell Incline Bench Press",
  "Dumbbell Bench Press",
  "Dumbbell Incline Bench Press",
  "Decline Bench Press",
  "Close-Grip Bench Press",
  "Cable Crossover",
  "Dumbbell Pullover",
  "Barbell Bent Over Row",
  "Dumbbell Row",
  "Single-Arm Dumbbell Row",
  "Cable Lat Pulldown Wide-Grip",
  "Close-Grip Pulldown",
  "Pull-Up",
  "Chin-Up",
  "Seated Cable Row",
  "T-Bar Row",
  "Rack Pull",
  "Barbell Back Squat",
  "Front Squat",
  "Goblet Squat",
  "Barbell Deadlift",
  "Romanian Deadlift",
  "Sumo Deadlift",
  "Machine Leg Press",
  "Leg Extension",
  "Lying Leg Curl",
  "Seated Leg Curl",
  "Hip Thrust",
  "Lunge",
  "Bulgarian Split Squat",
  "Standing Calf Raise",
  "Seated Calf Raise",
  "Box Jump",
  "Barbell Overhead Press",
  "Dumbbell Shoulder Press",
  "Arnold Press",
  "Dumbbell Lateral Raise",
  "Front Raise",
  "Face Pull",
  "Upright Row",
  "Reverse Pec Deck",
  "Barbell Shrug",
  "Barbell Bicep Curl",
  "Alternating Dumbbell Curl",
  "Hammer Curl",
  "Concentration Curl",
  "Preacher Curl",
  "Cable Rope Tricep Pushdown",
  "Skull Crusher",
  "Triceps Pushdown",
  "Overhead Triceps Extension",
  "Diamond Push-Up",
  "Bench Dip",
  "Plank",
  "Side Plank",
  "Crunch",
  "Cable Crunch",
  "Hanging Leg Raise",
  "Russian Twist",
  "Pallof Press",
  "Lying Leg Raise",
  "Push-Up",
  "Burpee",
  "Dips",
  "Kettlebell Swing",
  "Power Clean",
  "Jump Squat",
  "Box Step-Up",
  "Clean and Jerk",
  "Snatch",
  "Thruster",
  "Farmers Walk",
  "Sled Push",
  "Medicine Ball Slam",
  "Battle Ropes",
  "Sandbag Carry",
];

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
