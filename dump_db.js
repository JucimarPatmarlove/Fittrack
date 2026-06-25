import fs from 'fs';
import path from 'path';

// Need to simulate the module load to dump the object.
import { EXERCISE_DB } from './src/data/exerciseDB.js';

const targetDir = path.join(process.cwd(), 'public', 'data');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

fs.writeFileSync(
  path.join(targetDir, 'exercises.json'),
  JSON.stringify(EXERCISE_DB, null, 2),
  'utf-8'
);
console.log('✅ exercises.json created successfully!');
