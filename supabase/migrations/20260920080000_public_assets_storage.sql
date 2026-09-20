-- =========================================================
-- Fase F · Storage bucket untuk aset publik (gambar produk, QRIS)
-- Beda dengan "payment-proofs" (privat): bucket ini PUBLIC karena isinya
-- memang untuk ditampilkan ke pengunjung (foto produk, kode QRIS).
-- =========================================================

insert into storage.buckets (id, name, public)
values ('public-assets', 'public-assets', true)
on conflict (id) do nothing;

-- siapa saja (termasuk anon) boleh baca -- ini yang bikin <img src> di
-- halaman publik kerja tanpa perlu signed URL.
create policy "public_assets_select_all"
on storage.objects for select to anon, authenticated
using (bucket_id = 'public-assets');

-- hanya pengelola katalog (EDITOR/ADMIN/SUPER_ADMIN) yang boleh unggah/ubah/hapus.
create policy "public_assets_insert_catalog_manager"
on storage.objects for insert to authenticated
with check (bucket_id = 'public-assets' and (select private.is_catalog_manager()));

create policy "public_assets_update_catalog_manager"
on storage.objects for update to authenticated
using (bucket_id = 'public-assets' and (select private.is_catalog_manager()))
with check (bucket_id = 'public-assets' and (select private.is_catalog_manager()));

create policy "public_assets_delete_catalog_manager"
on storage.objects for delete to authenticated
using (bucket_id = 'public-assets' and (select private.is_catalog_manager()));
