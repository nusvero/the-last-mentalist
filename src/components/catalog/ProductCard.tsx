import Link from "next/link";

import { formatRupiah } from "@/lib/format";
import type { ProductListItem } from "@/lib/catalog/queries";

export function ProductCard({ product }: { product: ProductListItem }) {
  return (
    <Link
      href={`/produk/${product.slug}`}
      className="group overflow-hidden rounded-card border border-border-dark bg-charcoal transition-colors hover:border-gold"
    >
      <div className="relative aspect-square bg-deep">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- domain storage gambar belum final untuk didaftarkan ke next/image
          <img
            src={product.imageUrl}
            alt={product.name}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-caption text-muted">
            Tidak ada gambar
          </div>
        )}
        {product.isOutOfStock && (
          <span className="absolute top-2 right-2 rounded-full bg-crimson-dark px-2.5 py-1 text-caption text-ivory">
            Stok Habis
          </span>
        )}
      </div>
      <div className="space-y-1 px-4 py-3">
        {product.categoryName && (
          <p className="text-eyebrow tracking-arcane text-muted">
            {product.categoryName}
          </p>
        )}
        <p className="text-body font-medium text-ivory group-hover:text-gold-pale">
          {product.name}
        </p>
        <div className="flex items-baseline gap-2">
          <p className="text-body-sm text-gold-pale">{formatRupiah(product.price)}</p>
          {product.compareAtPrice && (
            <p className="text-caption text-muted line-through">
              {formatRupiah(product.compareAtPrice)}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
