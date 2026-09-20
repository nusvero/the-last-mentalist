-- =========================================================
-- Fase E (persiapan) · Skema pembayaran manual
-- Tidak pakai payment gateway. Pembeli transfer/QRIS/e-wallet ke rekening
-- toko sendiri, lalu upload bukti bayar; admin konfirmasi manual.
-- =========================================================

-- ---------- payment_channels ----------
-- Daftar tujuan pembayaran milik toko (rekening bank, e-wallet, QRIS).
-- Dikelola admin lewat dashboard, BUKAN lewat env, supaya bisa diubah
-- tanpa redeploy.
create type public.payment_channel_type as enum ('BANK_TRANSFER', 'EWALLET', 'QRIS');

create table public.payment_channels (
  id uuid primary key default gen_random_uuid(),
  type public.payment_channel_type not null,
  name text not null check (char_length(name) between 1 and 80),
  account_holder text check (char_length(account_holder) <= 120),
  account_number text check (char_length(account_number) <= 50),
  qris_image_url text check (char_length(qris_image_url) <= 500),
  instructions text check (char_length(instructions) <= 500),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- QRIS wajib punya gambar QR; bank/e-wallet wajib punya nomor tujuan.
  constraint payment_channels_fields_by_type check (
    case type
      when 'QRIS' then qris_image_url is not null
      else account_number is not null
    end
  )
);

create index payment_channels_active_sort_idx
  on public.payment_channels (is_active, sort_order);

create trigger payment_channels_set_updated_at
before update on public.payment_channels
for each row execute function public.set_updated_at();

alter table public.payment_channels enable row level security;

-- Info cara bayar bukan data rahasia (memang ditujukan untuk dilihat pembeli),
-- jadi siapa pun (termasuk anon, sebelum login) boleh melihat channel aktif.
-- Dipisah dari policy authenticated di bawah supaya anon TIDAK perlu izin
-- EXECUTE pada private.is_admin() (Postgres tetap mengecek izin fungsi pada
-- ekspresi policy walau secara logika bisa short-circuit).
create policy "payment_channels_select_active"
on public.payment_channels for select to anon
using (is_active);

-- Admin bisa melihat semua termasuk yang nonaktif.
create policy "payment_channels_select_active_or_admin"
on public.payment_channels for select to authenticated
using (is_active or (select private.is_admin()));

create policy "payment_channels_insert_admin"
on public.payment_channels for insert to authenticated
with check ((select private.is_admin()));

create policy "payment_channels_update_admin"
on public.payment_channels for update to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "payment_channels_delete_admin"
on public.payment_channels for delete to authenticated
using ((select private.is_admin()));

-- ---------- payment_proofs ----------
-- Bukti bayar yang diupload pembeli untuk satu order, menunggu konfirmasi
-- manual admin. `order_id` SENGAJA belum diberi foreign key: tabel `orders`
-- belum ada (baru dibuat saat modul katalog/order digarap). FK ke
-- public.orders(id) ditambahkan lewat migrasi ALTER TABLE saat tabel itu
-- dibuat, mengikuti pola migrasi "move_role_helpers_to_private" di repo ini
-- (mengeraskan aturan lewat migrasi susulan, bukan mengubah yang sudah ada).
--
-- Konsekuensi keamanan dari keterbatasan ini: policy insert di bawah HANYA
-- memastikan uploaded_by = pengguna yang login. Verifikasi bahwa order_id
-- benar-benar milik pengguna tsb dilakukan di server action (memakai
-- service role, setelah query kepemilikan order), bukan oleh RLS, sampai
-- tabel orders ada dan policy insert diperketat dengan subquery kepemilikan.
create type public.payment_proof_status as enum ('PENDING', 'CONFIRMED', 'REJECTED');

create table public.payment_proofs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null,
  channel_id uuid not null references public.payment_channels (id) on delete restrict,
  uploaded_by uuid not null references auth.users (id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  sender_name text check (char_length(sender_name) <= 120),
  proof_image_url text not null check (char_length(proof_image_url) > 0),
  note text check (char_length(note) <= 500),
  status public.payment_proof_status not null default 'PENDING',
  rejection_reason text check (char_length(rejection_reason) <= 500),
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payment_proofs_reviewed_by_iff_not_pending
    check ((status = 'PENDING') = (reviewed_by is null)),
  constraint payment_proofs_reviewed_at_iff_not_pending
    check ((status = 'PENDING') = (reviewed_at is null)),
  constraint payment_proofs_rejection_reason_required_if_rejected
    check (status <> 'REJECTED' or rejection_reason is not null)
);

create index payment_proofs_order_id_idx on public.payment_proofs (order_id);
create index payment_proofs_status_idx on public.payment_proofs (status);
create index payment_proofs_channel_id_idx on public.payment_proofs (channel_id);

-- Satu order hanya boleh punya satu bukti bayar yang masih PENDING sekaligus
-- (mencegah spam upload berulang sebelum yang lama diproses admin).
create unique index payment_proofs_one_pending_per_order
  on public.payment_proofs (order_id)
  where (status = 'PENDING');

create trigger payment_proofs_set_updated_at
before update on public.payment_proofs
for each row execute function public.set_updated_at();

alter table public.payment_proofs enable row level security;
revoke all on public.payment_proofs from anon;

-- select: pembeli lihat bukti bayarnya sendiri; admin lihat semua.
create policy "payment_proofs_select_own_or_admin"
on public.payment_proofs for select to authenticated
using ((select auth.uid()) = uploaded_by or (select private.is_admin()));

-- insert: pembeli hanya boleh upload atas namanya sendiri, status awal
-- harus PENDING dan belum ada hasil review (lihat catatan keamanan di atas).
create policy "payment_proofs_insert_own"
on public.payment_proofs for insert to authenticated
with check (
  (select auth.uid()) = uploaded_by
  and status = 'PENDING'
  and reviewed_by is null
  and reviewed_at is null
);

-- update: hanya admin yang boleh mengubah (konfirmasi/tolak). Pembeli tidak
-- bisa mengedit bukti yang sudah dikirim; kalau ditolak, ia upload baris baru.
create policy "payment_proofs_update_admin"
on public.payment_proofs for update to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

-- Tidak ada policy delete: bukti bayar disimpan permanen untuk audit trail.
