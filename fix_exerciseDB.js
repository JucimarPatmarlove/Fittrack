import fs from 'fs';

let content = fs.readFileSync('src/data/exerciseDB.ts', 'utf-8');

// Add import
if (!content.includes('import { ExerciseDefinition }')) {
    content = 'import { ExerciseDefinition } from "../types/exercise";\n' + content;
}

// Replace type
content = content.replace('export const EXERCISE_DB: Record<string, any> = {', 'export const EXERCISE_DB: Record<string, ExerciseDefinition> = {');

// Replace modalities: ['v_taper'] with goals: ['v_taper_aesthetics']
content = content.replace(/modalities: \['v_taper'\]/g, "goals: ['v_taper_aesthetics']");

fs.writeFileSync('src/data/exerciseDB.ts', content);
console.log('Done!');
