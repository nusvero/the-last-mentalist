-- =========================================================
-- Fase C · Keranjang, pesanan, dan checkout
-- Asumsi desain: checkout WAJIB login (tidak ada guest checkout) --
-- konsisten dengan model auth yang sudah ada (profiles/roles per akun).
-- =========================================================

create type public.order_status as enum (
  'PENDING_PAYMENT', 'PAID', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED'
);

-- ---------- cart_items ----------
-- Satu baris per (user, produk). Tidak ada tabel "carts" terpisah karena
-- belum ada data level-keranjang (kupon dll) yang perlu disimpan terpisah
-- dari baris itemnya sendiri.
create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create index cart_items_user_id_idx on public.cart_items (user_id);

create trigger cart_items_set_updated_at
before update on public.cart_items
for each row execute function public.set_updated_at();

alter table public.cart_items enable row level security;
revoke all on public.cart_items from anon;

-- Keranjang murni privat: tidak ada alasan bisnis bagi admin/fulfillment
-- untuk melihat keranjang orang lain sebelum checkout.
create policy "cart_items_owner_select"
on public.cart_items for select to authenticated
using ((select auth.uid()) = user_id);

create policy "cart_items_owner_insert"
on public.cart_items for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "cart_items_owner_update"
on public.cart_items for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "cart_items_owner_delete"
on public.cart_items for delete to authenticated
using ((select auth.uid()) = user_id);

-- ---------- orders ----------
create sequence public.order_number_seq;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  -- Nomor jalan (bukan reset harian) supaya tetap unik & sekuensial tanpa
  -- perlu locking tambahan. Format: PGC-YYYYMMDD-00001.
  order_number text not null default (
    'PGC-' || to_char(now(), 'YYYYMMDD') || '-'
    || lpad(nextval('public.order_number_seq')::text, 5, '0')
  ),
  user_id uuid not null references auth.users (id) on delete restrict,
  status public.order_status not null default 'PENDING_PAYMENT',
  -- subtotal DIJAGA OTOMATIS oleh trigger recalc_order_subtotal() dari
  -- order_items, bukan diisi manual oleh aplikasi -> tidak mungkin "drift".
  subtotal numeric(12, 2) not null default 0 check (subtotal >= 0),
  shipping_cost numeric(12, 2) not null default 0 check (shipping_cost >= 0),
  total numeric(12, 2) generated always as (subtotal + shipping_cost) stored,
  shipping_recipient_name text check (char_length(shipping_recipient_name) <= 120),
  shipping_phone text check (shipping_phone ~ '^\+?[0-9]{8,16}$'),
  shipping_address text check (char_length(shipping_address) <= 500),
  shipping_city text check (char_length(shipping_city) <= 100),
  shipping_province text check (char_length(shipping_province) <= 100),
  shipping_postal_code text check (shipping_postal_code ~ '^[0-9]{5}$'),
  -- Diisi Fase D (integrasi RajaOngkir) & Fase G (fulfillment fisik).
  shipping_courier text check (char_length(shipping_courier) <= 50),
  shipping_tracking_number text check (char_length(shipping_tracking_number) <= 100),
  customer_note text check (char_length(customer_note) <= 500),
  cancelled_reason text check (char_length(cancelled_reason) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (order_number)
);

-- on delete restrict: pesanan adalah catatan keuangan, tidak boleh ikut
-- terhapus kalau akun user dihapus (perlu penanganan manual/anonymisasi,
-- bukan cascade delete diam-diam).
create index orders_user_id_idx on public.orders (user_id);
create index orders_status_idx on public.orders (status);

create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

alter table public.orders enable row level security;
revoke all on public.orders from anon;

-- select: pemilik, atau staff yang menangani pesanan (ADMIN/SUPER_ADMIN
-- konfirmasi bayar, FULFILLMENT kirim barang).
create policy "orders_select_own_or_staff"
on public.orders for select to authenticated
using (
  (select auth.uid()) = user_id
  or (select private.has_role(array['ADMIN', 'SUPER_ADMIN', 'FULFILLMENT']::public.app_role[]))
);

-- insert: TIDAK ada policy untuk customer biasa. Alur normal WAJIB lewat
-- fungsi public.checkout_cart() (SECURITY DEFINER, di bawah) supaya order
-- + order_items + pengurangan stok + pengosongan keranjang terjadi dalam
-- satu transaksi atomik. Admin tetap bisa insert manual (mis. pesanan lewat
-- telepon/WA) lewat jalur biasa.
create policy "orders_insert_admin"
on public.orders for insert to authenticated
with check ((select private.has_role(array['ADMIN', 'SUPER_ADMIN']::public.app_role[])));

-- update: staff (ubah status, ongkir, resi, dsb).
create policy "orders_update_staff"
on public.orders for update to authenticated
using ((select private.has_role(array['ADMIN', 'SUPER_ADMIN', 'FULFILLMENT']::public.app_role[])))
with check ((select private.has_role(array['ADMIN', 'SUPER_ADMIN', 'FULFILLMENT']::public.app_role[])));

-- update: pemilik BOLEH membatalkan pesanannya sendiri selama masih
-- menunggu bayar. Catatan: RLS tidak bisa membatasi kolom lain ikut
-- berubah di UPDATE yang sama, tapi ini tidak eksploitatif secara finansial
-- karena pesanan yang sudah CANCELLED tidak berpengaruh ke apa pun (bukti
-- bayar tetap diverifikasi admin terhadap mutasi rekening asli).
create policy "orders_customer_cancel_own_pending"
on public.orders for update to authenticated
using ((select auth.uid()) = user_id and status = 'PENDING_PAYMENT')
with check ((select auth.uid()) = user_id and status = 'CANCELLED');

-- Tidak ada policy delete: pesanan disimpan permanen untuk audit/keuangan.

-- ---------- order_items ----------
-- Snapshot nama/harga/tipe produk pada saat order dibuat, supaya histori
-- pesanan tidak berubah kalau produk aslinya diedit/dihapus/naik harga.
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  product_name text not null check (char_length(product_name) between 1 and 150),
  fulfillment_type_snapshot public.product_fulfillment_type not null,
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  line_subtotal numeric(12, 2) generated always as (unit_price * quantity) stored,
  created_at timestamptz not null default now()
);

create index order_items_order_id_idx on public.order_items (order_id);
create index order_items_product_id_idx on public.order_items (product_id);

alter table public.order_items enable row level security;
revoke all on public.order_items from anon;

create policy "order_items_select_via_order"
on public.order_items for select to authenticated
using (
  exists (
    select 1 from public.orders o
    where o.id = order_items.order_id
      and (
        o.user_id = (select auth.uid())
        or (select private.has_role(array['ADMIN', 'SUPER_ADMIN', 'FULFILLMENT']::public.app_role[]))
      )
  )
);

-- insert langsung (di luar checkout_cart) cuma untuk staff, dan cuma ke
-- order yang belum dibayar (mis. koreksi pesanan manual sebelum konfirmasi).
create policy "order_items_insert_staff_pending_order"
on public.order_items for insert to authenticated
with check (
  (select private.has_role(array['ADMIN', 'SUPER_ADMIN']::public.app_role[]))
  and exists (
    select 1 from public.orders o
    where o.id = order_items.order_id and o.status = 'PENDING_PAYMENT'
  )
);

-- Tidak ada policy update/delete: baris item bersifat tetap begitu dibuat.
-- Kalau salah, batalkan ordernya dan buat order baru (sama seperti
-- payment_proofs: retry lewat baris baru, bukan edit baris lama).

-- ---------- Integritas otomatis lewat trigger ----------

-- subtotal order SELALU dihitung ulang dari order_items, tidak pernah
-- dipercayakan ke aplikasi -> tidak mungkin "total" di order beda dari
-- jumlah item aslinya.
create or replace function public.recalc_order_subtotal()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected_order_id uuid := coalesce(new.order_id, old.order_id);
begin
  update public.orders
  set subtotal = coalesce(
    (select sum(line_subtotal) from public.order_items where order_id = affected_order_id),
    0
  )
  where id = affected_order_id;
  return null;
end;
$$;

revoke execute on function public.recalc_order_subtotal() from public, anon, authenticated;

create trigger order_items_recalc_subtotal
after insert or update or delete on public.order_items
for each row execute function public.recalc_order_subtotal();

-- Stok dikurangi begitu order_items dibuat (stok "dikunci" sejak checkout,
-- bukan baru saat admin konfirmasi bayar, supaya tidak oversell selagi
-- menunggu bukti transfer). stock_quantity NULL = tak terbatas, dilewati.
-- KETERBATASAN YANG DISADARI: kalau pesanan dibiarkan menggantung tanpa
-- pernah dibayar/dibatalkan, stok tetap "terkunci" selamanya. Perlu job
-- terjadwal (mis. Supabase Cron/Edge Function) untuk auto-cancel pesanan
-- kedaluwarsa -- di luar cakupan Fase C ini, dicatat sebagai TODO fase
-- berikutnya (Fase D/E, saat alur checkout end-to-end dipakai sungguhan).
create or replace function public.reserve_product_stock()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  updated_rows int;
begin
  if new.product_id is null then
    return new;
  end if;

  update public.products
  set stock_quantity = stock_quantity - new.quantity
  where id = new.product_id
    and stock_quantity is not null
    and stock_quantity >= new.quantity;

  get diagnostics updated_rows = row_count;

  if updated_rows = 0 then
    -- 0 baris berarti salah satu: stok tak terbatas (NULL, tidak perlu
    -- dikurangi) ATAU stok memang kurang. Bedakan keduanya di sini.
    if exists (
      select 1 from public.products where id = new.product_id and stock_quantity is not null
    ) then
      raise exception 'Stok produk "%" tidak mencukupi', new.product_name;
    end if;
  end if;

  return new;
end;
$$;

revoke execute on function public.reserve_product_stock() from public, anon, authenticated;

create trigger order_items_reserve_stock
before insert on public.order_items
for each row execute function public.reserve_product_stock();

-- Pesanan dibatalkan -> kembalikan stok yang sempat dikunci. Hanya jalan
-- sekali (transisi masuk ke CANCELLED), tidak berulang kalau di-update lagi
-- selagi statusnya sudah CANCELLED.
create or replace function public.restore_stock_on_cancel()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'CANCELLED' and old.status <> 'CANCELLED' then
    update public.products p
    set stock_quantity = p.stock_quantity + oi.quantity
    from public.order_items oi
    where oi.order_id = new.id
      and oi.product_id = p.id
      and p.stock_quantity is not null;
  end if;
  return new;
end;
$$;

revoke execute on function public.restore_stock_on_cancel() from public, anon, authenticated;

create trigger orders_restore_stock_on_cancel
after update on public.orders
for each row execute function public.restore_stock_on_cancel();

-- ---------- Checkout: satu transaksi atomik ----------
-- Dipanggil dari client lewat supabase.rpc('checkout_cart', {...}).
-- SECURITY DEFINER supaya bisa insert ke orders/order_items & kosongkan
-- cart_items tanpa bergantung pada policy insert per tabel di atas, TAPI
-- tetap aman karena user_id diambil dari auth.uid() milik pemanggil, bukan
-- dari parameter -- tidak mungkin checkout atas nama orang lain.
create or replace function public.checkout_cart(
  p_shipping_recipient_name text default null,
  p_shipping_phone text default null,
  p_shipping_address text default null,
  p_shipping_city text default null,
  p_shipping_province text default null,
  p_shipping_postal_code text default null,
  p_shipping_cost numeric default 0,
  p_customer_note text default null
)
returns public.orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_order public.orders;
  v_has_physical boolean;
begin
  if v_user_id is null then
    raise exception 'Harus login untuk checkout';
  end if;

  if not exists (select 1 from public.cart_items where user_id = v_user_id) then
    raise exception 'Keranjang kosong';
  end if;

  if exists (
    select 1 from public.cart_items ci
    join public.products p on p.id = ci.product_id
    where ci.user_id = v_user_id and not p.is_active
  ) then
    raise exception 'Ada produk di keranjang yang sudah tidak tersedia, hapus dulu sebelum checkout';
  end if;

  select exists (
    select 1 from public.cart_items ci
    join public.products p on p.id = ci.product_id
    where ci.user_id = v_user_id and p.fulfillment_type = 'PHYSICAL'
  ) into v_has_physical;

  if v_has_physical and (
    p_shipping_recipient_name is null or p_shipping_phone is null or p_shipping_address is null
  ) then
    raise exception 'Alamat pengiriman wajib diisi karena ada barang fisik di keranjang';
  end if;

  insert into public.orders (
    user_id, shipping_cost, shipping_recipient_name, shipping_phone,
    shipping_address, shipping_city, shipping_province, shipping_postal_code,
    customer_note
  ) values (
    v_user_id, coalesce(p_shipping_cost, 0), p_shipping_recipient_name, p_shipping_phone,
    p_shipping_address, p_shipping_city, p_shipping_province, p_shipping_postal_code,
    p_customer_note
  )
  returning * into v_order;

  -- Trigger order_items_reserve_stock akan raise exception (dan otomatis
  -- rollback SELURUH transaksi checkout ini, termasuk insert order di atas)
  -- kalau ada item yang stoknya tidak cukup.
  insert into public.order_items (
    order_id, product_id, product_name, fulfillment_type_snapshot, unit_price, quantity
  )
  select v_order.id, p.id, p.name, p.fulfillment_type, p.price, ci.quantity
  from public.cart_items ci
  join public.products p on p.id = ci.product_id
  where ci.user_id = v_user_id;

  delete from public.cart_items where user_id = v_user_id;

  select * into v_order from public.orders where id = v_order.id;
  return v_order;
end;
$$;

revoke execute on function public.checkout_cart(
  text, text, text, text, text, text, numeric, text
) from public, anon;
grant execute on function public.checkout_cart(
  text, text, text, text, text, text, numeric, text
) to authenticated;

-- ---------- Sambungkan ke payment_proofs (Fase E) ----------
-- Menepati catatan di migrasi payment_channels_and_proofs: order_id
-- sekarang diberi foreign key sungguhan, dan policy insert diperketat
-- dengan verifikasi kepemilikan order (bukan cuma uploaded_by).
alter table public.payment_proofs
  add constraint payment_proofs_order_id_fkey
  foreign key (order_id) references public.orders (id) on delete restrict;

drop policy "payment_proofs_insert_own" on public.payment_proofs;

create policy "payment_proofs_insert_own"
on public.payment_proofs for insert to authenticated
with check (
  (select auth.uid()) = uploaded_by
  and status = 'PENDING'
  and reviewed_by is null
  and reviewed_at is null
  and exists (
    select 1 from public.orders o
    where o.id = payment_proofs.order_id
      and o.user_id = (select auth.uid())
      and o.status = 'PENDING_PAYMENT'
  )
);

-- Bukti bayar dikonfirmasi admin -> otomatis majukan status order jadi PAID.
-- Kalau ditolak (REJECTED), order tetap PENDING_PAYMENT (pembeli upload ulang).
create or replace function public.mark_order_paid_on_payment_confirmed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'CONFIRMED' and old.status <> 'CONFIRMED' then
    update public.orders
    set status = 'PAID'
    where id = new.order_id and status = 'PENDING_PAYMENT';
  end if;
  return new;
end;
$$;

revoke execute on function public.mark_order_paid_on_payment_confirmed() from public, anon, authenticated;

create trigger payment_proofs_mark_order_paid
after update on public.payment_proofs
for each row execute function public.mark_order_paid_on_payment_confirmed();
