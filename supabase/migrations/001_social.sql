-- ════════════════════════════════════════════════════════════════
-- FitTrack — Rede Social (Feed, Leaderboards, Desafios)
-- ════════════════════════════════════════════════════════════════
--
-- PRINCÍPIO DE DESENHO: o cofre local (IndexedDB cifrado com AES-GCM)
-- continua a ser a única fonte de verdade dos dados de treino. Estas
-- tabelas guardam SÓ o que o utilizador publica explicitamente
-- (ação "Partilhar PR" / "Publicar treino") — nunca uma sincronização
-- automática do vault. weight_kg/reps aqui são valores que o
-- utilizador escolheu tornar públicos, não um espelho do vault.
--
-- Corre com: npx supabase db push
-- (ou cola no SQL Editor do dashboard Supabase)
-- ════════════════════════════════════════════════════════════════

-- ─── PROFILES ──────────────────────────────────────────────────────
-- Um perfil por utilizador autenticado (auth.users é gerido pelo Supabase Auth).
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (char_length(username) between 3 and 24 and username ~ '^[a-z0-9_]+$'),
  display_name text not null default '',
  avatar_url text,
  bio text default '',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Perfis são visíveis a todos os utilizadores autenticados"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Cada utilizador só edita o próprio perfil"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

create policy "Cada utilizador só cria o próprio perfil"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);


-- ─── FOLLOWS ───────────────────────────────────────────────────────
create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  followee_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  constraint no_self_follow check (follower_id <> followee_id)
);

alter table public.follows enable row level security;

create policy "Relações de follow são públicas (para contar seguidores)"
  on public.follows for select
  to authenticated
  using (true);

create policy "Só podes criar/apagar os teus próprios follows"
  on public.follows for insert
  to authenticated
  with check (auth.uid() = follower_id);

create policy "Só podes deixar de seguir tu próprio"
  on public.follows for delete
  to authenticated
  using (auth.uid() = follower_id);


-- ─── ACTIVITIES (PRs / treinos publicados) ─────────────────────────
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  exercise_name text not null,
  metric_type text not null check (metric_type in ('1rm', 'volume', 'reps', 'duration')),
  value numeric not null check (value > 0),
  unit text not null default 'kg',
  reps integer,
  note text,
  visibility text not null default 'public' check (visibility in ('public', 'followers')),
  created_at timestamptz not null default now()
);

create index if not exists activities_exercise_value_idx
  on public.activities (exercise_name, metric_type, value desc);

create index if not exists activities_user_created_idx
  on public.activities (user_id, created_at desc);

alter table public.activities enable row level security;

create policy "Atividades públicas são visíveis a todos"
  on public.activities for select
  to authenticated
  using (
    visibility = 'public'
    or user_id = auth.uid()
    or (
      visibility = 'followers'
      and exists (
        select 1 from public.follows
        where follower_id = auth.uid() and followee_id = activities.user_id
      )
    )
  );

create policy "Só podes publicar atividades tuas"
  on public.activities for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Só podes apagar as tuas próprias publicações"
  on public.activities for delete
  to authenticated
  using (auth.uid() = user_id);


-- ─── CHALLENGES (desafios 1:1 ou abertos) ──────────────────────────
create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  exercise_name text not null,
  metric_type text not null check (metric_type in ('1rm', 'volume', 'reps')),
  title text not null,
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  status text not null default 'open' check (status in ('open', 'active', 'finished', 'cancelled')),
  created_at timestamptz not null default now(),
  constraint ends_after_starts check (ends_at > starts_at)
);

alter table public.challenges enable row level security;

create policy "Desafios são visíveis a todos os autenticados"
  on public.challenges for select
  to authenticated
  using (true);

create policy "Qualquer utilizador autenticado pode criar um desafio"
  on public.challenges for insert
  to authenticated
  with check (auth.uid() = creator_id);

create policy "Só o criador pode alterar/cancelar o desafio"
  on public.challenges for update
  to authenticated
  using (auth.uid() = creator_id);


-- ─── CHALLENGE_PARTICIPANTS ─────────────────────────────────────────
create table if not exists public.challenge_participants (
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  best_value numeric,
  joined_at timestamptz not null default now(),
  primary key (challenge_id, user_id)
);

alter table public.challenge_participants enable row level security;

create policy "Participações são visíveis a todos (para o ranking do desafio)"
  on public.challenge_participants for select
  to authenticated
  using (true);

create policy "Só te podes inscrever a ti próprio"
  on public.challenge_participants for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Só atualizas a tua própria marca no desafio"
  on public.challenge_participants for update
  to authenticated
  using (auth.uid() = user_id);


-- ─── VIEW: leaderboard global por exercício ────────────────────────
-- Usa a MELHOR marca de cada utilizador por exercício+métrica (não todas as publicações).
create or replace view public.leaderboard as
select distinct on (user_id, exercise_name, metric_type)
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
from public.activities a
join public.profiles p on p.id = a.user_id
where a.visibility = 'public'
order by user_id, exercise_name, metric_type, value desc;

-- Nota: esta view herda RLS da tabela activities/profiles subjacente
-- porque corre com o privilégio do chamador (security invoker é o
-- default em views no Postgres moderno do Supabase).


-- ─── CLUBS (substitui o protótipo mock de useSocialStore) ──────────
create table if not exists public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 3 and 40),
  code text not null unique check (code ~ '^[A-Z0-9]{6}$'),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  weekly_goal_xp integer not null default 30000 check (weekly_goal_xp > 0),
  is_official boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.clubs enable row level security;

create policy "Clubes são visíveis a todos os autenticados (para procurar/entrar)"
  on public.clubs for select
  to authenticated
  using (true);

create policy "Qualquer utilizador autenticado pode criar um clube"
  on public.clubs for insert
  to authenticated
  with check (auth.uid() = owner_id);

create policy "Só o dono pode alterar o clube"
  on public.clubs for update
  to authenticated
  using (auth.uid() = owner_id);


create table if not exists public.club_members (
  club_id uuid not null references public.clubs(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  xp_this_week integer not null default 0 check (xp_this_week >= 0),
  joined_at timestamptz not null default now(),
  primary key (club_id, user_id)
);

alter table public.club_members enable row level security;

create policy "Membros de clube são visíveis a todos os autenticados"
  on public.club_members for select
  to authenticated
  using (true);

create policy "Só te podes inscrever a ti próprio num clube"
  on public.club_members for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Só atualizas o teu próprio XP semanal"
  on public.club_members for update
  to authenticated
  using (auth.uid() = user_id);

create policy "Só te podes remover a ti próprio de um clube"
  on public.club_members for delete
  to authenticated
  using (auth.uid() = user_id);

-- Limite de 10 membros por clube, aplicado no servidor (não confiar só no cliente)
create or replace function public.enforce_club_member_limit()
returns trigger as $$
begin
  if (select count(*) from public.club_members where club_id = new.club_id) >= 10 then
    raise exception 'Este clube já tem o máximo de 10 membros.';
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger club_member_limit
  before insert on public.club_members
  for each row execute function public.enforce_club_member_limit();

-- Seed dos clubes oficiais mencionados no mock (PT_ELITE, CALISTENIA).
-- Substitui os IDs 'user_local'/'owner-placeholder' pelo teu próprio user_id
-- depois de teres uma conta criada, ou remove este bloco e cria os clubes
-- pela própria app.
-- insert into public.clubs (name, code, owner_id, is_official) values
--   ('Comunidade FitTrack', 'PTELIT', '<o-teu-user-id>', true),
--   ('Calistenia PT', 'CALIST', '<o-teu-user-id>', true);