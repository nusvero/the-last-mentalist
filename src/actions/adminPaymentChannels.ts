"use server";

import { revalidatePath } from "next/cache";

import { uploadPublicAsset } from "@/lib/storage/publicAssets";
import type { AdminActionResult } from "@/lib/adminActionResult";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { paymentChannelSchema } from "@/lib/validation/paymentChannel";

function strOrUndefined(v: FormDataEntryValue | null): string | undefined {
  if (typeof v !== "string" || v.trim() === "") return undefined;
  return v.trim();
}

function parseChannelForm(formData: FormData) {
  return {
    type: formData.get("type"),
    name: formData.get("name"),
    accountHolder: strOrUndefined(formData.get("accountHolder")),
    accountNumber: strOrUndefined(formData.get("accountNumber")),
    instructions: strOrUndefined(formData.get("instructions")),
    isActive: formData.get("isActive") === "on",
  };
}

export async function createPaymentChannelAction(
  _prev: AdminActionResult,
  formData: FormData,
): Promise<AdminActionResult> {
  const parsed = paymentChannelSchema.safeParse(parseChannelForm(formData));
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Data tidak valid.",
    };
  }

  const supabase = await createSupabaseServerClient();

  let qrisImageUrl: string | null = null;
  if (parsed.data.type === "QRIS") {
    const file = formData.get("qrisImage");
    if (!(file instanceof File) || file.size === 0) {
      return { status: "error", message: "Gambar QRIS wajib diupload." };
    }
    const uploaded = await uploadPublicAsset(supabase, "payment-channels", file);
    if ("error" in uploaded) return { status: "error", message: uploaded.error };
    qrisImageUrl = uploaded.url;
  }

  const { error } = await supabase.from("payment_channels").insert({
    type: parsed.data.type,
    name: parsed.data.name,
    account_holder: parsed.data.accountHolder ?? null,
    account_number: parsed.data.accountNumber ?? null,
    qris_image_url: qrisImageUrl,
    instructions: parsed.data.instructions ?? null,
    is_active: parsed.data.isActive,
  });

  if (error)
    return { status: "error", message: error.message || "Gagal membuat channel." };

  revalidatePath("/admin/channel-pembayaran");
  return { status: "success" };
}

export async function updatePaymentChannelAction(
  channelId: string,
  existingQrisImageUrl: string | null,
  _prev: AdminActionResult,
  formData: FormData,
): Promise<AdminActionResult> {
  const parsed = paymentChannelSchema.safeParse(parseChannelForm(formData));
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Data tidak valid.",
    };
  }

  const supabase = await createSupabaseServerClient();

  let qrisImageUrl = existingQrisImageUrl;
  if (parsed.data.type === "QRIS") {
    const file = formData.get("qrisImage");
    if (file instanceof File && file.size > 0) {
      const uploaded = await uploadPublicAsset(supabase, "payment-channels", file);
      if ("error" in uploaded) return { status: "error", message: uploaded.error };
      qrisImageUrl = uploaded.url;
    }
    if (!qrisImageUrl) {
      return { status: "error", message: "Gambar QRIS wajib diupload." };
    }
  }

  const { data, error } = await supabase
    .from("payment_channels")
    .update({
      type: parsed.data.type,
      name: parsed.data.name,
      account_holder: parsed.data.accountHolder ?? null,
      account_number: parsed.data.accountNumber ?? null,
      qris_image_url: parsed.data.type === "QRIS" ? qrisImageUrl : null,
      instructions: parsed.data.instructions ?? null,
      is_active: parsed.data.isActive,
    })
    .eq("id", channelId)
    .select("id");

  if (error)
    return { status: "error", message: error.message || "Gagal menyimpan channel." };
  if (!data || data.length === 0) {
    return { status: "error", message: "Tidak diizinkan, atau channel tidak ditemukan." };
  }

  revalidatePath("/admin/channel-pembayaran");
  return { status: "success" };
}

export async function togglePaymentChannelActiveAction(
  channelId: string,
  isActive: boolean,
): Promise<AdminActionResult> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("payment_channels")
    .update({ is_active: isActive })
    .eq("id", channelId)
    .select("id");

  if (error)
    return { status: "error", message: error.message || "Gagal mengubah status." };
  if (!data || data.length === 0) {
    return { status: "error", message: "Tidak diizinkan, atau channel tidak ditemukan." };
  }

  revalidatePath("/admin/channel-pembayaran");
  return { status: "success" };
}
