import { get, set, del } from 'idb-keyval';

/**
 * Adaptador assíncrono para Zustand (ou outras libs)
 * Evita bloqueios de main thread no SSR ou no render do browser,
 * movendo o I/O pesado de persistência para o IndexedDB em vez de localStorage.
 */
export const idbStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const value = await get(name);
      return value || null;
    } catch (e) {
      console.warn(`[idbStorage] Erro ao ler ${name}`, e);
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await set(name, value);
    } catch (e) {
      console.warn(`[idbStorage] Erro ao gravar ${name}`, e);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await del(name);
    } catch (e) {
      console.warn(`[idbStorage] Erro ao apagar ${name}`, e);
    }
  }
};
