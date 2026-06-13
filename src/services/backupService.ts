// src/services/backupService.ts
// ════════════════════════════════════════════════════════════════
// Exporta/importa todo o estado do FitTrack (IndexedDB + Zustand)
// Cifra/decifra com a masterKey actual.
// ════════════════════════════════════════════════════════════════

import { encryptData, decryptData, getMasterKey } from '../utils/cryptoEngine';
import { getDB } from '../db/schema';
import { SENSITIVE_STORE_NAMES } from '../stores/encryptedPersist';

/**
 * Exporta todo o estado do utilizador para um Blob cifrado.
 * Inclui: IndexedDB (workouts, setLogs, personalRecords) + Zustand stores.
 */
export async function exportEncryptedBackup(): Promise<Blob> {
  const key = getMasterKey();
  if (!key) throw new Error('Chave mestra não disponível. Defina um PIN primeiro.');

  // 1. Ler IndexedDB
  const db = await getDB();
  const workouts = await db.getAll('workouts');
  const setLogs = await db.getAll('setLogs');
  const personalRecords = await db.getAll('personalRecords');

  // 2. Ler Zustand stores (localStorage e IDB via fallback manual)
  // Como as stores SENSITIVE_STORE_NAMES estão no IndexedDB agora,
  // precisamos aceder ao fittrack_zustand_encrypted
  const zustandState: Record<string, any> = {};
  
  // Como SENSITIVE_STORE_NAMES migrou para IDB, vamos ler diretamente de lá
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.open('FitTrack_V7_ZustandStore', 1);
    req.onsuccess = (e: any) => {
      const idb = e.target.result;
      try {
        const tx = idb.transaction('fittrack_zustand_encrypted', 'readonly');
        const store = tx.objectStore('fittrack_zustand_encrypted');
        const getAllReq = store.getAll();
        const getKeysReq = store.getAllKeys();
        
        getAllReq.onsuccess = () => {
          getKeysReq.onsuccess = () => {
            const keys = getKeysReq.result;
            const values = getAllReq.result;
            keys.forEach((k: string, i: number) => {
               zustandState[k] = values[i]; // valor já está cifrado no IDB, mas queremos o plaintext para o backup global cifrar tudo junto?
               // Na verdade, se já está cifrado no IDB (Zustand), podemos guardar cifrado dentro do backup cifrado (dupla cifra),
               // ou guardar assim mesmo. O mais fácil é exportar o valor bruto do IDB e restaurá-lo bruto.
            });
            resolve();
          };
        };
      } catch (err) {
        resolve(); // Se a store não existir ainda
      }
    };
    req.onerror = () => reject('Erro ao aceder ao IDB do Zustand');
  });

  // NOVO: Ler idb-keyval (fit_history, fit_profile, etc)
  const { entries } = await import('idb-keyval');
  const idbKeyvals = await entries();
  const idbData: Record<string, any> = {};
  for (const [k, v] of idbKeyvals) {
    idbData[k as string] = v;
  }

  const exportData = {
    version: 'v1',
    timestamp: Date.now(),
    indexeddb: { workouts, setLogs, personalRecords },
    zustand: zustandState,
    idbKeyval: idbData,
  };

  const jsonString = JSON.stringify(exportData);
  const encryptedBase64 = await encryptData(key, jsonString);
  return new Blob([encryptedBase64], { type: 'application/octet-stream' });
}

/**
 * Restaura o estado a partir de um Blob cifrado.
 * Substitui todo o IndexedDB e as stores Zustand.
 */
export async function importEncryptedBackup(encryptedBlob: Blob): Promise<void> {
  const key = getMasterKey();
  if (!key) throw new Error('Chave mestra não disponível.');

  const encryptedBase64 = await encryptedBlob.text();
  const jsonString = await decryptData(key, encryptedBase64);
  const data = JSON.parse(jsonString);

  if (data.version !== 'v1') throw new Error('Versão de backup incompatível');

  // 1. Substituir IndexedDB (limpar e reinserir)
  const db = await getDB();
  await db.clear('workouts');
  await db.clear('setLogs');
  await db.clear('personalRecords');

  for (const w of data.indexeddb.workouts) await db.add('workouts', w);
  for (const s of data.indexeddb.setLogs) await db.add('setLogs', s);
  for (const pr of data.indexeddb.personalRecords) await db.add('personalRecords', pr);

  // 2. Restaurar Zustand stores no IndexedDB
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.open('FitTrack_V7_ZustandStore', 1);
    req.onsuccess = (e: any) => {
      const idb = e.target.result;
      try {
        const tx = idb.transaction('fittrack_zustand_encrypted', 'readwrite');
        const store = tx.objectStore('fittrack_zustand_encrypted');
        store.clear();
        for (const [name, state] of Object.entries(data.zustand)) {
          store.put(state, name);
        }
        tx.oncomplete = () => resolve();
      } catch (err) {
        resolve(); // Se a store não existir
      }
    };
    req.onerror = () => reject('Erro ao aceder ao IDB do Zustand no restore');
  });

  // 3. Restaurar idb-keyval
  if (data.idbKeyval) {
    const { set } = await import('idb-keyval');
    for (const [k, v] of Object.entries(data.idbKeyval)) {
      await set(k, v);
    }
  }

  // Recarregar a página para re-hidratar os stores
  window.location.reload();
}

/**
 * Verifica de forma silenciosa se existe um backup mais recente no Google Drive
 * do que a última atividade registada localmente.
 */
export async function checkForNewerBackup(): Promise<{ id: string; name: string; createdTime: string } | null> {
  const { getStoredToken, listBackups } = await import('./googleDrive');
  
  // 1. Verifica silenciosamente se há token (sem forçar login)
  const token = getStoredToken();
  if (!token) return null;

  try {
    // 2. Busca lista de backups (ordem decrescente de data por default no googleDrive.ts)
    const backups = await listBackups();
    if (backups.length === 0) return null;

    const latestBackup = backups[0];
    const backupTime = new Date(latestBackup.createdTime).getTime();

    // 3. Determinar a data da última atividade local (ex: último treino)
    const db = await getDB();
    const workouts = await db.getAll('workouts');
    let lastLocalTime = 0;
    
    if (workouts.length > 0) {
      // Procurar o treino mais recente
      const sortedWorkouts = workouts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      lastLocalTime = new Date(sortedWorkouts[0].date).getTime();
    } else {
      // Se não há treinos, ver se existe um perfil ativo
      const profile = localStorage.getItem('fit_profile');
      if (profile) lastLocalTime = Date.now(); // Assume-se que tem dados recentes não-treino se tiver perfil
    }

    // 4. Se o backup na nuvem for mais recente (margem de 5 minutos para evitar falsos positivos)
    if (backupTime > lastLocalTime + 5 * 60 * 1000) {
      return latestBackup;
    }
  } catch (err) {
    console.warn('[AutoRestore] Falha ao procurar backups recentes:', err);
  }

  return null;
}
