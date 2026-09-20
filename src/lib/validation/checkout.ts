import { z } from "zod";

// Validasi di sini sengaja longgar (semua opsional): aturan bisnis yang
// sesungguhnya -- alamat wajib kalau ada barang fisik, dst -- ditegakkan
// oleh public.checkout_cart() di database, satu-satunya sumber kebenaran,
// supaya tidak ada dua tempat yang bisa saling tidak sinkron.
export const checkoutSchema = z.object({
  shippingRecipientName: z.string().trim().min(1).max(120).optional(),
  shippingPhone: z
    .string()
    .trim()
    .regex(/^\+?[0-9]{8,16}$/, "Format nomor HP tidak valid.")
    .optional(),
  shippingAddress: z.string().trim().min(1).max(500).optional(),
  shippingCity: z.string().trim().max(100).optional(),
  shippingProvince: z.string().trim().max(100).optional(),
  shippingPostalCode: z
    .string()
    .trim()
    .regex(/^[0-9]{5}$/, "Kode pos harus 5 digit.")
    .optional(),
  shippingCost: z.number().min(0).default(0),
  customerNote: z.string().trim().max(500).optional(),
});
