import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type OrderSummary = {
  id: string;
  orderNumber: string;
  status: Tables<"orders">["status"];
  total: string;
  createdAt: string;
};

export type OrderDetail = OrderSummary & {
  subtotal: string;
  shippingCost: string;
  shippingRecipientName: string | null;
  shippingPhone: string | null;
  shippingAddress: string | null;
  shippingCity: string | null;
  shippingProvince: string | null;
  shippingPostalCode: string | null;
  shippingCourier: string | null;
  shippingTrackingNumber: string | null;
  customerNote: string | null;
  items: {
    productName: string;
    quantity: number;
    unitPrice: string;
    lineSubtotal: string;
  }[];
};

/** Riwayat pesanan milik user yang sedang login (bukan admin/staff view). */
export async function getMyOrders(): Promise<OrderSummary[]> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("orders")
    .select("id, order_number, status, total, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[orders] gagal ambil riwayat pesanan:", error.message);
    return [];
  }

  return data.map((o) => ({
    id: o.id,
    orderNumber: o.order_number,
    status: o.status,
    total: o.total,
    createdAt: o.created_at,
  }));
}

/** Detail satu pesanan, hanya kalau milik user yang sedang login. */
export async function getMyOrderByNumber(
  orderNumber: string,
): Promise<OrderDetail | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: order, error } = await supabase
    .from("orders")
    .select(
      `id, order_number, status, subtotal, shipping_cost, total, created_at,
       shipping_recipient_name, shipping_phone, shipping_address, shipping_city,
       shipping_province, shipping_postal_code, shipping_courier, shipping_tracking_number,
       customer_note`,
    )
    .eq("user_id", user.id)
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (error) {
    console.error("[orders] gagal ambil detail pesanan:", error.message);
    return null;
  }
  if (!order) return null;

  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select("product_name, quantity, unit_price, line_subtotal")
    .eq("order_id", order.id);

  if (itemsError) {
    console.error("[orders] gagal ambil item pesanan:", itemsError.message);
  }

  return {
    id: order.id,
    orderNumber: order.order_number,
    status: order.status,
    total: order.total,
    createdAt: order.created_at,
    subtotal: order.subtotal,
    shippingCost: order.shipping_cost,
    shippingRecipientName: order.shipping_recipient_name,
    shippingPhone: order.shipping_phone,
    shippingAddress: order.shipping_address,
    shippingCity: order.shipping_city,
    shippingProvince: order.shipping_province,
    shippingPostalCode: order.shipping_postal_code,
    shippingCourier: order.shipping_courier,
    shippingTrackingNumber: order.shipping_tracking_number,
    customerNote: order.customer_note,
    items: (items ?? []).map((i) => ({
      productName: i.product_name,
      quantity: i.quantity,
      unitPrice: i.unit_price,
      lineSubtotal: i.line_subtotal,
    })),
  };
}
