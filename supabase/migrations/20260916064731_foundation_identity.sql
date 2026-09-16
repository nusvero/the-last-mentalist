-- =========================================================
-- Fase A3 · Migrasi 1: Fondasi identitas & peran
-- =========================================================

-- Fungsi umum: mengisi updated_at otomatis saat baris diubah
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Daftar peran aplikasi
create type public.app_role as enum (
  'CUSTOMER', 'EDITOR', 'FULFILLMENT', 'ADMIN', 'SUPER_ADMIN'
);

-- Profil pelanggan (1:1 dengan akun auth)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text check (char_length(full_name) <= 120),
  phone text check (phone ~ '^\+?[0-9]{8,16}$'),
  marketing_consent boolean not null default false,
  marketing_consent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Peran disimpan di tabel terpisah, BUKAN di user metadata
-- (metadata bisa diubah sendiri oleh user)
create table public.user_roles (
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.app_role not null,
  granted_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create index user_roles_role_idx on public.user_roles (role);

-- Helper: apakah user yang login punya salah satu peran ini?
create or replace function public.has_role(required public.app_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = (select auth.uid())
      and ur.role = any (required)
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_role(array['ADMIN', 'SUPER_ADMIN']::public.app_role[]);
$$;

revoke execute on function public.has_role(public.app_role[]) from public, anon;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.has_role(public.app_role[]) to authenticated;
grant execute on function public.is_admin() to authenticated;

-- Saat akun baru dibuat: buat profil + beri peran CUSTOMER
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    nullif(left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 120), '')
  );

  insert into public.user_roles (user_id, role)
  values (new.id, 'CUSTOMER');

  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- =========================================================
-- Row Level Security
-- =========================================================
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;

-- Pengunjung anonim tidak boleh menyentuh tabel ini sama sekali
revoke all on public.profiles from anon;
revoke all on public.user_roles from anon;

-- profiles: pemilik (atau admin) bisa membaca
create policy "profiles_select_own_or_admin"
on public.profiles for select to authenticated
using ((select auth.uid()) = id or (select public.is_admin()));

-- profiles: hanya pemilik yang bisa mengubah profilnya
create policy "profiles_update_own"
on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- user_roles: user hanya bisa MELIHAT perannya sendiri (admin melihat semua).
-- Tidak ada policy insert/update/delete: perubahan peran hanya lewat
-- jalur server berhak (dibuat di Fase F, dengan audit log).
create policy "user_roles_select_own_or_admin"
on public.user_roles for select to authenticated
using ((select auth.uid()) = user_id or (select public.is_admin()));