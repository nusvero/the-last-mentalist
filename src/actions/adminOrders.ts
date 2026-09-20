"use server";

import { revalidatePath } from "next/cache";

import type { AdminActionResult } from "@/lib/adminActionResult";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { updateOrderStatusSchema } from "@/lib/validation/order";

function strOrUndefined(v: FormDataEntryValue | null): string | undefined {
  if (typeof v !== "string" || v.trim() === "") return undefined;
  return v.trim();
}

export async function updateOrderStatusAction(
  orderId: string,
  _prev: AdminActionResult,
  formData: FormData,
): Promise<AdminActionResult> {
  const parsed = updateOrderStatusSchema.safeParse({
    orderId,
    status: formData.get("status"),
    shippingCourier: strOrUndefined(formData.get("shippingCourier")),
    shippingTrackingNumber: strOrUndefined(formData.get("shippingTrackingNumber")),
    cancelledReason: strOrUndefined(formData.get("cancelledReason")),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Data tidak valid.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("orders")
    .update({
      status: parsed.data.status,
      shipping_courier: parsed.data.shippingCourier ?? null,
      shipping_tracking_number: parsed.data.shippingTrackingNumber ?? null,
      cancelled_reason:
        parsed.data.status === "CANCELLED" ? parsed.data.cancelledReason : null,
    })
    .eq("id", parsed.data.orderId)
    .select("order_number");

  if (error)
    return {
      status: "error",
      message: error.message || "Gagal mengubah status pesanan.",
    };
  if (!data || data.length === 0) {
    return { status: "error", message: "Tidak diizinkan, atau pesanan tidak ditemukan." };
  }

  const orderNumber = data[0]!.order_number;
  revalidatePath("/admin/pesanan");
  revalidatePath(`/admin/pesanan/${orderNumber}`);
  revalidatePath(`/account/orders/${orderNumber}`);
  return { status: "success" };
}
