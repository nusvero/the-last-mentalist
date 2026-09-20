import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PaymentProofReviewCard } from "@/components/admin/PaymentProofReviewCard";
import { isCurrentUserAdmin } from "@/lib/auth/roles";
import { getPendingPaymentProofs } from "@/lib/payment/queries";

export const metadata: Metadata = { title: "Konfirmasi Pembayaran" };

export default async function AdminPaymentsPage() {
  // Login & status staf sudah dijaga src/app/admin/layout.tsx. Halaman ini
  // butuh cek lebih sempit: hanya ADMIN/SUPER_ADMIN, bukan sembarang staf.
  if (!(await isCurrentUserAdmin())) redirect("/admin");

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
