import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const storesDir = path.resolve(__dirname, '../src/stores');

const files = fs.readdirSync(storesDir).filter(f => f.endsWith('.ts') && !f.includes('.test'));

console.log('📦 Zustand Stores - Auditoria de Persistência\n');
for (const file of files) {
  const content = fs.readFileSync(path.join(storesDir, file), 'utf8');
  const hasPersist = content.includes('persist(') || content.includes('createJSONStorage');
  const persistMethod = hasPersist ? 'localStorage (não cifrado)' : 'memória (volátil)';
  console.log(`- ${file}: ${persistMethod}`);
}
