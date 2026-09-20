import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Peran staf yang boleh mengelola pembayaran/pesanan (bukan CUSTOMER biasa). */
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

export async function isCurrentUserAdmin(): Promise<boolean> {
  const roles = await getCurrentUserRoles();
  return roles.includes("ADMIN") || roles.includes("SUPER_ADMIN");
}
