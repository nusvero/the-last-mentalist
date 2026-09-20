"use server";

import {
  calculateShippingCost,
  RajaOngkirError,
  searchShippingDestination,
  type ShippingCourierRate,
  type ShippingDestination,
} from "@/lib/shipping/rajaongkir";
import {
  calculateShippingCostSchema,
  searchDestinationSchema,
} from "@/lib/validation/shipping";

export type ShippingActionResult<T> =
  { status: "success"; data: T } | { status: "error"; message: string };

const GENERIC_ERROR = "Ongkir tidak bisa dihitung saat ini. Silakan coba lagi.";

export async function searchShippingDestinationAction(
  query: string,
): Promise<ShippingActionResult<ShippingDestination[]>> {
  const parsed = searchDestinationSchema.safeParse({ query });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? GENERIC_ERROR };
  }

  try {
    const data = await searchShippingDestination(parsed.data.query);
    return { status: "success", data };
  } catch (error) {
    if (error instanceof RajaOngkirError)
      console.error("[shipping] search gagal:", error.message);
    return { status: "error", message: GENERIC_ERROR };
  }
}

export async function getShippingRatesAction(input: {
  destinationId: string;
  weightGrams: number;
  couriers: string[];
}): Promise<ShippingActionResult<ShippingCourierRate[]>> {
  const parsed = calculateShippingCostSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? GENERIC_ERROR };
  }

  try {
    const data = await calculateShippingCost(parsed.data);
    return { status: "success", data };
  } catch (error) {
    if (error instanceof RajaOngkirError)
      console.error("[shipping] hitung ongkir gagal:", error.message);
    return { status: "error", message: GENERIC_ERROR };
  }
}
