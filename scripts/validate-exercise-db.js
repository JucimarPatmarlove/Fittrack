#!/usr/bin/env node
/**
 * scripts/validate-exercise-db.js
 *
 * Compara as chaves entre EXERCISE_DB (exerciseDB.ts) e exerciseCategoryMap
 * (exerciseClassifier.ts) para identificar exercícios em falta ou a mais.
 *
 * Uso: node scripts/validate-exercise-db.js
 * (O package.json já deve ter: "validate-exercises": "node scripts/validate-exercise-db.js")
 *
 * Nota: usa import() dinâmico porque o projecto é ESM (type: "module").
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// Lê os ficheiros TypeScript como texto e extrai as chaves via regex
// (abordagem sem transpilador para manter o script simples)
function extractKeysFromTS(filepath, recordVarName) {
  const content = readFileSync(filepath, 'utf-8');

  // Encontrar o bloco do Record
  const startIdx = content.indexOf(`${recordVarName}`);
  if (startIdx === -1) {
    console.error(`❌ Variável "${recordVarName}" não encontrada em ${filepath}`);
    process.exit(1);
  }

  // Extrair todas as chaves de string (formato: "Chave":)
  const keyRegex = /"([^"]+)"\s*:/g;
  const keys = new Set();
  let match;
  
  // Só analisar a partir do índice da variável para evitar falsos positivos
  const relevantContent = content.slice(startIdx);
  while ((match = keyRegex.exec(relevantContent)) !== null) {
    const key = match[1];
    // Ignorar chaves que são nomes de campo (ex: "muscle", "hipertrofia", etc.)
    if (!['muscle', 'equipment', 'base', 'hipertrofia', 'forca', 'resistencia', 'goals', 'modalities', 'jointImpact', 'ageMin', 'secondaryMuscles'].includes(key)) {
      keys.add(key);
    }
  }
  return keys;
}

const EXERCISE_DB_PATH = resolve(ROOT, 'src/data/exerciseDB.ts');
const CLASSIFIER_PATH = resolve(ROOT, 'src/data/exerciseClassifier.ts');

console.log('\n🔍 FitTrack — Validação de Consistência da Base de Exercícios\n');
console.log(`📄 exerciseDB.ts   : ${EXERCISE_DB_PATH}`);
console.log(`📄 exerciseClassifier.ts : ${CLASSIFIER_PATH}`);
console.log('');

const dbKeys = extractKeysFromTS(EXERCISE_DB_PATH, 'EXERCISE_DB');
const classKeys = extractKeysFromTS(CLASSIFIER_PATH, 'exerciseCategoryMap');

console.log(`📊 exerciseDB.ts       → ${dbKeys.size} exercícios`);
console.log(`📊 exerciseClassifier  → ${classKeys.size} exercícios`);
console.log('');

const onlyInDB = [...dbKeys].filter(k => !classKeys.has(k));
const onlyInClassifier = [...classKeys].filter(k => !dbKeys.has(k));
const inBoth = [...dbKeys].filter(k => classKeys.has(k));

if (onlyInDB.length === 0 && onlyInClassifier.length === 0) {
  console.log('✅ Perfeito! Os dois ficheiros estão completamente sincronizados.\n');
} else {
  if (onlyInDB.length > 0) {
    console.log(`⚠️  Apenas em exerciseDB.ts (${onlyInDB.length}) — falta categoria no classifier:`);
    onlyInDB.forEach(k => console.log(`   → "${k}"`));
    console.log('');
  }

  if (onlyInClassifier.length > 0) {
    console.log(`⚠️  Apenas em exerciseClassifier.ts (${onlyInClassifier.length}) — falta entrada na DB:`);
    onlyInClassifier.forEach(k => console.log(`   → "${k}"`));
    console.log('');
  }
}

console.log(`✅ Em ambos os ficheiros: ${inBoth.length} exercícios\n`);

// Sugere acções de correcção
if (onlyInDB.length > 0) {
  console.log('💡 Para corrigir os exercícios em falta no classifier, adiciona ao exerciseCategoryMap:');
  onlyInDB.forEach(k => {
    console.log(`   "${k}": "compound_multi", // TODO: verificar categoria correcta`);
  });
  console.log('');
}

if (onlyInClassifier.length > 0) {
  console.log('💡 Para corrigir os exercícios em falta na DB, adiciona ao EXERCISE_DB:');
  onlyInClassifier.forEach(k => {
    console.log(`   "${k}": { muscle: "TODO", equipment: "TODO", base: { hipertrofia: [3, 8, 12] } },`);
  });
  console.log('');
}

process.exit(onlyInDB.length + onlyInClassifier.length > 0 ? 1 : 0);
