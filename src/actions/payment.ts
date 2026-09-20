"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  ACCEPTED_PROOF_MIME_TYPES,
  MAX_PROOF_FILE_SIZE_BYTES,
  rejectPaymentProofSchema,
  reviewPaymentProofSchema,
  uploadPaymentProofSchema,
} from "@/lib/validation/payment";

export type PaymentActionResult =
  { status: "success" } | { status: "error"; message: string };

const GENERIC_ERROR = "Gagal memproses. Silakan coba lagi.";

export async function uploadPaymentProofAction(
  formData: FormData,
): Promise<PaymentActionResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: "Silakan login dulu." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", message: "Pilih file bukti bayar terlebih dahulu." };
  }
  if (file.size > MAX_PROOF_FILE_SIZE_BYTES) {
    return { status: "error", message: "Ukuran file maksimal 5 MB." };
  }
  if (
    !ACCEPTED_PROOF_MIME_TYPES.includes(
      file.type as (typeof ACCEPTED_PROOF_MIME_TYPES)[number],
    )
  ) {
    return { status: "error", message: "Format file harus JPG, PNG, atau WEBP." };
  }

  const rawAmount = formData.get("amount");
  const parsed = uploadPaymentProofSchema.safeParse({
    orderId: formData.get("orderId"),
    channelId: formData.get("channelId"),
    amount: typeof rawAmount === "string" ? Number(rawAmount) : NaN,
    senderName: formData.get("senderName") || undefined,
    note: formData.get("note") || undefined,
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? GENERIC_ERROR };
  }

  const orderNumber = formData.get("orderNumber");
  const extension = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
  const path = `${user.id}/${parsed.data.orderId}/${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("payment-proofs")
    .upload(path, file, { contentType: file.type });
  if (uploadError) {
    console.error("[payment] gagal upload file:", uploadError.message);
    return {
      status: "error",
      message: "Gagal mengupload bukti bayar. Silakan coba lagi.",
    };
  }

  const { error: insertError } = await supabase.from("payment_proofs").insert({
    order_id: parsed.data.orderId,
    channel_id: parsed.data.channelId,
    uploaded_by: user.id,
    amount: String(parsed.data.amount),
    sender_name: parsed.data.senderName ?? null,
    proof_image_url: path,
    note: parsed.data.note ?? null,
  });

  if (insertError) {
    // Bersihkan file yang telanjur terupload supaya tidak jadi sampah di storage.
    await supabase.storage.from("payment-proofs").remove([path]);
    return { status: "error", message: insertError.message || GENERIC_ERROR };
  }

  if (typeof orderNumber === "string" && orderNumber) {
    revalidatePath(`/account/orders/${orderNumber}`);
  }
  return { status: "success" };
}

export async function confirmPaymentProofAction(
  proofId: string,
): Promise<PaymentActionResult> {
  const parsed = reviewPaymentProofSchema.safeParse({ proofId });
  if (!parsed.success) return { status: "error", message: GENERIC_ERROR };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: "Silakan login dulu." };

  const { data, error } = await supabase
    .from("payment_proofs")
    .update({
      status: "CONFIRMED",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.proofId)
    .select("id");

  if (error) return { status: "error", message: error.message || GENERIC_ERROR };
  if (!data || data.length === 0) {
    return {
      status: "error",
      message: "Tidak diizinkan, atau bukti bayar tidak ditemukan.",
    };
  }

  revalidatePath("/admin/pembayaran");
  return { status: "success" };
}

export async function rejectPaymentProofAction(
  proofId: string,
  rejectionReason: string,
): Promise<PaymentActionResult> {
  const parsed = rejectPaymentProofSchema.safeParse({ proofId, rejectionReason });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? GENERIC_ERROR };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: "Silakan login dulu." };

  const { data, error } = await supabase
    .from("payment_proofs")
    .update({
      status: "REJECTED",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      rejection_reason: parsed.data.rejectionReason,
    })
    .eq("id", parsed.data.proofId)
    .select("id");

  if (error) return { status: "error", message: error.message || GENERIC_ERROR };
  if (!data || data.length === 0) {
    return {
      status: "error",
      message: "Tidak diizinkan, atau bukti bayar tidak ditemukan.",
    };
  }

  revalidatePath("/admin/pembayaran");
  return { status: "success" };
}
