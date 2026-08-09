// src/utils/__tests__/cryptoEngine.test.ts
// Testes unitários para as funções de criptografia AES-GCM
//
// NOTA: deriveKey() usa Web Worker (PBKDF2) e não pode ser testada directamente.
// Em vez disso, usamos crypto.subtle.generateKey() para criar uma chave de teste,
// o que nos permite validar encryptData/decryptData de forma isolada.

import { beforeAll, describe, expect, it } from 'vitest';
import { decryptData, encryptData } from '../cryptoEngine';
import { decryptJSON, encryptJSON } from '../cryptoHelpers';

// ─── Helpers de teste ──────────────────────────────────────────────────────────

/**
 * Gera uma chave AES-GCM de teste directamente (sem Worker/PBKDF2).
 * Equivalente ao que deriveKey() produz, mas mais rápido para testes.
 */
async function generateTestKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    false, // non-extractable
    ['encrypt', 'decrypt'],
  );
}

// ─── SUITE: encryptData / decryptData ─────────────────────────────────────────

describe('cryptoEngine — encryptData / decryptData', () => {
  let testKey: CryptoKey;

  beforeAll(async () => {
    testKey = await generateTestKey();
  });

  it('deve cifrar e decifrar uma string simples correctamente', async () => {
    const original = 'Hello, FitTrack!';
    const encrypted = await encryptData(testKey, original);
    const decrypted = await decryptData(testKey, encrypted);
    expect(decrypted).toBe(original);
  });

  it('deve cifrar strings JSON correctamente', async () => {
    const payload = JSON.stringify({ weightKg: 100, repsCompleted: 8, rpe: 7.5 });
    const encrypted = await encryptData(testKey, payload);
    const decrypted = await decryptData(testKey, encrypted);
    expect(decrypted).toBe(payload);
    // O JSON parseado deve ter os valores correctos
    const parsed = JSON.parse(decrypted);
    expect(parsed.weightKg).toBe(100);
    expect(parsed.rpe).toBe(7.5);
  });

  it('deve gerar ciphertexts diferentes para o mesmo plaintext (IV aleatório)', async () => {
    const text = 'mesmo texto';
    const enc1 = await encryptData(testKey, text);
    const enc2 = await encryptData(testKey, text);
    // IV é gerado aleatoriamente → ciphertexts nunca são iguais
    expect(enc1).not.toBe(enc2);
    // Mas ambos decifram para o texto original
    expect(await decryptData(testKey, enc1)).toBe(text);
    expect(await decryptData(testKey, enc2)).toBe(text);
  });

  it('deve lançar erro ao decifrar com chave errada', async () => {
    const wrongKey = await generateTestKey();
    const encrypted = await encryptData(testKey, 'dados secretos');
    await expect(decryptData(wrongKey, encrypted)).rejects.toThrow('Invalid PIN or corrupted data');
  });

  it('deve lançar erro ao decifrar dados corrompidos', async () => {
    const corrupted = 'aGVsbG8gd29ybGQ='; // base64 aleatório, não é ciphertext válido
    await expect(decryptData(testKey, corrupted)).rejects.toThrow('Invalid PIN or corrupted data');
  });

  it('deve cifrar strings vazias', async () => {
    const encrypted = await encryptData(testKey, '');
    const decrypted = await decryptData(testKey, encrypted);
    expect(decrypted).toBe('');
  });

  it('deve cifrar strings com caracteres especiais e UTF-8', async () => {
    const text = 'Peso: 87.5kg | RPE: 8 | Ação: 💪🔥';
    const encrypted = await encryptData(testKey, text);
    const decrypted = await decryptData(testKey, encrypted);
    expect(decrypted).toBe(text);
  });
});

// ─── SUITE: encryptJSON / decryptJSON ─────────────────────────────────────────

describe('cryptoHelpers — encryptJSON / decryptJSON', () => {
  let testKey: CryptoKey;

  beforeAll(async () => {
    testKey = await generateTestKey();
  });

  it('deve cifrar e decifrar um objecto JavaScript', async () => {
    const data = { weightKg: 100, repsCompleted: 8, rpe: 7, estimated1RM: 133 };
    const encrypted = await encryptJSON(data, testKey);
    const decrypted = await decryptJSON<typeof data>(encrypted, testKey);
    expect(decrypted.weightKg).toBe(100);
    expect(decrypted.repsCompleted).toBe(8);
    expect(decrypted.rpe).toBe(7);
    expect(decrypted.estimated1RM).toBe(133);
  });

  it('deve cifrar objectos aninhados', async () => {
    const nested = { exercises: ['Squat', 'Deadlift'], meta: { date: '2026-06-05' } };
    const encrypted = await encryptJSON(nested, testKey);
    const decrypted = await decryptJSON<typeof nested>(encrypted, testKey);
    expect(decrypted.exercises).toEqual(['Squat', 'Deadlift']);
    expect(decrypted.meta.date).toBe('2026-06-05');
  });

  it('deve lançar erro ao decifrar JSON com chave errada', async () => {
    const wrongKey = await generateTestKey();
    const encrypted = await encryptJSON({ secret: 'dados' }, testKey);
    await expect(decryptJSON(encrypted, wrongKey)).rejects.toThrow();
  });
});
