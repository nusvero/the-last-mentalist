import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { PaymentProofForm } from "@/components/payment/PaymentProofForm";
import { formatRupiah } from "@/lib/format";
import { getMyOrderByNumber, ORDER_STATUS_LABEL } from "@/lib/orders/queries";
import { getActivePaymentChannels, getLatestPaymentProof } from "@/lib/payment/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getStoreWhatsAppNumber } from "@/lib/whatsapp";

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

  const isPendingPayment = order.status === "PENDING_PAYMENT";
  const [channels, latestProof] = isPendingPayment
    ? await Promise.all([getActivePaymentChannels(), getLatestPaymentProof(order.id)])
    : [[], null];
  const whatsappNumber = isPendingPayment ? getStoreWhatsAppNumber() : null;

  return (
    <main className="mx-auto max-w-2xl px-5 py-12 sm:px-8">
      {checkout === "sukses" && (
        <div className="mb-8 rounded-md border border-mystic bg-mystic/10 px-4 py-4 text-body text-ivory">
          <p className="font-semibold text-mystic">Pesanan berhasil dibuat.</p>
          <p className="mt-1 text-body-sm text-muted">
            Simpan nomor pesananmu:{" "}
            <span className="text-ivory">{order.orderNumber}</span>. Silakan lakukan
            pembayaran dan upload bukti transfer di bawah.
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

      {isPendingPayment && (
        <div className="mt-6 rounded-card border border-border-dark bg-charcoal p-5">
          <h2 className="font-display text-h3 text-gold-pale">Pembayaran</h2>

          {latestProof?.status === "PENDING" ? (
            <p className="mt-3 text-body-sm text-muted">
              Bukti bayar sudah dikirim ({" "}
              {new Date(latestProof.createdAt).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              ) dan sedang diperiksa admin.
            </p>
          ) : (
            <>
              {latestProof?.status === "REJECTED" && (
                <p className="mt-3 text-body-sm text-ritual">
                  Bukti bayar sebelumnya ditolak
                  {latestProof.rejectionReason
                    ? `: ${latestProof.rejectionReason}`
                    : "."}{" "}
                  Silakan upload ulang.
                </p>
              )}
              <div className="mt-4">
                <PaymentProofForm
                  orderId={order.id}
                  orderNumber={order.orderNumber}
                  orderTotal={order.total}
                  channels={channels}
                  whatsappNumber={whatsappNumber}
                />
              </div>
            </>
          )}
        </div>
      )}
    </main>
  );
}
