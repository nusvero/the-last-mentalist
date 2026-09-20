import Link from "next/link";
import type { Metadata } from "next";

import { ProductCard } from "@/components/catalog/ProductCard";
import { getActiveCategories, getActiveProducts } from "@/lib/catalog/queries";

export const metadata: Metadata = { title: "Produk" };

export default async function ProductListPage({
  searchParams,
}: {
  searchParams: Promise<{ kategori?: string }>;
}) {
  const { kategori } = await searchParams;
  const [categories, products] = await Promise.all([
    getActiveCategories(),
    getActiveProducts({ categorySlug: kategori }),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
      <h1 className="font-display text-h1 text-ivory">Produk</h1>

      {categories.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/produk"
            className={`rounded-full border px-4 py-2 text-body-sm ${
              !kategori
                ? "border-gold bg-gold text-obsidian"
                : "border-border-dark text-ivory hover:border-gold"
            }`}
          >
            Semua
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/produk?kategori=${c.slug}`}
              className={`rounded-full border px-4 py-2 text-body-sm ${
                kategori === c.slug
                  ? "border-gold bg-gold text-obsidian"
                  : "border-border-dark text-ivory hover:border-gold"
              }`}
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}

      {products.length === 0 ? (
        <p className="mt-12 text-body text-muted">Belum ada produk di kategori ini.</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </main>
  );
}
