create extension if not exists pgcrypto;

create table if not exists public.tasks (
  id text primary key default replace(gen_random_uuid()::text, '-', ''),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null default 'Untitled Task',
  description text not null default '',
  start_time text not null default '00:00',
  end_time text not null default '',
  duration text not null default '',
  location text not null default '',
  status text not null default 'upcoming' check (status in ('in_progress', 'upcoming', 'completed')),
  date text not null default '',
  category text not null default '',
  checklist jsonb not null default '[]'::jsonb,
  notes text not null default '',
  -- Names used by the original PySide6 client.
  task text not null default 'Untitled Task',
  time text not null default '00:00',
  tip text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.journal_entries (
  id text primary key default replace(gen_random_uuid()::text, '-', ''),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null default 'Untitled Entry',
  content text not null default '',
  date text not null default '',
  time text not null default '00:00',
  category text not null default '',
  duration text not null default '',
  location text not null default '',
  -- Names and photo metadata used by the original PySide6 client.
  task text not null default 'Untitled Entry',
  note text not null default '',
  photos text[] not null default '{}',
  photo_urls text[] not null default '{}',
  photo_layout jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Upgrade the smaller schema from the supplied desktop script in place.
alter table public.tasks add column if not exists title text not null default 'Untitled Task';
alter table public.tasks add column if not exists description text not null default '';
alter table public.tasks add column if not exists start_time text not null default '00:00';
alter table public.tasks add column if not exists end_time text not null default '';
alter table public.tasks add column if not exists duration text not null default '';
alter table public.tasks add column if not exists location text not null default '';
alter table public.tasks add column if not exists status text not null default 'upcoming';
alter table public.tasks add column if not exists category text not null default '';
alter table public.tasks add column if not exists checklist jsonb not null default '[]'::jsonb;
alter table public.tasks add column if not exists notes text not null default '';
alter table public.tasks add column if not exists created_at timestamptz not null default now();
alter table public.tasks add column if not exists updated_at timestamptz not null default now();
alter table public.tasks add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.journal_entries add column if not exists title text not null default 'Untitled Entry';
alter table public.journal_entries add column if not exists content text not null default '';
alter table public.journal_entries add column if not exists category text not null default '';
alter table public.journal_entries add column if not exists duration text not null default '';
alter table public.journal_entries add column if not exists location text not null default '';
alter table public.journal_entries add column if not exists created_at timestamptz not null default now();
alter table public.journal_entries add column if not exists updated_at timestamptz not null default now();
alter table public.journal_entries add column if not exists user_id uuid references auth.users(id) on delete cascade;

update public.tasks set title = task, description = tip, start_time = time
where title = 'Untitled Task' and task <> 'Untitled Task';
update public.journal_entries set title = task, content = note
where title = 'Untitled Entry' and task <> 'Untitled Entry';

create or replace function public.sync_chrono_task_aliases()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    if new.title = 'Untitled Task' and new.task <> 'Untitled Task' then new.title := new.task; end if;
    if new.task = 'Untitled Task' and new.title <> 'Untitled Task' then new.task := new.title; end if;
    if new.description = '' and new.tip <> '' then new.description := new.tip; end if;
    if new.tip = '' and new.description <> '' then new.tip := new.description; end if;
    if new.start_time = '00:00' and new.time <> '00:00' then new.start_time := new.time; end if;
    if new.time = '00:00' and new.start_time <> '00:00' then new.time := new.start_time; end if;
  else
    if new.task is distinct from old.task and new.title is not distinct from old.title then new.title := new.task;
    elsif new.title is distinct from old.title then new.task := new.title; end if;
    if new.tip is distinct from old.tip and new.description is not distinct from old.description then new.description := new.tip;
    elsif new.description is distinct from old.description then new.tip := new.description; end if;
    if new.time is distinct from old.time and new.start_time is not distinct from old.start_time then new.start_time := new.time;
    elsif new.start_time is distinct from old.start_time then new.time := new.start_time; end if;
  end if;
  return new;
end;
$$;

create or replace function public.sync_chrono_journal_aliases()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    if new.title = 'Untitled Entry' and new.task <> 'Untitled Entry' then new.title := new.task; end if;
    if new.task = 'Untitled Entry' and new.title <> 'Untitled Entry' then new.task := new.title; end if;
    if new.content = '' and new.note <> '' then new.content := new.note; end if;
    if new.note = '' and new.content <> '' then new.note := new.content; end if;
  else
    if new.task is distinct from old.task and new.title is not distinct from old.title then new.title := new.task;
    elsif new.title is distinct from old.title then new.task := new.title; end if;
    if new.note is distinct from old.note and new.content is not distinct from old.content then new.content := new.note;
    elsif new.content is distinct from old.content then new.note := new.content; end if;
  end if;
  return new;
end;
$$;

drop trigger if exists sync_chrono_task_aliases on public.tasks;
create trigger sync_chrono_task_aliases before insert or update on public.tasks
for each row execute function public.sync_chrono_task_aliases();
drop trigger if exists sync_chrono_journal_aliases on public.journal_entries;
create trigger sync_chrono_journal_aliases before insert or update on public.journal_entries
for each row execute function public.sync_chrono_journal_aliases();

alter table public.tasks enable row level security;
alter table public.journal_entries enable row level security;

drop policy if exists "Users manage their own tasks" on public.tasks;
create policy "Users manage their own tasks" on public.tasks
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users manage their own journal entries" on public.journal_entries;
create policy "Users manage their own journal entries" on public.journal_entries
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('journal-photos', 'journal-photos', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Users upload their own journal photos" on storage.objects;
create policy "Users upload their own journal photos" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'journal-photos' and (storage.foldername(name))[1] = auth.uid()::text
  );
drop policy if exists "Users update their own journal photos" on storage.objects;
create policy "Users update their own journal photos" on storage.objects
  for update to authenticated using (
    bucket_id = 'journal-photos' and (storage.foldername(name))[1] = auth.uid()::text
  );
drop policy if exists "Users delete their own journal photos" on storage.objects;
create policy "Users delete their own journal photos" on storage.objects
  for delete to authenticated using (
    bucket_id = 'journal-photos' and (storage.foldername(name))[1] = auth.uid()::text
  );
drop policy if exists "Journal photos are publicly readable" on storage.objects;
create policy "Journal photos are publicly readable" on storage.objects
  for select using (bucket_id = 'journal-photos');
