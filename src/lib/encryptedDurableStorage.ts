import type { StateStorage } from 'zustand/middleware';
import { createDurableStorage } from './durablePersist';
import { encryptData, decryptData, getMasterKey } from '../utils/cryptoEngine';

/**
 * Wrapper que combina encriptação (AES-GCM) com escrita atómica durável
 *
 * Fluxo:
 * 1. getItem: Lê via durableStorage → desencripta
 * 2. setItem: Encripta → grava atomicamente via durableStorage
 * 3. removeItem: Remove atomicamente via durableStorage
 */

/**
 * Cria storage encriptado com persistência durável (atomic)
 *
 * @param options - Opções de configuração
 * @param options.useLocalStorageFallback - Se deve usar localStorage como fallback
 * @returns StateStorage compatível com Zustand persist
 */
export function createEncryptedDurableStorage(): StateStorage {
  // Storage durável subjacente (sem encriptação)
  const durableStorage = createDurableStorage();

  return {
    /**
     * Lê item usando durableStorage → desencripta
     */
    async getItem(name: string): Promise<string | null> {
      try {
        const encrypted = await durableStorage.getItem(name);

        if (!encrypted) {
          return null;
        }

        const key = getMasterKey();

        if (!key) {
          // Sem chave mestra → retorna dados em claro (modo de migração)
          console.warn('[EncryptedDurable] Sem chave mestra para "' + name + '", retornando em claro');
          return encrypted;
        }

        try {
          const decrypted = await decryptData(key, encrypted);
          return decrypted;
        } catch (err) {
          console.warn('[EncryptedDurable] Falha ao desencriptar "' + name + '":', err);
          // Dados corrompidos ou chave inválida
          return null;
        }
      } catch (err) {
        console.error('[EncryptedDurable] Erro ao ler "' + name + '":', err);
        return null;
      }
    },

    /**
     * Encripta e grava atomicamente
     */
    async setItem(name: string, value: string): Promise<void> {
      try {
        const key = getMasterKey();

        let dataToStore: string;

        if (!key) {
          // Sem chave → guarda em claro (migração)
          console.warn('[EncryptedDurable] Sem chave mestra para "' + name + '", guardando em claro');
          dataToStore = value;
        } else {
          try {
            dataToStore = await encryptData(key, value);
          } catch (err) {
            console.error('[EncryptedDurable] Falha ao encriptar "' + name + '":', err);
            throw err;
          }
        }

        // Gravação atómica
        await durableStorage.setItem(name, dataToStore);
      } catch (err) {
        console.error('[EncryptedDurable] Erro ao gravar "' + name + '":', err);
        throw err;
      }
    },

    /**
     * Remove dados atomicamente
     */
    async removeItem(name: string): Promise<void> {
      try {
        await durableStorage.removeItem(name);
      } catch (err) {
        console.error('[EncryptedDurable] Erro ao apagar "' + name + '":', err);
        throw err;
      }
    },
  };
}