import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { formatRupiah } from "@/lib/format";
import { getMyOrderByNumber, ORDER_STATUS_LABEL } from "@/lib/orders/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Detail Pesanan" };

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ checkout?: string }>;
}) {
  const { orderNumber } = await params;
  const { checkout } = await searchParams;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/account/orders/${orderNumber}`);

  const order = await getMyOrderByNumber(orderNumber);
  if (!order) notFound();

  return (
    <main className="mx-auto max-w-2xl px-5 py-12 sm:px-8">
      {checkout === "sukses" && (
        <div className="mb-8 rounded-md border border-mystic bg-mystic/10 px-4 py-4 text-body text-ivory">
          <p className="font-semibold text-mystic">Pesanan berhasil dibuat.</p>
          <p className="mt-1 text-body-sm text-muted">
            Instruksi pembayaran (QRIS/e-wallet/transfer bank) dan halaman upload bukti
            bayar akan segera menyusul &mdash; belum tersedia di versi ini. Simpan nomor
            pesananmu: <span className="text-ivory">{order.orderNumber}</span>.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="font-display text-h2 text-ivory">{order.orderNumber}</h1>
        <span className="rounded-full border border-gold px-3 py-1 text-body-sm text-gold-pale">
          {ORDER_STATUS_LABEL[order.status]}
        </span>
      </div>
      <p className="mt-1 text-body-sm text-muted">
        {new Date(order.createdAt).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </p>

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
        <div className="mt-4 space-y-1 border-t border-border-dark pt-4 text-body-sm">
          <div className="flex justify-between text-muted">
            <span>Subtotal</span>
            <span>{formatRupiah(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-muted">
            <span>Ongkos Kirim</span>
            <span>{formatRupiah(order.shippingCost)}</span>
          </div>
          <div className="flex justify-between text-body font-semibold text-ivory">
            <span>Total</span>
            <span>{formatRupiah(order.total)}</span>
          </div>
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
          {order.shippingTrackingNumber && (
            <p className="mt-2 text-body-sm text-gold-pale">
              No. Resi: {order.shippingTrackingNumber}
            </p>
          )}
        </div>
      )}

      {order.customerNote && (
        <p className="mt-6 text-body-sm text-muted">Catatan: {order.customerNote}</p>
      )}
    </main>
  );
}
