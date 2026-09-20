import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ProductForm } from "@/components/admin/ProductForm";
import { isCurrentUserCatalogManager } from "@/lib/auth/roles";
import { getAllCategoriesForAdmin } from "@/lib/catalog/adminQueries";

export const metadata: Metadata = { title: "Produk Baru" };

export default async function NewProductPage() {
  if (!(await isCurrentUserCatalogManager())) redirect("/admin");

  const categories = await getAllCategoriesForAdmin();

  return (
    <main className="mx-auto max-w-2xl px-5 py-12 sm:px-8">
      <h1 className="font-display text-h1 text-ivory">Produk Baru</h1>
      <div className="mt-8">
        <ProductForm categories={categories} />
      </div>
    </main>
  );
}
