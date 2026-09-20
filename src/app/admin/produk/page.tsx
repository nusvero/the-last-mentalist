import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { toggleProductActiveAction } from "@/actions/adminProducts";
import { ActiveToggleButton } from "@/components/admin/ActiveToggleButton";
import { isCurrentUserCatalogManager } from "@/lib/auth/roles";
import { getAllProductsForAdmin } from "@/lib/catalog/adminQueries";
import { formatRupiah } from "@/lib/format";

export const metadata: Metadata = { title: "Kelola Produk" };

export default async function AdminProductListPage() {
  if (!(await isCurrentUserCatalogManager())) redirect("/admin");

  const products = await getAllProductsForAdmin();

  return (
    <main className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-h1 text-ivory">Kelola Produk</h1>
        <Link
          href="/admin/produk/baru"
          className="rounded-md bg-gold px-5 py-2 font-semibold text-obsidian"
        >
          + Produk Baru
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="mt-8 text-body text-muted">
          Belum ada produk. Tambahkan yang pertama.
        </p>
      ) : (
        <div className="mt-8 divide-y divide-border-dark border-y border-border-dark">
          {products.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-4 px-2 py-4">
              <div className="min-w-0 flex-1">
                <Link
                  href={`/admin/produk/${p.id}`}
                  className="truncate text-body text-ivory hover:text-gold-pale"
                >
                  {p.name}
                </Link>
                <p className="text-body-sm text-muted">
                  {p.categoryName ?? "Tanpa kategori"} ·{" "}
                  {p.fulfillmentType === "PHYSICAL" ? "Fisik" : "Digital"}
                  {p.stockQuantity !== null && ` · Stok ${p.stockQuantity}`}
                </p>
              </div>
              <p className="w-32 shrink-0 text-right text-body-sm text-gold-pale">
                {formatRupiah(p.price)}
              </p>
              <ActiveToggleButton
                isActive={p.isActive}
                onToggle={(next) => toggleProductActiveAction(p.id, next)}
              />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
