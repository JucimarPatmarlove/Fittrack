import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const imagesDir = path.join(projectRoot, 'public', 'assets', 'exercises', 'images');
const gifsDir = path.join(projectRoot, 'public', 'assets', 'exercises', 'gifs');

const toAssetSlug = (fileName) =>
  fileName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

if (!fs.existsSync(gifsDir)) {
  fs.mkdirSync(gifsDir, { recursive: true });
}

const svgFiles = fs.readdirSync(imagesDir).filter((file) => file.endsWith('.svg'));

let created = 0;
let skipped = 0;

for (const fileName of svgFiles) {
  const sourcePath = path.join(imagesDir, fileName);
  const targetPath = path.join(gifsDir, `${toAssetSlug(fileName.replace(/\.svg$/, ''))}.gif`);

  if (fs.existsSync(targetPath)) {
    skipped += 1;
    continue;
  }

  execFileSync('convert', [sourcePath, targetPath], { stdio: 'ignore' });
  created += 1;
}

console.log(`GIFs generated: ${created}`);
console.log(`GIFs skipped: ${skipped}`);
