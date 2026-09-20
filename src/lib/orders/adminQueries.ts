import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";
import type { OrderDetail, OrderSummary } from "@/lib/orders/queries";

export type StaffOrderSummary = OrderSummary & { customerName: string | null };

/** Semua pesanan (lintas customer), untuk staf (ADMIN/SUPER_ADMIN/FULFILLMENT). */
export async function getAllOrdersForStaff(params?: {
  status?: Tables<"orders">["status"];
}): Promise<StaffOrderSummary[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("orders")
    .select("id, order_number, status, total, created_at, shipping_recipient_name")
    .order("created_at", { ascending: false });

  if (params?.status) query = query.eq("status", params.status);

  const { data, error } = await query;
  if (error) {
    console.error("[orders/admin] gagal ambil daftar pesanan:", error.message);
    return [];
  }

  return data.map((o) => ({
    id: o.id,
    orderNumber: o.order_number,
    status: o.status,
    total: o.total,
    createdAt: o.created_at,
    customerName: o.shipping_recipient_name,
  }));
}

/** Detail satu pesanan untuk staf -- tanpa filter kepemilikan (RLS yang jaga). */
export async function getOrderForStaff(orderNumber: string): Promise<OrderDetail | null> {
  const supabase = await createSupabaseServerClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select(
      `id, order_number, status, subtotal, shipping_cost, total, created_at,
       shipping_recipient_name, shipping_phone, shipping_address, shipping_city,
       shipping_province, shipping_postal_code, shipping_courier, shipping_tracking_number,
       customer_note`,
    )
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (error) {
    console.error("[orders/admin] gagal ambil detail pesanan:", error.message);
    return null;
  }
  if (!order) return null;

  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select("product_name, quantity, unit_price, line_subtotal")
    .eq("order_id", order.id);

  if (itemsError) {
    console.error("[orders/admin] gagal ambil item pesanan:", itemsError.message);
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
