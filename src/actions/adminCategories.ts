"use server";

import { revalidatePath } from "next/cache";

import type { AdminActionResult } from "@/lib/adminActionResult";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { categorySchema } from "@/lib/validation/product";

function strOrUndefined(v: FormDataEntryValue | null): string | undefined {
  if (typeof v !== "string" || v.trim() === "") return undefined;
  return v.trim();
}

function parseCategoryForm(formData: FormData) {
  return {
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: strOrUndefined(formData.get("description")),
    isActive: formData.get("isActive") === "on",
  };
}

export async function createCategoryAction(
  _prev: AdminActionResult,
  formData: FormData,
): Promise<AdminActionResult> {
  const parsed = categorySchema.safeParse(parseCategoryForm(formData));
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Data tidak valid.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("product_categories").insert({
    name: parsed.data.name,
    slug: parsed.data.slug,
    description: parsed.data.description ?? null,
    is_active: parsed.data.isActive,
  });

  if (error)
    return { status: "error", message: error.message || "Gagal membuat kategori." };

  revalidatePath("/admin/kategori");
  revalidatePath("/produk");
  return { status: "success" };
}

export async function updateCategoryAction(
  categoryId: string,
  _prev: AdminActionResult,
  formData: FormData,
): Promise<AdminActionResult> {
  const parsed = categorySchema.safeParse(parseCategoryForm(formData));
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Data tidak valid.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("product_categories")
    .update({
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description ?? null,
      is_active: parsed.data.isActive,
    })
    .eq("id", categoryId)
    .select("id");

  if (error)
    return { status: "error", message: error.message || "Gagal menyimpan kategori." };
  if (!data || data.length === 0) {
    return {
      status: "error",
      message: "Tidak diizinkan, atau kategori tidak ditemukan.",
    };
  }

  revalidatePath("/admin/kategori");
  revalidatePath("/produk");
  return { status: "success" };
}

export async function toggleCategoryActiveAction(
  categoryId: string,
  isActive: boolean,
): Promise<AdminActionResult> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("product_categories")
    .update({ is_active: isActive })
    .eq("id", categoryId)
    .select("id");

  if (error)
    return { status: "error", message: error.message || "Gagal mengubah status." };
  if (!data || data.length === 0) {
    return {
      status: "error",
      message: "Tidak diizinkan, atau kategori tidak ditemukan.",
    };
  }

  revalidatePath("/admin/kategori");
  revalidatePath("/produk");
  return { status: "success" };
}
