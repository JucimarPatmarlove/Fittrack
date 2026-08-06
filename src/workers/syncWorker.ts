// src/workers/syncWorker.ts
/// <reference lib="webworker" />

declare const self: DedicatedWorkerGlobalScope;

interface SyncEntry {
  id: string;
  type: 'hrm' | 'ftms' | string;
  data: unknown;
  timestamp: number;
  pending: boolean;
}

let queue: SyncEntry[] = [];

// Carregar fila do IndexedDB
async function loadQueue() {
  return new Promise<void>((resolve) => {
    const request = indexedDB.open('FittrackSyncDB', 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('syncQueue')) {
        db.createObjectStore('syncQueue', { keyPath: 'id' });
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction('syncQueue', 'readonly');
      const store = tx.objectStore('syncQueue');
      const getAll = store.getAll();
      getAll.onsuccess = () => {
        queue = getAll.result;
        resolve();
      };
    };
    request.onerror = () => resolve();
  });
}

async function saveToIndexedDB(entry: SyncEntry) {
  return new Promise<void>((resolve) => {
    const request = indexedDB.open('FittrackSyncDB', 1);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction('syncQueue', 'readwrite');
      const store = tx.objectStore('syncQueue');
      store.put(entry);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    };
    request.onerror = () => resolve();
  });
}

async function removeFromIndexedDB(id: string) {
  return new Promise<void>((resolve) => {
    const request = indexedDB.open('FittrackSyncDB', 1);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction('syncQueue', 'readwrite');
      const store = tx.objectStore('syncQueue');
      store.delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    };
    request.onerror = () => resolve();
  });
}

async function compressData(data: unknown): Promise<{ compressed: boolean; data: unknown }> {
  const str = JSON.stringify(data);
  if (typeof CompressionStream !== 'undefined') {
    try {
      const stream = new Blob([str]).stream().pipeThrough(new CompressionStream('deflate'));
      const buffer = await new Response(stream).arrayBuffer();
      // Retornar array para armazenar no IndexedDB facilmente
      return { compressed: true, data: Array.from(new Uint8Array(buffer)) };
    } catch {
      return { compressed: false, data: str };
    }
  }
  return { compressed: false, data: str };
}

self.onmessage = async (event: MessageEvent) => {
  const { type, payload } = event.data;

  if (type === 'enqueue') {
    const compressedPayload = await compressData(payload?.data || {});
    
    const entry: SyncEntry = {
      id: crypto.randomUUID(),
      type: payload?.type || 'generic',
      data: compressedPayload,
      timestamp: Date.now(),
      pending: true,
    };
    
    // Evitar que a queue passe dos 1000 itens (aprox 5-10MB comprimidos)
    if (queue.length > 1000) {
       const oldest = queue.shift();
       if (oldest) await removeFromIndexedDB(oldest.id);
    }
    
    queue.push(entry);
    await saveToIndexedDB(entry);
    self.postMessage({ type: 'queued', id: entry.id });
  }

  if (type === 'sync') {
    const pendingItems = queue.filter(e => e.pending);
    // Prioritizar treinos
    pendingItems.sort((a) => a.type === 'workout' ? -1 : 1);
    
    const chunkSize = 10;
    const syncedIds: string[] = [];
    
    for (let i = 0; i < pendingItems.length; i += chunkSize) {
      const chunk = pendingItems.slice(i, i + chunkSize);
      
      for (const entry of chunk) {
        try {
          // Aqui seria fetch para o teu backend
          // console.log(`Syncing ${entry.type} chunk...`);
          await removeFromIndexedDB(entry.id);
          syncedIds.push(entry.id);
        } catch (error) {
          console.error('Sync failed', error);
        }
      }
      // Libertar a event loop do Worker entre chunks
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    
    queue = queue.filter(e => !syncedIds.includes(e.id));
    self.postMessage({ type: 'synced', ids: syncedIds, remaining: queue.length });
  }

  if (type === 'getQueue') {
    self.postMessage({ type: 'queue', queue });
  }
};

// Inicializar a queue a partir do IndexedDB
loadQueue();

export {};
