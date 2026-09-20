"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { uploadPublicAsset } from "@/lib/storage/publicAssets";
import type { AdminActionResult } from "@/lib/adminActionResult";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { productSchema } from "@/lib/validation/product";

function numOrUndefined(v: FormDataEntryValue | null): number | undefined {
  if (typeof v !== "string" || v.trim() === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}
function strOrUndefined(v: FormDataEntryValue | null): string | undefined {
  if (typeof v !== "string" || v.trim() === "") return undefined;
  return v.trim();
}

function parseProductForm(formData: FormData) {
  return {
    categoryId: strOrUndefined(formData.get("categoryId")),
    fulfillmentType: formData.get("fulfillmentType"),
    name: formData.get("name"),
    slug: formData.get("slug"),
    shortDescription: strOrUndefined(formData.get("shortDescription")),
    description: strOrUndefined(formData.get("description")),
    price: numOrUndefined(formData.get("price")) ?? Number.NaN,
    compareAtPrice: numOrUndefined(formData.get("compareAtPrice")),
    sku: strOrUndefined(formData.get("sku")),
    stockQuantity: numOrUndefined(formData.get("stockQuantity")),
    weightGrams: numOrUndefined(formData.get("weightGrams")),
    isActive: formData.get("isActive") === "on",
    isFeatured: formData.get("isFeatured") === "on",
  };
}

export async function createProductAction(
  _prev: AdminActionResult,
  formData: FormData,
): Promise<AdminActionResult> {
  const parsed = productSchema.safeParse(parseProductForm(formData));
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Data tidak valid.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .insert({
      category_id: parsed.data.categoryId ?? null,
      fulfillment_type: parsed.data.fulfillmentType,
      name: parsed.data.name,
      slug: parsed.data.slug,
      short_description: parsed.data.shortDescription ?? null,
      description: parsed.data.description ?? null,
      price: String(parsed.data.price),
      compare_at_price:
        parsed.data.compareAtPrice != null ? String(parsed.data.compareAtPrice) : null,
      sku: parsed.data.sku ?? null,
      stock_quantity: parsed.data.stockQuantity ?? null,
      weight_grams: parsed.data.weightGrams ?? null,
      is_active: parsed.data.isActive,
      is_featured: parsed.data.isFeatured,
    })
    .select("id")
    .single();

  if (error)
    return { status: "error", message: error.message || "Gagal membuat produk." };

  revalidatePath("/admin/produk");
  revalidatePath("/produk");
  redirect(`/admin/produk/${data.id}`);
}

export async function updateProductAction(
  productId: string,
  _prev: AdminActionResult,
  formData: FormData,
): Promise<AdminActionResult> {
  const parsed = productSchema.safeParse(parseProductForm(formData));
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Data tidak valid.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .update({
      category_id: parsed.data.categoryId ?? null,
      fulfillment_type: parsed.data.fulfillmentType,
      name: parsed.data.name,
      slug: parsed.data.slug,
      short_description: parsed.data.shortDescription ?? null,
      description: parsed.data.description ?? null,
      price: String(parsed.data.price),
      compare_at_price:
        parsed.data.compareAtPrice != null ? String(parsed.data.compareAtPrice) : null,
      sku: parsed.data.sku ?? null,
      stock_quantity: parsed.data.stockQuantity ?? null,
      weight_grams: parsed.data.weightGrams ?? null,
      is_active: parsed.data.isActive,
      is_featured: parsed.data.isFeatured,
    })
    .eq("id", productId)
    .select("id");

  if (error)
    return { status: "error", message: error.message || "Gagal menyimpan produk." };
  if (!data || data.length === 0) {
    return { status: "error", message: "Tidak diizinkan, atau produk tidak ditemukan." };
  }

  revalidatePath("/admin/produk");
  revalidatePath(`/admin/produk/${productId}`);
  revalidatePath("/produk");
  return { status: "success" };
}

export async function toggleProductActiveAction(
  productId: string,
  isActive: boolean,
): Promise<AdminActionResult> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .update({ is_active: isActive })
    .eq("id", productId)
    .select("id");

  if (error)
    return { status: "error", message: error.message || "Gagal mengubah status." };
  if (!data || data.length === 0) {
    return { status: "error", message: "Tidak diizinkan, atau produk tidak ditemukan." };
  }

  revalidatePath("/admin/produk");
  revalidatePath("/produk");
  return { status: "success" };
}

export async function addProductImageAction(
  productId: string,
  formData: FormData,
): Promise<AdminActionResult> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", message: "Pilih file gambar terlebih dahulu." };
  }

  const supabase = await createSupabaseServerClient();
  const uploaded = await uploadPublicAsset(supabase, `products/${productId}`, file);
  if ("error" in uploaded) return { status: "error", message: uploaded.error };

  const { count } = await supabase
    .from("product_images")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);

  const { error } = await supabase.from("product_images").insert({
    product_id: productId,
    url: uploaded.url,
    alt_text: strOrUndefined(formData.get("altText")) ?? null,
    sort_order: count ?? 0,
  });

  if (error)
    return { status: "error", message: error.message || "Gagal menyimpan gambar." };

  revalidatePath(`/admin/produk/${productId}`);
  revalidatePath("/produk");
  return { status: "success" };
}

export async function deleteProductImageAction(
  imageId: string,
  productId: string,
): Promise<AdminActionResult> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("product_images")
    .delete()
    .eq("id", imageId)
    .select("id");

  if (error)
    return { status: "error", message: error.message || "Gagal menghapus gambar." };
  if (!data || data.length === 0) {
    return { status: "error", message: "Tidak diizinkan, atau gambar tidak ditemukan." };
  }

  revalidatePath(`/admin/produk/${productId}`);
  revalidatePath("/produk");
  return { status: "success" };
}
