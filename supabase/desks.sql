-- Classroom Assistant — θρανία για το ελεύθερο πλάνο τάξης
-- Τρέξτε αυτό στο SQL Editor αν έχετε ήδη το βασικό schema.

create table if not exists public.desks (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  label text,
  position_x numeric not null default 40,
  position_y numeric not null default 40,
  width numeric not null default 240,
  height numeric not null default 140,
  seat_count integer not null default 2 check (seat_count between 1 and 24),
  arrangement text not null default 'row' check (arrangement in ('row', 'around')),
  created_at timestamptz not null default now()
);

create index if not exists desks_class_id_idx on public.desks (class_id);

grant select, insert, update, delete on public.desks to authenticated;

alter table public.desks enable row level security;

drop policy if exists "Teachers can view own desks" on public.desks;
create policy "Teachers can view own desks"
  on public.desks for select
  to authenticated
  using (public.is_teacher_of_class(class_id));

drop policy if exists "Teachers can insert own desks" on public.desks;
create policy "Teachers can insert own desks"
  on public.desks for insert
  to authenticated
  with check (public.is_teacher_of_class(class_id));

drop policy if exists "Teachers can update own desks" on public.desks;
create policy "Teachers can update own desks"
  on public.desks for update
  to authenticated
  using (public.is_teacher_of_class(class_id))
  with check (public.is_teacher_of_class(class_id));

drop policy if exists "Teachers can delete own desks" on public.desks;
create policy "Teachers can delete own desks"
  on public.desks for delete
  to authenticated
  using (public.is_teacher_of_class(class_id));

alter table public.desks drop constraint if exists desks_seat_count_check;
alter table public.desks add constraint desks_seat_count_check check (seat_count between 1 and 24);
