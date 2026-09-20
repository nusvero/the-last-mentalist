import { z } from "zod";

// Kurir populer di Indonesia yang didukung RajaOngkir. Daftar ini yang
// ditawarkan ke pembeli di form checkout -- tambah di sini kalau toko mau
// buka kurir lain.
export const SUPPORTED_COURIERS = ["jne", "jnt", "sicepat", "anteraja", "pos"] as const;

export const searchDestinationSchema = z.object({
  query: z.string().trim().min(3, "Ketik minimal 3 huruf.").max(100),
});

export const calculateShippingCostSchema = z.object({
  destinationId: z.string().trim().min(1, "Pilih tujuan pengiriman."),
  weightGrams: z.number().int().positive("Berat paket tidak valid."),
  couriers: z
    .array(z.enum(SUPPORTED_COURIERS))
    .min(1, "Pilih minimal satu kurir.")
    .max(SUPPORTED_COURIERS.length),
});
