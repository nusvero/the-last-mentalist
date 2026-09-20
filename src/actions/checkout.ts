"use server";

import { revalidatePath } from "next/cache";
import type { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkoutSchema } from "@/lib/validation/checkout";

export type CheckoutActionResult =
  { status: "success"; orderNumber: string } | { status: "error"; message: string };

const GENERIC_ERROR = "Checkout gagal. Silakan coba lagi.";

export async function checkoutAction(
  input: z.infer<typeof checkoutSchema>,
): Promise<CheckoutActionResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: "Silakan login dulu untuk checkout." };

  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? GENERIC_ERROR };
  }

  const { data, error } = await supabase.rpc("checkout_cart", {
    p_shipping_recipient_name: parsed.data.shippingRecipientName ?? null,
    p_shipping_phone: parsed.data.shippingPhone ?? null,
    p_shipping_address: parsed.data.shippingAddress ?? null,
    p_shipping_city: parsed.data.shippingCity ?? null,
    p_shipping_province: parsed.data.shippingProvince ?? null,
    p_shipping_postal_code: parsed.data.shippingPostalCode ?? null,
    p_shipping_cost: parsed.data.shippingCost,
    p_customer_note: parsed.data.customerNote ?? null,
  });

  if (error) {
    // Pesan dari RAISE EXCEPTION di checkout_cart() sudah dalam Bahasa
    // Indonesia dan aman ditampilkan langsung (mis. "Keranjang kosong",
    // "Stok produk ... tidak mencukupi").
    return { status: "error", message: error.message || GENERIC_ERROR };
  }

  revalidatePath("/keranjang");
  revalidatePath("/account");
  return { status: "success", orderNumber: data.order_number };
}
