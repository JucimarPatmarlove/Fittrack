import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Club {
  id: string;
  name: string;
  code: string;
  members: { id: string; username: string; xpThisWeek: number }[];
  weeklyGoal: number; // kg ou XP
  weeklyProgress: number;
}

interface SocialStore {
  myClub: Club | null;
  createClub: (name: string) => Promise<string>;
  joinClub: (code: string) => Promise<void>;
  submitXP: (xp: number) => void;
  leaveClub: () => void;
}

export const useSocialStore = create<SocialStore>()(
  persist(
    (set, get) => ({
      myClub: null,
      
      createClub: async (name: string) => {
        // MOCK Supabase response
        await new Promise(resolve => setTimeout(resolve, 500));
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        const newClub: Club = {
            id: crypto.randomUUID(),
            name,
            code,
            members: [{ id: 'user_local', username: 'Atleta (Você)', xpThisWeek: 0 }],
            weeklyGoal: 30000,
            weeklyProgress: 0
        };
        set({ myClub: newClub });
        return code;
      },
      
      joinClub: async (code: string) => {
        // MOCK Supabase join
        await new Promise(resolve => setTimeout(resolve, 500));
        if (code === 'MOTRA1') {
            const fakeClub: Club = {
                id: crypto.randomUUID(),
                name: "Iron Brotherhood",
                code: "MOTRA1",
                members: [
                    { id: 'user_1', username: 'Arnold_PT', xpThisWeek: 4500 },
                    { id: 'user_local', username: 'Atleta (Você)', xpThisWeek: 0 }
                ],
                weeklyGoal: 30000,
                weeklyProgress: 4500
            };
            set({ myClub: fakeClub });
        } else {
            throw new Error('Código de clube inválido. Tente "MOTRA1"');
        }
      },
      
      submitXP: (xp: number) => {
        const { myClub } = get();
        if (!myClub) return;
        
        set((state) => {
            if (!state.myClub) return state;
            const updatedMembers = state.myClub.members.map(m => 
                m.id === 'user_local' ? { ...m, xpThisWeek: m.xpThisWeek + xp } : m
            );
            return {
                myClub: {
                    ...state.myClub,
                    weeklyProgress: state.myClub.weeklyProgress + xp,
                    members: updatedMembers
                }
            };
        });
      },

      leaveClub: () => set({ myClub: null })
    }),
    { name: 'social-mock-storage' }
  )
);
