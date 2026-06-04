// src/utils/cryptoHelpers.ts
// Wrapper de criptografia para objectos JSON.
// Reutiliza as funções AES-GCM do cryptoEngine.ts existente,
// adicionando serialização/deserialização JSON automática.

import { encryptData as encryptString, decryptData as decryptString } from './cryptoEngine';

/**
 * Cifra um objecto JavaScript com AES-GCM.
 * Serializa para JSON, depois cifra com a chave fornecida.
 * 
 * @param data Objecto a cifrar
 * @param key CryptoKey derivada do PIN do utilizador
 * @returns String Base64 com IV + ciphertext
 */
export async function encryptJSON(data: any, key: CryptoKey): Promise<string> {
  const jsonStr = JSON.stringify(data);
  return encryptString(key, jsonStr);
}

/**
 * Decifra uma string Base64 para um objecto JavaScript.
 * 
 * @param encryptedBase64 String Base64 cifrada
 * @param key CryptoKey derivada do PIN do utilizador
 * @returns Objecto JavaScript original
 * @throws Error se a chave for inválida ou dados corrompidos
 */
export async function decryptJSON<T = any>(encryptedBase64: string, key: CryptoKey): Promise<T> {
  const jsonStr = await decryptString(key, encryptedBase64);
  return JSON.parse(jsonStr) as T;
}
