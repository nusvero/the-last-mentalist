-- =========================================================
-- Fase A3 · Migrasi 2: Pindahkan helper peran ke schema privat
-- Memperbaiki Security Advisor lint 0029: fungsi SECURITY DEFINER
-- tidak boleh terbuka sebagai endpoint /rest/v1/rpc.
-- Schema "private" tidak diekspos oleh Data API.
-- =========================================================

create schema if not exists private;

revoke all on schema private from public, anon;
-- USAGE diperlukan agar policy RLS bisa memanggil fungsi di schema ini.
-- Ini TIDAK membuat schema terbuka lewat API.
grant usage on schema private to authenticated;

-- ---------- Helper baru di schema privat ----------
create or replace function private.has_role(required public.app_role[])
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

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.has_role(array['ADMIN', 'SUPER_ADMIN']::public.app_role[]);
$$;

revoke execute on function private.has_role(public.app_role[]) from public, anon;
revoke execute on function private.is_admin() from public, anon;
grant execute on function private.has_role(public.app_role[]) to authenticated;
grant execute on function private.is_admin() to authenticated;

-- ---------- Arahkan ulang policy ke helper privat ----------
drop policy "profiles_select_own_or_admin" on public.profiles;

create policy "profiles_select_own_or_admin"
on public.profiles for select to authenticated
using ((select auth.uid()) = id or (select private.is_admin()));

drop policy "user_roles_select_own_or_admin" on public.user_roles;

create policy "user_roles_select_own_or_admin"
on public.user_roles for select to authenticated
using ((select auth.uid()) = user_id or (select private.is_admin()));

-- ---------- Hapus helper lama yang terekspos ----------
drop function public.is_admin();
drop function public.has_role(public.app_role[]);