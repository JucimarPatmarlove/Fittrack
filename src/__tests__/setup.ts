// src/__tests__/setup.ts
// Setup global para todos os testes Vitest
// Fornece polyfills do Web Crypto e outros globals do browser

import { vi } from 'vitest';

// ─── Web Crypto API ───────────────────────────────────────────────────────────
// jsdom não implementa crypto.subtle — usamos o crypto do Node.js

import { webcrypto } from 'node:crypto';

// Injectar Web Crypto global (necessário para cryptoEngine.ts)
if (!globalThis.crypto) {
  // @ts-expect-error — Node.js webcrypto é compatível com browser WebCrypto API
  globalThis.crypto = webcrypto;
} else if (!globalThis.crypto.subtle) {
  // @ts-expect-error
  (globalThis.crypto as any).subtle = webcrypto.subtle;
}

// ─── IndexedDB Mock ───────────────────────────────────────────────────────────
// jsdom não tem IndexedDB — mock mínimo para testes de trendAnalyzer

// Os testes do trendAnalyzer fazem mock completo de encryptedDb,
// por isso não precisamos de um mock completo do IDB aqui.

// IDBKeyRange polyfill — needed by injuryPredictionEngine.ts
if (!globalThis.IDBKeyRange) {
  (globalThis as any).IDBKeyRange = {
    bound: (lower: any, upper: any, lowerOpen?: boolean, upperOpen?: boolean) => ({
      lower, upper, lowerOpen: !!lowerOpen, upperOpen: !!upperOpen,
    }),
    only: (value: any) => ({ lower: value, upper: value, lowerOpen: false, upperOpen: false }),
    lowerBound: (lower: any, open?: boolean) => ({ lower, upper: undefined, lowerOpen: !!open, upperOpen: true }),
    upperBound: (upper: any, open?: boolean) => ({ lower: undefined, upper, lowerOpen: true, upperOpen: !!open }),
  };
}
// ─── Worker Mock ─────────────────────────────────────────────────────────────
// O deriveKey() usa Web Worker. Nos testes, mockaremos a função directamente.
// Não é necessário mockar o Worker globalmente aqui.

// ─── TextEncoder / TextDecoder ────────────────────────────────────────────────
// Node.js 18+ já os tem, mas garantimos que estão disponíveis
import { TextEncoder, TextDecoder } from 'node:util';
if (!globalThis.TextEncoder) {
  (globalThis as any).TextEncoder = TextEncoder;
}
if (!globalThis.TextDecoder) {
  (globalThis as any).TextDecoder = TextDecoder;
}

// ─── Console warnings silenciados para imports de workers ─────────────────────
// Vitest pode lançar warnings sobre Worker URLs — suprimir
const originalWarn = console.warn;
console.warn = (...args: any[]) => {
  const msg = String(args[0] || '');
  if (msg.includes('Worker') || msg.includes('worker')) return;
  originalWarn(...args);
};
