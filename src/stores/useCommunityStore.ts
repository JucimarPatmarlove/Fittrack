import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SocialPost {
  id: string;
  userId: string;
  userName: string;
  avatarInitials: string;
  timestamp: number;
  workoutName: string;
  durationMinutes: number;
  metrics: {
    calories?: number;
    volume?: number;
    distanceKm?: number;
    pace?: number;
  };
  kudos: number;
  hasGivenKudos: boolean;
  comments: { user: string; text: string }[];
  isWalkingCoach?: boolean;
}

interface CommunityState {
  feed: SocialPost[];
  addPost: (post: Omit<SocialPost, 'id' | 'timestamp' | 'kudos' | 'hasGivenKudos' | 'comments'>) => void;
  giveKudos: (postId: string) => void;
  addComment: (postId: string, text: string, userName: string) => void;
  populateMocksIfEmpty: () => void;
}

export const useCommunityStore = create<CommunityState>()(
  persist(
    (set, get) => ({
      feed: [],
      addPost: (postData) => {
        const newPost: SocialPost = {
          ...postData,
          id: `post_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          timestamp: Date.now(),
          kudos: 0,
          hasGivenKudos: false,
          comments: []
        };
        set((state) => ({ feed: [newPost, ...state.feed] }));
      },
      giveKudos: (postId) => {
        set((state) => ({
          feed: state.feed.map(p => {
            if (p.id === postId && !p.hasGivenKudos) {
              return { ...p, kudos: p.kudos + 1, hasGivenKudos: true };
            }
            return p;
          })
        }));
      },
      addComment: (postId, text, userName) => {
        set((state) => ({
          feed: state.feed.map(p => {
            if (p.id === postId) {
              return { ...p, comments: [...p.comments, { user: userName, text }] };
            }
            return p;
          })
        }));
      },
      populateMocksIfEmpty: () => {
        if (get().feed.length > 0) return;
        
        const now = Date.now();
        const mocks: SocialPost[] = [
          {
            id: 'mock_1', userId: 'u1', userName: 'Alex Silva', avatarInitials: 'AS',
            timestamp: now - 3600000 * 2, // 2h ago
            workoutName: 'Caminhada c/ Radar',
            durationMinutes: 45,
            metrics: { distanceKm: 5.2, pace: 8.5, calories: 350 },
            kudos: 12, hasGivenKudos: false, comments: [{ user: 'Maria', text: 'Boa corrida!' }],
            isWalkingCoach: true
          },
          {
            id: 'mock_2', userId: 'u2', userName: 'Bruno Costa', avatarInitials: 'BC',
            timestamp: now - 3600000 * 5, // 5h ago
            workoutName: 'Dia de Pernas Infernal',
            durationMinutes: 60,
            metrics: { volume: 12500, calories: 420 },
            kudos: 24, hasGivenKudos: false, comments: [],
            isWalkingCoach: false
          },
          {
            id: 'mock_3', userId: 'u3', userName: 'Cyber Ninja', avatarInitials: 'CN',
            timestamp: now - 3600000 * 24, // 1 day ago
            workoutName: 'Full Body HIIT',
            durationMinutes: 30,
            metrics: { calories: 500 },
            kudos: 8, hasGivenKudos: false, comments: [{ user: 'Tu', text: 'Máquina!' }],
            isWalkingCoach: false
          }
        ];
        
        set({ feed: mocks });
      }
    }),
    {
      name: 'ft_community_feed'
    }
  )
);
