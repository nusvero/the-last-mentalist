import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { OrderStatusForm } from "@/components/admin/OrderStatusForm";
import { isCurrentUserOrderStaff } from "@/lib/auth/roles";
import { formatRupiah } from "@/lib/format";
import { getOrderForStaff } from "@/lib/orders/adminQueries";
import { ORDER_STATUS_LABEL } from "@/lib/orders/labels";

export const metadata: Metadata = { title: "Detail Pesanan" };

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  if (!(await isCurrentUserOrderStaff())) redirect("/admin");

  const { orderNumber } = await params;
  const order = await getOrderForStaff(orderNumber);
  if (!order) notFound();

  return (
    <main className="mx-auto max-w-2xl px-5 py-12 sm:px-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-h2 text-ivory">{order.orderNumber}</h1>
        <span className="rounded-full border border-gold px-3 py-1 text-body-sm text-gold-pale">
          {ORDER_STATUS_LABEL[order.status]}
        </span>
      </div>

      <div className="mt-8 rounded-card border border-border-dark bg-charcoal p-5">
        <h2 className="font-display text-h3 text-gold-pale">Item Pesanan</h2>
        <ul className="mt-3 space-y-2">
          {order.items.map((item, i) => (
            <li key={i} className="flex justify-between text-body-sm">
              <span className="text-ivory">
                {item.productName} × {item.quantity}
              </span>
              <span className="text-muted">{formatRupiah(item.lineSubtotal)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-between border-t border-border-dark pt-4 text-body font-semibold text-ivory">
          <span>Total</span>
          <span>{formatRupiah(order.total)}</span>
        </div>
      </div>

      {order.shippingAddress && (
        <div className="mt-6 rounded-card border border-border-dark bg-charcoal p-5">
          <h2 className="font-display text-h3 text-gold-pale">Alamat Pengiriman</h2>
          <p className="mt-2 text-body-sm text-ivory">{order.shippingRecipientName}</p>
          <p className="text-body-sm text-muted">{order.shippingPhone}</p>
          <p className="mt-1 text-body-sm text-muted">
            {order.shippingAddress}
            {order.shippingCity && `, ${order.shippingCity}`}
            {order.shippingProvince && `, ${order.shippingProvince}`}
            {order.shippingPostalCode && ` ${order.shippingPostalCode}`}
          </p>
        </div>
      )}

      {order.customerNote && (
        <p className="mt-6 text-body-sm text-muted">
          Catatan pembeli: {order.customerNote}
        </p>
      )}

      <div className="mt-6 rounded-card border border-border-dark bg-charcoal p-5">
        <h2 className="font-display text-h3 text-gold-pale">Ubah Status</h2>
        <div className="mt-4">
          <OrderStatusForm order={order} />
        </div>
      </div>
    </main>
  );
}
