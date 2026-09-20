import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type PaymentChannel = Pick<
  Tables<"payment_channels">,
  | "id"
  | "type"
  | "name"
  | "account_holder"
  | "account_number"
  | "qris_image_url"
  | "instructions"
>;

/** Rekening/e-wallet/QRIS aktif, ditampilkan di halaman upload bukti bayar. */
export async function getActivePaymentChannels(): Promise<PaymentChannel[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("payment_channels")
    .select(
      "id, type, name, account_holder, account_number, qris_image_url, instructions",
    )
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[payment] gagal ambil channel:", error.message);
    return [];
  }
  return data;
}

export type OrderPaymentProof = {
  id: string;
  status: Tables<"payment_proofs">["status"];
  rejectionReason: string | null;
  createdAt: string;
};

/** Bukti bayar TERAKHIR untuk satu order milik user yang login (kalau ada). */
export async function getLatestPaymentProof(
  orderId: string,
): Promise<OrderPaymentProof | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("payment_proofs")
    .select("id, status, rejection_reason, created_at")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[payment] gagal ambil bukti bayar:", error.message);
    return null;
  }
  if (!data) return null;
  return {
    id: data.id,
    status: data.status,
    rejectionReason: data.rejection_reason,
    createdAt: data.created_at,
  };
}

export type PendingPaymentProof = {
  id: string;
  orderId: string;
  orderNumber: string;
  orderTotal: string;
  amount: string;
  senderName: string | null;
  note: string | null;
  channelName: string;
  createdAt: string;
  signedImageUrl: string | null;
};

/** Antrean bukti bayar PENDING untuk admin konfirmasi, dgn signed URL gambar. */
export async function getPendingPaymentProofs(): Promise<PendingPaymentProof[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("payment_proofs")
    .select(
      `id, amount, sender_name, note, created_at, proof_image_url,
       orders(id, order_number, total),
       payment_channels(name)`,
    )
    .eq("status", "PENDING")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[payment] gagal ambil antrean konfirmasi:", error.message);
    return [];
  }

  const results: PendingPaymentProof[] = [];
  for (const row of data) {
    if (!row.orders) continue;
    const { data: signed } = await supabase.storage
      .from("payment-proofs")
      .createSignedUrl(row.proof_image_url, 60 * 10);

    results.push({
      id: row.id,
      orderId: row.orders.id,
      orderNumber: row.orders.order_number,
      orderTotal: row.orders.total,
      amount: row.amount,
      senderName: row.sender_name,
      note: row.note,
      channelName: row.payment_channels?.name ?? "-",
      createdAt: row.created_at,
      signedImageUrl: signed?.signedUrl ?? null,
    });
  }
  return results;
}
