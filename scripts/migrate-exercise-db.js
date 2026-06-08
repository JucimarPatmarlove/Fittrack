import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, '../src/data/exerciseDB.ts');

let content = fs.readFileSync(dbPath, 'utf8');

// Função para inferir valores padrão baseados no nome/categoria (simplificado)
function getDefaultFields(exerciseName, existingObj) {
  const isCompound = ['Pernas', 'Peito', 'Costas', 'Ombros', 'Full Body'].includes(existingObj.muscle) && existingObj.equipment !== 'Máquinas';
  const isIsolation = !isCompound;
  const isBodyweight = existingObj.equipment === 'PesoCorporal';

  const sets = isCompound ? 4 : isIsolation ? 3 : 3;
  const reps = isBodyweight ? '8-12' : (isCompound ? '8-10' : '10-15');
  const rest = isCompound ? 90 : 60;
  const difficulty = 'Intermédio';
  const secondaryMuscles = [];

  // Tentar encontrar um vídeo no exerciseMedia.ts (se existir)
  const media = {
    gif: `/assets/exercises/gifs/${exerciseName.toLowerCase().replace(/ /g, '_')}.gif`,
    video: `/assets/exercises/videos/${exerciseName.toLowerCase().replace(/ /g, '_')}.mp4`,
  };

  const instructions = [
    `Posiciona-te corretamente para o ${exerciseName}.`,
    `Executa o movimento com controlo e amplitude total.`,
    `Expira na fase de força, inspira na volta.`,
    `Mantém a postura alinhada durante toda a série.`,
  ];

  return { sets, reps, rest, difficulty, secondaryMuscles, media, instructions };
}

// Regex para capturar cada objecto de exercício
const exerciseRegex = /"([^"]+)":\s*\{([^}]+)\}/gs;
let updatedContent = content;
let match;

while ((match = exerciseRegex.exec(content)) !== null) {
  const name = match[1];
  const body = match[2];
  // Verificar se já tem os novos campos
  if (body.includes('media:') || body.includes('instructions:')) continue;

  // Tentar extrair o músculo para inferir melhor (ex: muscle: "Peito")
  const muscleMatch = body.match(/muscle:\s*"([^"]+)"/);
  const equipmentMatch = body.match(/equipment:\s*"([^"]+)"/);
  
  const existingObj = {
    muscle: muscleMatch ? muscleMatch[1] : '',
    equipment: equipmentMatch ? equipmentMatch[1] : ''
  };

  const defaultFields = getDefaultFields(name, existingObj);
  const insert = `, media: ${JSON.stringify(defaultFields.media)}, instructions: ${JSON.stringify(defaultFields.instructions)}, defaultSets: ${defaultFields.sets}, defaultReps: "${defaultFields.reps}", defaultRest: ${defaultFields.rest}, difficulty: "${defaultFields.difficulty}", secondaryMuscles: ${JSON.stringify(defaultFields.secondaryMuscles)}`;
  
  // Inserir antes da chave de fecho do objecto
  const newBody = body.replace(/\}$/, insert + ' }');
  updatedContent = updatedContent.replace(match[0], `"${name}": {${newBody}}`);
}

fs.writeFileSync(dbPath, updatedContent);
console.log('✅ exerciseDB.ts migrado com novos campos');
