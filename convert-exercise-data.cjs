/**
 * Script para extrair dados de exercises-generated.ts e exerciseDB.ts
 * e gravá-los como ficheiros JSON na pasta public/data/
 * Depois limpa os ficheiros .ts originais.
 */

const fs = require('fs');
const path = require('path');

// Caminhos
const exercisesGeneratedPath = path.resolve('src/data/exercises-generated.ts');
const exerciseDBPath = path.resolve('src/data/exerciseDB.ts');
const publicDataDir = path.resolve('public/data');

// Garantir que a pasta existe
if (!fs.existsSync(publicDataDir)) {
  fs.mkdirSync(publicDataDir, { recursive: true });
}

// Ler o conteúdo dos ficheiros
const exercisesGeneratedContent = fs.readFileSync(exercisesGeneratedPath, 'utf-8');
const exerciseDBContent = fs.readFileSync(exerciseDBPath, 'utf-8');

// ===== Extração do EXERCISE_LIBRARY =====
// Procura pelo start: "export const EXERCISE_LIBRARY = ["
// e o fim do array (procuro a linha com "];" ou "];\n")
const libStartIndex = exercisesGeneratedContent.indexOf('export const EXERCISE_LIBRARY = [');
if (libStartIndex === -1) {
  console.error('❌ Não foi possível encontrar EXERCISE_LIBRARY em exercises-generated.ts');
  process.exit(1);
}
const libArrayStart = libStartIndex + 'export const EXERCISE_LIBRARY ='.length;
const libArrayContentStart = libArrayStart + 1; // skip '['
// Encontrar o fim do array: procurar "];" ou "]"
let libArrayContentEnd = exercisesGeneratedContent.length;
// Procurar por "];" ou "]" seguido de ; e newline
const closingPattern = /\]\s*;?\s*\n?/;
const closingMatch = exercisesGeneratedContent.slice(libArrayContentStart).match(closingPattern);
if (closingMatch) {
  libArrayContentEnd = libArrayContentStart + closingMatch.index;
}

const libArrayContent = exercisesGeneratedContent.slice(libArrayContentStart, libArrayContentEnd).trim();
console.log('📊 Conteúdo do array (primeiros 100 chars):', libArrayContent.substring(0, 100));

// O conteúdo extraído está num array-like, precisa de fechar com "]"
// Remover a chave final de "-" não... Vamos simplesmente adicionar "]" se necessário
// O conteúdo começa com "[" e termina com "]" normalmente, ou só com a última chave.
// Vamos verificar e ajustar.

// Para ser seguro, vamos procurar o último "]" antes de "];"
const lastBracketIndex = libArrayContent.lastIndexOf(']');
let libJsonContent = libArrayContent.substring(0, lastBracketIndex + 1).trim();

// Parse como JSON
let exercisesLibrary;
try {
  exercisesLibrary = JSON.parse(libJsonContent);
  console.log(`✅ Extraídas ${exercisesLibrary.length} exercícios de EXERCISE_LIBRARY`);
} catch (e) {
  console.error('❌ Erro ao fazer parse de EXERCISE_LIBRARY:', e.message);
  process.exit(1);
}

// ===== Extração do EXERCISE_DB =====
// Procura pelo start: "export const EXERCISE_DB: Record<string, ExerciseDefinition> = {"
const dbStartIndex = exerciseDBContent.indexOf('export const EXERCISE_DB');
if (dbStartIndex === -1) {
  console.error('❌ Não foi encontrado EXERCISE_DB em exerciseDB.ts');
  process.exit(1);
}
const dbEqualsIndex = exerciseDBContent.indexOf('=', dbStartIndex);
const dbOpenBraceIndex = exerciseDBContent.indexOf('{', dbEqualsIndex);
const dbObjectContentStart = dbOpenBraceIndex;
// Encontrar o fim do objeto: o primeiro "}" seguido de ";" ou newline no final
let dbObjectContentEnd = exerciseDBContent.length;
// Procurar por "}\s*;?\s*\n?$"
const dbClosingPattern = /\}\s*;?\s*\n?$/;
const dbClosingMatch = exerciseDBContent.match(dbClosingPattern);
if (dbClosingMatch) {
  dbObjectContentEnd = exerciseDBContent.length - (dbClosingMatch[0].length - dbClosingMatch[0].indexOf('}'));
}

const dbObjectContent = exerciseDBContent.substring(dbObjectContentStart, dbObjectContentEnd).trim();
console.log('📊 Conteúdo do objeto (primeiros 100 chars):', dbObjectContent.substring(0, 100));

// Parse como JSON
let exercisesDatabase;
try {
  exercisesDatabase = JSON.parse(dbObjectContent);
  console.log(`✅ Extraídas ${Object.keys(exercisesDatabase).length} definições de EXERCISE_DB`);
} catch (e) {
  console.error('❌ Erro ao fazer parse de EXERCISE_DB:', e.message);
  process.exit(1);
}

// Gravar como ficheiros JSON
const exercisesLibraryPath = path.join(publicDataDir, 'exercises-generated.json');
const exercisesDatabasePath = path.join(publicDataDir, 'exerciseDB.json');

fs.writeFileSync(exercisesLibraryPath, JSON.stringify(exercisesLibrary, null, 2));
fs.writeFileSync(exercisesDatabasePath, JSON.stringify(exercisesDatabase, null, 2));

console.log(`\n✅ Ficheiros JSON gravados:`);
console.log(`   - ${exercisesLibraryPath}`);
console.log(`   - ${exercisesDatabasePath}`);

// Agora limpar os ficheiros .ts originais
console.log('\n🧹 A limpar ficheiros .ts originais...');

// Substituir o conteúdo dos ficheiros .TS
const exercisesTsContent = `// Dados movidos para public/data/exercises-generated.json
// Este ficheiro foi automaticamente limpo pelo script de otimização do bundle.

// O export original foi removido para reduzir o tamanho do bundle TypeScript.
// Reimportar de: ../public/data/exercises-generated.json se necessário.

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const EXERCISE_LIBRARY: never[] = [];`;

const exerciseDbTsContent = `import type { ExerciseDefinition } from '../types/exercise';

// Dados movidos para public/data/exerciseDB.json
// Este ficheiro foi automaticamente limpo pelo script de otimização do bundle.

// O export original foi removido para reduzir o tamanho do bundle TypeScript.
// Reimportar de: ../public/data/exerciseDB.json se necessário.

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const EXERCISE_DB: Record<string, ExerciseDefinition> = {};`;

try {
  fs.writeFileSync(exercisesGeneratedPath, exercisesTsContent);
  console.log(`✅ ${exercisesGeneratedPath} limpo`);
} catch (e) {
  console.error(`❌ Erro ao limpar ${exercisesGeneratedPath}:`, e.message);
}

try {
  fs.writeFileSync(exerciseDBPath, exerciseDbTsContent);
  console.log(`✅ ${exerciseDBPath} limpo`);
} catch (e) {
  console.error(`❌ Erro ao limpar ${exerciseDBPath}:`, e.message);
}

console.log('\n🎉 Script concluído!');

// Resumo para o utilizador
console.log('\n--- Resumo ---');
console.log(`EXERCISE_LIBRARY: ${exercisesLibrary.length} exercícios movidos`);
console.log(`EXERCISE_DB: ${Object.keys(exercisesDatabase).length} definições movidas`);
console.log(`Ficheiros JSON: ${publicDataDir}/`);
console.log(`Ficheiros .TS originais: limpos e substituídos por placeholders`);