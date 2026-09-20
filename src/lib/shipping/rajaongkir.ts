import "server-only";
import { z } from "zod";

import { getServerEnv } from "@/lib/env/server";

/**
 * Klien untuk RajaOngkir API v2 (Komerce), metode "search-base" -- satu
 * kolom pencarian alamat bebas (search-as-you-type), bukan 4 dropdown
 * provinsi/kota/kecamatan/kelurahan berjenjang.
 *
 * SUMBER: dokumentasi resmi rajaongkir.com/docs diblokir oleh proxy jaringan
 * sandbox ini saat modul ini ditulis, jadi kontrak endpoint di bawah
 * disusun dari beberapa sumber sekunder yang saling menguatkan (cuplikan
 * hasil pencarian atas halaman docs resmi + repo pihak ketiga yang
 * mendokumentasikan API yang sama). Yang PALING tidak pasti dan WAJIB
 * diverifikasi begitu RAJAONGKIR_API_KEY asli tersedia:
 *   1. Apakah parameter `courier` benar-benar menerima beberapa kode
 *      digabung tanda ":" (mis. "jne:jnt:sicepat") dalam satu request.
 *   2. Bentuk persis pesan error saat API key salah / kuota habis.
 * Kalau ternyata meleset, perbaikannya terisolasi di file ini saja.
 */

const RAJAONGKIR_BASE_URL = "https://rajaongkir.komerce.id/api/v1";
const REQUEST_TIMEOUT_MS = 10_000;

export class RajaOngkirError extends Error {
  readonly cause_?: unknown;

  constructor(message: string, cause_?: unknown) {
    super(message);
    this.name = "RajaOngkirError";
    this.cause_ = cause_;
  }
}

const metaSchema = z.object({
  message: z.string(),
  code: z.number(),
  status: z.string(),
});

const rawDestinationSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  label: z.string(),
  subdistrict_name: z.string().nullish(),
  district_name: z.string().nullish(),
  city_name: z.string().nullish(),
  province_name: z.string().nullish(),
  zip_code: z.string().nullish(),
});

const searchDestinationResponseSchema = z.object({
  meta: metaSchema,
  data: z.array(rawDestinationSchema).nullish(),
});

const rawCourierRateSchema = z.object({
  name: z.string(),
  code: z.string(),
  service: z.string(),
  description: z.string().nullish(),
  cost: z.number(),
  etd: z.string().nullish(),
});

const calculateCostResponseSchema = z.object({
  meta: metaSchema,
  data: z.array(rawCourierRateSchema).nullish(),
});

/** Bentuk domain internal aplikasi -- terpisah dari nama field API vendor. */
export type ShippingDestination = {
  id: string;
  label: string;
  city: string | null;
  province: string | null;
  postalCode: string | null;
};

export type ShippingCourierRate = {
  courierCode: string;
  courierName: string;
  service: string;
  description: string | null;
  costRupiah: number;
  etd: string | null;
};

async function callRajaOngkir(path: string, init: RequestInit): Promise<unknown> {
  const { RAJAONGKIR_API_KEY } = getServerEnv();
  if (!RAJAONGKIR_API_KEY) {
    throw new RajaOngkirError(
      "RAJAONGKIR_API_KEY belum diisi -- ongkir belum bisa dihitung (Fase D).",
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${RAJAONGKIR_BASE_URL}${path}`, {
      ...init,
      headers: { key: RAJAONGKIR_API_KEY, ...init.headers },
      signal: controller.signal,
    });
  } catch (error) {
    throw new RajaOngkirError("Tidak bisa menghubungi layanan RajaOngkir.", error);
  } finally {
    clearTimeout(timeout);
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch (error) {
    throw new RajaOngkirError("Respons RajaOngkir tidak valid (bukan JSON).", error);
  }

  if (!response.ok) {
    const parsedMeta = metaSchema.safeParse((json as { meta?: unknown })?.meta);
    const message = parsedMeta.success
      ? parsedMeta.data.message
      : `HTTP ${response.status}`;
    throw new RajaOngkirError(`RajaOngkir menolak permintaan: ${message}`);
  }

  return json;
}

/**
 * Cari tujuan pengiriman (desa/kecamatan/kota) lewat teks bebas, untuk
 * dipakai di kolom pencarian alamat pada form checkout.
 */
export async function searchShippingDestination(
  query: string,
): Promise<ShippingDestination[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  const params = new URLSearchParams({ search: trimmed, limit: "10" });
  const json = await callRajaOngkir(`/destination/domestic-destination?${params}`, {
    method: "GET",
  });

  const parsed = searchDestinationResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new RajaOngkirError(
      "Format respons pencarian tujuan tidak dikenali.",
      parsed.error,
    );
  }

  return (parsed.data.data ?? []).map((d) => ({
    id: d.id,
    label: d.label,
    city: d.city_name ?? null,
    province: d.province_name ?? null,
    postalCode: d.zip_code ?? null,
  }));
}

/**
 * Hitung ongkir dari gudang toko (RAJAONGKIR_ORIGIN_ID) ke satu tujuan,
 * untuk satu atau beberapa kurir sekaligus.
 */
export async function calculateShippingCost(params: {
  destinationId: string;
  weightGrams: number;
  couriers: string[];
}): Promise<ShippingCourierRate[]> {
  const { RAJAONGKIR_ORIGIN_ID } = getServerEnv();
  if (!RAJAONGKIR_ORIGIN_ID) {
    throw new RajaOngkirError("RAJAONGKIR_ORIGIN_ID belum diisi (alamat asal toko).");
  }
  if (params.weightGrams <= 0) {
    throw new RajaOngkirError("Berat paket harus lebih dari 0 gram.");
  }
  if (params.couriers.length === 0) {
    throw new RajaOngkirError("Minimal satu kurir harus dipilih.");
  }

  const body = new URLSearchParams({
    origin: RAJAONGKIR_ORIGIN_ID,
    destination: params.destinationId,
    weight: String(Math.ceil(params.weightGrams)),
    courier: params.couriers.join(":"),
    price: "lowest",
  });

  const json = await callRajaOngkir("/calculate/domestic-cost", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const parsed = calculateCostResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new RajaOngkirError("Format respons ongkir tidak dikenali.", parsed.error);
  }

  return (parsed.data.data ?? []).map((r) => ({
    courierCode: r.code,
    courierName: r.name,
    service: r.service,
    description: r.description ?? null,
    costRupiah: r.cost,
    etd: r.etd ?? null,
  }));
}
