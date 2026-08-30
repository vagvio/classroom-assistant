-- Classroom Assistant — μαθήματα ως ξεχωριστή οντότητα
-- Ένα τμήμα μπορεί να έχει πολλά μαθήματα.
-- Τρέξτε αυτό στο SQL Editor αν έχετε ήδη το βασικό schema.

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index if not exists subjects_class_id_idx on public.subjects (class_id);
create unique index if not exists subjects_class_id_name_idx
  on public.subjects (class_id, lower(name));

insert into public.subjects (class_id, name)
select c.id, trim(c.subject)
from public.classes c
where c.subject is not null
  and trim(c.subject) <> ''
  and not exists (
    select 1
    from public.subjects s
    where s.class_id = c.id
      and lower(s.name) = lower(trim(c.subject))
  );

grant select, insert, update, delete on public.subjects to authenticated;

alter table public.subjects enable row level security;

drop policy if exists "Teachers can view own subjects" on public.subjects;
create policy "Teachers can view own subjects"
  on public.subjects for select
  to authenticated
  using (public.is_teacher_of_class(class_id));

drop policy if exists "Teachers can insert own subjects" on public.subjects;
create policy "Teachers can insert own subjects"
  on public.subjects for insert
  to authenticated
  with check (public.is_teacher_of_class(class_id));

drop policy if exists "Teachers can update own subjects" on public.subjects;
create policy "Teachers can update own subjects"
  on public.subjects for update
  to authenticated
  using (public.is_teacher_of_class(class_id))
  with check (public.is_teacher_of_class(class_id));

drop policy if exists "Teachers can delete own subjects" on public.subjects;
create policy "Teachers can delete own subjects"
  on public.subjects for delete
  to authenticated
  using (public.is_teacher_of_class(class_id));
