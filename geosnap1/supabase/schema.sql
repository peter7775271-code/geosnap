create table if not exists game_sessions (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  host_user_id text not null,
  mode text not null check (mode in ('solo', 'multiplayer', 'daily')),
  round_count int not null check (round_count between 1 and 20),
  timer_seconds int,
  status text not null default 'waiting' check (status in ('waiting', 'active', 'finished')),
  created_at timestamptz not null default now()
);

create table if not exists rounds (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references game_sessions(id) on delete cascade,
  photo_hash text not null,
  actual_lat double precision not null,
  actual_lon double precision not null,
  round_index int not null,
  unique (session_id, round_index)
);

create table if not exists guesses (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references rounds(id) on delete cascade,
  user_id text not null,
  guess_lat double precision not null,
  guess_lon double precision not null,
  distance_km double precision not null,
  score int not null,
  time_taken_ms int not null,
  submitted_at timestamptz not null default now()
);

create index if not exists idx_rounds_session_id on rounds(session_id);
create index if not exists idx_guesses_round_id on guesses(round_id);
