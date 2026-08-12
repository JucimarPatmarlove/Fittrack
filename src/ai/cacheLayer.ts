import { get, set } from 'idb-keyval';

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 horas

interface CacheEntry {
  workout: any;
  timestamp: number;
}

export const getCachedWorkout = async (contextHash: string) => {
  try {
    const cached = await get<CacheEntry>(`fittrack_ai_${contextHash}`);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.workout;
    }
    return null;
  } catch (_e) {
    return null;
  }
};

export const cacheWorkout = async (contextHash: string, workout: any) => {
  try {
    await set(`fittrack_ai_${contextHash}`, {
      workout,
      timestamp: Date.now(),
    });
  } catch (e) {
    console.warn('IDB caching failed', e);
  }
};
