import { z } from "zod";

const slug = z
  .string()
  .trim()
  .toLowerCase()
  .regex(
    /^[a-z0-9]+(-[a-z0-9]+)*$/,
    "Slug hanya boleh huruf kecil, angka, dan tanda hubung.",
  );

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi.").max(80),
  slug,
  description: z.string().trim().max(500).optional(),
  isActive: z.boolean(),
});

export const productSchema = z
  .object({
    categoryId: z.string().uuid().optional(),
    fulfillmentType: z.enum(["PHYSICAL", "DIGITAL"]),
    name: z.string().trim().min(1, "Nama wajib diisi.").max(150),
    slug,
    shortDescription: z.string().trim().max(300).optional(),
    description: z.string().trim().max(5000).optional(),
    price: z.number().min(0, "Harga tidak boleh negatif."),
    compareAtPrice: z.number().min(0).optional(),
    sku: z.string().trim().max(50).optional(),
    stockQuantity: z.number().int().min(0).optional(),
    weightGrams: z.number().int().positive().optional(),
    isActive: z.boolean(),
    isFeatured: z.boolean(),
  })
  .refine(
    (data) => data.fulfillmentType !== "PHYSICAL" || data.weightGrams !== undefined,
    {
      message: "Berat paket wajib diisi untuk produk fisik (dipakai hitung ongkir).",
      path: ["weightGrams"],
    },
  )
  .refine((data) => !data.compareAtPrice || data.compareAtPrice > data.price, {
    message: "Harga coret harus lebih besar dari harga jual.",
    path: ["compareAtPrice"],
  });
