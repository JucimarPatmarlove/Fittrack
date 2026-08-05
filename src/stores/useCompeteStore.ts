// ════════════════════════════════════════════════════════════════
// FitTrack V7 — useCompeteStore (Arena Competitiva)
// ════════════════════════════════════════════════════════════════
//
// Store Zustand para o sistema competitivo "Strava do treino de força".
// Quando configurado via VITE_SUPABASE_URL, liga-se ao Supabase
// mantendo os dados de fallback local para quando estiver offline.
// ════════════════════════════════════════════════════════════════

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getSupabaseBrowser, signInAnonymously } from '../lib/supabaseBrowser';

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
  deadline: number;
  winnerId?: string;
}

// ─── MOCK DATA (Fallback) ───────────────────────────────────────

const MOCK_USERS: PublicProfile[] = [
  { userId: 'u_iron', username: 'IronMike_PT', avatarInitials: 'IM', weightClass: 'u90', totalPublishedPRs: 12, joinedAt: Date.now() - 86400000 * 60 },
  { userId: 'u_steel', username: 'SteelQueen', avatarInitials: 'SQ', weightClass: 'u70', totalPublishedPRs: 8, joinedAt: Date.now() - 86400000 * 45 },
  { userId: 'u_titan', username: 'TitanForge', avatarInitials: 'TF', weightClass: 'u100', totalPublishedPRs: 15, joinedAt: Date.now() - 86400000 * 90 },
];

function generateMockLeaderboard(exerciseName: string, userPR?: number): LeaderboardEntry[] {
  const baselines: Record<string, number> = {
    'Barbell Bench Press': 100, 'Barbell Back Squat': 140, 'Barbell Deadlift': 170,
  };
  const base = baselines[exerciseName] || 80;
  
  const entries: LeaderboardEntry[] = MOCK_USERS.map((u, i) => ({
    rank: 0, userId: u.userId, username: u.username, avatarInitials: u.avatarInitials,
    weightClass: u.weightClass, best1RM: Math.round(base * (1.3 - i * 0.08) + Math.random() * 10),
    isCurrentUser: false,
  }));

  if (userPR && userPR > 0) {
    entries.push({
      rank: 0, userId: 'user_local', username: 'Tu', avatarInitials: '⭐', weightClass: 'open',
      best1RM: userPR, isCurrentUser: true,
    });
  }

  entries.sort((a, b) => b.best1RM - a.best1RM);
  entries.forEach((e, i) => { e.rank = i + 1; });
  return entries;
}

// ─── STORE ──────────────────────────────────────────────────────

interface CompeteState {
  // Profile
  publicProfile: PublicProfile | null;
  setupProfile: (username: string, weightClass: WeightClass) => Promise<void>;

  // Published PRs
  publishedPRs: PublishedPR[];
  publishPR: (exerciseName: string, best1RM: number) => Promise<void>;
  unpublishPR: (exerciseName: string) => Promise<void>;
  isExercisePublished: (exerciseName: string) => boolean;

  // Leaderboard
  leaderboard: LeaderboardEntry[];
  leaderboardExercise: string;
  fetchLeaderboard: (exerciseName: string) => Promise<void>;

  // Challenges
  challenges: Challenge[];
  fetchChallenges: () => Promise<void>;
  createChallenge: (targetUserId: string, targetUsername: string, exerciseName: string, daysUntilDeadline: number) => Promise<void>;
  acceptChallenge: (challengeId: string) => Promise<void>;
  declineChallenge: (challengeId: string) => Promise<void>;
  submitChallengeResult: (challengeId: string, result: number) => Promise<void>;

  // Derived
  myRank: number | null;
  pendingChallengesCount: number;
}

export const useCompeteStore = create<CompeteState>()(
  persist(
    (set, get) => ({
      // ── Profile ──
      publicProfile: null,

      setupProfile: async (username, weightClass) => {
        const initials = username.slice(0, 2).toUpperCase();
        let userId = 'user_local';
        
        const sb = getSupabaseBrowser();
        if (sb) {
          const authId = await signInAnonymously();
          if (authId) {
            userId = authId;
            await sb.from('compete_profiles').upsert({
              user_id: userId,
              username,
              avatar_initials: initials,
              weight_class: weightClass,
            });
          }
        }

        set({
          publicProfile: {
            userId,
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

      publishPR: async (exerciseName, best1RM) => {
        const profile = get().publicProfile;
        const sb = getSupabaseBrowser();

        if (sb && profile && profile.userId !== 'user_local') {
          await sb.from('compete_prs').upsert({
            user_id: profile.userId,
            exercise_name: exerciseName,
            best_1rm: best1RM,
          }, { onConflict: 'user_id, exercise_name' });
        }

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
                id: `pr_${Date.now()}`,
                exerciseName,
                best1RM,
                publishedAt: Date.now(),
                isPublished: true,
              },
            ],
          };
        });
      },

      unpublishPR: async (exerciseName) => {
        const profile = get().publicProfile;
        const sb = getSupabaseBrowser();

        if (sb && profile && profile.userId !== 'user_local') {
          await sb.from('compete_prs')
            .delete()
            .eq('user_id', profile.userId)
            .eq('exercise_name', exerciseName);
        }

        set(state => ({
          publishedPRs: state.publishedPRs.map(p =>
            p.exerciseName === exerciseName ? { ...p, isPublished: false } : p
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
        const sb = getSupabaseBrowser();
        
        if (sb) {
          const { data, error } = await sb
            .from('compete_prs')
            .select(`
              best_1rm,
              compete_profiles (user_id, username, avatar_initials, weight_class)
            `)
            .eq('exercise_name', exerciseName)
            .order('best_1rm', { ascending: false })
            .limit(50);

          if (!error && data) {
            const myId = get().publicProfile?.userId;
            const entries: LeaderboardEntry[] = data.map((d: any, i) => ({
              rank: i + 1,
              userId: d.compete_profiles.user_id,
              username: d.compete_profiles.username,
              avatarInitials: d.compete_profiles.avatar_initials,
              weightClass: d.compete_profiles.weight_class,
              best1RM: d.best_1rm,
              isCurrentUser: d.compete_profiles.user_id === myId,
            }));
            
            const myEntry = entries.find(e => e.isCurrentUser);
            set({ leaderboard: entries, leaderboardExercise: exerciseName, myRank: myEntry?.rank ?? null });
            return;
          }
        }

        // Fallback to mock
        const userPR = get().publishedPRs.find(p => p.exerciseName === exerciseName && p.isPublished);
        const entries = generateMockLeaderboard(exerciseName, userPR?.best1RM);
        const myEntry = entries.find(e => e.isCurrentUser);
        set({ leaderboard: entries, leaderboardExercise: exerciseName, myRank: myEntry?.rank ?? null });
      },

      // ── Challenges ──
      challenges: [],

      fetchChallenges: async () => {
        const sb = getSupabaseBrowser();
        const profile = get().publicProfile;

        if (sb && profile && profile.userId !== 'user_local') {
          const { data, error } = await sb
            .from('compete_challenges')
            .select(`
              *,
              challenger:compete_profiles!challenger_id(username),
              target:compete_profiles!target_id(username)
            `)
            .or(`challenger_id.eq.${profile.userId},target_id.eq.${profile.userId}`)
            .order('created_at', { ascending: false });

          if (!error && data) {
            const parsed: Challenge[] = data.map((d: any) => ({
              id: d.id,
              exerciseName: d.exercise_name,
              challengerUserId: d.challenger_id,
              challengerUsername: d.challenger?.username || '?',
              challengerResult: d.challenger_result,
              targetUserId: d.target_id,
              targetUsername: d.target?.username || '?',
              targetResult: d.target_result,
              status: d.status as ChallengeStatus,
              createdAt: new Date(d.created_at).getTime(),
              deadline: new Date(d.deadline).getTime(),
              winnerId: d.winner_id,
            }));
            set({ challenges: parsed });
          }
        }
      },

      createChallenge: async (targetUserId, targetUsername, exerciseName, daysUntilDeadline) => {
        const profile = get().publicProfile;
        const sb = getSupabaseBrowser();
        const deadline = new Date(Date.now() + daysUntilDeadline * 86400000).toISOString();

        let newId = `ch_${Date.now()}`;

        if (sb && profile && profile.userId !== 'user_local') {
          const { data } = await sb.from('compete_challenges').insert({
            exercise_name: exerciseName,
            challenger_id: profile.userId,
            target_id: targetUserId,
            deadline,
          }).select('id').single();
          if (data) newId = data.id;
        }

        const newChallenge: Challenge = {
          id: newId,
          exerciseName,
          challengerUserId: profile?.userId || 'user_local',
          challengerUsername: profile?.username || 'Tu',
          targetUserId,
          targetUsername,
          status: 'pending',
          createdAt: Date.now(),
          deadline: new Date(deadline).getTime(),
        };

        set(state => ({ challenges: [newChallenge, ...state.challenges] }));
      },

      acceptChallenge: async (challengeId) => {
        const sb = getSupabaseBrowser();
        if (sb && !challengeId.startsWith('ch_')) {
          await sb.from('compete_challenges').update({ status: 'active' }).eq('id', challengeId);
        }

        set(state => ({
          challenges: state.challenges.map(c =>
            c.id === challengeId ? { ...c, status: 'active' as ChallengeStatus } : c
          ),
        }));
      },

      declineChallenge: async (challengeId) => {
        const sb = getSupabaseBrowser();
        if (sb && !challengeId.startsWith('ch_')) {
          await sb.from('compete_challenges').update({ status: 'declined' }).eq('id', challengeId);
        }

        set(state => ({
          challenges: state.challenges.map(c =>
            c.id === challengeId ? { ...c, status: 'declined' as ChallengeStatus } : c
          ),
        }));
      },

      submitChallengeResult: async (challengeId, result) => {
        const profile = get().publicProfile;
        const stateChallenge = get().challenges.find(c => c.id === challengeId);
        if (!profile || !stateChallenge) return;

        const isChallenger = stateChallenge.challengerUserId === profile.userId;
        const updates: any = {};
        
        if (isChallenger) updates.challenger_result = result;
        else updates.target_result = result;

        // Verify if both have completed to set winner
        const opponentResult = isChallenger ? stateChallenge.targetResult : stateChallenge.challengerResult;
        
        if (opponentResult) {
          updates.status = 'completed';
          updates.winner_id = result >= opponentResult 
            ? profile.userId 
            : (isChallenger ? stateChallenge.targetUserId : stateChallenge.challengerUserId);
        }

        const sb = getSupabaseBrowser();
        if (sb && !challengeId.startsWith('ch_')) {
          await sb.from('compete_challenges').update(updates).eq('id', challengeId);
        }

        set(state => ({
          challenges: state.challenges.map(c => {
            if (c.id !== challengeId) return c;
            return { ...c, ...updates, winnerId: updates.winner_id };
          }),
        }));
      },

      // ── Derived ──
      myRank: null,

      get pendingChallengesCount() {
        const profile = get().publicProfile;
        if (!profile) return 0;
        return get().challenges.filter(
          c => c.status === 'pending' && c.targetUserId === profile.userId
        ).length;
      },
    }),
    { name: 'ft_compete_store' }
  )
);
