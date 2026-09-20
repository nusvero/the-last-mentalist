import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PaymentChannelForm } from "@/components/admin/PaymentChannelForm";
import { PaymentChannelListItem } from "@/components/admin/PaymentChannelListItem";
import { isCurrentUserAdmin } from "@/lib/auth/roles";
import { getAllPaymentChannelsForAdmin } from "@/lib/payment/adminQueries";

export const metadata: Metadata = { title: "Channel Pembayaran" };

export default async function AdminPaymentChannelsPage() {
  if (!(await isCurrentUserAdmin())) redirect("/admin");

  const channels = await getAllPaymentChannelsForAdmin();

  return (
    <main className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
      <h1 className="font-display text-h1 text-ivory">Channel Pembayaran</h1>
      <p className="mt-2 text-body-sm text-muted">
        Rekening/e-wallet/QRIS yang ditampilkan ke pembeli saat upload bukti bayar.
      </p>

      <section className="mt-8 rounded-card border border-border-dark bg-charcoal p-5">
        <h2 className="font-display text-h3 text-gold-pale">Tambah Channel</h2>
        <div className="mt-4">
          <PaymentChannelForm />
        </div>
      </section>

      {channels.length === 0 ? (
        <p className="mt-8 text-body text-muted">Belum ada channel pembayaran.</p>
      ) : (
        <div className="mt-8 divide-y divide-border-dark border-y border-border-dark">
          {channels.map((c) => (
            <PaymentChannelListItem key={c.id} channel={c} />
          ))}
        </div>
      )}
    </main>
  );
}
