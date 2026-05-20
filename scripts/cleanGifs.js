import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GIF_DIR = path.resolve(__dirname, '../public/assets/exercises/gifs');

if (fs.existsSync(GIF_DIR)) {
  const files = fs.readdirSync(GIF_DIR);
  let deletedCount = 0;
  for (const file of files) {
    if (file.endsWith('.gif')) {
      const filePath = path.join(GIF_DIR, file);
      fs.unlinkSync(filePath);
      deletedCount++;
    }
  }
  console.log(`Deleted ${deletedCount} placeholder GIF files from public/assets/exercises/gifs/`);
} else {
  console.log('GIF directory does not exist, nothing to clean.');
}
