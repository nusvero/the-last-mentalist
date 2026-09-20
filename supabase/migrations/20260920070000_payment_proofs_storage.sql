-- =========================================================
-- Fase E · Storage bucket untuk bukti bayar
-- Bucket PRIVATE (bukan public): screenshot mutasi bank/e-wallet berisi
-- info yang tidak pantas dibuka ke siapa pun lewat URL publik. Akses
-- dibaca lewat signed URL yang dibuat sesudah lolos RLS di bawah.
--
-- Konvensi path objek: "{uploaded_by}/{order_id}/{timestamp}-{nama_file}"
-- -- folder pertama dipakai storage.foldername() untuk cek kepemilikan.
-- =========================================================

insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false)
on conflict (id) do nothing;

-- pembeli hanya boleh upload ke foldernya sendiri
create policy "payment_proofs_storage_insert_own"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'payment-proofs'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

-- pembeli lihat file miliknya sendiri; admin lihat semua (untuk verifikasi)
create policy "payment_proofs_storage_select_own_or_admin"
on storage.objects for select to authenticated
using (
  bucket_id = 'payment-proofs'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or (select private.is_admin())
  )
);

-- Tidak ada policy update/delete: bukti bayar yang sudah diupload tidak
-- boleh diubah/dihapus siapa pun lewat API (audit trail), sama seperti
-- baris payment_proofs itu sendiri.
