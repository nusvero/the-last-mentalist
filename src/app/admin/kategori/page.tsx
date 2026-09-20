import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CategoryForm } from "@/components/admin/CategoryForm";
import { CategoryListItem } from "@/components/admin/CategoryListItem";
import { isCurrentUserCatalogManager } from "@/lib/auth/roles";
import { getAllCategoriesForAdmin } from "@/lib/catalog/adminQueries";

export const metadata: Metadata = { title: "Kelola Kategori" };

export default async function AdminCategoriesPage() {
  if (!(await isCurrentUserCatalogManager())) redirect("/admin");

  const categories = await getAllCategoriesForAdmin();

  return (
    <main className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
      <h1 className="font-display text-h1 text-ivory">Kelola Kategori</h1>

      <section className="mt-8 rounded-card border border-border-dark bg-charcoal p-5">
        <h2 className="font-display text-h3 text-gold-pale">Tambah Kategori</h2>
        <div className="mt-4">
          <CategoryForm />
        </div>
      </section>

      {categories.length === 0 ? (
        <p className="mt-8 text-body text-muted">Belum ada kategori.</p>
      ) : (
        <div className="mt-8 divide-y divide-border-dark border-y border-border-dark">
          {categories.map((c) => (
            <CategoryListItem key={c.id} category={c} />
          ))}
        </div>
      )}
    </main>
  );
}
