import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { sanitizeText, sanitizeUrl } from '../utils/sanitize';

export interface Vibe {
  id: string;
  userName: string;
  song: string;
  url: string | null;
  timestamp: number;
  isPublic: boolean;
  goal?: string;
}

interface VibeState {
  vibes: Vibe[];
  saveVibe: (vibe: Omit<Vibe, 'id' | 'timestamp'>) => void;
  getRecentVibes: (hours?: number) => Vibe[];
  clearOldVibes: () => void;
  importVibesFromJSON: (file: File) => Promise<void>;
  exportVibesToJSON: () => void;
}

export const useVibeStore = create<VibeState>()(
  persist(
    (set, get) => ({
      vibes: [],
      saveVibe: (vibeData) => {
        const newVibe: Vibe = {
          ...vibeData,
          id: Math.random().toString(36).substring(2, 9),
          timestamp: Date.now(),
          song: sanitizeText(vibeData.song),
          url: vibeData.url ? sanitizeUrl(vibeData.url) : null,
        };
        set((state) => ({ vibes: [newVibe, ...state.vibes] }));
      },
      getRecentVibes: (hours = 2) => {
        const cutoff = Date.now() - hours * 60 * 60 * 1000;
        return get()
          .vibes.filter((v) => v.isPublic && v.timestamp >= cutoff)
          .sort((a, b) => b.timestamp - a.timestamp);
      },
      clearOldVibes: () => {
        const cutoff = Date.now() - 4 * 60 * 60 * 1000; // 4 hours
        set((state) => ({
          vibes: state.vibes.filter((v) => v.timestamp >= cutoff),
        }));
      },
      importVibesFromJSON: async (file: File) => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const importedVibes: Vibe[] = JSON.parse(e.target?.result as string);
              if (Array.isArray(importedVibes)) {
                // Merge and deduplicate by id
                set((state) => {
                  const existingIds = new Set(state.vibes.map((v) => v.id));
                  const newVibes = importedVibes.filter((v) => !existingIds.has(v.id));
                  return {
                    vibes: [...newVibes, ...state.vibes].sort((a, b) => b.timestamp - a.timestamp),
                  };
                });
                resolve();
              } else {
                reject(new Error('Formato JSON inválido'));
              }
            } catch (err) {
              reject(err);
            }
          };
          reader.readAsText(file);
        });
      },
      exportVibesToJSON: () => {
        const data = JSON.stringify(get().vibes, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gymvibes_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      },
    }),
    {
      name: 'ft_vibes',
    },
  ),
);
