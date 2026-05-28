-- SteadiDay — Phase 2: data sync tables
-- Apply after Phase 1's initial_profiles migration.

-- Extend profiles with caregiver-dashboard fields
alter table public.profiles
  add column if not exists member_since timestamptz,
  add column if not exists last_active_at timestamptz;

-- Tasks
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  notes text,
  due_date timestamptz,
  is_recurring boolean default false,
  recurrence_rule text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

alter table public.tasks enable row level security;

drop policy if exists "Users access own tasks" on public.tasks;
create policy "Users access own tasks" on public.tasks
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists tasks_user_id_idx on public.tasks(user_id);

-- Task completions (per-day instances)
create table if not exists public.task_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  task_id uuid references public.tasks(id) on delete cascade not null,
  completed_date date not null,
  completed_at timestamptz default now(),
  unique (task_id, completed_date)
);

alter table public.task_completions enable row level security;

drop policy if exists "Users access own task completions" on public.task_completions;
create policy "Users access own task completions" on public.task_completions
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists task_completions_user_date_idx
  on public.task_completions(user_id, completed_date);

-- Medications (text metadata only — never photos, URIs, or scan data)
create table if not exists public.medications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  dosage text,
  frequency text,
  schedule jsonb,
  instructions text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

alter table public.medications enable row level security;

drop policy if exists "Users access own medications" on public.medications;
create policy "Users access own medications" on public.medications
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists medications_user_id_idx on public.medications(user_id);

-- Medication logs (taken / skipped / missed events)
create table if not exists public.medication_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  medication_id uuid references public.medications(id) on delete cascade not null,
  scheduled_at timestamptz not null,
  taken_at timestamptz,
  status text check (status in ('taken', 'skipped', 'missed', 'snoozed')) not null,
  created_at timestamptz default now()
);

alter table public.medication_logs enable row level security;

drop policy if exists "Users access own medication logs" on public.medication_logs;
create policy "Users access own medication logs" on public.medication_logs
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists medication_logs_user_scheduled_idx
  on public.medication_logs(user_id, scheduled_at);

-- Daily check-ins
create table if not exists public.check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  check_in_date date not null,
  mood text,
  energy_level integer check (energy_level between 1 and 5),
  notes text,
  created_at timestamptz default now(),
  unique (user_id, check_in_date)
);

alter table public.check_ins enable row level security;

drop policy if exists "Users access own check-ins" on public.check_ins;
create policy "Users access own check-ins" on public.check_ins
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Daily activity summary (caregiver dashboard fuel)
create table if not exists public.daily_activity_summary (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  summary_date date not null,
  last_active_at timestamptz not null,
  tasks_completed integer default 0,
  medications_taken integer default 0,
  check_in_completed boolean default false,
  step_count integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, summary_date)
);

alter table public.daily_activity_summary enable row level security;

drop policy if exists "Users write own activity summary" on public.daily_activity_summary;
create policy "Users write own activity summary" on public.daily_activity_summary
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists daily_activity_summary_user_date_idx
  on public.daily_activity_summary(user_id, summary_date desc);

-- Trigger: keep profiles.last_active_at in sync with the latest summary
create or replace function public.update_profile_last_active()
returns trigger as $$
begin
  update public.profiles
  set last_active_at = new.last_active_at,
      updated_at = now()
  where id = new.user_id
    and (last_active_at is null or last_active_at < new.last_active_at);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_activity_summary_upsert on public.daily_activity_summary;
create trigger on_activity_summary_upsert
  after insert or update on public.daily_activity_summary
  for each row execute procedure public.update_profile_last_active();
