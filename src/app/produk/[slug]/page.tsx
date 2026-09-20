import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AddToCartButton } from "@/components/catalog/AddToCartButton";
import { getProductBySlug } from "@/lib/catalog/queries";
import { formatRupiah } from "@/lib/format";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  return { title: product?.name ?? "Produk tidak ditemukan" };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  return (
    <main className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
      <div className="grid gap-10 md:grid-cols-2">
        <div className="space-y-3">
          <div className="aspect-square overflow-hidden rounded-card border border-border-dark bg-charcoal">
            {product.images[0] ? (
              // eslint-disable-next-line @next/next/no-img-element -- lihat catatan di ProductCard.
              <img
                src={product.images[0].url}
                alt={product.images[0].altText ?? product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-caption text-muted">
                Tidak ada gambar
              </div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {product.images.slice(1).map((img, i) => (
                // eslint-disable-next-line @next/next/no-img-element -- lihat catatan di ProductCard.
                <img
                  key={i}
                  src={img.url}
                  alt={img.altText ?? product.name}
                  className="aspect-square rounded-md border border-border-dark object-cover"
                />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            {product.categoryName && (
              <p className="text-eyebrow tracking-arcane text-gold">
                {product.categoryName}
              </p>
            )}
            <h1 className="mt-1 font-display text-h1 text-ivory">{product.name}</h1>
          </div>

          <div className="flex items-baseline gap-3">
            <p className="font-display text-h2 text-gold-pale">
              {formatRupiah(product.price)}
            </p>
            {product.compareAtPrice && (
              <p className="text-body-lg text-muted line-through">
                {formatRupiah(product.compareAtPrice)}
              </p>
            )}
          </div>

          {product.shortDescription && (
            <p className="text-body-lg text-muted">{product.shortDescription}</p>
          )}

          <p className="text-body-sm text-muted">
            {product.fulfillmentType === "DIGITAL"
              ? "Produk digital — tidak dikenakan ongkos kirim."
              : "Produk fisik — ongkos kirim dihitung saat checkout."}
          </p>

          <AddToCartButton productId={product.id} outOfStock={product.isOutOfStock} />

          {product.description && (
            <div className="border-t border-border-dark pt-6">
              <h2 className="font-display text-h3 text-gold-pale">Detail Produk</h2>
              <p className="mt-3 text-body whitespace-pre-line text-ivory">
                {product.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
