/**
 * Script para extrair dados de exercises-generated.ts e exerciseDB.ts
 * e gravá-los como ficheiros JSON na pasta public/data/
 * Depois limpa os ficheiros .ts originais.
 */

import fs from 'fs';
import path from 'path';

const exercisesGeneratedPath = path.resolve('src/data/exercises-generated.ts');
const exerciseDBPath = path.resolve('src/data/exerciseDB.ts');
const publicDataDir = path.resolve('public/data');

if (!fs.existsSync(publicDataDir)) {
  fs.mkdirSync(publicDataDir, { recursive: true });
}

const libContent = fs.readFileSync(exercisesGeneratedPath, 'utf-8');
const dbContent = fs.readFileSync(exerciseDBPath, 'utf-8');

// ===== EXERCISE_LIBRARY =====
const libMatch = libContent.match(/export const EXERCISE_LIBRARY\s*=\s*(\[[\s\S]*?\])\s*;?\s*$/m);
if (!libMatch) {
  console.error('❌ Não encontrou EXERCISE_LIBRARY');
  process.exit(1);
}
const libJsonStr = libMatch[1].trim();
console.log('📊 EXERCISE_LIBRARY extraído, tamanho:', libJsonStr.length);

// ===== EXERCISE_DB =====
const dbPrefix = 'export const EXERCISE_DB:\s*Record<string, ExerciseDefinition>=';
let dbJsonStr = dbContent
  .replace(dbPrefix, '')
  .replace(/;\s*$/m, '')
  .trim();
console.log('📊 EXERCISE_DB extraído, tamanho:', dbJsonStr.length);

let exercisesLibrary, exercisesDatabase;
try {
  exercisesLibrary = JSON.parse(libJsonStr);
  console.log(`✅ ${exercisesLibrary.length} exercícios`);
} catch (e) {
  console.error('❌ Parse lib:', e.message);
  process.exit(1);
}

try {
  exercisesDatabase = JSON.parse(dbJsonStr);
  console.log(`✅ ${Object.keys(exercisesDatabase).length} definições`);
} catch (e) {
  console.error('❌ Parse db:', e.message);
  process.exit(1);
}

fs.writeFileSync(path.join(publicDataDir, 'exercises-generated.json'), JSON.stringify(exercisesLibrary, null, 2));
fs.writeFileSync(path.join(publicDataDir, 'exerciseDB.json'), JSON.stringify(exercisesDatabase, null, 2));

console.log('✅ JSON gravados em public/data/');

// Limpar ficheiros .ts
const libClean = `// Dados movidos para public/data/exercises-generated.json
// Limpo automaticamente pelo script de otimização do bundle.
export const EXERCISE_LIBRARY = [];`;

const dbClean = `import type { ExerciseDefinition } from '../types/exercise';
// Dados movidos para public/data/exerciseDB.json
// Limpo automaticamente pelo script de otimização do bundle.
export const EXERCISE_DB: Record<string, ExerciseDefinition> = {};`;

fs.writeFileSync(exercisesGeneratedPath, libClean);
fs.writeFileSync(exerciseDBPath, dbClean);
console.log('✅ Ficheiros .ts originais limpos');
console.log('\n🎉 Concluído!');