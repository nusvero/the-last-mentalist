import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Upload gambar ke bucket publik "public-assets" (foto produk, QRIS, dst).
 * Dipakai dari beberapa server action -- bukan action sendiri. */
export async function uploadPublicAsset(
  supabase: SupabaseClient<Database>,
  folder: string,
  file: File,
): Promise<{ url: string } | { error: string }> {
  if (file.size === 0) return { error: "Pilih file gambar terlebih dahulu." };
  if (file.size > MAX_SIZE_BYTES) return { error: "Ukuran file maksimal 5 MB." };
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return { error: "Format file harus JPG, PNG, atau WEBP." };
  }

  const extension = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;

  const { error } = await supabase.storage
    .from("public-assets")
    .upload(path, file, { contentType: file.type });
  if (error) {
    console.error("[storage] gagal upload aset publik:", error.message);
    return { error: "Gagal mengupload gambar. Silakan coba lagi." };
  }

  const { data } = supabase.storage.from("public-assets").getPublicUrl(path);
  return { url: data.publicUrl };
}
