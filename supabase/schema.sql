-- Classroom Assistant — σχήμα βάσης για το Supabase SQL Editor
-- Τρέξτε ολόκληρο το script μία φορά στο SQL Editor του project σας.
-- Κάθε καθηγητής βλέπει μόνο τα δικά του δεδομένα μέσω Row Level Security.

-- ---------------------------------------------------------------------------
-- Βοηθητικές συναρτήσεις
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Δημιουργεί αυτόματα profile όταν εγγράφεται χρήστης στο Auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '')
  );
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Πίνακες
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  updated_at timestamptz not null default now(),
  full_name text
);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute procedure public.set_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  subject text,
  created_at timestamptz not null default now()
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  first_name text not null,
  last_name text not null,
  photo_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.seating_layouts (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  position_x numeric not null,
  position_y numeric not null,
  desk_id text,
  created_at timestamptz not null default now(),
  unique (class_id, student_id)
);

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

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  date date not null,
  status text not null check (status in ('present', 'absent', 'late')),
  notes text,
  unique (student_id, date)
);

create table if not exists public.homework_checks (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  date date not null,
  completed boolean not null default false,
  notes text,
  unique (student_id, date)
);

create table if not exists public.grades (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  title text not null,
  score numeric not null,
  max_score numeric not null check (max_score > 0),
  date date not null default current_date
);

create index if not exists classes_teacher_id_idx on public.classes (teacher_id);
create index if not exists students_class_id_idx on public.students (class_id);
create index if not exists subjects_class_id_idx on public.subjects (class_id);
create unique index if not exists subjects_class_id_name_idx
  on public.subjects (class_id, lower(name));
create index if not exists seating_layouts_class_id_idx on public.seating_layouts (class_id);
create index if not exists desks_class_id_idx on public.desks (class_id);
create index if not exists attendance_student_id_idx on public.attendance (student_id);
create index if not exists homework_checks_student_id_idx on public.homework_checks (student_id);
create index if not exists grades_student_id_idx on public.grades (student_id);

-- True αν το τμήμα ανήκει στον συνδεδεμένο καθηγητή
create or replace function public.is_teacher_of_class(target_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.classes
    where id = target_class_id
      and teacher_id = auth.uid()
  );
$$;

-- True αν ο μαθητής ανήκει σε τμήμα του συνδεδεμένου καθηγητή
create or replace function public.is_teacher_of_student(target_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.students s
    join public.classes c on c.id = s.class_id
    where s.id = target_student_id
      and c.teacher_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- Δικαιώματα πίνακα (το RLS περιορίζει τις γραμμές)
-- ---------------------------------------------------------------------------

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on function public.is_teacher_of_class(uuid) to authenticated;
grant execute on function public.is_teacher_of_student(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.students enable row level security;
alter table public.subjects enable row level security;
alter table public.seating_layouts enable row level security;
alter table public.desks enable row level security;
alter table public.attendance enable row level security;
alter table public.homework_checks enable row level security;
alter table public.grades enable row level security;

-- profiles
drop policy if exists "Teachers can view own profile" on public.profiles;
create policy "Teachers can view own profile"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

drop policy if exists "Teachers can insert own profile" on public.profiles;
create policy "Teachers can insert own profile"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

drop policy if exists "Teachers can update own profile" on public.profiles;
create policy "Teachers can update own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- classes
drop policy if exists "Teachers can view own classes" on public.classes;
create policy "Teachers can view own classes"
  on public.classes for select
  to authenticated
  using (teacher_id = auth.uid());

drop policy if exists "Teachers can insert own classes" on public.classes;
create policy "Teachers can insert own classes"
  on public.classes for insert
  to authenticated
  with check (teacher_id = auth.uid());

drop policy if exists "Teachers can update own classes" on public.classes;
create policy "Teachers can update own classes"
  on public.classes for update
  to authenticated
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());

drop policy if exists "Teachers can delete own classes" on public.classes;
create policy "Teachers can delete own classes"
  on public.classes for delete
  to authenticated
  using (teacher_id = auth.uid());

-- students
drop policy if exists "Teachers can view own students" on public.students;
create policy "Teachers can view own students"
  on public.students for select
  to authenticated
  using (public.is_teacher_of_class(class_id));

drop policy if exists "Teachers can insert own students" on public.students;
create policy "Teachers can insert own students"
  on public.students for insert
  to authenticated
  with check (public.is_teacher_of_class(class_id));

drop policy if exists "Teachers can update own students" on public.students;
create policy "Teachers can update own students"
  on public.students for update
  to authenticated
  using (public.is_teacher_of_class(class_id))
  with check (public.is_teacher_of_class(class_id));

drop policy if exists "Teachers can delete own students" on public.students;
create policy "Teachers can delete own students"
  on public.students for delete
  to authenticated
  using (public.is_teacher_of_class(class_id));

-- subjects
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

-- seating_layouts
drop policy if exists "Teachers can view own seating layouts" on public.seating_layouts;
create policy "Teachers can view own seating layouts"
  on public.seating_layouts for select
  to authenticated
  using (public.is_teacher_of_class(class_id));

drop policy if exists "Teachers can insert own seating layouts" on public.seating_layouts;
create policy "Teachers can insert own seating layouts"
  on public.seating_layouts for insert
  to authenticated
  with check (public.is_teacher_of_class(class_id) and public.is_teacher_of_student(student_id));

drop policy if exists "Teachers can update own seating layouts" on public.seating_layouts;
create policy "Teachers can update own seating layouts"
  on public.seating_layouts for update
  to authenticated
  using (public.is_teacher_of_class(class_id))
  with check (public.is_teacher_of_class(class_id) and public.is_teacher_of_student(student_id));

drop policy if exists "Teachers can delete own seating layouts" on public.seating_layouts;
create policy "Teachers can delete own seating layouts"
  on public.seating_layouts for delete
  to authenticated
  using (public.is_teacher_of_class(class_id));

-- desks
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

-- attendance
drop policy if exists "Teachers can view own attendance" on public.attendance;
create policy "Teachers can view own attendance"
  on public.attendance for select
  to authenticated
  using (public.is_teacher_of_student(student_id));

drop policy if exists "Teachers can insert own attendance" on public.attendance;
create policy "Teachers can insert own attendance"
  on public.attendance for insert
  to authenticated
  with check (public.is_teacher_of_student(student_id));

drop policy if exists "Teachers can update own attendance" on public.attendance;
create policy "Teachers can update own attendance"
  on public.attendance for update
  to authenticated
  using (public.is_teacher_of_student(student_id))
  with check (public.is_teacher_of_student(student_id));

drop policy if exists "Teachers can delete own attendance" on public.attendance;
create policy "Teachers can delete own attendance"
  on public.attendance for delete
  to authenticated
  using (public.is_teacher_of_student(student_id));

-- homework_checks
drop policy if exists "Teachers can view own homework checks" on public.homework_checks;
create policy "Teachers can view own homework checks"
  on public.homework_checks for select
  to authenticated
  using (public.is_teacher_of_student(student_id));

drop policy if exists "Teachers can insert own homework checks" on public.homework_checks;
create policy "Teachers can insert own homework checks"
  on public.homework_checks for insert
  to authenticated
  with check (public.is_teacher_of_student(student_id));

drop policy if exists "Teachers can update own homework checks" on public.homework_checks;
create policy "Teachers can update own homework checks"
  on public.homework_checks for update
  to authenticated
  using (public.is_teacher_of_student(student_id))
  with check (public.is_teacher_of_student(student_id));

drop policy if exists "Teachers can delete own homework checks" on public.homework_checks;
create policy "Teachers can delete own homework checks"
  on public.homework_checks for delete
  to authenticated
  using (public.is_teacher_of_student(student_id));

-- grades
drop policy if exists "Teachers can view own grades" on public.grades;
create policy "Teachers can view own grades"
  on public.grades for select
  to authenticated
  using (public.is_teacher_of_student(student_id));

drop policy if exists "Teachers can insert own grades" on public.grades;
create policy "Teachers can insert own grades"
  on public.grades for insert
  to authenticated
  with check (public.is_teacher_of_student(student_id));

drop policy if exists "Teachers can update own grades" on public.grades;
create policy "Teachers can update own grades"
  on public.grades for update
  to authenticated
  using (public.is_teacher_of_student(student_id))
  with check (public.is_teacher_of_student(student_id));

drop policy if exists "Teachers can delete own grades" on public.grades;
create policy "Teachers can delete own grades"
  on public.grades for delete
  to authenticated
  using (public.is_teacher_of_student(student_id));

-- ---------------------------------------------------------------------------
-- Storage: φωτογραφίες μαθητών
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'student-photos',
  'student-photos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Teachers can upload own student photos" on storage.objects;
create policy "Teachers can upload own student photos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'student-photos'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "Teachers can read own student photos" on storage.objects;
create policy "Teachers can read own student photos"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'student-photos'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "Teachers can update own student photos" on storage.objects;
create policy "Teachers can update own student photos"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'student-photos'
  and split_part(name, '/', 1) = auth.uid()::text
)
with check (
  bucket_id = 'student-photos'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "Teachers can delete own student photos" on storage.objects;
create policy "Teachers can delete own student photos"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'student-photos'
  and split_part(name, '/', 1) = auth.uid()::text
);
