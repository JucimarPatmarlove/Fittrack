import type { StateStorage } from 'zustand/middleware';
import { atomicSave, atomicLoad, atomicRemove } from './durableStorage';

// Cache opcional para reduzir leituras repetidas do mesmo key
const readCache = new Map<string, string>;

/**
 * Cria um adaptador de storage Zustand usando atomicSave/atomicLoad
 * do durableStorage para garantir escritas atómicas e proteção contra corrupção.
 *
 * O persist middleware do Zustand usa createJSONStorage por baixo-do-quepasa,
 * que faz JSON.parse/JSON.stringify automaticamente. Por isso, este adapter
 * retorna JSON stringificado que o createJSONStorage desserializa.
 *
 * @returns StateStorage compatível com persist middleware
 */
export function createDurableStorage(): StateStorage {
  return {
    /**
     * Lê item usando atomicLoad (com fallback para backup se corrompido)
     *
     * @returns JSON stringificado do estado da store ou null
     */
    async getItem(name: string): Promise<string | null> {
      // Verifica cache primeiro
      if (readCache.has(name)) {
        const cached = readCache.get(name);
        if (cached) return cached;
        return null;
      }

      try {
        const result = await atomicLoad<string>(name);

        if (result.data !== null) {
          // Sucesso - guarda no cache (JSON stringificado)
          readCache.set(name, result.data);
          return result.data;
        }

        // Dados não encontrados ou corrompidos
        return null;
      } catch (err) {
        console.warn('[DurablePersist] Erro ao ler "' + name + '":', err);
        return null;
      }
    },

    /**
     * Escreve item usando atomicSave (escrita atómica com validação e rollback)
     *
     * @param value - JSON stringificado do estado da store
     */
    async setItem(name: string, value: string): Promise<void> {
      try {
        // value já é um JSON stringificado
        const result = await atomicSave(name, value);

        if (!result.success) {
          throw result.error ?? new Error('atomicSave falhou sem erro');
        }

        // Atualiza cache em caso de sucesso
        readCache.set(name, value);
      } catch (err) {
        console.error('[DurablePersist] Erro ao gravar "' + name + '":', err);
        // Limpa cache em caso de erro
        readCache.delete(name);
        throw err;
      }
    },

    /**
     * Remove item usando atomicRemove (apaga chave e backup)
     */
    async removeItem(name: string): Promise<void> {
      try {
        const result = await atomicRemove(name);

        if (!result.success) {
          throw result.error ?? new Error('atomicRemove falhou sem erro');
        }

        // Limpa cache
        readCache.delete(name);
      } catch (err) {
        console.error('[DurablePersist] Erro ao apagar "' + name + '":', err);
        throw err;
      }
    },
  };
}