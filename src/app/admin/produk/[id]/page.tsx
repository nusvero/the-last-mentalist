import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { ProductForm } from "@/components/admin/ProductForm";
import { ProductImageManager } from "@/components/admin/ProductImageManager";
import { isCurrentUserCatalogManager } from "@/lib/auth/roles";
import { getAllCategoriesForAdmin, getProductForAdmin } from "@/lib/catalog/adminQueries";

export const metadata: Metadata = { title: "Edit Produk" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await isCurrentUserCatalogManager())) redirect("/admin");

  const { id } = await params;
  const [categories, product] = await Promise.all([
    getAllCategoriesForAdmin(),
    getProductForAdmin(id),
  ]);
  if (!product) notFound();

  return (
    <main className="mx-auto max-w-2xl px-5 py-12 sm:px-8">
      <h1 className="font-display text-h1 text-ivory">{product.name}</h1>

      <section className="mt-8">
        <h2 className="font-display text-h3 text-gold-pale">Gambar Produk</h2>
        <div className="mt-4">
          <ProductImageManager productId={product.id} images={product.images} />
        </div>
      </section>

      <section className="mt-10 border-t border-border-dark pt-8">
        <h2 className="font-display text-h3 text-gold-pale">Detail Produk</h2>
        <div className="mt-4">
          <ProductForm categories={categories} product={product} />
        </div>
      </section>
    </main>
  );
}
