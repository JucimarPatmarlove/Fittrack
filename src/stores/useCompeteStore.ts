// ════════════════════════════════════════════════════════════════
// FitTrack V7 — useCompeteStore (Arena Competitiva)
// ════════════════════════════════════════════════════════════════
//
// Store Zustand para o sistema competitivo "Strava do treino de força".
// Fase 1: Mock data local. Fase 2: Liga ao Supabase via supabaseBrowser.
//
// Princípio: O vault cifrado local NUNCA é sincronizado.
// Apenas PRs explicitamente publicados pelo utilizador entram aqui.
// ════════════════════════════════════════════════════════════════

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── TIPOS ──────────────────────────────────────────────────────

export type WeightClass = 'open' | 'u60' | 'u70' | 'u80' | 'u90' | 'u100' | 'o100';

export interface PublicProfile {
  userId: string;
  username: string;
  avatarInitials: string;
  weightClass: WeightClass;
  totalPublishedPRs: number;
  joinedAt: number;
}

export interface PublishedPR {
  id: string;
  exerciseName: string;
  best1RM: number;
  publishedAt: number;
  isPublished: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatarInitials: string;
  weightClass: WeightClass;
  best1RM: number;
  isCurrentUser: boolean;
}

export type ChallengeStatus = 'pending' | 'active' | 'completed' | 'declined' | 'expired';

export interface Challenge {
  id: string;
  exerciseName: string;
  challengerUserId: string;
  challengerUsername: string;
  challengerResult?: number;
  targetUserId: string;
  targetUsername: string;
  targetResult?: number;
  status: ChallengeStatus;
  createdAt: number;
  deadline: number; // timestamp
  winnerId?: string;
}

// ─── MOCK DATA ──────────────────────────────────────────────────

const MOCK_USERS: PublicProfile[] = [
  { userId: 'u_iron', username: 'IronMike_PT', avatarInitials: 'IM', weightClass: 'u90', totalPublishedPRs: 12, joinedAt: Date.now() - 86400000 * 60 },
  { userId: 'u_steel', username: 'SteelQueen', avatarInitials: 'SQ', weightClass: 'u70', totalPublishedPRs: 8, joinedAt: Date.now() - 86400000 * 45 },
  { userId: 'u_titan', username: 'TitanForge', avatarInitials: 'TF', weightClass: 'u100', totalPublishedPRs: 15, joinedAt: Date.now() - 86400000 * 90 },
  { userId: 'u_ghost', username: 'GhostLifter', avatarInitials: 'GL', weightClass: 'u80', totalPublishedPRs: 6, joinedAt: Date.now() - 86400000 * 30 },
  { userId: 'u_nova', username: 'NovaPower', avatarInitials: 'NP', weightClass: 'u60', totalPublishedPRs: 10, joinedAt: Date.now() - 86400000 * 20 },
  { userId: 'u_viper', username: 'ViperStrength', avatarInitials: 'VS', weightClass: 'o100', totalPublishedPRs: 18, joinedAt: Date.now() - 86400000 * 120 },
  { userId: 'u_blaze', username: 'BlazeBarbell', avatarInitials: 'BB', weightClass: 'u90', totalPublishedPRs: 9, joinedAt: Date.now() - 86400000 * 15 },
  { userId: 'u_apex', username: 'ApexAthlete', avatarInitials: 'AA', weightClass: 'u80', totalPublishedPRs: 11, joinedAt: Date.now() - 86400000 * 55 },
];

function generateMockLeaderboard(exerciseName: string, userPR?: number): LeaderboardEntry[] {
  // Baseline weights per exercise for realistic mock data
  const baselines: Record<string, number> = {
    'Barbell Bench Press': 100,
    'Barbell Back Squat': 140,
    'Barbell Deadlift': 170,
    'Barbell Overhead Press': 65,
    'Barbell Bent Over Row': 90,
    'Pull-Up': 100,    // peso corporal + lastro
    'Dips': 95,
    'Machine Leg Press': 200,
    'Barbell Hip Thrust': 130,
    'Barbell Bicep Curl': 45,
  };
  
  const base = baselines[exerciseName] || 80;
  
  const entries: LeaderboardEntry[] = MOCK_USERS.map((u, i) => ({
    rank: 0,
    userId: u.userId,
    username: u.username,
    avatarInitials: u.avatarInitials,
    weightClass: u.weightClass,
    best1RM: Math.round(base * (1.3 - i * 0.08) + Math.random() * 10),
    isCurrentUser: false,
  }));

  // Inject current user if they have a published PR
  if (userPR && userPR > 0) {
    entries.push({
      rank: 0,
      userId: 'user_local',
      username: 'Tu',
      avatarInitials: '⭐',
      weightClass: 'open',
      best1RM: userPR,
      isCurrentUser: true,
    });
  }

  // Sort and rank
  entries.sort((a, b) => b.best1RM - a.best1RM);
  entries.forEach((e, i) => { e.rank = i + 1; });

  return entries;
}

const MOCK_CHALLENGES: Challenge[] = [
  {
    id: 'ch_1',
    exerciseName: 'Barbell Bench Press',
    challengerUserId: 'u_iron',
    challengerUsername: 'IronMike_PT',
    challengerResult: 115,
    targetUserId: 'user_local',
    targetUsername: 'Tu',
    status: 'pending',
    createdAt: Date.now() - 3600000 * 6,
    deadline: Date.now() + 86400000 * 5,
  },
  {
    id: 'ch_2',
    exerciseName: 'Barbell Back Squat',
    challengerUserId: 'user_local',
    challengerUsername: 'Tu',
    challengerResult: 130,
    targetUserId: 'u_titan',
    targetUsername: 'TitanForge',
    targetResult: 155,
    status: 'completed',
    createdAt: Date.now() - 86400000 * 10,
    deadline: Date.now() - 86400000 * 3,
    winnerId: 'u_titan',
  },
  {
    id: 'ch_3',
    exerciseName: 'Barbell Deadlift',
    challengerUserId: 'u_ghost',
    challengerUsername: 'GhostLifter',
    challengerResult: undefined,
    targetUserId: 'user_local',
    targetUsername: 'Tu',
    status: 'active',
    createdAt: Date.now() - 86400000 * 2,
    deadline: Date.now() + 86400000 * 4,
  },
];

// ─── STORE ──────────────────────────────────────────────────────

interface CompeteState {
  // Profile
  publicProfile: PublicProfile | null;
  setupProfile: (username: string, weightClass: WeightClass) => void;

  // Published PRs
  publishedPRs: PublishedPR[];
  publishPR: (exerciseName: string, best1RM: number) => void;
  unpublishPR: (exerciseName: string) => void;
  isExercisePublished: (exerciseName: string) => boolean;

  // Leaderboard
  leaderboard: LeaderboardEntry[];
  leaderboardExercise: string;
  fetchLeaderboard: (exerciseName: string) => Promise<void>;

  // Challenges
  challenges: Challenge[];
  createChallenge: (targetUserId: string, targetUsername: string, exerciseName: string, daysUntilDeadline: number) => void;
  acceptChallenge: (challengeId: string) => void;
  declineChallenge: (challengeId: string) => void;
  submitChallengeResult: (challengeId: string, result: number) => void;

  // Derived
  myRank: number | null;
  pendingChallengesCount: number;
}

export const useCompeteStore = create<CompeteState>()(
  persist(
    (set, get) => ({
      // ── Profile ──
      publicProfile: null,

      setupProfile: (username, weightClass) => {
        const initials = username.slice(0, 2).toUpperCase();
        set({
          publicProfile: {
            userId: 'user_local',
            username,
            avatarInitials: initials,
            weightClass,
            totalPublishedPRs: get().publishedPRs.filter(p => p.isPublished).length,
            joinedAt: Date.now(),
          }
        });
      },

      // ── Published PRs ──
      publishedPRs: [],

      publishPR: (exerciseName, best1RM) => {
        set(state => {
          const existing = state.publishedPRs.find(p => p.exerciseName === exerciseName);
          if (existing) {
            return {
              publishedPRs: state.publishedPRs.map(p =>
                p.exerciseName === exerciseName
                  ? { ...p, best1RM, isPublished: true, publishedAt: Date.now() }
                  : p
              ),
            };
          }
          return {
            publishedPRs: [
              ...state.publishedPRs,
              {
                id: `pr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                exerciseName,
                best1RM,
                publishedAt: Date.now(),
                isPublished: true,
              },
            ],
          };
        });
      },

      unpublishPR: (exerciseName) => {
        set(state => ({
          publishedPRs: state.publishedPRs.map(p =>
            p.exerciseName === exerciseName
              ? { ...p, isPublished: false }
              : p
          ),
        }));
      },

      isExercisePublished: (exerciseName) => {
        return get().publishedPRs.some(p => p.exerciseName === exerciseName && p.isPublished);
      },

      // ── Leaderboard ──
      leaderboard: [],
      leaderboardExercise: 'Barbell Bench Press',

      fetchLeaderboard: async (exerciseName) => {
        // Phase 1: Mock delay + generated data
        await new Promise(r => setTimeout(r, 300));
        
        const userPR = get().publishedPRs.find(
          p => p.exerciseName === exerciseName && p.isPublished
        );
        
        const entries = generateMockLeaderboard(exerciseName, userPR?.best1RM);
        const myEntry = entries.find(e => e.isCurrentUser);

        set({
          leaderboard: entries,
          leaderboardExercise: exerciseName,
          myRank: myEntry?.rank ?? null,
        });
      },

      // ── Challenges ──
      challenges: MOCK_CHALLENGES,

      createChallenge: (targetUserId, targetUsername, exerciseName, daysUntilDeadline) => {
        const profile = get().publicProfile;
        const newChallenge: Challenge = {
          id: `ch_${Date.now()}`,
          exerciseName,
          challengerUserId: 'user_local',
          challengerUsername: profile?.username || 'Tu',
          targetUserId,
          targetUsername,
          status: 'active',
          createdAt: Date.now(),
          deadline: Date.now() + daysUntilDeadline * 86400000,
        };

        set(state => ({ challenges: [newChallenge, ...state.challenges] }));
      },

      acceptChallenge: (challengeId) => {
        set(state => ({
          challenges: state.challenges.map(c =>
            c.id === challengeId ? { ...c, status: 'active' as ChallengeStatus } : c
          ),
        }));
      },

      declineChallenge: (challengeId) => {
        set(state => ({
          challenges: state.challenges.map(c =>
            c.id === challengeId ? { ...c, status: 'declined' as ChallengeStatus } : c
          ),
        }));
      },

      submitChallengeResult: (challengeId, result) => {
        set(state => ({
          challenges: state.challenges.map(c => {
            if (c.id !== challengeId) return c;

            const isChallenger = c.challengerUserId === 'user_local';
            const updated = isChallenger
              ? { ...c, challengerResult: result }
              : { ...c, targetResult: result };

            // Auto-complete if both results are in
            if (updated.challengerResult && updated.targetResult) {
              updated.status = 'completed';
              updated.winnerId = updated.challengerResult >= updated.targetResult
                ? updated.challengerUserId
                : updated.targetUserId;
            }

            return updated;
          }),
        }));
      },

      // ── Derived ──
      myRank: null,

      get pendingChallengesCount() {
        return get().challenges.filter(
          c => c.status === 'pending' && c.targetUserId === 'user_local'
        ).length;
      },
    }),
    { name: 'ft_compete_store' }
  )
);
