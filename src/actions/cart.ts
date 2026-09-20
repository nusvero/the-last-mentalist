"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  addToCartSchema,
  removeCartItemSchema,
  updateCartItemSchema,
} from "@/lib/validation/cart";

export type CartActionResult =
  | { status: "success" }
  | { status: "error"; message: string }
  | { status: "unauthenticated" };

const GENERIC_ERROR: CartActionResult = {
  status: "error",
  message: "Keranjang tidak bisa diperbarui. Silakan coba lagi.",
};

export async function addToCartAction(
  productId: string,
  quantity: number,
): Promise<CartActionResult> {
  const parsed = addToCartSchema.safeParse({ productId, quantity });
  if (!parsed.success) return GENERIC_ERROR;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "unauthenticated" };

  // Kalau produk sudah ada di cart, tambah quantity-nya (bukan baris baru) --
  // cocok dengan unique(user_id, product_id) di skema.
  const { data: existing } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("user_id", user.id)
    .eq("product_id", parsed.data.productId)
    .maybeSingle();

  const { error } = existing
    ? await supabase
        .from("cart_items")
        .update({ quantity: existing.quantity + parsed.data.quantity })
        .eq("id", existing.id)
    : await supabase.from("cart_items").insert({
        user_id: user.id,
        product_id: parsed.data.productId,
        quantity: parsed.data.quantity,
      });

  if (error) {
    console.error("[cart] gagal tambah item:", error.message);
    return GENERIC_ERROR;
  }

  revalidatePath("/keranjang");
  return { status: "success" };
}

export async function updateCartItemQuantityAction(
  cartItemId: string,
  quantity: number,
): Promise<CartActionResult> {
  const parsed = updateCartItemSchema.safeParse({ cartItemId, quantity });
  if (!parsed.success) return GENERIC_ERROR;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("cart_items")
    .update({ quantity: parsed.data.quantity })
    .eq("id", parsed.data.cartItemId);

  if (error) {
    console.error("[cart] gagal ubah jumlah:", error.message);
    return GENERIC_ERROR;
  }

  revalidatePath("/keranjang");
  return { status: "success" };
}

export async function removeCartItemAction(
  cartItemId: string,
): Promise<CartActionResult> {
  const parsed = removeCartItemSchema.safeParse({ cartItemId });
  if (!parsed.success) return GENERIC_ERROR;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("id", parsed.data.cartItemId);

  if (error) {
    console.error("[cart] gagal hapus item:", error.message);
    return GENERIC_ERROR;
  }

  revalidatePath("/keranjang");
  return { status: "success" };
}
