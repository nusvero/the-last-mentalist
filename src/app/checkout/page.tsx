import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import {
  cartHasPhysicalItems,
  cartSubtotal,
  cartTotalWeightGrams,
  getCartLines,
} from "@/lib/cart/queries";
import { formatRupiah } from "@/lib/format";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/checkout");

  const lines = await getCartLines();
  if (lines.length === 0) redirect("/keranjang");

  const hasPhysicalItems = cartHasPhysicalItems(lines);
  const totalWeightGrams = cartTotalWeightGrams(lines);
  const subtotal = cartSubtotal(lines);
  const inactiveItem = lines.find((l) => !l.isActive);
  const outOfStockItem = lines.find(
    (l) => l.stockQuantity !== null && l.stockQuantity < l.quantity,
  );

  return (
    <main className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
      <h1 className="font-display text-h1 text-ivory">Checkout</h1>

      {(inactiveItem || outOfStockItem) && (
        <div className="mt-6 rounded-md border border-crimson bg-crimson-dark/30 px-4 py-3 text-body-sm text-ivory">
          Ada produk di keranjang yang sudah tidak tersedia atau stoknya kurang. Silakan{" "}
          <Link href="/keranjang" className="underline">
            perbarui keranjang
          </Link>{" "}
          sebelum checkout.
        </div>
      )}

      <div className="mt-8 rounded-card border border-border-dark bg-charcoal p-5">
        <h2 className="font-display text-h3 text-gold-pale">Ringkasan Pesanan</h2>
        <ul className="mt-3 space-y-1 text-body-sm text-muted">
          {lines.map((l) => (
            <li key={l.id} className="flex justify-between">
              <span>
                {l.productName} × {l.quantity}
              </span>
              <span>{formatRupiah(Number(l.unitPrice) * l.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t border-border-dark pt-3 text-body text-ivory">
          <span>Subtotal</span>
          <span>{formatRupiah(subtotal)}</span>
        </div>
      </div>

      <div className="mt-10">
        <CheckoutForm
          hasPhysicalItems={hasPhysicalItems}
          totalWeightGrams={totalWeightGrams}
        />
      </div>
    </main>
  );
}
