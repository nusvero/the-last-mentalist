import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PaymentProofReviewCard } from "@/components/admin/PaymentProofReviewCard";
import { isCurrentUserAdmin } from "@/lib/auth/roles";
import { getPendingPaymentProofs } from "@/lib/payment/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Konfirmasi Pembayaran" };

export default async function AdminPaymentsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/pembayaran");

  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) redirect("/");

  const proofs = await getPendingPaymentProofs();

  return (
    <main className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
      <h1 className="font-display text-h1 text-ivory">Konfirmasi Pembayaran</h1>
      <p className="mt-2 text-body-sm text-muted">
        {proofs.length} bukti bayar menunggu diperiksa.
      </p>

      {proofs.length === 0 ? (
        <p className="mt-8 text-body text-muted">Tidak ada antrean saat ini.</p>
      ) : (
        <div className="mt-8 space-y-6">
          {proofs.map((proof) => (
            <PaymentProofReviewCard key={proof.id} proof={proof} />
          ))}
        </div>
      )}
    </main>
  );
}
