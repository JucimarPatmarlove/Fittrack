// ─── Web Crypto API ───────────────────────────────────────────────────────────
// jsdom não implementa crypto.subtle — usamos o crypto do Node.js

import { webcrypto } from 'node:crypto';

// Injectar Web Crypto global (necessário para cryptoEngine.ts)
if (!globalThis.crypto) {
  // @ts-expect-error — Node.js webcrypto é compatível com browser WebCrypto API
  globalThis.crypto = webcrypto;
} else if (!globalThis.crypto.subtle) {
  // @ts-expect-error suppressing type error for test setup
  (globalThis.crypto as unknown).subtle = webcrypto.subtle;
}

// ─── IndexedDB Mock ───────────────────────────────────────────────────────────
// jsdom não tem IndexedDB — mock mínimo para testes de trendAnalyzer

// Os testes do trendAnalyzer fazem mock completo de encryptedDb,
// por isso não precisamos de um mock completo do IDB aqui.

// IDBKeyRange polyfill — needed by injuryPredictionEngine.ts
if (!globalThis.IDBKeyRange) {
  (globalThis as unknown as { IDBKeyRange: unknown }).IDBKeyRange = {
    bound: (lower: unknown, upper: unknown, lowerOpen?: boolean, upperOpen?: boolean) => ({
      lower,
      upper,
      lowerOpen: !!lowerOpen,
      upperOpen: !!upperOpen,
    }),
    only: (value: unknown) => ({ lower: value, upper: value, lowerOpen: false, upperOpen: false }),
    lowerBound: (lower: unknown, open?: boolean) => ({
      lower,
      upper: undefined,
      lowerOpen: !!open,
      upperOpen: true,
    }),
    upperBound: (upper: unknown, open?: boolean) => ({
      lower: undefined,
      upper,
      lowerOpen: true,
      upperOpen: !!open,
    }),
  };
}
// ─── Worker Mock ─────────────────────────────────────────────────────────────
// O deriveKey() usa Web Worker. Nos testes, mockaremos a função directamente.
// Não é necessário mockar o Worker globalmente aqui.

// ─── TextEncoder / TextDecoder ────────────────────────────────────────────────
// Node.js 18+ já os tem, mas garantimos que estão disponíveis
import { TextDecoder, TextEncoder } from 'node:util';
if (!globalThis.TextEncoder) {
  (globalThis as unknown as { TextEncoder: typeof TextEncoder }).TextEncoder = TextEncoder;
}
if (!globalThis.TextDecoder) {
  (globalThis as unknown as { TextDecoder: typeof TextDecoder }).TextDecoder = TextDecoder;
}

// ─── Console warnings silenciados para imports de workers ─────────────────────
// Vitest pode lançar warnings sobre Worker URLs — suprimir
const originalWarn = console.warn;
console.warn = (...args: unknown[]) => {
  const msg = String(args[0] || '');
  if (msg.includes('Worker') || msg.includes('worker')) return;
  originalWarn(...args);
};
