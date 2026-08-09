// ════════════════════════════════════════════════════════════════
// FitTrack — Store da Rede Social (real, Supabase + RLS)
// ════════════════════════════════════════════════════════════════
//
// Substitui o protótipo mock anterior (setTimeout + Math.random(),
// sem backend real). Schema em supabase/migrations/001_social.sql.
//
// PRINCÍPIO DE DESENHO: o vault local (IndexedDB cifrado com AES-GCM)
// continua a ser a única fonte de verdade dos dados de treino. Esta
// store só lida com o que o utilizador publica explicitamente
// (ação "Partilhar PR" / entrar num clube/desafio) — nunca sincroniza
// o vault inteiro nem envia dados sem uma ação explícita do utilizador.
//
// Sem persist/encryptedStorage: os dados aqui são remotos e devem ser
// sempre refrescados. A sessão de auth já é persistida pelo próprio
// supabase-js (localStorage próprio, gerido pela lib).
// ════════════════════════════════════════════════════════════════

import { create } from 'zustand';
import { getSocialClient, isSocialConfigured } from '../services/supabaseClient';

export type MetricType = '1rm' | 'volume' | 'reps' | 'duration';
export type ChallengeStatus = 'open' | 'active' | 'finished' | 'cancelled';

export interface Profile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string;
}

export interface LeaderboardEntry {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  exerciseName: string;
  metricType: MetricType;
  value: number;
  unit: string;
  createdAt: string;
}

export interface SocialChallenge {
  id: string;
  creatorId: string;
  exerciseName: string;
  metricType: MetricType;
  title: string;
  startsAt: string;
  endsAt: string;
  status: ChallengeStatus;
}

export interface ClubMember {
  id: string;
  username: string;
  xpThisWeek: number;
}

export interface Club {
  id: string;
  name: string;
  code: string;
  members: ClubMember[];
  weeklyGoal: number;
  weeklyProgress: number;
}

interface SocialState {
  isConfigured: boolean;
  profile: Profile | null;
  authLoading: boolean;
  authError: string | null;

  leaderboard: LeaderboardEntry[];
  leaderboardLoading: boolean;

  challenges: SocialChallenge[];
  challengesLoading: boolean;

  myClub: Club | null;
  clubLoading: boolean;
  clubError: string | null;

  // ── Auth ──
  loadSession: () => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;

  // ── Publicação (opt-in explícito, nunca automático a partir do vault) ──
  publishPR: (input: {
    exerciseName: string;
    metricType: MetricType;
    value: number;
    unit?: string;
    reps?: number;
    note?: string;
    visibility?: 'public' | 'followers';
  }) => Promise<{ error: string | null }>;

  // ── Leaderboard ──
  fetchLeaderboard: (exerciseName: string, metricType: MetricType) => Promise<void>;

  // ── Desafios ──
  createChallenge: (input: {
    exerciseName: string;
    metricType: MetricType;
    title: string;
    endsAt: string;
  }) => Promise<{ error: string | null; challengeId?: string }>;
  fetchOpenChallenges: () => Promise<void>;
  joinChallenge: (challengeId: string) => Promise<{ error: string | null }>;
  updateMyChallengeMark: (challengeId: string, value: number) => Promise<{ error: string | null }>;

  // ── Clubes (agora real, substitui o mock) ──
  loadMyClub: () => Promise<void>;
  createClub: (name: string) => Promise<string>;
  joinClub: (code: string) => Promise<void>;
  submitXP: (xp: number) => Promise<void>;
  leaveClub: () => Promise<void>;
}

function genClubCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let out = '';
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  for (let i = 0; i < 6; i++) out += chars[(bytes[i] ?? 0) % chars.length];
  return out;
}

async function loadClubById(supabase: ReturnType<typeof getSocialClient>, clubId: string): Promise<Club | null> {
  if (!supabase) return null;
  const { data: club, error } = await supabase
    .from('clubs')
    .select('id, name, code, weekly_goal_xp')
    .eq('id', clubId)
    .maybeSingle();
  if (error || !club) return null;

  const { data: members } = await supabase
    .from('club_members')
    .select('user_id, xp_this_week, profiles(username)')
    .eq('club_id', clubId);

  const memberList: ClubMember[] = (members ?? []).map((m: any) => ({
    id: m.user_id,
    username: m.profiles?.username ?? 'Atleta',
    xpThisWeek: m.xp_this_week,
  }));

  return {
    id: club.id,
    name: club.name,
    code: club.code,
    members: memberList,
    weeklyGoal: club.weekly_goal_xp,
    weeklyProgress: memberList.reduce((sum, m) => sum + m.xpThisWeek, 0),
  };
}

export const useSocialStore = create<SocialState>()((set, get) => ({
  isConfigured: isSocialConfigured(),
  profile: null,
  authLoading: false,
  authError: null,

  leaderboard: [],
  leaderboardLoading: false,

  challenges: [],
  challengesLoading: false,

  myClub: null,
  clubLoading: false,
  clubError: null,

  // ══ Auth ══════════════════════════════════════════════════════
  loadSession: async () => {
    const supabase = getSocialClient();
    if (!supabase) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      set({ profile: null, myClub: null });
      return;
    }
    const { data } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, bio')
      .eq('id', session.user.id)
      .maybeSingle();
    if (data) {
      set({
        profile: {
          id: data.id,
          username: data.username,
          displayName: data.display_name,
          avatarUrl: data.avatar_url,
          bio: data.bio,
        },
      });
      await get().loadMyClub();
    }
  },

  signUp: async (email, password, username) => {
    const supabase = getSocialClient();
    if (!supabase) return { error: 'Rede social não configurada.' };
    set({ authLoading: true, authError: null });

    const { data: existing } = await supabase.from('profiles').select('id').eq('username', username).maybeSingle();
    if (existing) {
      const errorMsg = 'Username já está em uso.';
      set({ authLoading: false, authError: errorMsg });
      return { error: errorMsg };
    }

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error || !data.user) {
      const message = error?.message ?? 'Falha no registo.';
      set({ authLoading: false, authError: message });
      return { error: message };
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .insert({ id: data.user.id, username, display_name: username });

    if (profileError) {
      set({ authLoading: false, authError: profileError.message });
      return { error: profileError.message };
    }

    set({
      authLoading: false,
      profile: { id: data.user.id, username, displayName: username },
    });
    return { error: null };
  },

  signIn: async (email, password) => {
    const supabase = getSocialClient();
    if (!supabase) return { error: 'Rede social não configurada.' };
    set({ authLoading: true, authError: null });

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      set({ authLoading: false, authError: error.message });
      return { error: error.message };
    }

    await get().loadSession();
    set({ authLoading: false });
    return { error: null };
  },

  signOut: async () => {
    const supabase = getSocialClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    set({ profile: null, myClub: null });
  },

  // ══ Publicação de PRs ═════════════════════════════════════════
  publishPR: async ({ exerciseName, metricType, value, unit = 'kg', reps, note, visibility = 'public' }) => {
    const supabase = getSocialClient();
    const { profile } = get();
    if (!supabase || !profile) return { error: 'Precisas de sessão iniciada para publicar.' };

    const { error } = await supabase.from('activities').insert({
      user_id: profile.id,
      exercise_name: exerciseName,
      metric_type: metricType,
      value,
      unit,
      reps,
      note,
      visibility,
    });

    return { error: error?.message ?? null };
  },

  // ══ Leaderboard ═══════════════════════════════════════════════
  fetchLeaderboard: async (exerciseName, metricType) => {
    const supabase = getSocialClient();
    if (!supabase) return;
    set({ leaderboardLoading: true });

    const { data, error } = await supabase
      .from('leaderboard')
      .select('*')
      .eq('exercise_name', exerciseName)
      .eq('metric_type', metricType)
      .order('value', { ascending: false })
      .limit(50);

    if (error) {
      console.error('[Social] fetchLeaderboard:', error.message);
      set({ leaderboardLoading: false });
      return;
    }

    set({
      leaderboard: (data ?? []).map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        username: row.username,
        displayName: row.display_name,
        avatarUrl: row.avatar_url,
        exerciseName: row.exercise_name,
        metricType: row.metric_type,
        value: row.value,
        unit: row.unit,
        createdAt: row.created_at,
      })),
      leaderboardLoading: false,
    });
  },

  // ══ Desafios ══════════════════════════════════════════════════
  createChallenge: async ({ exerciseName, metricType, title, endsAt }) => {
    const supabase = getSocialClient();
    const { profile } = get();
    if (!supabase || !profile) return { error: 'Precisas de sessão iniciada para criar um desafio.' };

    const { data, error } = await supabase
      .from('challenges')
      .insert({
        creator_id: profile.id,
        exercise_name: exerciseName,
        metric_type: metricType,
        title,
        ends_at: endsAt,
        status: 'open',
      })
      .select('id')
      .single();

    if (error) return { error: error.message };

    await supabase.from('challenge_participants').insert({
      challenge_id: data.id,
      user_id: profile.id,
    });

    return { error: null, challengeId: data.id };
  },

  fetchOpenChallenges: async () => {
    const supabase = getSocialClient();
    if (!supabase) return;
    set({ challengesLoading: true });

    const { data, error } = await supabase
      .from('challenges')
      .select('id, creator_id, exercise_name, metric_type, title, starts_at, ends_at, status')
      .in('status', ['open', 'active'])
      .order('ends_at', { ascending: true });

    if (error) {
      console.error('[Social] fetchOpenChallenges:', error.message);
      set({ challengesLoading: false });
      return;
    }

    set({
      challenges: (data ?? []).map((row: any) => ({
        id: row.id,
        creatorId: row.creator_id,
        exerciseName: row.exercise_name,
        metricType: row.metric_type,
        title: row.title,
        startsAt: row.starts_at,
        endsAt: row.ends_at,
        status: row.status,
      })),
      challengesLoading: false,
    });
  },

  joinChallenge: async (challengeId) => {
    const supabase = getSocialClient();
    const { profile } = get();
    if (!supabase || !profile) return { error: 'Precisas de sessão iniciada para entrar num desafio.' };

    const { error } = await supabase
      .from('challenge_participants')
      .insert({ challenge_id: challengeId, user_id: profile.id });

    return { error: error?.message ?? null };
  },

  updateMyChallengeMark: async (challengeId, value) => {
    const supabase = getSocialClient();
    const { profile } = get();
    if (!supabase || !profile) return { error: 'Precisas de sessão iniciada.' };

    const { error } = await supabase
      .from('challenge_participants')
      .update({ best_value: value })
      .eq('challenge_id', challengeId)
      .eq('user_id', profile.id);

    return { error: error?.message ?? null };
  },

  // ══ Clubes (real, substitui o mock) ═══════════════════════════
  loadMyClub: async () => {
    const supabase = getSocialClient();
    const { profile } = get();
    if (!supabase || !profile) return;
    set({ clubLoading: true });

    const { data: membership } = await supabase
      .from('club_members')
      .select('club_id')
      .eq('user_id', profile.id)
      .maybeSingle();

    if (!membership) {
      set({ myClub: null, clubLoading: false });
      return;
    }

    const club = await loadClubById(supabase, membership.club_id);
    set({ myClub: club, clubLoading: false });
  },

  createClub: async (name) => {
    const supabase = getSocialClient();
    const { profile } = get();
    if (!supabase || !profile) throw new Error('Precisas de sessão iniciada para criar um clube.');
    set({ clubLoading: true, clubError: null });

    const code = genClubCode();
    const { data, error } = await supabase
      .from('clubs')
      .insert({ name, code, owner_id: profile.id })
      .select('id')
      .single();

    if (error) {
      set({ clubLoading: false, clubError: error.message });
      throw new Error(error.message);
    }

    await supabase.from('club_members').insert({ club_id: data.id, user_id: profile.id });
    const club = await loadClubById(supabase, data.id);
    set({ myClub: club, clubLoading: false });
    return code;
  },

  joinClub: async (code) => {
    const supabase = getSocialClient();
    const { profile } = get();
    if (!supabase || !profile) throw new Error('Precisas de sessão iniciada para entrar num clube.');
    set({ clubLoading: true, clubError: null });

    const { data: club, error: findError } = await supabase
      .from('clubs')
      .select('id')
      .eq('code', code)
      .maybeSingle();

    if (findError || !club) {
      const message = 'Código de clube inválido.';
      set({ clubLoading: false, clubError: message });
      throw new Error(message);
    }

    const { error: joinError } = await supabase
      .from('club_members')
      .insert({ club_id: club.id, user_id: profile.id });

    if (joinError) {
      // A trigger de limite de 10 membros dispara aqui como exceção do Postgres
      const message = joinError.message.includes('máximo de 10 membros')
        ? 'Este clube já está cheio (máximo 10 membros).'
        : joinError.message;
      set({ clubLoading: false, clubError: message });
      throw new Error(message);
    }

    const loaded = await loadClubById(supabase, club.id);
    set({ myClub: loaded, clubLoading: false });
  },

  submitXP: async (xp) => {
    const supabase = getSocialClient();
    const { profile, myClub } = get();
    if (!supabase || !profile || !myClub) return;

    const current = myClub.members.find((m) => m.id === profile.id)?.xpThisWeek ?? 0;
    const { error } = await supabase
      .from('club_members')
      .update({ xp_this_week: current + xp })
      .eq('club_id', myClub.id)
      .eq('user_id', profile.id);

    if (!error) {
      set({
        myClub: {
          ...myClub,
          weeklyProgress: myClub.weeklyProgress + xp,
          members: myClub.members.map((m) =>
            m.id === profile.id ? { ...m, xpThisWeek: m.xpThisWeek + xp } : m
          ),
        },
      });
    }
  },

  leaveClub: async () => {
    const supabase = getSocialClient();
    const { profile, myClub } = get();
    if (!supabase || !profile || !myClub) return;

    await supabase
      .from('club_members')
      .delete()
      .eq('club_id', myClub.id)
      .eq('user_id', profile.id);

    set({ myClub: null });
  },
}));