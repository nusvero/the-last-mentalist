import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type AdminCategory = Tables<"product_categories">;

export async function getAllCategoriesForAdmin(): Promise<AdminCategory[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("product_categories")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[catalog/admin] gagal ambil kategori:", error.message);
    return [];
  }
  return data;
}

export type AdminProductListItem = {
  id: string;
  name: string;
  slug: string;
  price: string;
  isActive: boolean;
  stockQuantity: number | null;
  fulfillmentType: Tables<"products">["fulfillment_type"];
  categoryName: string | null;
};

/** Semua produk (aktif & nonaktif), untuk pengelola katalog. */
export async function getAllProductsForAdmin(): Promise<AdminProductListItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, name, slug, price, is_active, stock_quantity, fulfillment_type, product_categories(name)",
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[catalog/admin] gagal ambil produk:", error.message);
    return [];
  }

  return data.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    isActive: p.is_active,
    stockQuantity: p.stock_quantity,
    fulfillmentType: p.fulfillment_type,
    categoryName: p.product_categories?.name ?? null,
  }));
}

export type AdminProductDetail = {
  id: string;
  categoryId: string | null;
  fulfillmentType: Tables<"products">["fulfillment_type"];
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  price: string;
  compareAtPrice: string | null;
  sku: string | null;
  stockQuantity: number | null;
  weightGrams: number | null;
  isActive: boolean;
  isFeatured: boolean;
  images: { id: string; url: string; altText: string | null; sortOrder: number }[];
};

export async function getProductForAdmin(id: string): Promise<AdminProductDetail | null> {
  const supabase = await createSupabaseServerClient();
  const { data: product, error } = await supabase
    .from("products")
    .select(
      `id, category_id, fulfillment_type, name, slug, short_description, description, price,
       compare_at_price, sku, stock_quantity, weight_grams, is_active, is_featured`,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[catalog/admin] gagal ambil produk:", error.message);
    return null;
  }
  if (!product) return null;

  const { data: images, error: imagesError } = await supabase
    .from("product_images")
    .select("id, url, alt_text, sort_order")
    .eq("product_id", id)
    .order("sort_order", { ascending: true });

  if (imagesError) {
    console.error("[catalog/admin] gagal ambil gambar produk:", imagesError.message);
  }

  return {
    id: product.id,
    categoryId: product.category_id,
    fulfillmentType: product.fulfillment_type,
    name: product.name,
    slug: product.slug,
    shortDescription: product.short_description,
    description: product.description,
    price: product.price,
    compareAtPrice: product.compare_at_price,
    sku: product.sku,
    stockQuantity: product.stock_quantity,
    weightGrams: product.weight_grams,
    isActive: product.is_active,
    isFeatured: product.is_featured,
    images: (images ?? []).map((img) => ({
      id: img.id,
      url: img.url,
      altText: img.alt_text,
      sortOrder: img.sort_order,
    })),
  };
}
