import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read src/data/exerciseMedia.ts contents
const mediaFilePath = path.resolve(__dirname, '../src/data/exerciseMedia.ts');
const mediaFileContent = fs.readFileSync(mediaFilePath, 'utf8');

// Simple regex parser to extract keys from exerciseMediaMap
// Keys look like: 'Barbell Bench Press': {
const regex = /^\s*['"]([^'"]+)['"]\s*:\s*\{/gm;
const keysInCode = [];
let match;
while ((match = regex.exec(mediaFileContent)) !== null) {
  keysInCode.push(match[1]);
}

console.log('Total keys in exerciseMediaMap:', keysInCode.length);

const toAssetSlug = (name) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

const IMG_DIR = path.resolve(__dirname, '../public/assets/exercises/images');
const existingSvgs = new Set(fs.readdirSync(IMG_DIR));

const missing = [];
for (const key of keysInCode) {
  const slug = toAssetSlug(key);
  const fileName = `${slug}.svg`;
  if (!existingSvgs.has(fileName)) {
    missing.push({ key, slug, fileName });
  }
}

console.log('Missing SVGs:', missing.length);
if (missing.length > 0) {
  console.log(JSON.stringify(missing, null, 2));
} else {
  console.log('All exercise keys in code have corresponding generated SVGs!');
}
