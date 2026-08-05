-- ════════════════════════════════════════════════════════════════
-- FitTrack V7 — Compete Arena Schema
-- ════════════════════════════════════════════════════════════════
-- Este script cria as tabelas e políticas RLS para a Arena Competitiva.
-- Executa isto no "SQL Editor" do teu dashboard Supabase.

-- 1. Tabela de Perfis Públicos da Arena
CREATE TABLE IF NOT EXISTS public.compete_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE CHECK (char_length(username) >= 3),
  avatar_initials TEXT NOT NULL,
  weight_class TEXT NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Qualquer um pode ver os perfis, mas só o dono pode criar/editar o seu.
ALTER TABLE public.compete_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by everyone" ON public.compete_profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.compete_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.compete_profiles FOR UPDATE USING (auth.uid() = user_id);

-- 2. Tabela de PRs Publicados (Leaderboard)
CREATE TABLE IF NOT EXISTS public.compete_prs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.compete_profiles(user_id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  best_1rm NUMERIC NOT NULL,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, exercise_name) -- Cada user só tem 1 PR ativo por exercício
);

-- RLS: Qualquer um pode ver os PRs, só o dono pode editar.
ALTER TABLE public.compete_prs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "PRs are viewable by everyone" ON public.compete_prs FOR SELECT USING (true);
CREATE POLICY "Users can insert their own PRs" ON public.compete_prs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own PRs" ON public.compete_prs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own PRs" ON public.compete_prs FOR DELETE USING (auth.uid() = user_id);

-- 3. Tabela de Desafios (1v1)
CREATE TYPE challenge_status AS ENUM ('pending', 'active', 'completed', 'declined', 'expired');

CREATE TABLE IF NOT EXISTS public.compete_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_name TEXT NOT NULL,
  challenger_id UUID NOT NULL REFERENCES public.compete_profiles(user_id),
  target_id UUID NOT NULL REFERENCES public.compete_profiles(user_id),
  challenger_result NUMERIC,
  target_result NUMERIC,
  status challenge_status DEFAULT 'pending',
  deadline TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  winner_id UUID REFERENCES public.compete_profiles(user_id)
);

-- RLS: Desafios visíveis por todos (ou apenas pelos participantes, mas vamos deixar público para o histórico)
ALTER TABLE public.compete_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Challenges viewable by everyone" ON public.compete_challenges FOR SELECT USING (true);
CREATE POLICY "Challenger can create a challenge" ON public.compete_challenges FOR INSERT WITH CHECK (auth.uid() = challenger_id);
CREATE POLICY "Participants can update the challenge" ON public.compete_challenges FOR UPDATE USING (auth.uid() IN (challenger_id, target_id));

-- Realtime: Activar o realtime nas tabelas
ALTER PUBLICATION supabase_realtime ADD TABLE public.compete_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.compete_prs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.compete_challenges;
