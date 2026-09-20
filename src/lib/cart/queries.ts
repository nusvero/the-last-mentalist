import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type CartLine = {
  id: string;
  productId: string;
  quantity: number;
  productName: string;
  productSlug: string;
  unitPrice: string;
  imageUrl: string | null;
  fulfillmentType: Tables<"products">["fulfillment_type"];
  weightGrams: number | null;
  isActive: boolean;
  stockQuantity: number | null;
};

/** Isi keranjang milik user yang sedang login. Kosong (bukan error) kalau belum login. */
export async function getCartLines(): Promise<CartLine[]> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("cart_items")
    .select(
      `id, quantity, product_id,
       products(name, slug, price, fulfillment_type, weight_grams, is_active, stock_quantity,
         product_images(url, sort_order))`,
    )
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[cart] gagal ambil keranjang:", error.message);
    return [];
  }

  return data
    .filter((row) => row.products !== null)
    .map((row) => {
      const product = row.products!;
      const sortedImages = [...product.product_images].sort(
        (a, b) => a.sort_order - b.sort_order,
      );
      return {
        id: row.id,
        productId: row.product_id,
        quantity: row.quantity,
        productName: product.name,
        productSlug: product.slug,
        unitPrice: product.price,
        imageUrl: sortedImages[0]?.url ?? null,
        fulfillmentType: product.fulfillment_type,
        weightGrams: product.weight_grams,
        isActive: product.is_active,
        stockQuantity: product.stock_quantity,
      };
    });
}

export function cartSubtotal(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + Number(l.unitPrice) * l.quantity, 0);
}

export function cartTotalWeightGrams(lines: CartLine[]): number {
  return lines
    .filter((l) => l.fulfillmentType === "PHYSICAL")
    .reduce((sum, l) => sum + (l.weightGrams ?? 0) * l.quantity, 0);
}

export function cartHasPhysicalItems(lines: CartLine[]): boolean {
  return lines.some((l) => l.fulfillmentType === "PHYSICAL");
}
