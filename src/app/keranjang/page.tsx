import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CartItemRow } from "@/components/cart/CartItemRow";
import { cartHasPhysicalItems, cartSubtotal, getCartLines } from "@/lib/cart/queries";
import { formatRupiah } from "@/lib/format";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Keranjang" };

export default async function CartPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/keranjang");

  const lines = await getCartLines();

  return (
    <main className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
      <h1 className="font-display text-h1 text-ivory">Keranjang</h1>

      {lines.length === 0 ? (
        <div className="mt-8">
          <p className="text-body text-muted">Keranjangmu masih kosong.</p>
          <Link
            href="/produk"
            className="mt-4 inline-block text-body text-gold-pale underline"
          >
            Lihat produk
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-8">
            {lines.map((line) => (
              <CartItemRow key={line.id} line={line} />
            ))}
          </div>

          <div className="mt-8 space-y-4 border-t border-border-dark pt-6">
            <div className="flex items-center justify-between">
              <p className="text-body text-muted">Subtotal</p>
              <p className="font-display text-h3 text-ivory">
                {formatRupiah(cartSubtotal(lines))}
              </p>
            </div>
            {cartHasPhysicalItems(lines) && (
              <p className="text-body-sm text-muted">
                Ongkos kirim dihitung di halaman checkout, sesuai alamat tujuan.
              </p>
            )}
            <Link
              href="/checkout"
              className="block w-full rounded-md bg-gold px-5 py-3 text-center font-semibold text-obsidian"
            >
              Lanjut ke Checkout
            </Link>
          </div>
        </>
      )}
    </main>
  );
}
