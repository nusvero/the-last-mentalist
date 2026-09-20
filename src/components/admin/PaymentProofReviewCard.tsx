"use client";

import { useState, useTransition } from "react";

import { confirmPaymentProofAction, rejectPaymentProofAction } from "@/actions/payment";
import { formatRupiah } from "@/lib/format";
import type { PendingPaymentProof } from "@/lib/payment/queries";

export function PaymentProofReviewCard({ proof }: { proof: PendingPaymentProof }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await confirmPaymentProofAction(proof.id);
      if (result.status === "error") {
        setError(result.message);
        return;
      }
      setDone(true);
    });
  }

  function handleReject() {
    if (!rejectionReason.trim()) {
      setError("Alasan penolakan wajib diisi.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await rejectPaymentProofAction(proof.id, rejectionReason);
      if (result.status === "error") {
        setError(result.message);
        return;
      }
      setDone(true);
    });
  }

  if (done) return null;

  const amountMismatch = Number(proof.amount) !== Number(proof.orderTotal);

  return (
    <div className="rounded-card border border-border-dark bg-charcoal p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-body text-ivory">{proof.orderNumber}</p>
          <p className="text-body-sm text-muted">{proof.channelName}</p>
          <p className="text-body-sm text-muted">
            {new Date(proof.createdAt).toLocaleString("id-ID")}
          </p>
        </div>
        <div className="text-right">
          <p className="text-body-sm text-muted">
            Total pesanan: {formatRupiah(proof.orderTotal)}
          </p>
          <p className={`text-body ${amountMismatch ? "text-ritual" : "text-ivory"}`}>
            Ditransfer: {formatRupiah(proof.amount)}
          </p>
          {amountMismatch && (
            <p className="text-caption text-ritual">Nominal tidak sama!</p>
          )}
        </div>
      </div>

      {proof.senderName && (
        <p className="mt-2 text-body-sm text-muted">Pengirim: {proof.senderName}</p>
      )}
      {proof.note && (
        <p className="mt-1 text-body-sm text-muted">Catatan: {proof.note}</p>
      )}

      {proof.signedImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- signed URL sementara dari Supabase Storage.
        <img
          src={proof.signedImageUrl}
          alt={`Bukti bayar ${proof.orderNumber}`}
          className="mt-4 max-h-96 rounded-md border border-border-dark object-contain"
        />
      )}

      {error && <p className="mt-3 text-body-sm text-ritual">{error}</p>}

      {showRejectReason ? (
        <div className="mt-4 space-y-2">
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Alasan penolakan (mis. nominal tidak sesuai, gambar tidak jelas)"
            rows={2}
            className="w-full rounded-md border border-border-dark bg-obsidian px-4 py-3 text-body-sm text-ivory placeholder:text-muted focus:border-gold focus:outline-none"
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleReject}
              disabled={pending}
              className="rounded-md bg-crimson px-4 py-2 text-body-sm font-semibold text-ivory disabled:opacity-60"
            >
              {pending ? "Memproses..." : "Konfirmasi Tolak"}
            </button>
            <button
              type="button"
              onClick={() => setShowRejectReason(false)}
              disabled={pending}
              className="text-body-sm text-muted"
            >
              Batal
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={pending}
            className="rounded-md bg-mystic px-5 py-2 text-body-sm font-semibold text-obsidian disabled:opacity-60"
          >
            {pending ? "Memproses..." : "Konfirmasi"}
          </button>
          <button
            type="button"
            onClick={() => setShowRejectReason(true)}
            disabled={pending}
            className="rounded-md border border-crimson px-5 py-2 text-body-sm font-semibold text-ritual disabled:opacity-60"
          >
            Tolak
          </button>
        </div>
      )}
    </div>
  );
}
