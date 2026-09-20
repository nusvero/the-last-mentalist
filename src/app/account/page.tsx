import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { formatRupiah } from "@/lib/format";
import { getMyOrders, ORDER_STATUS_LABEL } from "@/lib/orders/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Akun" };

export default async function AccountPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account");

  const orders = await getMyOrders();

  return (
    <main className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
      <h1 className="font-display text-h1 text-ivory">Riwayat Pesanan</h1>

      {orders.length === 0 ? (
        <div className="mt-8">
          <p className="text-body text-muted">Belum ada pesanan.</p>
          <Link
            href="/produk"
            className="mt-4 inline-block text-body text-gold-pale underline"
          >
            Mulai belanja
          </Link>
        </div>
      ) : (
        <div className="mt-8 divide-y divide-border-dark border-y border-border-dark">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/account/orders/${order.orderNumber}`}
              className="flex items-center justify-between px-2 py-4 hover:bg-charcoal"
            >
              <div>
                <p className="text-body text-ivory">{order.orderNumber}</p>
                <p className="text-body-sm text-muted">
                  {new Date(order.createdAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-body text-ivory">{formatRupiah(order.total)}</p>
                <p className="text-body-sm text-gold-pale">
                  {ORDER_STATUS_LABEL[order.status]}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
