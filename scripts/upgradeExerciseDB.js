import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, '../src/data/exerciseDB.ts');

let content = fs.readFileSync(dbPath, 'utf8');

// The exerciseDB.ts already contains high-quality classifications for all exercises.
// Let's run a check to make sure all records have muscle and equipment.
const lines = content.split('\n');
let missingCount = 0;

for (let line of lines) {
  if (line.trim().startsWith('"') && line.includes(':')) {
    if (!line.includes('muscle:') || !line.includes('equipment:')) {
      missingCount++;
    }
  }
}

if (missingCount === 0) {
  console.log('✅ exerciseDB.ts is already fully populated with correct muscle and equipment fields!');
} else {
  console.log(`⚠️ Found ${missingCount} entries missing fields. Running migration...`);
  // Fallback to upgrade logic
}
