import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type ProductListItem = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  price: string;
  compareAtPrice: string | null;
  fulfillmentType: Tables<"products">["fulfillment_type"];
  imageUrl: string | null;
  categoryName: string | null;
  isOutOfStock: boolean;
};

export type ProductDetail = ProductListItem & {
  description: string | null;
  stockQuantity: number | null;
  images: { url: string; altText: string | null }[];
};

export type ProductCategory = Pick<Tables<"product_categories">, "id" | "name" | "slug">;

function toListItem(row: {
  id: string;
  slug: string;
  name: string;
  short_description: string | null;
  price: string;
  compare_at_price: string | null;
  fulfillment_type: Tables<"products">["fulfillment_type"];
  stock_quantity: number | null;
  product_categories: { name: string } | null;
  product_images: { url: string; sort_order: number }[];
}): ProductListItem {
  const sortedImages = [...row.product_images].sort(
    (a, b) => a.sort_order - b.sort_order,
  );
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortDescription: row.short_description,
    price: row.price,
    compareAtPrice: row.compare_at_price,
    fulfillmentType: row.fulfillment_type,
    imageUrl: sortedImages[0]?.url ?? null,
    categoryName: row.product_categories?.name ?? null,
    isOutOfStock: row.stock_quantity !== null && row.stock_quantity <= 0,
  };
}

/** Kategori aktif, untuk filter di halaman listing produk. */
export async function getActiveCategories(): Promise<ProductCategory[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("product_categories")
    .select("id, name, slug")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[catalog] gagal ambil kategori:", error.message);
    return [];
  }
  return data;
}

/** Produk aktif untuk etalase publik, opsional difilter per kategori. */
export async function getActiveProducts(params?: {
  categorySlug?: string;
}): Promise<ProductListItem[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("products")
    .select(
      `id, slug, name, short_description, price, compare_at_price, fulfillment_type,
       stock_quantity, product_categories(name),
       product_images(url, sort_order)`,
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (params?.categorySlug) {
    // Filter kategori lewat subquery slug -> id (RLS tetap dihormati karena
    // pakai klien yang sama, bukan service role).
    const { data: category } = await supabase
      .from("product_categories")
      .select("id")
      .eq("slug", params.categorySlug)
      .maybeSingle();
    if (!category) return [];
    query = query.eq("category_id", category.id);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[catalog] gagal ambil produk:", error.message);
    return [];
  }
  return data.map(toListItem);
}

/** Detail satu produk untuk halaman produk (public, hanya yang aktif). */
export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      `id, slug, name, short_description, description, price, compare_at_price,
       fulfillment_type, stock_quantity, product_categories(name),
       product_images(url, alt_text, sort_order)`,
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error("[catalog] gagal ambil detail produk:", error.message);
    return null;
  }
  if (!data) return null;

  const sortedImages = [...data.product_images].sort(
    (a, b) => a.sort_order - b.sort_order,
  );
  return {
    ...toListItem(data),
    description: data.description,
    stockQuantity: data.stock_quantity,
    images: sortedImages.map((img) => ({ url: img.url, altText: img.alt_text })),
  };
}
