import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Semua peran user yang sedang login (bisa lebih dari satu). */
export async function getCurrentUserRoles(): Promise<string[]> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);
  if (error) {
    console.error("[roles] gagal ambil peran:", error.message);
    return [];
  }
  return data.map((r) => r.role);
}

/** ADMIN/SUPER_ADMIN: kelola pembayaran, channel bayar, peran, dan operasional penuh. */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const roles = await getCurrentUserRoles();
  return roles.includes("ADMIN") || roles.includes("SUPER_ADMIN");
}

/** EDITOR/ADMIN/SUPER_ADMIN: boleh kelola katalog (produk & kategori). Samakan
 * dengan private.is_catalog_manager() di database. */
export async function isCurrentUserCatalogManager(): Promise<boolean> {
  const roles = await getCurrentUserRoles();
  return (
    roles.includes("EDITOR") || roles.includes("ADMIN") || roles.includes("SUPER_ADMIN")
  );
}

/** ADMIN/SUPER_ADMIN/FULFILLMENT: boleh kelola pesanan (status, resi).
 * Samakan dengan policy orders_update_staff di database. */
export async function isCurrentUserOrderStaff(): Promise<boolean> {
  const roles = await getCurrentUserRoles();
  return (
    roles.includes("ADMIN") ||
    roles.includes("SUPER_ADMIN") ||
    roles.includes("FULFILLMENT")
  );
}

/** Siapa saja yang punya peran staf apa pun -- dipakai untuk gerbang masuk /admin,
 * halaman/tindakan spesifik tetap dicek lagi dengan fungsi yang lebih sempit di atas. */
export async function isCurrentUserStaff(): Promise<boolean> {
  const roles = await getCurrentUserRoles();
  return roles.some(
    (r) => r === "EDITOR" || r === "ADMIN" || r === "SUPER_ADMIN" || r === "FULFILLMENT",
  );
}
