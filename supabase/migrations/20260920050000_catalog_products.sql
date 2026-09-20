-- =========================================================
-- Fase B · Katalog produk
-- Toko jual dua jenis barang dalam satu katalog: board game fisik
-- (butuh ongkir & stok) dan produk digital (tanpa ongkir, tanpa
-- batas stok kecuali ditentukan). fulfillment_type membedakan
-- keduanya supaya Fase D (ongkir) hanya menghitung item fisik.
-- =========================================================

create type public.product_fulfillment_type as enum ('PHYSICAL', 'DIGITAL');

-- ---------- Helper peran: siapa yang boleh kelola katalog ----------
-- EDITOR ditambahkan di sini (bukan cuma ADMIN/SUPER_ADMIN) karena app_role
-- di Fase A3 sudah menyediakan peran EDITOR khusus untuk pengelolaan konten,
-- terpisah dari ADMIN (yang lebih ke operasional/peran/pesanan).
create or replace function private.is_catalog_manager()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.has_role(array['EDITOR', 'ADMIN', 'SUPER_ADMIN']::public.app_role[]);
$$;

revoke execute on function private.is_catalog_manager() from public, anon;
grant execute on function private.is_catalog_manager() to authenticated;

-- ---------- product_categories ----------
create table public.product_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text check (char_length(description) <= 500),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (slug)
);

create index product_categories_active_sort_idx
  on public.product_categories (is_active, sort_order);

create trigger product_categories_set_updated_at
before update on public.product_categories
for each row execute function public.set_updated_at();

alter table public.product_categories enable row level security;

-- select dipecah anon vs authenticated: anon TIDAK boleh dikenai pengecekan
-- private.is_catalog_manager() sama sekali (tidak punya izin EXECUTE),
-- lihat catatan di migrasi payment_channels_and_proofs soal ini.
create policy "product_categories_select_active"
on public.product_categories for select to anon
using (is_active);

create policy "product_categories_select_active_or_manager"
on public.product_categories for select to authenticated
using (is_active or (select private.is_catalog_manager()));

create policy "product_categories_insert_manager"
on public.product_categories for insert to authenticated
with check ((select private.is_catalog_manager()));

create policy "product_categories_update_manager"
on public.product_categories for update to authenticated
using ((select private.is_catalog_manager()))
with check ((select private.is_catalog_manager()));

create policy "product_categories_delete_manager"
on public.product_categories for delete to authenticated
using ((select private.is_catalog_manager()));

-- ---------- products ----------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.product_categories (id) on delete set null,
  fulfillment_type public.product_fulfillment_type not null,
  name text not null check (char_length(name) between 1 and 150),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  short_description text check (char_length(short_description) <= 300),
  description text check (char_length(description) <= 5000),
  price numeric(12, 2) not null check (price >= 0),
  compare_at_price numeric(12, 2) check (compare_at_price is null or compare_at_price > price),
  sku text check (char_length(sku) <= 50),
  -- null = stok tidak dibatasi (umum untuk produk digital)
  stock_quantity integer check (stock_quantity is null or stock_quantity >= 0),
  -- wajib diisi untuk produk fisik: dipakai Fase D untuk hitung ongkir (RajaOngkir)
  weight_grams integer check (weight_grams is null or weight_grams > 0),
  is_active boolean not null default true,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (slug),
  unique (sku),
  constraint products_physical_requires_weight
    check (fulfillment_type <> 'PHYSICAL' or weight_grams is not null)
);

create index products_category_id_idx on public.products (category_id);
create index products_active_featured_idx on public.products (is_active, is_featured);
create index products_fulfillment_type_idx on public.products (fulfillment_type);

create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

alter table public.products enable row level security;

create policy "products_select_active"
on public.products for select to anon
using (is_active);

create policy "products_select_active_or_manager"
on public.products for select to authenticated
using (is_active or (select private.is_catalog_manager()));

create policy "products_insert_manager"
on public.products for insert to authenticated
with check ((select private.is_catalog_manager()));

create policy "products_update_manager"
on public.products for update to authenticated
using ((select private.is_catalog_manager()))
with check ((select private.is_catalog_manager()));

create policy "products_delete_manager"
on public.products for delete to authenticated
using ((select private.is_catalog_manager()));

-- ---------- product_images ----------
create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  url text not null check (char_length(url) > 0),
  alt_text text check (char_length(alt_text) <= 200),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index product_images_product_id_sort_idx
  on public.product_images (product_id, sort_order);

alter table public.product_images enable row level security;

-- Gambar ikut visibilitas produk induknya (produk nonaktif -> gambar juga
-- tidak boleh dibaca publik), dipecah anon/authenticated dengan alasan sama
-- seperti policy di atas.
create policy "product_images_select_of_visible_product"
on public.product_images for select to anon
using (
  exists (
    select 1 from public.products p
    where p.id = product_images.product_id and p.is_active
  )
);

create policy "product_images_select_of_visible_product_or_manager"
on public.product_images for select to authenticated
using (
  exists (
    select 1 from public.products p
    where p.id = product_images.product_id and p.is_active
  )
  or (select private.is_catalog_manager())
);

create policy "product_images_insert_manager"
on public.product_images for insert to authenticated
with check ((select private.is_catalog_manager()));

create policy "product_images_update_manager"
on public.product_images for update to authenticated
using ((select private.is_catalog_manager()))
with check ((select private.is_catalog_manager()));

create policy "product_images_delete_manager"
on public.product_images for delete to authenticated
using ((select private.is_catalog_manager()));
