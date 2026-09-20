import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type AdminPaymentChannel = Tables<"payment_channels">;

/** Semua channel (aktif & nonaktif), untuk admin kelola. */
export async function getAllPaymentChannelsForAdmin(): Promise<AdminPaymentChannel[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("payment_channels")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[payment/admin] gagal ambil channel:", error.message);
    return [];
  }
  return data;
}
