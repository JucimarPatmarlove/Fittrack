-- ════════════════════════════════════════════════════════════════
-- FitTrack V7 — Database Initialization (Self-Hosted)
-- ════════════════════════════════════════════════════════════════
-- Este script corre automaticamente no primeiro `docker compose up`.
-- Cria o stub de autenticação e as tabelas de social/competição.
--
-- NOTA: Em modo self-hosted, os dados de treino (sets, PRs, nutrição)
-- ficam no IndexedDB cifrado do browser. Este PostgreSQL armazena
-- APENAS funcionalidades sociais (perfis, leaderboards, desafios).
-- ════════════════════════════════════════════════════════════════

-- ─── EXTENSÕES ─────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── STUB AUTH (Compatibilidade com Supabase Migrations) ───────
-- Simula o esquema auth.users do Supabase para que as foreign keys
-- das migrations sociais funcionem sem o GoTrue Auth Server.
CREATE SCHEMA IF NOT EXISTS auth;

CREATE TABLE IF NOT EXISTS auth.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Função auxiliar que simula auth.uid() do Supabase
-- Em self-hosted, o user_id é passado via variável de sessão
CREATE OR REPLACE FUNCTION auth.uid() RETURNS UUID AS $$
  SELECT COALESCE(
    nullif(current_setting('app.current_user_id', true), '')::UUID,
    '00000000-0000-0000-0000-000000000000'::UUID
  );
$$ LANGUAGE SQL STABLE;

-- Criar um utilizador local default para self-hosted
INSERT INTO auth.users (id, email) VALUES
  ('00000000-0000-0000-0000-000000000001', 'selfhost@fittrack.local')
ON CONFLICT (id) DO NOTHING;


-- ═══════════════════════════════════════════════════════════════
-- PROFILES (Rede Social)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL CHECK (char_length(username) BETWEEN 3 AND 24 AND username ~ '^[a-z0-9_]+$'),
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  bio TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Perfil default para self-hosted
INSERT INTO public.profiles (id, username, display_name) VALUES
  ('00000000-0000-0000-0000-000000000001', 'athlete', 'Atleta Local')
ON CONFLICT (id) DO NOTHING;


-- ═══════════════════════════════════════════════════════════════
-- FOLLOWS
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.follows (
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  followee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, followee_id),
  CONSTRAINT no_self_follow CHECK (follower_id <> followee_id)
);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "follows_select" ON public.follows FOR SELECT USING (true);
CREATE POLICY "follows_insert" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "follows_delete" ON public.follows FOR DELETE USING (auth.uid() = follower_id);


-- ═══════════════════════════════════════════════════════════════
-- ACTIVITIES (PRs / Treinos Publicados)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('1rm', 'volume', 'reps', 'duration')),
  value NUMERIC NOT NULL CHECK (value > 0),
  unit TEXT NOT NULL DEFAULT 'kg',
  reps INTEGER,
  note TEXT,
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'followers')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS activities_exercise_value_idx
  ON public.activities (exercise_name, metric_type, value DESC);
CREATE INDEX IF NOT EXISTS activities_user_created_idx
  ON public.activities (user_id, created_at DESC);

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activities_select" ON public.activities FOR SELECT USING (
  visibility = 'public'
  OR user_id = auth.uid()
  OR (visibility = 'followers' AND EXISTS (
    SELECT 1 FROM public.follows WHERE follower_id = auth.uid() AND followee_id = activities.user_id
  ))
);
CREATE POLICY "activities_insert" ON public.activities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "activities_delete" ON public.activities FOR DELETE USING (auth.uid() = user_id);


-- ═══════════════════════════════════════════════════════════════
-- CHALLENGES (Desafios 1v1)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('1rm', 'volume', 'reps')),
  title TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'active', 'finished', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ends_after_starts CHECK (ends_at > starts_at)
);

ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "challenges_select" ON public.challenges FOR SELECT USING (true);
CREATE POLICY "challenges_insert" ON public.challenges FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "challenges_update" ON public.challenges FOR UPDATE USING (auth.uid() = creator_id);


-- ═══════════════════════════════════════════════════════════════
-- CHALLENGE PARTICIPANTS
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.challenge_participants (
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  best_value NUMERIC,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (challenge_id, user_id)
);

ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cp_select" ON public.challenge_participants FOR SELECT USING (true);
CREATE POLICY "cp_insert" ON public.challenge_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cp_update" ON public.challenge_participants FOR UPDATE USING (auth.uid() = user_id);


-- ═══════════════════════════════════════════════════════════════
-- CLUBS
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 3 AND 40),
  code TEXT NOT NULL UNIQUE CHECK (code ~ '^[A-Z0-9]{6}$'),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  weekly_goal_xp INTEGER NOT NULL DEFAULT 30000 CHECK (weekly_goal_xp > 0),
  is_official BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clubs_select" ON public.clubs FOR SELECT USING (true);
CREATE POLICY "clubs_insert" ON public.clubs FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "clubs_update" ON public.clubs FOR UPDATE USING (auth.uid() = owner_id);


-- ═══════════════════════════════════════════════════════════════
-- CLUB MEMBERS
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.club_members (
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  xp_this_week INTEGER NOT NULL DEFAULT 0 CHECK (xp_this_week >= 0),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (club_id, user_id)
);

ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cm_select" ON public.club_members FOR SELECT USING (true);
CREATE POLICY "cm_insert" ON public.club_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cm_update" ON public.club_members FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "cm_delete" ON public.club_members FOR DELETE USING (auth.uid() = user_id);

-- Limite de 10 membros por clube
CREATE OR REPLACE FUNCTION public.enforce_club_member_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT count(*) FROM public.club_members WHERE club_id = NEW.club_id) >= 10 THEN
    RAISE EXCEPTION 'Este clube já tem o máximo de 10 membros.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER club_member_limit
  BEFORE INSERT ON public.club_members
  FOR EACH ROW EXECUTE FUNCTION public.enforce_club_member_limit();


-- ═══════════════════════════════════════════════════════════════
-- COMPETE ARENA (PRs Públicos)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.compete_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE CHECK (char_length(username) >= 3),
  avatar_initials TEXT NOT NULL,
  weight_class TEXT NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.compete_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "compete_profiles_select" ON public.compete_profiles FOR SELECT USING (true);
CREATE POLICY "compete_profiles_insert" ON public.compete_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "compete_profiles_update" ON public.compete_profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.compete_prs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.compete_profiles(user_id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  best_1rm NUMERIC NOT NULL,
  published_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, exercise_name)
);

ALTER TABLE public.compete_prs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "compete_prs_select" ON public.compete_prs FOR SELECT USING (true);
CREATE POLICY "compete_prs_insert" ON public.compete_prs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "compete_prs_update" ON public.compete_prs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "compete_prs_delete" ON public.compete_prs FOR DELETE USING (auth.uid() = user_id);


-- ═══════════════════════════════════════════════════════════════
-- LEADERBOARD VIEW
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE VIEW public.leaderboard AS
SELECT DISTINCT ON (user_id, exercise_name, metric_type)
  a.id,
  a.user_id,
  p.username,
  p.display_name,
  p.avatar_url,
  a.exercise_name,
  a.metric_type,
  a.value,
  a.unit,
  a.created_at
FROM public.activities a
JOIN public.profiles p ON p.id = a.user_id
WHERE a.visibility = 'public'
ORDER BY user_id, exercise_name, metric_type, value DESC;


-- ════════════════════════════════════════════════════════════════
-- ✅ Inicialização completa
-- ════════════════════════════════════════════════════════════════
DO $$
BEGIN
  RAISE NOTICE '══════════════════════════════════════════════';
  RAISE NOTICE '  FitTrack V7 — Base de dados inicializada!  ';
  RAISE NOTICE '  Tabelas: profiles, follows, activities,    ';
  RAISE NOTICE '  challenges, clubs, compete_profiles/prs    ';
  RAISE NOTICE '══════════════════════════════════════════════';
END $$;
